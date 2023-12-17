import React, { useEffect } from 'react';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react';

import type { ChangeEvent } from 'react';
import { useHoneyForm } from '../use-honey-form';

import { useChildHoneyForm } from '../use-child-honey-form';

describe('Hook [use-honey-form]: General', () => {
  it('a form should be dirty after setting a new field value', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            type: 'string',
            defaultValue: 45,
          },
        },
      }),
    );

    expect(result.current.isFormDirty).toBeFalsy();

    act(() => {
      result.current.formFields.age.setValue(56);
    });

    expect(result.current.isFormDirty).toBeTruthy();
  });

  it('a form should not be dirty when successfully submitted', async () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            type: 'string',
            defaultValue: 45,
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.age.setValue(56);
    });

    expect(result.current.isFormDirty).toBeTruthy();

    await act(() => result.current.submitForm());

    expect(result.current.isFormDirty).toBeFalsy();
  });

  it('clear manually added form fields errors', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {
            type: 'string',
          },
          age: {
            type: 'string',
          },
        },
      }),
    );

    act(() => {
      result.current.addFormFieldError('name', {
        type: 'server',
        message: 'name should be less than 255 chars',
      });

      result.current.addFormFieldError('age', {
        type: 'server',
        message: 'age should be less than 55',
      });
    });

    expect(Object.keys(result.current.formErrors).length).toBe(2);

    act(() => {
      result.current.clearFormErrors();
    });

    expect(Object.keys(result.current.formErrors).length).toBe(0);
  });

  it('should re-render form one time when `onChange` is triggered', () => {
    let renderers = 0;

    const Comp = () => {
      const { formFields } = useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
            defaultValue: '',
          },
        },
      });

      renderers += 1;

      return <input {...formFields.name.props} data-testid="name" />;
    };

    const { getByTestId } = render(<Comp />);

    expect(renderers).toBe(1);

    fireEvent.change(getByTestId('name'), { target: { value: 'Jake' } });

    expect(renderers).toBe(2);
  });

  it('call `onChange` with form data when any field value is changed', async () => {
    const onChange = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; kind: string }>({
        fields: {
          name: {
            type: 'string',
          },
          kind: {
            type: 'string',
          },
        },
        onChange,
      }),
    );

    expect(onChange).not.toHaveBeenCalled();

    act(() => {
      result.current.formFields.name.setValue('a');
    });

    await waitFor(() =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(onChange.mock.calls[0][0]).toStrictEqual({ name: 'a', kind: undefined }),
    );

    act(() => {
      result.current.formFields.kind.setValue('f');
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await waitFor(() => expect(onChange.mock.calls[1][0]).toStrictEqual({ name: 'a', kind: 'f' }));
  });

  it('should partially set form values', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; kind: string }>({
        fields: {
          name: {
            type: 'string',
            defaultValue: 'banana',
          },
          kind: {
            type: 'string',
            defaultValue: 'fruit',
          },
        },
      }),
    );

    expect(result.current.formFields.name.value).toBe('banana');
    expect(result.current.formFields.name.cleanValue).toBe('banana');
    expect(result.current.formFields.name.props.value).toBe('banana');

    expect(result.current.formFields.kind.value).toBe('fruit');
    expect(result.current.formFields.kind.cleanValue).toBe('fruit');
    expect(result.current.formFields.kind.props.value).toBe('fruit');

    act(() => {
      result.current.setFormValues({ name: 'apple' });
    });

    expect(result.current.formFields.name.value).toBe('apple');
    expect(result.current.formFields.name.cleanValue).toBe('apple');
    expect(result.current.formFields.name.props.value).toBe('apple');

    expect(result.current.formFields.kind.value).toBe('fruit');
    expect(result.current.formFields.kind.cleanValue).toBe('fruit');
    expect(result.current.formFields.kind.props.value).toBe('fruit');
  });

  it('should partially set form values with clearing all values', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; kind: string }>({
        fields: {
          name: {
            type: 'string',
            defaultValue: 'banana',
          },
          kind: {
            type: 'string',
            defaultValue: 'fruit',
          },
        },
      }),
    );

    act(() => {
      result.current.setFormValues({ name: 'apple' }, { clearAll: true });
    });

    expect(result.current.formFields.name.value).toBe('apple');
    expect(result.current.formFields.name.cleanValue).toBe('apple');
    expect(result.current.formFields.name.props.value).toBe('apple');

    expect(result.current.formFields.kind.value).toBe(undefined);
    expect(result.current.formFields.kind.cleanValue).toBe(undefined);
    expect(result.current.formFields.kind.props.value).toBe(undefined);
  });
});

describe('Hook [use-honey-form]: Form context', () => {
  it('should use `allowedNames` configuration from the context in validator function', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {
            type: 'string',
            defaultValue: '',
            validator: (value, { formContext }) => formContext.allowedNames.includes(value),
          },
        },
        context: {
          allowedNames: ['Apple'],
        },
      }),
    );

    act(() => {
      result.current.formFields.name.setValue('Apple');
    });

    expect(result.current.formFields.name.value).toBe('Apple');
    expect(result.current.formErrors).toStrictEqual({});
  });

  it('should use `maxStrLength` configuration from the context in filter function', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {
            type: 'string',
            defaultValue: '',
            filter: (value, { formContext }) => value.slice(0, formContext.maxStrLength),
          },
        },
        context: {
          maxStrLength: 5,
        },
      }),
    );

    act(() => {
      result.current.formFields.name.setValue('Apple123');
    });

    expect(result.current.formFields.name.value).toBe('Apple');
    expect(result.current.formErrors).toStrictEqual({});
  });

  it('should use `currencySign` configuration from the context in format function', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          price: {
            type: 'string',
            defaultValue: '',
            formatter: (value, { formContext }) => `${formContext.currencySign}${value}`,
          },
        },
        context: {
          currencySign: '$',
        },
      }),
    );

    act(() => {
      result.current.formFields.price.setValue('15');
    });

    expect(result.current.formFields.price.value).toBe('$15');
    expect(result.current.formErrors).toStrictEqual({});
  });
});

describe('Hook [use-honey-form]: Reset form', () => {
  it('should reset to initial field values', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {
            type: 'string',
            defaultValue: 'Alex',
          },
          age: {
            type: 'string',
            defaultValue: 45,
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.age.setValue(47);
      result.current.formFields.name.setValue('Dima');
    });

    expect(result.current.formValues).toStrictEqual({
      age: 47,
      name: 'Dima',
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formValues).toStrictEqual({
      age: 45,
      name: 'Alex',
    });
  });

  it('should clear form and field errors after form reset', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {
            type: 'string',
            required: true,
            defaultValue: '',
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.name.setValue('Apple');
    });

    expect(result.current.formValues.name).toBe('Apple');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formValues.name).toBe('');

    expect(result.current.formErrors).toStrictEqual({});
    expect(result.current.formFields.name.errors).toStrictEqual([]);
  });
});

describe('Hook [use-honey-form]: Default values', () => {
  it('should set default form fields values using fields config', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {
            type: 'string',
            defaultValue: 'Alex',
          },
          age: {
            type: 'string',
            defaultValue: 45,
          },
        },
      }),
    );

    expect(result.current.formFields.name.value).toBe('Alex');
    expect(result.current.formFields.age.value).toBe(45);

    expect(result.current.formValues).toStrictEqual({
      name: 'Alex',
      age: 45,
    });
  });

  it('set default fields values using form config', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
          },
        },
        defaults: {
          name: 'banana',
        },
      }),
    );

    expect(result.current.formDefaultValues.name).toBe('banana');

    expect(result.current.formFields.name.value).toBe('banana');
    expect(result.current.formFields.name.cleanValue).toBe('banana');
    expect(result.current.formFields.name.props.value).toBe('banana');
  });

  it('set default field values via `Promise` function', async () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
          },
        },
        defaults: () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                name: 'apple',
              });
            });
          }),
      }),
    );

    expect(result.current.formDefaultValues.name).toBeUndefined();

    expect(result.current.formFields.name.value).toBeUndefined();
    expect(result.current.formFields.name.cleanValue).toBeUndefined();
    expect(result.current.formFields.name.props.value).toBeUndefined();

    await waitFor(() => expect(result.current.isFormDefaultsFetching).toBeTruthy());
    await waitFor(() => expect(result.current.isFormDefaultsFetching).toBeFalsy());

    expect(result.current.formFields.name.value).toBe('apple');
    expect(result.current.formFields.name.cleanValue).toBe('apple');
    expect(result.current.formFields.name.props.value).toBe('apple');

    expect(result.current.formDefaultValues.name).toBe('apple');
  });
});

describe('Hook [use-honey-form]: Fields', () => {
  it('set a new value via `onChange` function', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.name.props.onChange({
        target: { value: 'Peter' },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formFields.name.value).toBe('Peter');
  });

  it('use custom boolean field validator', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'string',
            validator: value => value === 45,
          },
        },
      }),
    );

    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.age.setValue(43);
    });

    expect(result.current.formFields.age.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'Invalid value',
      },
    ]);

    act(() => {
      result.current.formFields.age.setValue(45);
    });

    expect(result.current.formFields.age.errors).toStrictEqual([]);
  });

  it('focus form field', () => {
    const Comp = () => {
      const { formFields } = useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
          },
        },
      });

      useEffect(() => {
        formFields.name.focus();
      }, []);

      return <input data-testid="name" {...formFields.name.props} />;
    };

    const { getByTestId } = render(<Comp />);

    expect(document.activeElement).toBe(getByTestId('name'));
  });

  it('should call `onChange` when field value is changed', async () => {
    const onNameChange = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
            onChange: onNameChange,
          },
        },
      }),
    );

    expect(onNameChange).not.toHaveBeenCalled();

    act(() => {
      result.current.formFields.name.setValue('Dan');
    });

    await waitFor(() => expect(onNameChange).toHaveBeenCalledWith('Dan', expect.any(Object)));
  });
});

describe('Hook [use-honey-form]: String field type', () => {
  it('string field type should only fill interactive field props', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
          },
        },
      }),
    );

    expect(result.current.formFields.name.props).toBeDefined();
    expect(result.current.formFields.name.passiveProps).toBeUndefined();
    expect(result.current.formFields.name.objectProps).toBeUndefined();
  });
});

describe('Hook [use-honey-form]: Numeric field type', () => {
  it('numeric field type should only fill interactive field props', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ phone: string }>({
        fields: {
          phone: {
            type: 'numeric',
          },
        },
      }),
    );

    expect(result.current.formFields.phone.props).toBeDefined();
    expect(result.current.formFields.phone.passiveProps).toBeUndefined();
    expect(result.current.formFields.phone.objectProps).toBeUndefined();
  });

  it('should not raise an error when numeric value is empty', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ phone: string }>({
        fields: {
          phone: {
            type: 'numeric',
          },
        },
      }),
    );
    expect(result.current.formFields.phone.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.phone.setValue('');
    });

    expect(result.current.formFields.phone.errors).toStrictEqual([]);
  });

  it('should not raise an error when numeric value is correct', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ phone: string }>({
        fields: {
          phone: {
            type: 'numeric',
          },
        },
      }),
    );
    expect(result.current.formFields.phone.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.phone.setValue('12345678901234567890');
    });

    expect(result.current.formFields.phone.errors).toStrictEqual([]);
  });

  it('should raise an error when numeric value contains non-numeric characters', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ phone: string }>({
        fields: {
          phone: {
            type: 'numeric',
          },
        },
      }),
    );
    expect(result.current.formFields.phone.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.phone.setValue('1a2');
    });

    expect(result.current.formFields.phone.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'Invalid format',
      },
    ]);
  });
});

describe('Hook [use-honey-form]: Number field type', () => {
  it('number field type should only fill interactive field props', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: string }>({
        fields: {
          age: {
            type: 'number',
          },
        },
      }),
    );

    expect(result.current.formFields.age.props).toBeDefined();
    expect(result.current.formFields.age.passiveProps).toBeUndefined();
    expect(result.current.formFields.age.objectProps).toBeUndefined();
  });

  it('initially the number field type value should be undefined', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'number',
          },
        },
      }),
    );

    expect(result.current.formFields.age.value).toBeUndefined();
    expect(result.current.formFields.age.cleanValue).toBeUndefined();
  });

  it('string value should be converted to number using number type', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'number',
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.age.props.onChange({
        target: { value: '35' },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formFields.age.value).toBe('35');
    expect(result.current.formFields.age.cleanValue).toBe(35);
  });

  it('empty string value should be converted to `undefined` using number type', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'number',
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.age.props.onChange({
        target: { value: '' },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formFields.age.value).toBe('');
    expect(result.current.formFields.age.cleanValue).toBeUndefined();
  });

  it('negative value should be allowed by default for number field type', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'number',
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.age.setValue(-5);
    });

    expect(result.current.formFields.age.value).toBe(-5);
    expect(result.current.formFields.age.cleanValue).toBe(-5);
    expect(result.current.formFields.age.errors).toStrictEqual([]);
  });
});

describe('Hook [use-honey-form]: Email field type', () => {
  it('email field type should only fill interactive field props', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ email: string }>({
        fields: {
          email: {
            type: 'email',
          },
        },
      }),
    );

    expect(result.current.formFields.email.props).toBeDefined();
    expect(result.current.formFields.email.passiveProps).toBeUndefined();
    expect(result.current.formFields.email.objectProps).toBeUndefined();
  });

  it('should not raise an error when email is empty', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ email: string }>({
        fields: {
          email: {
            type: 'email',
          },
        },
      }),
    );

    expect(result.current.formFields.email.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.email.setValue('');
    });

    expect(result.current.formFields.email.errors).toStrictEqual([]);
  });

  it('should raise an error when email is not valid', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ email: string }>({
        fields: {
          email: {
            type: 'email',
          },
        },
      }),
    );
    expect(result.current.formFields.email.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.email.setValue('abc');
    });

    expect(result.current.formFields.email.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'Invalid email format',
      },
    ]);

    act(() => {
      result.current.formFields.email.setValue('a@');
    });

    expect(result.current.formFields.email.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'Invalid email format',
      },
    ]);

    act(() => {
      result.current.formFields.email.setValue('a@g');
    });

    expect(result.current.formFields.email.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'Invalid email format',
      },
    ]);

    act(() => {
      result.current.formFields.email.setValue('a@gmail.');
    });

    expect(result.current.formFields.email.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'Invalid email format',
      },
    ]);

    act(() => {
      result.current.formFields.email.setValue('...a@gmail.com');
    });

    expect(result.current.formFields.email.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'Invalid email format',
      },
    ]);
  });

  it('should pass email validation when email is correct', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ email: string }>({
        fields: {
          email: {
            type: 'email',
          },
        },
      }),
    );
    expect(result.current.formFields.email.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.email.setValue('a.kr@gmail.com');
    });

    expect(result.current.formFields.email.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.email.setValue('a+1@gmail.com');
    });

    expect(result.current.formFields.email.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.email.setValue('a-b@gmail.com');
    });

    expect(result.current.formFields.email.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.email.setValue('a_b@gmail.com');
    });

    expect(result.current.formFields.email.errors).toStrictEqual([]);
  });
});

describe('Hook [use-honey-form]: Nested forms', () => {
  it('should correctly identify the value type of an array field', () => {
    type Item = {
      name: string;
      weight: number;
    };

    type Products = {
      items: Item[];
    };

    const { result } = renderHook(() =>
      useHoneyForm<Products>({
        fields: {
          items: {
            type: 'nestedForms',
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.items.setValue([]);
    });

    expect(result.current.formFields.items.value).toStrictEqual([]);
  });

  it('should populate the parent field with default values from the child form initially', () => {
    type Item = {
      name: string;
      weight: number;
    };

    type Products = {
      items: Item[];
      name: string;
    };

    const { result: itemsResult } = renderHook(() =>
      useHoneyForm<Products>({
        fields: {
          items: {
            type: 'nestedForms',
            defaultValue: [],
          },
          name: {
            type: 'string',
          },
        },
      }),
    );

    const { unmount } = renderHook(() =>
      useChildHoneyForm<Products, Item>({
        formIndex: 0,
        parentField: itemsResult.current.formFields.items,
        fields: {
          name: {
            type: 'string',
          },
          weight: {
            type: 'number',
          },
        },
        defaults: {
          name: '',
          weight: 0,
        },
      }),
    );

    expect(itemsResult.current.formFields.items.getChildFormsValues()).toStrictEqual([
      {
        name: '',
        weight: 0,
      },
    ]);

    unmount();

    expect(itemsResult.current.formFields.items.getChildFormsValues()).toStrictEqual([]);
  });

  it('should synchronize child form field values with the parent form field', () => {
    type Item = {
      name: string;
      weight: number;
    };

    type Products = {
      items: Item[];
    };

    const { result: itemsResult } = renderHook(() =>
      useHoneyForm<Products>({
        fields: {
          items: {
            type: 'nestedForms',
            defaultValue: [],
          },
        },
      }),
    );

    const { result: itemResult1, unmount: unmountItem1 } = renderHook(() =>
      useChildHoneyForm<Products, Item>({
        formIndex: 0,
        parentField: itemsResult.current.formFields.items,
        fields: {
          name: {
            type: 'string',
          },
          weight: {
            type: 'number',
          },
        },
      }),
    );

    const { result: itemResult2, unmount: unmountItem2 } = renderHook(() =>
      useChildHoneyForm<Products, Item>({
        formIndex: 1,
        parentField: itemsResult.current.formFields.items,
        fields: {
          name: {
            type: 'string',
          },
          weight: {
            type: 'number',
          },
        },
      }),
    );

    act(() => {
      itemResult1.current.formFields.name.setValue('Apple');
    });

    expect(itemsResult.current.formFields.items.getChildFormsValues()).toStrictEqual([
      {
        name: 'Apple',
        weight: undefined,
      },
      {
        name: undefined,
        weight: undefined,
      },
    ]);

    act(() => {
      itemResult2.current.formFields.name.setValue('Banana');
    });

    expect(itemsResult.current.formFields.items.getChildFormsValues()).toStrictEqual([
      {
        name: 'Apple',
        weight: undefined,
      },
      {
        name: 'Banana',
        weight: undefined,
      },
    ]);

    unmountItem1();

    expect(itemsResult.current.formFields.items.getChildFormsValues()).toStrictEqual([
      {
        name: 'Banana',
        weight: undefined,
      },
    ]);

    const { result: itemResult3 } = renderHook(() =>
      useChildHoneyForm<Products, Item>({
        formIndex: 1,
        parentField: itemsResult.current.formFields.items,
        fields: {
          name: {
            type: 'string',
          },
          weight: {
            type: 'number',
          },
        },
      }),
    );

    expect(itemsResult.current.formFields.items.getChildFormsValues()).toStrictEqual([
      {
        name: 'Banana',
        weight: undefined,
      },
      {
        name: undefined,
        weight: undefined,
      },
    ]);

    act(() => {
      itemResult3.current.formFields.name.setValue('Apple');
    });

    expect(itemsResult.current.formFields.items.getChildFormsValues()).toStrictEqual([
      {
        name: 'Banana',
        weight: undefined,
      },
      {
        name: 'Apple',
        weight: undefined,
      },
    ]);

    unmountItem2();

    expect(itemsResult.current.formFields.items.getChildFormsValues()).toStrictEqual([
      {
        name: 'Apple',
        weight: undefined,
      },
    ]);
  });
});

describe('Hook [use-honey-form]: Dependent fields', () => {
  it('dependent field value should be cleared when parent field value is changed', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ city: string; address: string }>({
        fields: {
          city: {
            type: 'string',
          },
          address: {
            type: 'string',
            dependsOn: 'city',
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.city.setValue('New York');
      result.current.formFields.address.setValue('71st Queens');
    });

    expect(result.current.formFields.city.value).toBe('New York');
    expect(result.current.formFields.address.value).toBe('71st Queens');

    act(() => {
      result.current.formFields.city.setValue('New Jersey');
    });

    expect(result.current.formFields.city.value).toBe('New Jersey');

    expect(result.current.formFields.address.value).toBeUndefined();
    expect(result.current.formFields.address.props.value).toBeUndefined();
  });

  it('dependent field values should be cleared in chain when parent field value is changed', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ city: string; address: string; apt: string }>({
        fields: {
          city: {
            type: 'string',
          },
          address: {
            type: 'string',
            dependsOn: 'city',
          },
          apt: {
            type: 'string',
            dependsOn: 'address',
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.city.setValue('New Jersey');
      result.current.formFields.address.setValue('53st Dockland');
      result.current.formFields.apt.setValue('341a');
    });

    expect(result.current.formFields.city.value).toBe('New Jersey');
    expect(result.current.formFields.address.value).toBe('53st Dockland');
    expect(result.current.formFields.apt.value).toBe('341a');

    act(() => {
      result.current.formFields.city.setValue('New York');
    });

    expect(result.current.formFields.city.value).toBe('New York');

    expect(result.current.formFields.address.value).toBeUndefined();
    expect(result.current.formFields.address.props.value).toBeUndefined();

    expect(result.current.formFields.apt.value).toBeUndefined();
    expect(result.current.formFields.apt.props.value).toBeUndefined();
  });

  it('cleared dependent field value should not be submitted', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ city: string; address: string }>({
        fields: {
          city: {
            type: 'string',
          },
          address: {
            type: 'string',
            dependsOn: 'city',
          },
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.formFields.city.setValue('New York');
      result.current.formFields.address.setValue('71st Queens');
      result.current.formFields.city.setValue('New Jersey');
    });

    await act(() => result.current.submitForm());

    expect(onSubmit).toHaveBeenCalledWith(
      { city: 'New Jersey', address: undefined },
      { context: undefined },
    );
  });

  it('cross dependent fields should clear each other', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ address1: string; address2: string }>({
        fields: {
          address1: {
            type: 'string',
            dependsOn: 'address2',
          },
          address2: {
            type: 'string',
            dependsOn: 'address1',
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.address1.setValue('541st Arnold');
      result.current.formFields.address2.setValue('71st Queens');
    });

    expect(result.current.formFields.address1.value).toBeUndefined();
    expect(result.current.formFields.address1.props.value).toBeUndefined();

    expect(result.current.formFields.address2.value).toBe('71st Queens');

    act(() => {
      result.current.formFields.address1.setValue('132st Rich-Port');
    });

    expect(result.current.formFields.address1.value).toBe('132st Rich-Port');

    expect(result.current.formFields.address2.value).toBeUndefined();
    expect(result.current.formFields.address2.props.value).toBeUndefined();
  });

  it('multiple cross dependent fields with clearing each other', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; category: string; customCategory: string }>({
        fields: {
          name: {
            type: 'string',
          },
          category: {
            type: 'string',
            dependsOn: ['name', 'customCategory'],
          },
          customCategory: {
            type: 'string',
            dependsOn: 'category',
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.name.setValue('apple');
      result.current.formFields.category.setValue('fruits');
    });

    expect(result.current.formFields.name.value).toBe('apple');
    expect(result.current.formFields.category.value).toBe('fruits');

    act(() => {
      result.current.formFields.customCategory.setValue('my-fruits');
    });

    expect(result.current.formFields.name.value).toBe('apple');
    expect(result.current.formFields.category.value).toBeUndefined();
    expect(result.current.formFields.customCategory.value).toBe('my-fruits');
  });
});

describe('Hook [use-honey-form]: Work with dynamic fields', () => {
  it('dynamically add a new form field', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ gender?: 'male' | 'female' }>({
        fields: {},
      }),
    );

    act(() => {
      result.current.addFormField('gender', {
        type: 'string',
        defaultValue: 'female',
      });
    });

    expect(result.current.formFields.gender?.value).toBe('female');
  });

  it('dynamically added the new form field should be submitted with other fields', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ age: number; gender?: 'male' | 'female' }>({
        fields: {
          age: {
            type: 'string',
            defaultValue: 30,
          },
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.addFormField('gender', {
        type: 'string',
        defaultValue: 'female',
      });
    });

    await act(() => result.current.submitForm());

    expect(onSubmit).toHaveBeenCalledWith({ age: 30, gender: 'female' }, { context: undefined });
  });

  it('remove dynamically added the form field', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age?: number }>({
        fields: {
          age: {
            type: 'string',
            defaultValue: 10,
          },
        },
      }),
    );
    expect(result.current.formFields.age?.value).toBe(10);

    act(() => {
      result.current.removeFormField('age');
    });

    expect(result.current.formFields.age?.value).toBeUndefined();
  });
});

describe('Hook [use-honey-form]: Skipping fields', () => {
  it('should skip field permanently', async () => {
    type Form = {
      name: string;
      price: number;
    };

    const onSubmit = jest.fn<Promise<void>, [Form]>();

    const { result } = renderHook(() =>
      useHoneyForm<Form>({
        fields: {
          name: {
            type: 'string',
          },
          price: {
            type: 'string',
            skip: () => true,
          },
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.formFields.name.setValue('Apple');
      result.current.formFields.price.setValue(10);
    });

    expect(result.current.formFields.name.value).toBe('Apple');
    expect(result.current.formFields.price.value).toBe(10);

    await act(() => result.current.submitForm());

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          name: 'Apple',
        },
        { context: undefined },
      ),
    );
  });

  it('should skip field by condition', async () => {
    type Form = {
      name: string;
      price: number;
    };

    const onSubmit = jest.fn<Promise<void>, [Form]>();

    const { result } = renderHook(() =>
      useHoneyForm<Form>({
        fields: {
          name: {
            type: 'string',
          },
          price: {
            type: 'number',
            skip: ({ formFields }) => formFields.name.value === 'Pear',
          },
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.formFields.name.setValue('Orange');
      result.current.formFields.price.setValue(15);
    });

    await act(() => result.current.submitForm());

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          name: 'Orange',
          price: 15,
        },
        { context: undefined },
      ),
    );

    act(() => {
      result.current.formFields.name.setValue('Pear');
    });

    await act(() => result.current.submitForm());

    expect(result.current.formFields.price.value).toBe(15);

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          name: 'Pear',
        },
        { context: undefined },
      ),
    );
  });
});

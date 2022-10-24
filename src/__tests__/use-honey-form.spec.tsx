import React, { ChangeEvent, useEffect } from 'react';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react';

import { useHoneyForm } from '../use-honey-form';

describe('Use honey form. General', () => {
  test('errors should be null initially', () => {
    const { result } = renderHook(() => useHoneyForm({ fields: {} }));

    expect(result.current.errors).toStrictEqual({});
  });

  test('error should be undefined for just declared field', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {},
        },
      })
    );

    expect(result.current.errors.name).toBeUndefined();
  });

  test('should set initial form fields', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {
            value: 'Alex',
          },
          age: {
            value: 45,
          },
        },
      })
    );

    expect(result.current.formFields.name.value).toBe('Alex');
    expect(result.current.formFields.age.value).toBe(45);
  });

  test('should reset to initial field values', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {
            value: 'Alex',
          },
          age: {
            value: 45,
          },
        },
      })
    );

    act(() => {
      result.current.formFields.age.setValue(47);
      result.current.formFields.name.setValue('Dima');
    });

    expect(result.current.formFields.age.value).toBe(47);
    expect(result.current.formFields.name.value).toBe('Dima');

    act(() => {
      result.current.reset();
    });

    expect(result.current.formFields.name.value).toBe('Alex');
    expect(result.current.formFields.age.value).toBe(45);
  });

  test('a form should be dirty after setting value', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            value: 45,
          },
        },
      })
    );
    expect(result.current.isDirty).toBeFalsy();

    act(() => {
      result.current.formFields.age.setValue(56);
    });

    expect(result.current.isDirty).toBeTruthy();
  });

  test('a form should not be dirty after submitting', async () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            value: 45,
          },
        },
      })
    );

    await act(async () => {
      result.current.formFields.age.setValue(56);

      await result.current.submit();
    });

    expect(result.current.isDirty).toBeFalsy();
  });

  test('reset errors', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {},
          age: {},
        },
      })
    );

    act(() => {
      result.current.addError('name', {
        type: 'server',
        message: 'name should be less than 255 chars',
      });

      result.current.addError('age', {
        type: 'server',
        message: 'age should be less than 55',
      });
    });

    expect(Object.keys(result.current.errors).length).toBe(2);

    act(() => {
      result.current.resetErrors();
    });

    expect(Object.keys(result.current.errors).length).toBe(0);
  });

  test('should re-render form one time when onChange() is triggered', () => {
    let renderers = 0;

    const Comp = () => {
      const { formFields } = useHoneyForm<{ name: string }>({
        fields: {
          name: {
            value: '',
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

  test('call onChange() with form data when any field value is changed', async () => {
    const onChange = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; kind: string }>({
        fields: {
          name: {},
          kind: {},
        },
        onChange,
      })
    );

    expect(onChange).not.toBeCalled();

    act(() => {
      result.current.formFields.name.setValue('a');
    });

    await waitFor(() => expect(onChange).toBeCalledWith({ name: 'a', kind: undefined }));

    act(() => {
      result.current.formFields.kind.setValue('f');
    });

    await waitFor(() => expect(onChange).toBeCalledWith({ name: 'a', kind: 'f' }));
  });
});

describe('Use honey form. Validation', () => {
  test('use min value validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            min: 5,
          },
        },
      })
    );
    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.age.setValue(5);
    });
    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.age.setValue(4);
    });
    expect(result.current.formFields.age.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'The value should be greater or equal to 5',
      },
    ]);
  });

  test('use max value validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            max: 65,
          },
        },
      })
    );
    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.age.setValue(65);
    });
    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.age.setValue(70);
    });
    expect(result.current.formFields.age.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'The value should be less or equal to 65',
      },
    ]);
  });

  test('use min and max value validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            min: 5,
            max: 65,
          },
        },
      })
    );
    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.age.setValue(70);
    });
    expect(result.current.formFields.age.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'The value should be between 5 and 65',
      },
    ]);
  });

  test('use min length string validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {
            min: 1,
          },
        },
      })
    );
    expect(result.current.formFields.name.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.name.setValue('A');
    });
    expect(result.current.formFields.name.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.name.setValue('');
    });
    expect(result.current.formFields.name.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'The length should be greater or equal to 1',
      },
    ]);
  });

  test('use max length string validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {
            max: 5,
          },
        },
      })
    );
    expect(result.current.formFields.name.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.name.setValue('A');
    });
    expect(result.current.formFields.name.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.name.setValue('Antonio');
    });
    expect(result.current.formFields.name.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'The length should be less or equal to 5',
      },
    ]);
  });

  test('use min and max length string validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {
            min: 1,
            max: 5,
          },
        },
      })
    );
    expect(result.current.formFields.name.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.name.setValue('Antonio');
    });
    expect(result.current.formFields.name.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'The length should be between 1 and 5',
      },
    ]);
  });
});

describe('Use honey form. Submitting', () => {
  test('should call onSubmit() when submitting', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {
            value: 'Peter',
          },
          age: {
            value: 23,
          },
        },
        onSubmit,
      })
    );
    expect(onSubmit).not.toBeCalled();

    await act(() => result.current.submit());

    expect(onSubmit).toBeCalledWith({ name: 'Peter', age: 23 });
  });

  test('check required fields when submitting', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {
            required: true,
          },
          age: {},
        },
        onSubmit,
      })
    );

    await act(() => result.current.submit());

    expect(result.current.formFields.name.errors).toStrictEqual([
      {
        type: 'required',
        message: 'The value is required',
      },
    ]);
    expect(onSubmit).not.toBeCalled();
  });

  test('use submit handler function passed to submit()', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {
            required: true,
          },
          age: {},
        },
      })
    );

    expect(onSubmit).not.toBeCalled();

    act(() => {
      result.current.formFields.name.setValue('Ken');
    });

    await act(() => result.current.submit(onSubmit));

    expect(onSubmit).toBeCalledWith({ name: 'Ken', age: undefined });
  });
});

describe('Use honey form. Field', () => {
  test('set value calling onChange()', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {},
        },
      })
    );

    act(() => {
      result.current.formFields.name.props.onChange({
        target: { value: 'Peter' },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formFields.name.value).toBe('Peter');
  });

  test('use a filter for a field value', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            value: '',
            filter: value => value.replace(/[^0-9]/g, ''),
          },
        },
      })
    );

    act(() => {
      result.current.formFields.age.setValue('a12b');
    });
    expect(result.current.formFields.age.value).toBe('12');
  });

  test('use number type', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'number',
          },
        },
      })
    );

    act(() => {
      result.current.formFields.age.props.onChange({
        target: { value: '35' },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formFields.age.cleanValue).toBe(35);
  });

  test('use custom boolean field validator', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            validator: value => value === 45,
          },
        },
      })
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

  test('use custom errors return from field validator', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            validator: value =>
              value > 45 || {
                errors: [
                  {
                    type: 'invalid',
                    message: 'Age should be greater than 45',
                  },
                ],
              },
          },
        },
      })
    );
    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.age.setValue(43);
    });
    expect(result.current.formFields.age.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'Age should be greater than 45',
      },
    ]);

    act(() => {
      result.current.formFields.age.setValue(46);
    });
    expect(result.current.formFields.age.errors).toStrictEqual([]);
  });

  test('add new form field', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ gender?: 'male' | 'female' }>({
        fields: {},
      })
    );

    act(() => {
      result.current.addFormField('gender', {
        value: 'female',
      });
    });
    expect(result.current.formFields.gender?.value).toBe('female');
  });

  test('a new form field should be submitted with other fields', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ age: number; gender?: 'male' | 'female' }>({
        fields: {
          age: {
            value: 30,
          },
        },
        onSubmit,
      })
    );

    act(() => {
      result.current.addFormField('gender', {
        value: 'female',
      });
    });

    await act(() => result.current.submit());

    expect(onSubmit).toBeCalledWith({ age: 30, gender: 'female' });
  });

  test('remove form field', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age?: number }>({
        fields: {
          age: {
            value: 10,
          },
        },
      })
    );
    expect(result.current.formFields.age?.value).toBe(10);

    act(() => {
      result.current.removeFormField('age');
    });
    expect(result.current.formFields.age?.value).toBeUndefined();
  });

  test('dependent field value should be cleared when parent field is changed', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ city: string; address: string }>({
        fields: {
          city: {},
          address: {
            dependsOn: 'city',
          },
        },
      })
    );

    act(() => {
      result.current.formFields.city.setValue('New York');
    });
    act(() => {
      result.current.formFields.address.setValue('71st Queens');
    });

    expect(result.current.formFields.city.value).toBe('New York');
    expect(result.current.formFields.address.value).toBe('71st Queens');

    act(() => {
      result.current.formFields.city.setValue('New Jersey');
    });

    expect(result.current.formFields.city.value).toBe('New Jersey');
    expect(result.current.formFields.address.value).toBeUndefined();
  });

  test('form field should be focused', () => {
    const Comp = () => {
      const { formFields } = useHoneyForm<{ name: string }>({
        fields: {
          name: {},
        },
      });

      useEffect(() => {
        formFields.name.focus();
      }, []);

      return <input {...formFields.name.props} data-testid="name" />;
    };

    const { getByTestId } = render(<Comp />);

    expect(document.activeElement).toBe(getByTestId('name'));
  });

  test('add server error to existed field', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {},
        },
      })
    );
    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.addError('age', {
        type: 'server',
        message: 'age should be less than 55',
      });
    });

    expect(result.current.formFields.age.errors).toStrictEqual([
      {
        message: 'age should be less than 55',
        type: 'server',
      },
    ]);
  });

  test('add server error to non existed field', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {},
        },
      })
    );

    act(() => {
      // there are some cases when the form can have alien field errors when the server can return non existed form fields
      result.current.addError('name' as never, {
        type: 'server',
        message: 'name should be less than 255',
      });
    });

    expect(result.current.errors).toStrictEqual({
      name: [
        {
          message: 'name should be less than 255',
          type: 'server',
        },
      ],
    });
  });

  test('fields list should have 0 length when no initial items added', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ items: { name: string }[] }>({
        fields: {
          items: {
            value: [],
          },
        },
      })
    );

    expect(result.current.formFields.items.length).toBe(0);
  });

  test('fields list should have 1 added item', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ items: { name: string }[] }>({
        fields: {
          items: {
            value: [
              {
                name: 'apple',
              },
            ],
          },
        },
      })
    );

    expect(result.current.formFields.items.length).toBe(1);
  });

  test.skip('1', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ items: { name: string }[] }>({
        fields: {
          items: {
            value: [],
          },
        },
      })
    );

    result.current.formFields.items.add({ name: 'Apple' });

    expect(result.current.formFields.items.length).toBe(1);
  });
});

describe('Use honey form. Filter function', () => {
  test.skip('should not re-render form when filter() does not change a value', () => {
    let renderers = 0;

    const Comp = () => {
      const { formFields } = useHoneyForm<{ age: string }>({
        fields: {
          age: {
            value: '',
            filter: value => value.replace(/[^0-9]/g, ''),
          },
        },
      });
      renderers += 1;

      return <input {...formFields.age.props} data-testid="age" />;
    };

    const { getByTestId } = render(<Comp />);

    expect(renderers).toBe(1);

    fireEvent.change(getByTestId('age'), { target: { value: '10' } });

    expect(renderers).toBe(2);

    fireEvent.change(getByTestId('age'), { target: { value: '10a' } });

    expect(renderers).toBe(2);
  });
});

describe('Use honey form. Format function', () => {
  test('a value should have formatted value', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ price: number }>({
        fields: {
          price: {
            format: value => `$${value}`,
          },
        },
      })
    );

    act(() => {
      result.current.formFields.price.setValue(5);
    });

    expect(result.current.formFields.price.cleanValue).toBe(5);
    expect(result.current.formFields.price.value).toBe('$5');
  });

  test('call onSubmit() with clean values (not formatted)', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; price: number }>({
        fields: {
          name: {},
          price: {
            format: value => `$${value}`,
          },
        },
        onSubmit,
      })
    );

    act(() => {
      result.current.formFields.name.setValue('apple');
      result.current.formFields.price.setValue(15);
    });

    expect(result.current.formFields.price.cleanValue).toBe(15);
    expect(result.current.formFields.price.value).toBe('$15');

    await act(() => result.current.submit());

    expect(onSubmit).toBeCalledWith({ name: 'apple', price: 15 });
  });
});

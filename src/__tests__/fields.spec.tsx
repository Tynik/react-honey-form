import type { ChangeEvent } from 'react';
import React, { useEffect } from 'react';
import { act, render, renderHook, waitFor } from '@testing-library/react';

import { useHoneyForm } from '../use-honey-form';

describe('Hook [use-honey-form]: Fields', () => {
  it('set a new value via onChange() function', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {},
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

  it('empty string value should be converted to undefined using number type', () => {
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

  it('use custom boolean field validator', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
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

  it('negative value should be allowed by default for number type', () => {
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

  it('focus form field', () => {
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

  it('set default field values', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {},
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

  it('set default field values via Promise function', async () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {},
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

    expect(result.current.formFields.name.value).toBeUndefined();
    expect(result.current.formFields.name.cleanValue).toBeUndefined();
    expect(result.current.formFields.name.props.value).toBeUndefined();

    await waitFor(() => expect(result.current.isFormDefaultsFetching).toBeTruthy());
    await waitFor(() => expect(result.current.isFormDefaultsFetching).toBeFalsy());

    expect(result.current.formFields.name.value).toBe('apple');
    expect(result.current.formFields.name.cleanValue).toBe('apple');
    expect(result.current.formFields.name.props.value).toBe('apple');
  });

  it('form default values should be filled with resolved value of Promise function', async () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {},
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

    await waitFor(() => expect(result.current.isFormDefaultsFetching).toBeTruthy());
    await waitFor(() => expect(result.current.isFormDefaultsFetching).toBeFalsy());

    expect(result.current.formDefaultValues.name).toBe('apple');
  });

  it('should call onChange() when field value is changed', async () => {
    const onNameChange = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            onChange: onNameChange,
          },
        },
      }),
    );

    expect(onNameChange).not.toBeCalled();

    act(() => {
      result.current.formFields.name.setValue('Dan');
    });

    await waitFor(() => expect(onNameChange).toBeCalledWith('Dan', expect.any(Object)));
  });
});

describe('Hook [use-honey-form]: Array fields', () => {
  it('should correctly identify the value type of an array field', () => {
    type Item = {
      name: string;
      weight: number;
    };

    const { result } = renderHook(() =>
      useHoneyForm<{ items: Item[] }>({
        fields: {
          items: {},
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

    const { result: itemsResult } = renderHook(() =>
      useHoneyForm<{ items: Item[] }>({
        fields: {
          items: {
            value: [],
          },
        },
      }),
    );

    const { unmount } = renderHook(() =>
      useHoneyForm<Item>({
        formIndex: 0,
        parentField: itemsResult.current.formFields.items,
        fields: {
          name: {},
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

    expect(itemsResult.current.formFields.items.childFormsValues).toStrictEqual([
      {
        name: '',
        weight: 0,
      },
    ]);

    unmount();

    expect(itemsResult.current.formFields.items.childFormsValues).toStrictEqual([]);
  });

  it('should synchronize child form field values with the parent form field', () => {
    type Item = {
      name: string;
      weight: number;
    };

    const { result: itemsResult } = renderHook(() =>
      useHoneyForm<{ items: Item[] }>({
        fields: {
          items: {
            value: [],
          },
        },
      }),
    );

    const { result: itemResult1, unmount: unmountItem1 } = renderHook(() =>
      useHoneyForm<Item>({
        formIndex: 0,
        parentField: itemsResult.current.formFields.items,
        fields: {
          name: {},
          weight: {
            type: 'number',
          },
        },
      }),
    );

    const { result: itemResult2, unmount: unmountItem2 } = renderHook(() =>
      useHoneyForm<Item>({
        formIndex: 1,
        parentField: itemsResult.current.formFields.items,
        fields: {
          name: {},
          weight: {
            type: 'number',
          },
        },
      }),
    );

    act(() => {
      itemResult1.current.formFields.name.setValue('Apple');
    });

    expect(itemsResult.current.formFields.items.childFormsValues).toStrictEqual([
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

    expect(itemsResult.current.formFields.items.childFormsValues).toStrictEqual([
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

    expect(itemsResult.current.formFields.items.childFormsValues).toStrictEqual([
      {
        name: 'Banana',
        weight: undefined,
      },
    ]);

    const { result: itemResult3 } = renderHook(() =>
      useHoneyForm<Item>({
        formIndex: 1,
        parentField: itemsResult.current.formFields.items,
        fields: {
          name: {},
          weight: {
            type: 'number',
          },
        },
      }),
    );

    expect(itemsResult.current.formFields.items.childFormsValues).toStrictEqual([
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

    expect(itemsResult.current.formFields.items.childFormsValues).toStrictEqual([
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

    expect(itemsResult.current.formFields.items.childFormsValues).toStrictEqual([
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
          city: {},
          address: {
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
      useHoneyForm<{ city: string; address: string; ap: string }>({
        fields: {
          city: {},
          address: {
            dependsOn: 'city',
          },
          ap: {
            dependsOn: 'address',
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.city.setValue('New Jersey');
      result.current.formFields.address.setValue('53st Dockland');
      result.current.formFields.ap.setValue('341a');
    });

    expect(result.current.formFields.city.value).toBe('New Jersey');
    expect(result.current.formFields.address.value).toBe('53st Dockland');
    expect(result.current.formFields.ap.value).toBe('341a');

    act(() => {
      result.current.formFields.city.setValue('New York');
    });

    expect(result.current.formFields.city.value).toBe('New York');

    expect(result.current.formFields.address.value).toBeUndefined();
    expect(result.current.formFields.address.props.value).toBeUndefined();

    expect(result.current.formFields.ap.value).toBeUndefined();
    expect(result.current.formFields.ap.props.value).toBeUndefined();
  });

  it('cleared dependent field value should not be submitted', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ city: string; address: string }>({
        fields: {
          city: {},
          address: {
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

    expect(onSubmit).toBeCalledWith({ city: 'New Jersey', address: undefined });
  });

  it('cross dependent fields should clear each other', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ address1: string; address2: string }>({
        fields: {
          address1: {
            dependsOn: 'address2',
          },
          address2: {
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
          name: {},
          category: {
            dependsOn: ['name', 'customCategory'],
          },
          customCategory: {
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
        value: 'female',
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
            value: 30,
          },
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.addFormField('gender', {
        value: 'female',
      });
    });

    await act(() => result.current.submitForm());

    expect(onSubmit).toBeCalledWith({ age: 30, gender: 'female' });
  });

  it('remove dynamically added the form field', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age?: number }>({
        fields: {
          age: {
            value: 10,
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

    const onSubmit = jest.fn<Promise<void>, Form[]>();

    const { result } = renderHook(() =>
      useHoneyForm<Form>({
        fields: {
          name: {},
          price: {
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
      expect(onSubmit).toBeCalledWith({
        name: 'Apple',
      }),
    );
  });

  it('should skip field by condition', async () => {
    type Form = {
      name: string;
      price: number;
    };

    const onSubmit = jest.fn<Promise<void>, Form[]>();

    const { result } = renderHook(() =>
      useHoneyForm<Form>({
        fields: {
          name: {},
          price: {
            type: 'number',
            skip: formFields => formFields.name.value === 'Pear',
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
      expect(onSubmit).toBeCalledWith({
        name: 'Orange',
        price: 15,
      }),
    );

    act(() => {
      result.current.formFields.name.setValue('Pear');
    });

    await act(() => result.current.submitForm());

    expect(result.current.formFields.price.value).toBe(15);

    await waitFor(() =>
      expect(onSubmit).toBeCalledWith({
        name: 'Pear',
      }),
    );
  });
});

import React, { useEffect } from 'react';
import { act, render, renderHook } from '@testing-library/react';

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
        type: 'invalidValue',
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
        type: 'invalidValue',
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
        type: 'invalidValue',
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
        type: 'invalidValue',
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
        type: 'invalidValue',
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
        type: 'invalidValue',
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
});

describe('Use honey form. Field', () => {
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
        type: 'invalidValue',
        message: 'Invalid value',
      },
    ]);

    act(() => {
      result.current.formFields.age.setValue(45);
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

  test('add server field error', () => {
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

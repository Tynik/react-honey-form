import type { ChangeEvent } from 'react';
import React, { useEffect } from 'react';
import { act, render, renderHook } from '@testing-library/react';

import { useHoneyForm } from '../use-honey-form';

describe('Use honey form. Fields', () => {
  test('set a new value via onChange() function', () => {
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

  test('use filter() function for a field value', () => {
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
    expect(result.current.formFields.age.cleanValue).toBe('12');
  });

  test('by default number type field values should be undefined', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'number',
          },
        },
      })
    );

    expect(result.current.formFields.age.value).toBeUndefined();
    expect(result.current.formFields.age.cleanValue).toBeUndefined();
  });

  test('string value should be converted to number with number type', () => {
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

    expect(result.current.formFields.age.value).toBe('35');
    expect(result.current.formFields.age.cleanValue).toBe(35);
  });

  test('empty string value should be converted to undefined with number type', () => {
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
        target: { value: '' },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formFields.age.value).toBe('');
    expect(result.current.formFields.age.cleanValue).toBeUndefined();
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

  test('negative value should be allowed by default for number type', () => {
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
      result.current.formFields.age.setValue(-5);
    });

    expect(result.current.formFields.age.value).toBe(-5);
    expect(result.current.formFields.age.cleanValue).toBe(-5);
    expect(result.current.formFields.age.errors).toStrictEqual([]);
  });

  test('decimal value should not be allowed by default for number type', () => {
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
      result.current.formFields.age.setValue(1.5);
    });

    expect(result.current.formFields.age.value).toBe(1.5);
    expect(result.current.formFields.age.cleanValue).toBeUndefined();

    expect(result.current.errors).toStrictEqual({
      age: [
        {
          message: 'Only numerics are allowed',
          type: 'invalid',
        },
      ],
    });
  });

  test('decimal value should not be allowed by default for number type with custom validator', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'number',
            validator: value => value > 18 && value < 100,
          },
        },
      })
    );

    act(() => {
      result.current.formFields.age.setValue(1.5);
    });

    expect(result.current.formFields.age.value).toBe(1.5);
    expect(result.current.formFields.age.cleanValue).toBeUndefined();

    expect(result.current.errors).toStrictEqual({
      age: [
        {
          message: 'Only numerics are allowed',
          type: 'invalid',
        },
      ],
    });
  });

  test('focus form field using focus() field function', () => {
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

  test('should recognize array field value type', () => {
    type Item = { name: string; weight: number };

    const { result } = renderHook(() =>
      useHoneyForm<{ items: Item[] }>({
        fields: {
          items: {},
        },
      })
    );

    act(() => {
      result.current.formFields.items.setValue([]);
    });

    expect(result.current.formFields.items.value).toStrictEqual([]);
  });
});

describe('Use honey form. Dependent fields', () => {
  test('dependent field value should be cleared when parent field value is changed', () => {
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

  test('dependent field values should be cleared in chain when parent field value is changed', () => {
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
      })
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
    expect(result.current.formFields.ap.value).toBeUndefined();
  });

  test('cleared dependent field value should not be submitted', async () => {
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
      })
    );

    act(() => {
      result.current.formFields.city.setValue('New York');
      result.current.formFields.address.setValue('71st Queens');
      result.current.formFields.city.setValue('New Jersey');
    });

    await act(() => result.current.submit());

    expect(onSubmit).toBeCalledWith({ city: 'New Jersey', address: undefined });
  });
});

describe('Use honey form. Work with dynamic fields', () => {
  test('dynamically add a new form field', () => {
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

  test('dynamically added the new form field should be submitted with other fields', async () => {
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

  test('remove dynamically added the form field', () => {
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
});

describe('Use honey form. Work with field errors', () => {
  test('use custom errors return from field validator', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            validator: value =>
              value > 45 || [
                {
                  type: 'invalid',
                  message: 'Age should be greater than 45',
                },
              ],
          },
        },
      })
    );

    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.age.setValue(43);
    });

    expect(result.current.formFields.age.value).toBe(43);
    expect(result.current.formFields.age.cleanValue).toBeUndefined();

    expect(result.current.formFields.age.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'Age should be greater than 45',
      },
    ]);

    act(() => {
      result.current.formFields.age.setValue(46);
    });

    expect(result.current.formFields.age.value).toBe(46);
    expect(result.current.formFields.age.cleanValue).toBe(46);

    expect(result.current.formFields.age.errors).toStrictEqual([]);
  });

  test('add new server error to existed field', () => {
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
});

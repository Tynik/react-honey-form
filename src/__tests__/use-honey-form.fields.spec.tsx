import type { ChangeEvent } from 'react';
import React, { useEffect } from 'react';
import { act, render, renderHook } from '@testing-library/react';
import * as yup from 'yup';

import { useHoneyForm } from '../use-honey-form';

describe('Use honey form. Fields', () => {
  test('set a new value calling onChange()', () => {
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

  test('use filter for a field value', () => {
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

  test('check not set number type values', () => {
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

  test('use number type converting', () => {
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

  test('use number type with empty string value', () => {
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

  test('add a new form field', () => {
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

  test('remove a form field', () => {
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

  test('dependent field values should be cleared in chain when parent field is changed', () => {
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
    });
    act(() => {
      result.current.formFields.address.setValue('71st Queens');
    });

    act(() => {
      result.current.formFields.city.setValue('New Jersey');
    });

    await act(() => result.current.submit());

    expect(onSubmit).toBeCalledWith({ city: 'New Jersey', address: undefined });
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

  test('should recognize array field type', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ items: { name: string; weight: number }[] }>({
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

  test.skip('use simple yup schema', () => {
    const schema = yup.object({
      name: yup.string(),
    });

    const { result } = renderHook(() =>
      useHoneyForm<yup.InferType<typeof schema>>({
        schema,
      })
    );

    act(() => {
      result.current.formFields.name.setValue('Kris');
    });

    expect(result.current.formFields.name.value).toBe('Kris');
  });
});

import type { ChangeEvent } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useHoneyForm } from '../use-honey-form';
import { createHoneyFormDateFromValidator, createHoneyFormDateToValidator } from '../validators';
import type { CustomDateRangeForm } from '../form.types';

describe('Hook [use-honey-form]: Validation', () => {
  it('use min value validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'string',
            min: 5,
          },
        },
      }),
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
        type: 'min',
        message: 'The value must be greater than or equal to 5',
      },
    ]);
  });

  it('use max value validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'string',
            max: 65,
          },
        },
      }),
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
        type: 'max',
        message: 'The value must be less than or equal to 65',
      },
    ]);
  });

  it('use min and max value validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'string',
            min: 5,
            max: 65,
          },
        },
      }),
    );
    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.age.setValue(70);
    });

    expect(result.current.formFields.age.errors).toStrictEqual([
      {
        type: 'minMax',
        message: 'The value must be between 5 and 65',
      },
    ]);
  });

  it('use min and max value validation with number field type', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'number',
            min: 5,
            max: 65,
          },
        },
      }),
    );
    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.age.props.onChange({
        target: { value: '78' },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formFields.age.errors).toStrictEqual([
      {
        type: 'minMax',
        message: 'The value must be between 5 and 65',
      },
    ]);
  });

  it('use min length string validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
            min: 1,
          },
        },
      }),
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
        type: 'min',
        message: 'The length must be greater than or equal to 1 characters',
      },
    ]);
  });

  it('use max length string validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
            max: 5,
          },
        },
      }),
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
        type: 'max',
        message: 'The length must be less than or equal to 5 characters',
      },
    ]);
  });

  it('use min and max length for string validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
            min: 1,
            max: 5,
          },
        },
      }),
    );
    expect(result.current.formFields.name.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.name.setValue('Antonio');
    });

    expect(result.current.formFields.name.errors).toStrictEqual([
      {
        type: 'minMax',
        message: 'The length must be between 1 and 5 characters',
      },
    ]);
  });

  it('use equal min and max length for string validation', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ code: string }>({
        fields: {
          code: {
            type: 'string',
            min: 5,
            max: 5,
          },
        },
      }),
    );
    expect(result.current.formFields.code.errors).toStrictEqual([]);

    act(() => {
      result.current.formFields.code.setValue('A81J');
    });

    expect(result.current.formFields.code.errors).toStrictEqual([
      {
        type: 'minMax',
        message: 'The length must be exactly 5 characters',
      },
    ]);
  });

  it('multiple field validators that affects each other', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ age1: number; age2: number; age3: number }>({
        fields: {
          age1: {
            type: 'number',
            defaultValue: 1,
            validator: (value, { formFields }) => value < formFields.age2.value,
          },
          age2: {
            type: 'number',
            defaultValue: 2,
            validator: (value, { formFields }) =>
              value > formFields.age1.value && value < formFields.age3.value,
          },
          age3: {
            type: 'number',
            defaultValue: 3,
            validator: (value, { formFields }) => value > formFields.age2.value,
          },
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.formFields.age1.setValue(2);
      result.current.formFields.age2.setValue(3);
      result.current.formFields.age3.setValue(4);
    });

    expect(result.current.formFields.age1.value).toBe(2);
    expect(result.current.formFields.age2.value).toBe(3);
    expect(result.current.formFields.age3.value).toBe(4);

    await act(() => result.current.submitForm());

    expect(onSubmit).toHaveBeenCalledWith({ age1: 2, age2: 3, age3: 4 }, { context: undefined });
  });

  it('check required string field type when submitting', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {
            type: 'string',
            required: true,
          },
          age: {
            type: 'string',
          },
        },
        onSubmit,
      }),
    );

    await act(() => result.current.submitForm());

    expect(result.current.formFields.name.errors).toStrictEqual([
      {
        type: 'required',
        message: 'The value is required',
      },
    ]);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('check required object field type when submitting', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ category: string }>({
        fields: {
          category: {
            type: 'object',
            required: true,
          },
        },
        onSubmit,
      }),
    );

    await act(() => result.current.submitForm());

    expect(result.current.formFields.category.errors).toStrictEqual([
      {
        type: 'required',
        message: 'The value is required',
      },
    ]);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should handle custom required field error message during form submission', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
            required: true,
            errorMessages: {
              required: 'This value must be filled',
            },
          },
        },
        onSubmit,
      }),
    );

    await act(() => result.current.submitForm());

    expect(result.current.formFields.name.errors).toStrictEqual([
      {
        type: 'required',
        message: 'This value must be filled',
      },
    ]);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should validate required field with empty array value', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ names: string[] }>({
        fields: {
          names: {
            type: 'object',
            required: true,
            defaultValue: [],
          },
        },
        onSubmit,
      }),
    );

    await act(() => result.current.submitForm());

    expect(result.current.formFields.names.errors).toStrictEqual([
      {
        type: 'required',
        message: 'The value is required',
      },
    ]);

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('Hook [use-honey-form]: Direct form fields validation', () => {
  it('should validate all form fields', async () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {
            type: 'string',
            required: true,
          },
          age: {
            type: 'number',
            required: true,
          },
        },
      }),
    );

    expect(result.current.formErrors).toStrictEqual({});

    await act(() => result.current.validateForm());

    expect(result.current.formErrors).toStrictEqual({
      name: [
        {
          type: 'required',
          message: 'The value is required',
        },
      ],
      age: [
        {
          type: 'required',
          message: 'The value is required',
        },
      ],
    });
  });

  it('should validate all fields when no specific target fields are provided', async () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {
            type: 'string',
            required: true,
          },
          age: {
            type: 'number',
            required: true,
          },
        },
      }),
    );

    expect(result.current.formErrors).toStrictEqual({});

    await act(() => result.current.validateForm({ targetFields: [] }));

    expect(Object.keys(result.current.formErrors).length).toBe(2);
  });

  it('should validate specified form fields', async () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {
            type: 'string',
            required: true,
          },
          age: {
            type: 'number',
            required: true,
          },
        },
      }),
    );

    expect(result.current.formErrors).toStrictEqual({});

    await act(() => result.current.validateForm({ targetFields: ['name'] }));

    expect(result.current.formErrors).toStrictEqual({
      name: [
        {
          type: 'required',
          message: 'The value is required',
        },
      ],
    });
  });

  it('should not validate excluded form fields', async () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {
            type: 'string',
            required: true,
          },
          age: {
            type: 'number',
            required: true,
          },
        },
      }),
    );

    expect(result.current.formErrors).toStrictEqual({});

    await act(() => result.current.validateForm({ excludeFields: ['name'] }));

    expect(result.current.formErrors).toStrictEqual({
      age: [
        {
          type: 'required',
          message: 'The value is required',
        },
      ],
    });
  });

  it('should validate all fields when no fields are excluded', async () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {
            type: 'string',
            required: true,
          },
          age: {
            type: 'number',
            required: true,
          },
        },
      }),
    );

    expect(result.current.formErrors).toStrictEqual({});

    await act(() => result.current.validateForm({ excludeFields: [] }));

    expect(Object.keys(result.current.formErrors).length).toBe(2);
  });
});

describe('Hook [use-honey-form]: Validator as the promise function', () => {
  it('should handle promise-based validator function (resolve)', async () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
            validator: value => {
              return new Promise(resolve => {
                setTimeout(() => {
                  resolve(value === 'Apple' ? 'Apples are not accepted!' : true);
                }, 0);
              });
            },
          },
        },
      }),
    );

    expect(result.current.formFields.name.errors).toStrictEqual([]);

    act(() => result.current.formFields.name.setValue('Apple'));

    await waitFor(() =>
      expect(result.current.formFields.name.errors).toStrictEqual([
        {
          type: 'invalid',
          message: 'Apples are not accepted!',
        },
      ]),
    );

    act(() => result.current.formFields.name.setValue('Pear'));

    expect(result.current.formFields.name.errors).toStrictEqual([]);
  });

  it('should handle promise-based validator function (reject)', async () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
            validator: () => {
              return new Promise((resolve, reject) => {
                setTimeout(() => {
                  reject(new Error('Something went wrong!'));
                }, 0);
              });
            },
          },
        },
      }),
    );

    expect(result.current.formFields.name.errors).toStrictEqual([]);

    act(() => result.current.formFields.name.setValue('Beans'));

    await waitFor(() =>
      expect(result.current.formFields.name.errors).toStrictEqual([
        {
          type: 'invalid',
          message: 'Something went wrong!',
        },
      ]),
    );
  });

  it('should execute promise-based validator functions when submitting', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
            validator: value => {
              return new Promise(resolve => {
                setTimeout(() => {
                  resolve(value === 'Apple' ? 'Apples are not accepted!' : true);
                }, 0);
              });
            },
          },
        },
        onSubmit,
      }),
    );

    expect(result.current.formFields.name.errors).toStrictEqual([]);

    act(() => result.current.formFields.name.setValue('Apple'));

    await act(() => result.current.submitForm());

    expect(result.current.formFields.name.errors).toStrictEqual([
      {
        type: 'invalid',
        message: 'Apples are not accepted!',
      },
    ]);

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('Hook [use-honey-form]: Scheduled validation', () => {
  it('schedule validation for another field inside field validator', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ amountFrom: number; amountTo: number }>({
        fields: {
          amountFrom: {
            type: 'string',
            validator: (value, { formFields, scheduleValidation }) => {
              scheduleValidation('amountTo');

              if (value > formFields.amountTo.value) {
                return 'The `amountFrom` field value must be less than `amountTo`';
              }

              return true;
            },
          },
          amountTo: {
            type: 'string',
            validator: (value, { formFields, scheduleValidation }) => {
              scheduleValidation('amountFrom');

              if (value < formFields.amountFrom.value) {
                return 'The `amountTo` field value must be greater than `amountFrom`';
              }

              return true;
            },
          },
        },
      }),
    );

    act(() => result.current.formFields.amountFrom.setValue(5));

    // errors should not be shown when only one field is filled
    expect(result.current.formErrors).toStrictEqual({});

    act(() => result.current.formFields.amountTo.setValue(3));

    expect(result.current.formErrors).toStrictEqual({
      amountFrom: [
        {
          type: 'invalid',
          message: 'The `amountFrom` field value must be less than `amountTo`',
        },
      ],
      amountTo: [
        {
          type: 'invalid',
          message: 'The `amountTo` field value must be greater than `amountFrom`',
        },
      ],
    });

    act(() => result.current.formFields.amountFrom.setValue(2));

    expect(result.current.formErrors).toStrictEqual({});
  });
});

describe('Hook [use-honey-form]: Predefined validators', () => {
  it('should validate date range correctly', () => {
    type DateRangeForm = CustomDateRangeForm<'fromDate', 'toDate'>;

    const { result } = renderHook(() =>
      useHoneyForm<DateRangeForm>({
        fields: {
          fromDate: {
            type: 'string',
            // <DateRangeForm, 'fromDate', 'toDate'> as an example how it can be used with any additional properties like `name: string`
            validator: createHoneyFormDateFromValidator<
              DateRangeForm,
              undefined,
              'fromDate',
              'toDate'
            >({
              dateToKey: 'toDate',
            }),
          },
          toDate: {
            type: 'string',
            validator: createHoneyFormDateToValidator({
              dateFromKey: 'fromDate',
            }),
          },
        },
      }),
    );

    act(() => result.current.formFields.fromDate.setValue(new Date('04/05/2031')));

    // errors should not be shown when only one field is filled
    expect(result.current.formErrors).toStrictEqual({});

    act(() => result.current.formFields.toDate.setValue(new Date('03/04/2030')));

    expect(result.current.formErrors).toStrictEqual({
      fromDate: [
        {
          type: 'invalid',
          message: '"Date From" should be equal or less than "Date To"',
        },
      ],
      toDate: [
        {
          type: 'invalid',
          message: '"Date To" should be equal or greater than "Date From"',
        },
      ],
    });

    act(() => result.current.formFields.toDate.setValue(new Date('04/05/2031')));

    expect(result.current.formErrors).toStrictEqual({});
  });

  it('should validate date range with min/max date limits', () => {
    type DateRangeForm = CustomDateRangeForm<'fromDate', 'toDate'>;

    const MIN_DATE = new Date('04/05/2031');
    const MAX_DATE = new Date('04/05/2032');

    const { result } = renderHook(() =>
      useHoneyForm<DateRangeForm>({
        fields: {
          fromDate: {
            type: 'string',
            validator: createHoneyFormDateFromValidator({
              dateToKey: 'toDate',
              minDate: MIN_DATE,
            }),
          },
          toDate: {
            type: 'string',
            validator: createHoneyFormDateToValidator({
              dateFromKey: 'fromDate',
              maxDate: MAX_DATE,
            }),
          },
        },
      }),
    );

    // Set valid from date
    act(() => result.current.formFields.fromDate.setValue(MIN_DATE));

    expect(result.current.formErrors).toStrictEqual({});

    // Set valid to date
    act(() => result.current.formFields.toDate.setValue(new Date('06/01/2031')));

    expect(result.current.formErrors).toStrictEqual({});

    // Set invalid from date (< min date)
    act(() => {
      result.current.formFields.fromDate.setValue(new Date('04/04/2031'));
    });

    expect(result.current.formErrors).toStrictEqual({
      fromDate: [
        {
          type: 'invalid',
          message: '"Date From" should be equal or less than "Date To"',
        },
      ],
    });

    // Set valid from date
    act(() => result.current.formFields.fromDate.setValue(new Date('05/01/2031')));

    expect(result.current.formErrors).toStrictEqual({});

    // Set invalid to date (> max date)
    act(() => result.current.formFields.toDate.setValue(new Date('04/06/2032')));

    expect(result.current.formErrors).toStrictEqual({
      toDate: [
        {
          type: 'invalid',
          message: '"Date To" should be equal or greater than "Date From"',
        },
      ],
    });

    // Set valid to date
    act(() => result.current.formFields.toDate.setValue(MAX_DATE));

    expect(result.current.formErrors).toStrictEqual({});
  });
});

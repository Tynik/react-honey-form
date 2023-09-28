import { act, renderHook } from '@testing-library/react';

import { useHoneyForm } from '../use-honey-form';

describe('Hook [use-honey-form]: Work with errors', () => {
  it('errors initially should have empty object', () => {
    const { result } = renderHook(() => useHoneyForm({ fields: {} }));

    expect(result.current.formErrors).toStrictEqual({});
    expect(result.current.isFormErred).toBeFalsy();
  });

  it('error should not be present for just declared field', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          name: {},
        },
      }),
    );

    expect(result.current.formErrors.name).toBeUndefined();
  });

  it('decimal value should not be allowed by default for number type', () => {
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
      result.current.formFields.age.setValue(1.5);
    });

    expect(result.current.formFields.age.value).toBe(1.5);
    expect(result.current.formFields.age.cleanValue).toBeUndefined();

    expect(result.current.isFormErred).toBeTruthy();
    expect(result.current.formErrors).toStrictEqual({
      age: [
        {
          message: 'Only numerics are allowed',
          type: 'invalid',
        },
      ],
    });
  });

  it('decimal value should not be allowed by default for number type with custom validator', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'number',
            validator: value => value > 18 && value < 100,
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.age.setValue(1.5);
    });

    expect(result.current.formFields.age.value).toBe(1.5);
    expect(result.current.formFields.age.cleanValue).toBeUndefined();

    expect(result.current.formErrors).toStrictEqual({
      age: [
        {
          message: 'Only numerics are allowed',
          type: 'invalid',
        },
      ],
    });
  });

  it('use custom errors return from field validator', () => {
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
      }),
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

  it('add and clear the server error added to existed field', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {},
        },
      }),
    );
    expect(result.current.formFields.age.errors).toStrictEqual([]);

    act(() => {
      result.current.addFormFieldError('age', {
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

    act(() => {
      result.current.formFields.age.clearErrors();
    });

    expect(result.current.formFields.age.errors).toStrictEqual([]);
  });

  it('add server error to non existed field', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {},
        },
      }),
    );

    act(() => {
      // there are some cases when the form can have alien field errors when the server can return non-existed form fields
      result.current.addFormFieldError('name' as never, {
        type: 'server',
        message: 'name should be less than 255',
      });
    });

    expect(result.current.formErrors).toStrictEqual({
      name: [
        {
          type: 'server',
          message: 'name should be less than 255',
        },
      ],
    });
  });

  it('should ignore server type errors when submitting', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {},
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.setFormErrors({
        name: [
          {
            type: 'server',
            message: 'Apple is not allowed',
          },
        ],
      });
    });

    expect(result.current.formErrors).toStrictEqual({
      name: [
        {
          type: 'server',
          message: 'Apple is not allowed',
        },
      ],
    });

    await act(() => result.current.submitForm());

    expect(onSubmit).toBeCalled();
    // The errors should be cleared because the submit handler does not return the new server errors
    expect(result.current.formErrors).toStrictEqual({});
  });

  it('should set server errors as the result of form submission', async () => {
    const onSubmit = jest
      .fn()
      .mockResolvedValueOnce(
        Promise.resolve({
          name: ['Apple is not allowed', 'The name should not be fruit'],
        }),
      )
      .mockResolvedValueOnce(Promise.resolve({}));

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {},
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.formFields.name.setValue('Apple');
    });

    await act(() => result.current.submitForm());

    expect(onSubmit).toBeCalled();
    expect(result.current.formErrors).toStrictEqual({
      name: [
        {
          type: 'server',
          message: 'Apple is not allowed',
        },
        {
          type: 'server',
          message: 'The name should not be fruit',
        },
      ],
    });
  });
});

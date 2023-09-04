import { act, renderHook } from '@testing-library/react';
import { useHoneyForm } from '../use-honey-form';
import { createHoneyFormSplitStringFormatter } from '../formatters';
import { createHoneyFormNumbersFilter } from '../filters';

describe('Hook [use-honey-form]: Format function', () => {
  it('a value should have formatted value', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ price: string }>({
        fields: {
          price: {
            format: value => `$${value}`,
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.price.setValue('5');
    });

    expect(result.current.formFields.price.value).toBe('$5');
    expect(result.current.formFields.price.cleanValue).toBe('5');
  });

  it('should send filtered value, but not formatted value when submitting', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ price: string }>({
        fields: {
          price: {
            value: '',
            filter: value => value.replace(/\$/, ''),
            format: value => `$${value}`,
          },
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.formFields.price.setValue('5');
    });

    await act(() => result.current.submitForm(onSubmit));

    expect(result.current.formFields.price.value).toBe('$5');
    expect(result.current.formFields.price.cleanValue).toBe('5');

    expect(onSubmit).toBeCalledWith({ price: '5' });
  });

  test('submit form with clean values, but not formatted', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; price: string }>({
        fields: {
          name: {},
          price: {
            type: 'number',
            format: value => `$${value}`,
          },
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.formFields.name.setValue('apple');
      result.current.formFields.price.setValue('15');
    });

    expect(result.current.formFields.price.rawValue).toBe('15');
    expect(result.current.formFields.price.cleanValue).toBe(15);
    expect(result.current.formFields.price.value).toBe('$15');

    await act(() => result.current.submitForm());

    expect(onSubmit).toBeCalledWith({ name: 'apple', price: 15 });
  });

  test('submit formatted value when flag `submitFormattedValue` set as `true`', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ cardExpirationDate: string }>({
        fields: {
          cardExpirationDate: {
            submitFormattedValue: true,
            filter: createHoneyFormNumbersFilter({ maxLength: 4 }),
            format: createHoneyFormSplitStringFormatter(2, '/'),
          },
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.formFields.cardExpirationDate.setValue('10/29');
    });

    expect(result.current.formFields.cardExpirationDate.value).toBe('10/29');

    await act(() => result.current.submitForm());

    expect(onSubmit).toBeCalledWith({ cardExpirationDate: '10/29' });
  });
});

describe('Hook [use-honey-form]: Use predefined string formatter for segments', () => {
  it('should split passed value by equal 4 characters segments', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ cardNumber: string }>({
        fields: {
          cardNumber: {
            format: createHoneyFormSplitStringFormatter(4),
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.cardNumber.setValue('');
    });

    expect(result.current.formFields.cardNumber.value).toBe('');

    act(() => {
      result.current.formFields.cardNumber.setValue('1');
    });

    expect(result.current.formFields.cardNumber.value).toBe('1');

    act(() => {
      result.current.formFields.cardNumber.setValue('1111');
    });

    expect(result.current.formFields.cardNumber.value).toBe('1111');

    act(() => {
      result.current.formFields.cardNumber.setValue('11111');
    });

    expect(result.current.formFields.cardNumber.value).toBe('1111 1');

    act(() => {
      result.current.formFields.cardNumber.setValue('1111111111111111');
    });

    expect(result.current.formFields.cardNumber.value).toBe('1111 1111 1111 1111');
  });
});

import { act, renderHook } from '@testing-library/react';
import { useHoneyForm } from '../use-honey-form';
import { createHoneyFormNumberFilter, createHoneyFormNumericFilter } from '../filters';

describe('Hook [use-honey-form]: Filter function', () => {
  it('should filter the initial field value', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: string }>({
        fields: {
          age: {
            type: 'string',
            defaultValue: '1abc3',
            filter: value => value.replace(/[^0-9]/g, ''),
          },
        },
      }),
    );

    expect(result.current.formFields.age.value).toBe('13');
    expect(result.current.formFields.age.cleanValue).toBe('13');
  });

  it('should filter the field value when updated', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: string }>({
        fields: {
          age: {
            type: 'string',
            filter: value => value?.replace(/[^0-9]/g, ''),
          },
        },
      }),
    );

    act(() => result.current.formFields.age.setValue('a12b'));

    expect(result.current.formFields.age.value).toBe('12');
    expect(result.current.formFields.age.cleanValue).toBe('12');
  });

  it('should send filtered value when submitting', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            type: 'string',
            filter: value => value?.replace(/[0-9]/g, ''),
          },
        },
        onSubmit,
      }),
    );

    act(() => {
      result.current.formFields.name.setValue('A1pple3');
    });

    await act(() => result.current.submitForm(onSubmit));

    expect(result.current.formFields.name.value).toBe('Apple');
    expect(result.current.formFields.name.cleanValue).toBe('Apple');

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Apple' }, { context: undefined });
  });
});

describe('Hook [use-honey-form]: Use predefined numeric filter', () => {
  it('remove non-numeric characters from passed value and limit the length', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ zip: string }>({
        fields: {
          zip: {
            type: 'string',
            filter: createHoneyFormNumericFilter({ maxLength: 5 }),
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.zip.setValue('');
    });

    expect(result.current.formFields.zip.value).toBe('');

    act(() => {
      result.current.formFields.zip.setValue('1');
    });

    expect(result.current.formFields.zip.value).toBe('1');

    act(() => {
      result.current.formFields.zip.setValue('a');
    });

    expect(result.current.formFields.zip.value).toBe('');

    act(() => {
      result.current.formFields.zip.setValue(' -.!g%$#*&@');
    });

    expect(result.current.formFields.zip.value).toBe('');

    act(() => {
      result.current.formFields.zip.setValue('123456789');
    });

    expect(result.current.formFields.zip.value).toBe('12345');
  });
});

describe('Hook [use-honey-form]: Use predefined number filter', () => {
  it('remove non-numeric characters from passed value and limit the length', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ amount: string }>({
        fields: {
          amount: {
            type: 'string',
            filter: createHoneyFormNumberFilter({ maxLength: 5 }),
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.amount.setValue('');
    });

    expect(result.current.formFields.amount.value).toBe('');

    act(() => {
      result.current.formFields.amount.setValue('1');
    });

    expect(result.current.formFields.amount.value).toBe('1');

    act(() => {
      result.current.formFields.amount.setValue('a');
    });

    expect(result.current.formFields.amount.value).toBe('');

    act(() => {
      result.current.formFields.amount.setValue(' -.!g%$#*&@');
    });

    // Allow negative values (char "-")
    expect(result.current.formFields.amount.value).toBe('-.');

    act(() => {
      result.current.formFields.amount.setValue('123456789');
    });

    expect(result.current.formFields.amount.value).toBe('12345');

    act(() => {
      result.current.formFields.amount.setValue('-123456789');
    });

    expect(result.current.formFields.amount.value).toBe('-12345');
  });

  it('correctly formats and filters decimal numbers', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ amount: string }>({
        fields: {
          amount: {
            type: 'number',
            filter: createHoneyFormNumberFilter({ maxLength: 3 }),
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.amount.setValue('');
    });

    expect(result.current.formValues.amount).toBe('');

    act(() => {
      result.current.formFields.amount.setValue('.');
    });

    expect(result.current.formValues.amount).toBe('.');

    act(() => {
      result.current.formFields.amount.setValue('.1');
    });

    expect(result.current.formValues.amount).toBe('.1');

    act(() => {
      result.current.formFields.amount.setValue('1');
    });

    expect(result.current.formValues.amount).toBe('1');

    act(() => {
      result.current.formFields.amount.setValue('12356');
    });

    expect(result.current.formValues.amount).toBe('123');

    act(() => {
      result.current.formFields.amount.setValue('1.');
    });

    expect(result.current.formValues.amount).toBe('1.');

    act(() => {
      result.current.formFields.amount.setValue('-1.');
    });

    expect(result.current.formValues.amount).toBe('-1.');

    act(() => {
      result.current.formFields.amount.setValue('-.1');
    });

    expect(result.current.formValues.amount).toBe('-.1');

    act(() => {
      result.current.formFields.amount.setValue('1.2');
    });

    expect(result.current.formValues.amount).toBe('1.2');

    act(() => {
      result.current.formFields.amount.setValue('1.23');
    });

    expect(result.current.formValues.amount).toBe('1.23');

    act(() => {
      result.current.formFields.amount.setValue('1.235');
    });

    expect(result.current.formValues.amount).toBe('1.23');

    act(() => {
      result.current.formFields.amount.setValue('16245.235');
    });

    expect(result.current.formValues.amount).toBe('162.23');

    act(() => {
      result.current.formFields.amount.setValue('-16245.235');
    });

    expect(result.current.formValues.amount).toBe('-162.23');
  });
});

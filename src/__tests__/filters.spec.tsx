import { act, renderHook } from '@testing-library/react';
import { useHoneyForm } from '../use-honey-form';
import { createHoneyFormNumbersFilter } from '../filters';

describe('Hook [use-honey-form]: Filter function', () => {
  it('should filter the initial field value', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ age: string }>({
        fields: {
          age: {
            value: '1abc3',
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
            value: '',
            filter: value => value.replace(/[^0-9]/g, ''),
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.age.setValue('a12b');
    });

    expect(result.current.formFields.age.value).toBe('12');
    expect(result.current.formFields.age.cleanValue).toBe('12');
  });

  it('should send filtered value when submitting', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string }>({
        fields: {
          name: {
            value: '',
            filter: value => value.replace(/[0-9]/g, ''),
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

    expect(onSubmit).toBeCalledWith({ name: 'Apple' });
  });
});

describe('Hook [use-honey-form]: Use predefined numbers filter', () => {
  it('remove non-numeric characters from passed value and limit the length', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ zip: string }>({
        fields: {
          zip: {
            value: '',
            filter: createHoneyFormNumbersFilter({ maxLength: 5 }),
          },
        },
      }),
    );

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
      result.current.formFields.zip.setValue('123456');
    });

    expect(result.current.formFields.zip.value).toBe('12345');
  });
});

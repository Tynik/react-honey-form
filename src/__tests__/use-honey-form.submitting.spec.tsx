import type { ChangeEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { useHoneyForm } from '../use-honey-form';

describe('Use honey form. Submitting', () => {
  test('should submit', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
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

  test.skip('submit form with clean values (not formatted)', async () => {
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

  test('should show an error related to allow only numerics because its high priority error than min/max', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'number',
            min: 18,
            max: 100,
          },
        },
        onSubmit,
      })
    );

    act(() => {
      result.current.formFields.age.setValue(1.5);
    });

    await act(() => result.current.submit());

    expect(onSubmit).not.toBeCalled();
    expect(result.current.errors).toStrictEqual({
      age: [
        {
          message: 'Only numerics are allowed',
          type: 'invalid',
        },
      ],
    });
  });

  test('should not submit when errors are present', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ age: number }>({
        fields: {
          age: {
            type: 'number',
            min: 3,
            max: 5,
          },
        },
        onSubmit,
      })
    );

    act(() => {
      result.current.formFields.age.props.onChange({
        target: { value: '1' },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formFields.age.errors.length).toBe(1);

    await act(() => result.current.submit());

    expect(onSubmit).not.toBeCalled();
  });
});

import type { ChangeEvent } from 'react';
import { act, renderHook } from '@testing-library/react';
import { useHoneyForm } from '../use-honey-form';

describe('Hook [use-honey-form]: Submitting', () => {
  it('should submit', async () => {
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
      }),
    );
    expect(onSubmit).not.toBeCalled();

    await act(() => result.current.submitForm());

    expect(onSubmit).toBeCalledWith({ name: 'Peter', age: 23 });
  });

  it('should call custom submit function passed to submitForm()', async () => {
    const onSubmit = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {
            required: true,
          },
          age: {},
        },
      }),
    );

    expect(onSubmit).not.toBeCalled();

    act(() => {
      result.current.formFields.name.setValue('Ken');
    });

    await act(() => result.current.submitForm(onSubmit));

    expect(onSubmit).toBeCalledWith({ name: 'Ken', age: undefined });
  });

  it('should show an error related to allow only numerics because its high priority error than min/max', async () => {
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
      }),
    );

    act(() => {
      result.current.formFields.age.setValue(1.5);
    });

    await act(() => result.current.submitForm());

    expect(onSubmit).not.toBeCalled();
    expect(result.current.formErrors).toStrictEqual({
      age: [
        {
          message: 'Only numerics are allowed',
          type: 'invalid',
        },
      ],
    });
  });

  it('should not submit when errors are present', async () => {
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
      }),
    );

    act(() => {
      result.current.formFields.age.props.onChange({
        target: { value: '1' },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formFields.age.errors.length).toBe(1);

    await act(() => result.current.submitForm());

    expect(onSubmit).not.toBeCalled();
  });
});
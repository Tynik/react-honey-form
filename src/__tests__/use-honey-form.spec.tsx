import React from 'react';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react';

import { useHoneyForm } from '../use-honey-form';

describe('Use honey form. General', () => {
  it('should set initial form fields', () => {
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
      }),
    );

    expect(result.current.formFields.name.value).toBe('Alex');
    expect(result.current.formFields.age.value).toBe(45);
  });

  it('should reset to initial field values', () => {
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
      }),
    );

    act(() => {
      result.current.formFields.age.setValue(47);
      result.current.formFields.name.setValue('Dima');
    });

    expect(result.current.formFields.age.value).toBe(47);
    expect(result.current.formFields.name.value).toBe('Dima');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formFields.name.value).toBe('Alex');
    expect(result.current.formFields.age.value).toBe(45);
  });

  it('a form should be dirty after setting value', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            value: 45,
          },
        },
      }),
    );
    expect(result.current.isFormDirty).toBeFalsy();

    act(() => {
      result.current.formFields.age.setValue(56);
    });

    expect(result.current.isFormDirty).toBeTruthy();
  });

  it('a form should not be dirty when successfully submitted', async () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            value: 45,
          },
        },
      }),
    );

    act(() => {
      result.current.formFields.age.setValue(56);
    });

    expect(result.current.isFormDirty).toBeTruthy();

    await act(async () => {
      await result.current.submitForm();
    });

    expect(result.current.isFormDirty).toBeFalsy();
  });

  it('clear manually added form fields errors', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {},
          age: {},
        },
      }),
    );

    act(() => {
      result.current.addFormFieldError('name', {
        type: 'server',
        message: 'name should be less than 255 chars',
      });

      result.current.addFormFieldError('age', {
        type: 'server',
        message: 'age should be less than 55',
      });
    });

    expect(Object.keys(result.current.formErrors).length).toBe(2);

    act(() => {
      result.current.clearFormErrors();
    });

    expect(Object.keys(result.current.formErrors).length).toBe(0);
  });

  it('should re-render form one time when onChange() is triggered', () => {
    let renderers = 0;

    const Comp = () => {
      const { formFields } = useHoneyForm<{ name: string }>({
        fields: {
          name: {
            value: '',
          },
        },
      });
      renderers += 1;

      return <input {...formFields.name.props} data-testid="name" />;
    };

    const { getByTestId } = render(<Comp />);

    expect(renderers).toBe(1);

    fireEvent.change(getByTestId('name'), { target: { value: 'Jake' } });

    expect(renderers).toBe(2);
  });

  it('call onChange() with form data when any field value is changed', async () => {
    const onChange = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; kind: string }>({
        fields: {
          name: {},
          kind: {},
        },
        onChange,
      }),
    );

    expect(onChange).not.toBeCalled();

    act(() => {
      result.current.formFields.name.setValue('a');
    });

    await waitFor(() =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(onChange.mock.calls[0][0]).toStrictEqual({ name: 'a', kind: undefined }),
    );

    act(() => {
      result.current.formFields.kind.setValue('f');
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await waitFor(() => expect(onChange.mock.calls[1][0]).toStrictEqual({ name: 'a', kind: 'f' }));
  });

  it('should partially set form values', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; kind: string }>({
        fields: {
          name: {
            value: 'banana',
          },
          kind: {
            value: 'fruit',
          },
        },
      }),
    );

    expect(result.current.formFields.name.value).toBe('banana');
    expect(result.current.formFields.name.cleanValue).toBe('banana');

    expect(result.current.formFields.kind.value).toBe('fruit');
    expect(result.current.formFields.kind.cleanValue).toBe('fruit');

    act(() => {
      result.current.setFormValues({ name: 'apple' });
    });

    expect(result.current.formFields.name.value).toBe('apple');
    expect(result.current.formFields.name.cleanValue).toBe('apple');
    expect(result.current.formFields.name.props.value).toBe('apple');

    expect(result.current.formFields.kind.value).toBe('fruit');
    expect(result.current.formFields.kind.cleanValue).toBe('fruit');
    expect(result.current.formFields.kind.props.value).toBe('fruit');
  });

  it('should partially set form values with clearing all values', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; kind: string }>({
        fields: {
          name: {
            value: 'banana',
          },
          kind: {
            value: 'fruit',
          },
        },
      }),
    );

    act(() => {
      result.current.setFormValues({ name: 'apple' }, { clearAll: true });
    });

    expect(result.current.formFields.name.value).toBe('apple');
    expect(result.current.formFields.name.cleanValue).toBe('apple');
    expect(result.current.formFields.name.props.value).toBe('apple');

    expect(result.current.formFields.kind.value).toBe(undefined);
    expect(result.current.formFields.kind.cleanValue).toBe(undefined);
    expect(result.current.formFields.kind.props.value).toBe(undefined);
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

  test('submit form with clean values (not formatted)', async () => {
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
      }),
    );

    act(() => {
      result.current.formFields.name.setValue('apple');
      result.current.formFields.price.setValue(15);
    });

    expect(result.current.formFields.price.rawValue).toBe(15);
    expect(result.current.formFields.price.cleanValue).toBe(15);
    expect(result.current.formFields.price.value).toBe('$15');

    await act(() => result.current.submitForm());

    expect(onSubmit).toBeCalledWith({ name: 'apple', price: 15 });
  });
});

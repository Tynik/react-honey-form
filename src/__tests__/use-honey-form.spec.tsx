import React from 'react';
import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react';
import * as yup from 'yup';

import { useHoneyForm } from '../use-honey-form';

describe('Use honey form. General', () => {
  test('should set initial form fields', () => {
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
      })
    );

    expect(result.current.formFields.name.value).toBe('Alex');
    expect(result.current.formFields.age.value).toBe(45);
  });

  test('should reset to initial field values', () => {
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
      })
    );

    act(() => {
      result.current.formFields.age.setValue(47);
      result.current.formFields.name.setValue('Dima');
    });

    expect(result.current.formFields.age.value).toBe(47);
    expect(result.current.formFields.name.value).toBe('Dima');

    act(() => {
      result.current.reset();
    });

    expect(result.current.formFields.name.value).toBe('Alex');
    expect(result.current.formFields.age.value).toBe(45);
  });

  test('a form should be dirty after setting value', () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            value: 45,
          },
        },
      })
    );
    expect(result.current.isDirty).toBeFalsy();

    act(() => {
      result.current.formFields.age.setValue(56);
    });

    expect(result.current.isDirty).toBeTruthy();
  });

  test('a form should not be dirty when successfully submitted', async () => {
    const { result } = renderHook(() =>
      useHoneyForm({
        fields: {
          age: {
            value: 45,
          },
        },
      })
    );

    act(() => {
      result.current.formFields.age.setValue(56);
    });

    expect(result.current.isDirty).toBeTruthy();

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.isDirty).toBeFalsy();
  });

  test('reset manually added errors', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; age: number }>({
        fields: {
          name: {},
          age: {},
        },
      })
    );

    act(() => {
      result.current.addError('name', {
        type: 'server',
        message: 'name should be less than 255 chars',
      });

      result.current.addError('age', {
        type: 'server',
        message: 'age should be less than 55',
      });
    });

    expect(Object.keys(result.current.errors).length).toBe(2);

    act(() => {
      result.current.resetErrors();
    });

    expect(Object.keys(result.current.errors).length).toBe(0);
  });

  test('should re-render form one time when onChange() is triggered', () => {
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

  test('call onChange() with form data when any field value is changed', async () => {
    const onChange = jest.fn();

    const { result } = renderHook(() =>
      useHoneyForm<{ name: string; kind: string }>({
        fields: {
          name: {},
          kind: {},
        },
        onChange,
      })
    );

    expect(onChange).not.toBeCalled();

    act(() => {
      result.current.formFields.name.setValue('a');
    });

    await waitFor(() =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(onChange.mock.calls[0][0]).toStrictEqual({ name: 'a', kind: undefined })
    );

    act(() => {
      result.current.formFields.kind.setValue('f');
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    await waitFor(() => expect(onChange.mock.calls[1][0]).toStrictEqual({ name: 'a', kind: 'f' }));
  });

  test('should partially set form values via setFormValues() function', () => {
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
      })
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

  test('should partially set form values with clearing current values via setFormValues() function', () => {
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
      })
    );

    act(() => {
      result.current.setFormValues({ name: 'apple' }, { clearAll: true });
    });

    expect(result.current.formFields.name.value).toBe('apple');
    expect(result.current.formFields.name.cleanValue).toBe('apple');

    expect(result.current.formFields.kind.value).toBe(undefined);
    expect(result.current.formFields.kind.cleanValue).toBe(undefined);
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

describe('Use honey form. Filter function', () => {
  test.skip('should not re-render form when filter() does not change a value', () => {
    let renderers = 0;

    const Comp = () => {
      const { formFields } = useHoneyForm<{ age: string }>({
        fields: {
          age: {
            value: '',
            filter: value => value.replace(/[^0-9]/g, ''),
          },
        },
      });
      renderers += 1;

      return <input {...formFields.age.props} data-testid="age" />;
    };

    const { getByTestId } = render(<Comp />);

    expect(renderers).toBe(1);

    fireEvent.change(getByTestId('age'), { target: { value: '10' } });

    expect(renderers).toBe(2);

    fireEvent.change(getByTestId('age'), { target: { value: '10a' } });

    expect(renderers).toBe(2);
  });
});

describe('Use honey form. Format function', () => {
  test('a value should have formatted value', () => {
    const { result } = renderHook(() =>
      useHoneyForm<{ price: number }>({
        fields: {
          price: {
            format: value => `$${value}`,
          },
        },
      })
    );

    act(() => {
      result.current.formFields.price.setValue(5);
    });

    expect(result.current.formFields.price.cleanValue).toBe(5);
    expect(result.current.formFields.price.value).toBe('$5');
  });
});

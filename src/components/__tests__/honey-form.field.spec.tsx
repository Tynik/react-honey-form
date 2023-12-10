import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

import { HoneyForm } from '../honey-form';
import { HoneyFormDynamicField } from '../honey-form-dynamic.field';

describe('Component [HoneyFormDynamicField]', () => {
  it('set and submit the field value', async () => {
    type Form = {
      product: string;
    };

    const onSubmit = jest.fn<Promise<void>, [Form]>();

    const { getByTestId } = render(
      <HoneyForm onSubmit={onSubmit}>
        <HoneyFormDynamicField type="string" name="product" defaultValue="apple">
          {field => <input {...field.props} />}
        </HoneyFormDynamicField>

        <button type="submit" data-testid="save">
          Save
        </button>
      </HoneyForm>,
    );

    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ product: 'apple' }, { context: undefined }),
    );
  });

  it('should submit form with correct gender value for unselected and selected radio inputs', async () => {
    type Form = {
      gender: string;
    };

    const onSubmit = jest.fn<Promise<void>, [Form]>();

    const { getByTestId } = render(
      <HoneyForm onSubmit={onSubmit}>
        <HoneyFormDynamicField name="gender" type="radio" defaultValue={null}>
          {field => (
            <fieldset name="gender">
              <input value="male" data-testid="male" {...field.props} />
              <input value="female" data-testid="female" {...field.props} />
              <input value="other" data-testid="other" {...field.props} />
            </fieldset>
          )}
        </HoneyFormDynamicField>

        <button type="submit" data-testid="save">
          Save
        </button>
      </HoneyForm>,
    );

    // case 1
    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ gender: null }, { context: undefined }),
    );

    // case 2
    fireEvent.click(getByTestId('female'));
    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ gender: 'female' }, { context: undefined }),
    );
  });
});

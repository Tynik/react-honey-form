import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

import { HoneyForm } from '../honey-form';
import { HoneyFormField } from '../honey-form.field';

describe('HoneyFormField component', () => {
  it('set and submit the field value', async () => {
    type Form = {
      product: string;
    };

    const onSubmit = jest.fn<Promise<void>, Form[]>();

    const { getByTestId } = render(
      <HoneyForm onSubmit={onSubmit}>
        <HoneyFormField name="product" value="apple">
          {field => <input {...field.props} />}
        </HoneyFormField>

        <button type="submit" data-testid="save">
          Save
        </button>
      </HoneyForm>
    );

    fireEvent.click(getByTestId('save'));

    await waitFor(() => expect(onSubmit).toBeCalledWith({ product: 'apple' }));
  });

  it('should submit form with correct gender value for unselected and selected radio inputs', async () => {
    type Form = {
      gender: string;
    };

    const onSubmit = jest.fn<Promise<void>, Form[]>();

    const { getByTestId } = render(
      <HoneyForm onSubmit={onSubmit}>
        <HoneyFormField name="gender" value={null}>
          {field => (
            <fieldset name="gender">
              <input
                type="radio"
                name="gender"
                value="male"
                data-testid="male"
                onChange={field.props.onChange}
              />
              <input
                type="radio"
                name="gender"
                value="female"
                data-testid="female"
                onChange={field.props.onChange}
              />
              <input
                type="radio"
                name="gender"
                value="other"
                data-testid="other"
                onChange={field.props.onChange}
              />
            </fieldset>
          )}
        </HoneyFormField>

        <button type="submit" data-testid="save">
          Save
        </button>
      </HoneyForm>
    );

    // case 1
    fireEvent.click(getByTestId('save'));

    await waitFor(() => expect(onSubmit).toBeCalledWith({ gender: null }));

    // case 2
    fireEvent.click(getByTestId('female'));
    fireEvent.click(getByTestId('save'));

    await waitFor(() => expect(onSubmit).toBeCalledWith({ gender: 'female' }));
  });
});

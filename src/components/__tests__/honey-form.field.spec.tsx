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
});

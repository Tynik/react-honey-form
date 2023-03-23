import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

import type { UseHoneyFormFieldsConfigs } from '../../use-honey-form.types';

import { HoneyForm } from '../honey-form';

describe('HoneyForm component', () => {
  it('the form should be mounted', () => {
    const fields = {};

    const { getByTestId } = render(<HoneyForm fields={fields} />);

    expect(getByTestId('form')).toBeDefined();
  });

  it('the form should be submitted', async () => {
    const onSubmit = jest.fn();

    type Form = {
      name: string;
    };

    const fields: UseHoneyFormFieldsConfigs<Form> = {
      name: {
        //
      },
    };

    const { getByTestId } = render(
      <HoneyForm fields={fields} onSubmit={onSubmit}>
        {honeyFormApi => (
          <button type="submit" data-testid="save">
            Save
          </button>
        )}
      </HoneyForm>
    );

    expect(onSubmit).not.toBeCalledWith();

    fireEvent.click(getByTestId('save'));

    await waitFor(() => expect(onSubmit).toBeCalled());
  });
});

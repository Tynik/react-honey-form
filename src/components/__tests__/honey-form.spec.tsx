import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

import type { UseHoneyFormFieldsConfigs } from '../../use-honey-form.types';

import { HoneyForm } from '../honey-form';
import { useHoneyForm } from '../../use-honey-form';
import { useHoneyFormProvider } from '../honey-form.provider';

describe('HoneyForm component. Basic usage', () => {
  it('the form should be mounted', () => {
    const fields = {};

    const { getByTestId } = render(<HoneyForm fields={fields} />);

    expect(getByTestId('form')).toBeDefined();
  });

  it('the form should accept the function as content', () => {
    type Form = {
      name: string;
    };

    const fields: UseHoneyFormFieldsConfigs<Form> = { name: {} };

    const { getByTestId } = render(
      <HoneyForm fields={fields}>
        {() => (
          <button type="submit" data-testid="save">
            Save
          </button>
        )}
      </HoneyForm>
    );

    expect(getByTestId('save')).toBeDefined();
  });

  it('the form should be submitted when submit button is clicked', async () => {
    type Form = {
      name: string;
    };

    const onSubmit = jest.fn<Promise<void>, Form[]>();

    const fields: UseHoneyFormFieldsConfigs<Form> = {
      name: {
        //
      },
    };

    const { getByTestId } = render(
      <HoneyForm fields={fields} onSubmit={onSubmit}>
        <button type="submit" data-testid="save">
          Save
        </button>
      </HoneyForm>
    );

    expect(onSubmit).not.toBeCalledWith();

    fireEvent.click(getByTestId('save'));

    await waitFor(() => expect(onSubmit).toBeCalled());
  });
});

describe('HoneyForm component. Nested forms', () => {
  it('should submit form with correct item values after dynamic addition', async () => {
    type ItemForm = {
      name: string;
      price: number;
    };

    type ItemsForm = {
      items: ItemForm[];
    };

    const onSubmit = jest.fn<Promise<void>, ItemsForm[]>();

    type ItemFormProps = {
      formIndex: number;
    };

    const ItemLineForm = ({ formIndex }: ItemFormProps) => {
      const { formFields: itemsFormFields } = useHoneyFormProvider<ItemsForm>();

      const { formFields } = useHoneyForm<ItemForm>({
        formIndex,
        parentField: itemsFormFields.items,
        fields: {
          name: {
            required: true,
          },
          price: {
            type: 'number',
            required: true,
          },
        },
      });

      return (
        <>
          <input data-testid={`item[${formIndex}].name`} {...formFields.name.props} />
          <input data-testid={`item[${formIndex}].price`} {...formFields.price.props} />
        </>
      );
    };

    const fields: UseHoneyFormFieldsConfigs<ItemsForm> = {
      items: {
        value: [],
      },
    };

    const { getByTestId } = render(
      <HoneyForm fields={fields} onSubmit={onSubmit}>
        {({ formFields }) => (
          <>
            {formFields.items.value.map((_, itemFormIndex) => (
              <ItemLineForm formIndex={itemFormIndex} />
            ))}

            <button
              type="button"
              data-testid="addItem"
              onClick={() =>
                formFields.items.addValue({
                  name: '',
                  price: undefined,
                })
              }
            >
              Add Item
            </button>

            <button type="submit" data-testid="save">
              Save
            </button>
          </>
        )}
      </HoneyForm>
    );

    // Initial form submission attempt
    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toBeCalledWith({
        items: [],
      })
    );
    onSubmit.mockClear();

    // Add a new item to the form
    fireEvent.click(getByTestId('addItem'));
    // Submit the form
    fireEvent.click(getByTestId('save'));

    await waitFor(() => expect(onSubmit).not.toBeCalled());

    // Enter values for the new item
    fireEvent.change(getByTestId('item[0].name'), { target: { value: 'Apple' } });
    fireEvent.change(getByTestId('item[0].price'), { target: { value: '10' } });

    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toBeCalledWith({
        items: [
          {
            name: 'Apple',
            price: 10,
          },
        ],
      })
    );
    onSubmit.mockClear();

    fireEvent.click(getByTestId('addItem'));
    fireEvent.click(getByTestId('save'));

    await waitFor(() => expect(onSubmit).not.toBeCalled());
    onSubmit.mockClear();

    fireEvent.change(getByTestId('item[1].name'), { target: { value: 'Pear' } });
    fireEvent.change(getByTestId('item[1].price'), { target: { value: '30' } });

    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toBeCalledWith({
        items: [
          {
            name: 'Apple',
            price: 10,
          },
          {
            name: 'Pear',
            price: 30,
          },
        ],
      })
    );
  });
});

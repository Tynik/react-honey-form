import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

import type { UseHoneyFormFieldsConfigs } from '../../use-honey-form.types';

import { HoneyForm } from '../honey-form';
import { useHoneyForm } from '../../use-honey-form';
import { useHoneyFormProvider } from '../honey-form.provider';
import { getHoneyFormNextChildFormId } from '../../use-honey-form.helpers';

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
      id: string;
      name: string;
      price: number;
    };

    type ItemsForm = {
      items: ItemForm[];
    };

    let CHILD_FORM_ID = 0;

    const getNextChildFormId = () => {
      CHILD_FORM_ID += 1;

      return `${CHILD_FORM_ID}`;
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
          id: {
            required: true,
          },
          name: {
            required: true,
            value: '',
          },
          price: {
            type: 'number',
            required: true,
            value: 0,
          },
        },
      });

      return (
        <>
          <input data-testid={`item[${formIndex}].name`} {...formFields.name.props} />
          <input data-testid={`item[${formIndex}].price`} {...formFields.price.props} />

          <button
            type="button"
            data-testid={`item[${formIndex}].removeItem`}
            onClick={() => itemsFormFields.items.removeValue(formIndex)}
          />
        </>
      );
    };

    const fields: UseHoneyFormFieldsConfigs<ItemsForm> = {
      items: {
        value: [],
      },
    };

    const { getByTestId, queryByTestId } = render(
      <HoneyForm fields={fields} onSubmit={onSubmit}>
        {({ formFields }) => (
          <>
            {formFields.items.value.map((itemForm, itemFormIndex) => (
              <ItemLineForm key={itemForm.id} formIndex={itemFormIndex} />
            ))}

            <button
              type="button"
              data-testid="addItem"
              onClick={() =>
                formFields.items.pushValue({
                  id: getNextChildFormId(),
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
            id: '1',
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
            id: '1',
            name: 'Apple',
            price: 10,
          },
          {
            id: '2',
            name: 'Pear',
            price: 30,
          },
        ],
      })
    );
    onSubmit.mockClear();

    fireEvent.click(getByTestId('item[0].removeItem'));

    expect(queryByTestId('item[0].price')).not.toBeNull();
    expect(queryByTestId('item[1].price')).toBeNull();

    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toBeCalledWith({
        items: [
          {
            id: '2',
            name: 'Pear',
            price: 30,
          },
        ],
      })
    );
  });

  it('should remove an item from the list when remove button is clicked', async () => {
    type ItemForm = {
      id: string;
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
          id: {
            required: true,
          },
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

          <button
            type="button"
            data-testid={`item[${formIndex}].removeItem`}
            onClick={() => itemsFormFields.items.removeValue(formIndex)}
          />
        </>
      );
    };

    const fields: UseHoneyFormFieldsConfigs<ItemsForm> = {
      items: {
        value: [
          {
            id: '1',
            name: 'Apple',
            price: 10,
          },
          {
            id: '2',
            name: 'Pineapple',
            price: 45,
          },
        ],
      },
    };

    const { getByTestId, queryByTestId } = render(
      <HoneyForm fields={fields} onSubmit={onSubmit}>
        {({ formFields }) => (
          <>
            {formFields.items.value.map((itemForm, itemFormIndex) => (
              <ItemLineForm key={itemForm.id} formIndex={itemFormIndex} />
            ))}

            <button type="submit" data-testid="save">
              Save
            </button>
          </>
        )}
      </HoneyForm>
    );

    fireEvent.click(getByTestId('item[0].removeItem'));

    expect(queryByTestId('item[0].price')).not.toBeNull();
    expect(queryByTestId('item[1].price')).toBeNull();

    expect((getByTestId('item[0].name') as HTMLInputElement).value).toEqual('Pineapple');
    expect((getByTestId('item[0].price') as HTMLInputElement).value).toEqual('45');
  });
});

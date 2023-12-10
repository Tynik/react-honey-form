import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

import type { ChildHoneyFormFieldsConfigs, HoneyFormFieldsConfigs } from '../../types';

import { HoneyForm } from '../honey-form';
import { useHoneyFormProvider } from '../honey-form.provider';
import { useChildHoneyForm } from '../../use-child-honey-form';
import { ChildHoneyForm } from '../child-honey-form';

describe('Component [HoneyForm]: Basic usage', () => {
  it('the form should be mounted', () => {
    const fields = {};

    const { getByTestId } = render(<HoneyForm fields={fields} />);

    expect(getByTestId('honey-form')).toBeDefined();
  });

  it('the form should accept the function as content', () => {
    type Form = {
      name: string;
    };

    const fields: HoneyFormFieldsConfigs<Form> = {
      name: {
        type: 'string',
      },
    };

    const { getByTestId } = render(
      <HoneyForm fields={fields}>
        {() => (
          <button type="submit" data-testid="save">
            Save
          </button>
        )}
      </HoneyForm>,
    );

    expect(getByTestId('save')).toBeDefined();
  });

  it('the form should be submitted when submit button is clicked', async () => {
    type Form = {
      name: string;
    };

    const onSubmit = jest.fn<Promise<void>, [Form]>();

    const fields: HoneyFormFieldsConfigs<Form> = {
      name: {
        type: 'string',
      },
    };

    const { getByTestId } = render(
      <HoneyForm fields={fields} onSubmit={onSubmit}>
        <button type="submit" data-testid="save">
          Save
        </button>
      </HoneyForm>,
    );

    expect(onSubmit).not.toHaveBeenCalledWith();

    fireEvent.click(getByTestId('save'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});

describe('Component [HoneyForm]: Field mode usage', () => {
  it('should validate field when onBlur event is triggered', async () => {
    type Form = {
      name: string;
    };

    const onSubmit = jest.fn<Promise<void>, [Form]>();

    const fields: HoneyFormFieldsConfigs<Form> = {
      name: {
        type: 'string',
        mode: 'blur',
        defaultValue: '',
        validator: value => value.length > 3,
      },
    };

    const { getByTestId } = render(
      <HoneyForm fields={fields} onSubmit={onSubmit}>
        {({ formFields }) => (
          <>
            <input data-testid="name" {...formFields.name.props} />

            <button type="submit" data-testid="save">
              Save
            </button>
          </>
        )}
      </HoneyForm>,
    );

    fireEvent.change(getByTestId('name'), { target: { value: 'App' } });
    expect(getByTestId('name').getAttribute('aria-invalid')).toBe('false');

    fireEvent.blur(getByTestId('name'));
    expect(getByTestId('name').getAttribute('aria-invalid')).toBe('true');

    fireEvent.change(getByTestId('name'), { target: { value: 'Apple' } });
    // Submit the form
    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          name: 'Apple',
        },
        { context: undefined },
      ),
    );
  });
});

describe('Component [HoneyForm]: Nested forms', () => {
  type ItemForm = {
    id: string;
    name: string;
    price: number;
  };

  type ItemsForm = {
    companyName: string;
    items: ItemForm[];
  };

  type ItemFormProps = {
    formIndex: number;
  };

  let CHILD_FORM_ID = 0;

  const getNextChildFormId = () => {
    CHILD_FORM_ID += 1;

    return `${CHILD_FORM_ID}`;
  };

  beforeEach(() => {
    CHILD_FORM_ID = 0;
  });

  it('should submit form with correct item values after dynamic addition', async () => {
    const onSubmit = jest.fn<Promise<void>, [ItemsForm]>();

    const ItemLineForm = ({ formIndex }: ItemFormProps) => {
      const { formFields: itemsFormFields } = useHoneyFormProvider<ItemsForm>();

      return (
        <ChildHoneyForm
          formIndex={formIndex}
          parentField={itemsFormFields.items}
          fields={
            {
              id: {
                type: 'string',
                required: true,
              },
              name: {
                type: 'string',
                required: true,
                defaultValue: '',
              },
              price: {
                type: 'number',
                required: true,
                defaultValue: 0,
              },
            } as ChildHoneyFormFieldsConfigs<ItemsForm, ItemForm>
          }
        >
          {({ formFields }) => (
            <>
              <input data-testid={`item[${formIndex}].name`} {...formFields.name.props} />
              <input data-testid={`item[${formIndex}].price`} {...formFields.price.props} />
              <button
                type="button"
                data-testid={`item[${formIndex}].removeItem`}
                onClick={() => itemsFormFields.items.removeValue(formIndex)}
              />
            </>
          )}
        </ChildHoneyForm>
      );
    };

    const fields: HoneyFormFieldsConfigs<ItemsForm> = {
      companyName: {
        type: 'string',
        defaultValue: 'test',
      },
      items: {
        type: 'string',
        defaultValue: [],
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
      </HoneyForm>,
    );

    // Initial form submission attempt
    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          companyName: 'test',
          items: [],
        },
        { context: undefined },
      ),
    );
    onSubmit.mockClear();

    // Add a new item to the form
    fireEvent.click(getByTestId('addItem'));
    // Submit the form
    fireEvent.click(getByTestId('save'));

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());

    // Enter values for the new item
    fireEvent.change(getByTestId('item[0].name'), { target: { value: 'Apple' } });
    fireEvent.change(getByTestId('item[0].price'), { target: { value: '10' } });

    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          companyName: 'test',
          items: [
            {
              id: '1',
              name: 'Apple',
              price: 10,
            },
          ],
        },
        { context: undefined },
      ),
    );
    onSubmit.mockClear();

    fireEvent.click(getByTestId('addItem'));
    fireEvent.click(getByTestId('save'));

    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
    onSubmit.mockClear();

    fireEvent.change(getByTestId('item[1].name'), { target: { value: 'Pear' } });
    fireEvent.change(getByTestId('item[1].price'), { target: { value: '30' } });

    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          companyName: 'test',
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
        },
        { context: undefined },
      ),
    );
    onSubmit.mockClear();

    fireEvent.click(getByTestId('item[0].removeItem'));

    expect(queryByTestId('item[0].price')).not.toBeNull();
    expect(queryByTestId('item[1].price')).toBeNull();

    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          companyName: 'test',
          items: [
            {
              id: '2',
              name: 'Pear',
              price: 30,
            },
          ],
        },
        { context: undefined },
      ),
    );
  });

  it('should remove an item from the list when remove button is clicked', () => {
    const onSubmit = jest.fn<Promise<void>, [ItemsForm]>();

    const ItemLineForm = ({ formIndex }: ItemFormProps) => {
      const { formFields: itemsFormFields } = useHoneyFormProvider<ItemsForm>();

      const { formFields } = useChildHoneyForm<ItemsForm, ItemForm>({
        formIndex,
        parentField: itemsFormFields.items,
        fields: {
          id: {
            type: 'string',
            required: true,
          },
          name: {
            type: 'string',
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

    const fields: HoneyFormFieldsConfigs<ItemsForm> = {
      companyName: {
        type: 'string',
        defaultValue: 'test',
      },
      items: {
        type: 'string',
        defaultValue: [
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
      </HoneyForm>,
    );

    fireEvent.click(getByTestId('item[0].removeItem'));

    expect(queryByTestId('item[0].price')).not.toBeNull();
    expect(queryByTestId('item[1].price')).toBeNull();

    expect((getByTestId('item[0].name') as HTMLInputElement).value).toEqual('Pineapple');
    expect((getByTestId('item[0].price') as HTMLInputElement).value).toEqual('45');
  });

  it('should remove items from the form and exclude them in the submitted data', async () => {
    const onSubmit = jest.fn<Promise<void>, [ItemsForm]>();

    const ItemLineForm = ({ formIndex }: ItemFormProps) => {
      const { formFields: itemsFormFields } = useHoneyFormProvider<ItemsForm>();

      const { formFields } = useChildHoneyForm<ItemsForm, ItemForm>({
        formIndex,
        parentField: itemsFormFields.items,
        fields: {
          id: {
            type: 'string',
            required: true,
          },
          name: {
            type: 'string',
            required: true,
            defaultValue: '',
          },
          price: {
            type: 'number',
            required: true,
            defaultValue: 0,
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

    const fields: HoneyFormFieldsConfigs<ItemsForm> = {
      companyName: {
        type: 'string',
        defaultValue: 'test',
      },
      items: {
        type: 'string',
        defaultValue: [],
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
      </HoneyForm>,
    );

    // Add a new item to the form
    fireEvent.click(getByTestId('addItem'));
    fireEvent.click(getByTestId('addItem'));

    expect(queryByTestId('item[0].price')).not.toBeNull();
    expect(queryByTestId('item[1].price')).not.toBeNull();

    fireEvent.click(getByTestId('item[0].removeItem'));

    expect(queryByTestId('item[0].price')).not.toBeNull();
    expect(queryByTestId('item[1].price')).toBeNull();

    fireEvent.click(getByTestId('item[0].removeItem'));

    expect(queryByTestId('item[0].price')).toBeNull();
    expect(queryByTestId('item[1].price')).toBeNull();

    // Submit the form
    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          companyName: 'test',
          items: [],
        },
        { context: undefined },
      ),
    );

    expect(queryByTestId('item[0].price')).toBeNull();
    expect(queryByTestId('item[1].price')).toBeNull();

    // Add new item after deleting all items one by one
    fireEvent.click(getByTestId('addItem'));

    expect(queryByTestId('item[0].price')).not.toBeNull();

    fireEvent.change(getByTestId('item[0].name'), { target: { value: 'Apple' } });
    fireEvent.change(getByTestId('item[0].price'), { target: { value: '30' } });

    // Submit the form
    fireEvent.click(getByTestId('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          companyName: 'test',
          items: [
            {
              id: '3',
              name: 'Apple',
              price: 30,
            },
          ],
        },
        { context: undefined },
      ),
    );
  });
});

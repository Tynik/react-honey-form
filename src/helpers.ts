import React from 'react';
import type {
  HoneyFormBaseForm,
  HoneyFormFields,
  HoneyFormField,
  HoneyFormChildFormContext,
  HoneyFormChildFormId,
  HoneyFormParentField,
  ChildHoneyFormBaseForm,
  HoneyFormFieldsConfigs,
  HoneyFormFieldConfig,
  HoneyFormErrors,
  HoneyFormFieldError,
  HoneyFormServerErrors,
  HoneyFormFieldErrorMessage,
  HoneyFormInteractiveFieldConfig,
  HoneyFormPassiveFieldConfig,
  HoneyFormObjectFieldConfig,
} from './types';

export const noop = () => {
  //
};

export const genericMemo: <T>(component: T) => T = React.memo;

export const warningMessage = (message: string) => {
  // eslint-disable-next-line no-console
  console.warn(`[honey-form]: ${message}`);
};

export const errorMessage = (message: string) => {
  // eslint-disable-next-line no-console
  console.error(`[honey-form]: ${message}`);
};

export const getHoneyFormUniqueId = () => {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `${timestamp}${randomNum}`;
};

/**
 * Maps over each field configuration and invokes the provided callback to create form fields.
 *
 * @template Form - The type representing the form structure.
 * @template FormContext - The type representing the context associated with the form.
 *
 * @param {HoneyFormFieldsConfigs<Form, FormContext>} fieldsConfigs - Object containing field configurations.
 * @param {(fieldName: keyof Form, fieldConfig: HoneyFormFieldConfig<Form, keyof Form, FormContext>) => HoneyFormField<Form, keyof Form, FormContext>} fieldCallback - Callback function
 *   invoked for each field configuration, providing the field name and the entire field configuration.
 *
 * @returns {HoneyFormFields<Form, FormContext>} - Object containing mapped form fields.
 */
export const mapFieldsConfigs = <Form extends HoneyFormBaseForm, FormContext>(
  fieldsConfigs: HoneyFormFieldsConfigs<Form, FormContext>,
  fieldCallback: (
    fieldName: keyof Form,
    fieldConfig: HoneyFormFieldConfig<Form, keyof Form, FormContext>,
  ) => HoneyFormField<Form, keyof Form, FormContext>,
): HoneyFormFields<Form, FormContext> =>
  Object.keys(fieldsConfigs).reduce(
    (nextFormFields, fieldName: keyof Form) => {
      nextFormFields[fieldName] = fieldCallback(fieldName, fieldsConfigs[fieldName]);

      return nextFormFields;
    },
    {} as HoneyFormFields<Form, FormContext>,
  );

/**
 * Maps server errors to a new format using a callback for each field with server errors.
 *
 * @template Form - The form type.
 *
 * @param {HoneyFormServerErrors<Form>} serverErrors - The server errors associated with form fields.
 * @param {(erredFieldName: keyof Form, fieldErrors: HoneyFormFieldErrorMessage[]) => HoneyFormFieldError[]} erredFieldCallback
 *   - The callback function to transform server errors for each field.
 *
 * @returns {HoneyFormErrors<Form>} - The mapped server errors.
 */
export const mapServerErrors = <Form extends HoneyFormBaseForm>(
  serverErrors: HoneyFormServerErrors<Form>,
  erredFieldCallback: (
    erredFieldName: keyof Form,
    fieldErrors: HoneyFormFieldErrorMessage[],
  ) => HoneyFormFieldError[],
): HoneyFormErrors<Form> =>
  Object.keys(serverErrors).reduce((nextFormErrors, erredFieldName: keyof Form) => {
    nextFormErrors[erredFieldName] = erredFieldCallback(
      erredFieldName,
      serverErrors[erredFieldName],
    );

    return nextFormErrors;
  }, {} as HoneyFormErrors<Form>);

/**
 * Iterates over each form field and invokes the provided callback.
 *
 * @template Form - The type representing the form structure.
 * @template FormContext - The type representing the context associated with the form.
 *
 * @param {HoneyFormFields<Form, FormContext>} formFields - Object containing form fields.
 * @param {(fieldName: keyof Form, formField: HoneyFormField<Form, keyof Form, FormContext>) => void} fieldCallback - Callback function
 *   invoked for each form field, providing the field name and the entire form field object.
 */
export const forEachFormField = <Form extends HoneyFormBaseForm, FormContext>(
  formFields: HoneyFormFields<Form, FormContext>,
  fieldCallback: (
    fieldName: keyof Form,
    formField: HoneyFormField<Form, keyof Form, FormContext>,
  ) => void,
) => {
  Object.keys(formFields).forEach((fieldName: keyof Form) =>
    fieldCallback(fieldName, formFields[fieldName]),
  );
};

/**
 * Iterates over each form field error and invokes the provided callback.
 *
 * @template Form - The type representing the form structure.
 *
 * @param {HoneyFormErrors<Form>} formErrors - Object containing form field errors.
 * @param {(fieldName: keyof Form, fieldErrors: HoneyFormFieldError[]) => void} fieldCallback - Callback function
 *   invoked for each form field, providing the field name and its associated errors.
 */
export const forEachFormError = <Form extends HoneyFormBaseForm>(
  formErrors: HoneyFormErrors<Form>,
  fieldCallback: (erredFieldName: keyof Form, fieldErrors: HoneyFormFieldError[]) => void,
) => {
  Object.keys(formErrors).forEach((erredFieldName: keyof Form) =>
    fieldCallback(erredFieldName, formErrors[erredFieldName]),
  );
};

/**
 * Maps over the fields, applying a callback to each field.
 *
 * @param formFields - The fields.
 * @param fieldCallback - A function that takes a field name and its configuration and returns a transformed item.
 * @param filterFieldCallback - (Optional) A function that takes a field name and its configuration and returns a boolean.
 *  If true, the field is excluded from the result.
 *
 * @returns A new object where each field is transformed according to the callback.
 */
export const mapFormFields = <Form extends HoneyFormBaseForm, FormContext, Item>(
  formFields: HoneyFormFields<Form, FormContext>,
  fieldCallback: (
    fieldName: keyof Form,
    formField: HoneyFormField<Form, keyof Form, FormContext>,
  ) => Item,
  filterFieldCallback?: (
    fieldName: keyof Form,
    formField: HoneyFormField<Form, keyof Form, FormContext>,
  ) => boolean,
): Record<keyof Form, Item> =>
  Object.keys(formFields).reduce(
    (result, fieldName: keyof Form) => {
      if (filterFieldCallback?.(fieldName, formFields[fieldName]) === false) {
        return result;
      }

      result[fieldName] = fieldCallback(fieldName, formFields[fieldName]);

      return result;
    },
    {} as Record<keyof Form, Item>,
  );

/**
 * Checks if the given form field configuration is interactive.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 *
 * @param {HoneyFormFieldConfig<Form, FieldName, FormContext>} fieldConfig - The configuration of the form field.
 *
 * @returns {fieldConfig is HoneyFormInteractiveFieldConfig<Form, FieldName, FormContext>} - A boolean indicating whether the field is interactive.
 */
export const checkIfFieldIsInteractive = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext>,
): fieldConfig is HoneyFormInteractiveFieldConfig<Form, FieldName, FormContext> =>
  fieldConfig.type === 'string' ||
  fieldConfig.type === 'numeric' ||
  fieldConfig.type === 'number' ||
  fieldConfig.type === 'email';

/**
 * Checks if a given form field is of passive type, such as checkbox, radio, or file.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 *
 * @param fieldConfig - Configuration options for the form field.
 *
 * @returns A boolean indicating whether the field is of passive type.
 */
export const checkIfFieldIsPassive = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext>,
): fieldConfig is HoneyFormPassiveFieldConfig<Form, FieldName, FormContext> =>
  fieldConfig.type === 'checkbox' || fieldConfig.type === 'radio' || fieldConfig.type === 'file';

/**
 * Checks if a given form field is of object type.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 *
 * @param fieldConfig - Configuration options for the form field.
 *
 * @returns A boolean indicating whether the field is of object type.
 */
export const checkIfFieldIsObject = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext>,
): fieldConfig is HoneyFormObjectFieldConfig<Form, FieldName, FormContext> =>
  fieldConfig.type === 'object';

/**
 * Options object for determining whether to skip a form field.
 *
 * @template Form - Type representing the entire form.
 * @template FormContext - Contextual information for the form.
 */
type IsSkipFieldOptions<Form extends HoneyFormBaseForm, FormContext> = {
  /**
   * The context object for the entire form.
   */
  formContext: FormContext;
  /**
   * An object containing all form fields and their properties.
   */
  formFields: HoneyFormFields<Form, FormContext>;
};

/**
 * Checks if a specific form field should be skipped based on the skip function in its configuration.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 *
 * @param {FieldName} fieldName - Name of the field to check for skipping.
 * @param {IsSkipFieldOptions<Form, FormContext>} options - Options object containing form context and form fields.
 *
 * @returns {boolean} - A boolean indicating whether the field should be skipped.
 */
export const isSkipField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  fieldName: FieldName,
  { formContext, formFields }: IsSkipFieldOptions<Form, FormContext>,
): boolean => formFields[fieldName].config.skip?.({ formContext, formFields }) === true;

export const getFormValues = <Form extends HoneyFormBaseForm, FormContext>(
  formFields: HoneyFormFields<Form, FormContext>,
): Form => mapFormFields(formFields, (_, formField) => formField.value) as Form;

/**
 * Retrieves the values of the form fields suitable for form submission.
 *
 * @template Form - The type representing the form structure.
 * @template FormContext - The type representing the context associated with the form.
 *
 * @param {FormContext} formContext - The context associated with the form.
 * @param {HoneyFormFields<Form, FormContext>} formFields - The form fields to extract values from.
 *
 * @returns {Form} - Object containing values of the form fields suitable for submission.
 */
export const getSubmitFormValues = <Form extends HoneyFormBaseForm, FormContext>(
  formContext: FormContext,
  formFields: HoneyFormFields<Form, FormContext>,
): Form =>
  mapFormFields(
    formFields,
    (_, formField) => {
      if (formField.__meta__.childForms) {
        const childFormsCleanValues: ChildHoneyFormBaseForm[] = [];

        formField.__meta__.childForms.forEach(childForm => {
          const childFormFields = childForm.formFieldsRef.current;
          if (!childFormFields) {
            throw new Error('The child `childFormFields` value is null');
          }

          childFormsCleanValues.push(getSubmitFormValues(formContext, childFormFields));
        });

        return childFormsCleanValues as Form[keyof Form];
      }

      const isFieldInteractive = checkIfFieldIsInteractive(formField.config);

      return !isFieldInteractive || formField.config.submitFormattedValue
        ? formField.value
        : formField.cleanValue;
    },
    fieldName => !isSkipField(fieldName, { formContext, formFields }),
  ) as Form;

/**
 * Retrieves form errors for each form field.
 *
 * @template Form - The type representing the form structure.
 * @template FormContext - The type representing the context associated with the form.
 *
 * @param {HoneyFormFields<Form, FormContext>} formFields - The form fields to extract errors from.
 *
 * @returns {HoneyFormErrors<Form>} - Object containing errors for each form field.
 */
export const getFormErrors = <Form extends HoneyFormBaseForm, FormContext>(
  formFields: HoneyFormFields<Form, FormContext>,
): HoneyFormErrors<Form> =>
  mapFormFields(
    formFields,
    (_, formField) => formField.errors,
    (_, formField) => formField.errors.length > 0,
  );

/**
 * Registers a child form within a parent form field's metadata.
 *
 * @template ParentForm - The type representing the parent form structure.
 * @template ChildForm - The type representing the child form structure.
 * @template FormContext - The type representing the context associated with the forms.
 *
 * @param {HoneyFormParentField<ParentForm>} parentFormField - The parent form field where the child form is associated.
 * @param {HoneyFormChildFormContext<ChildForm, FormContext>} childFormContext - The context information for the child form.
 */
export const registerChildForm = <
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext,
>(
  parentFormField: HoneyFormParentField<ParentForm>,
  childFormContext: HoneyFormChildFormContext<ChildForm, FormContext>,
) => {
  // Ensure __meta__ property exists and is an array, then push the child form context
  // @ts-expect-error
  parentFormField.__meta__.childForms ||= [];
  // @ts-expect-error
  parentFormField.__meta__.childForms.push(childFormContext);
};

/**
 * Unregisters a child form from a parent form field's metadata using the child form's ID.
 *
 * @template ParentForm - The type representing the parent form structure.
 *
 * @param {HoneyFormParentField<ParentForm>} parentFormField - The parent form field from which to unregister the child form.
 * @param {HoneyFormChildFormId} childFormId - The ID of the child form to unregister.
 */
export const unregisterChildForm = <ParentForm extends HoneyFormBaseForm>(
  parentFormField: HoneyFormParentField<ParentForm>,
  childFormId: HoneyFormChildFormId,
) => {
  // Filter out the child form with the specified ID
  // @ts-expect-error
  parentFormField.__meta__.childForms = parentFormField.__meta__.childForms?.filter(
    childForm => childForm.id !== childFormId,
  );
};

/**
 * Runs validation on child forms associated with a given form field.
 *
 * @template Form - The type representing the entire form structure.
 * @template FieldName - The type representing the field name of the form.
 * @template FormContext - The type representing the context of the form.
 *
 * @param {HoneyFormField<Form, FieldName, FormContext>} formField - The form field containing child forms to validate.
 *
 * @returns {Promise<boolean>} - A promise resolving to `true` if any child form has validation errors, otherwise `false`.
 */
export const runChildFormsValidation = async <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
): Promise<boolean> => {
  const { childForms } = formField.__meta__;
  if (!childForms?.length) {
    // If no child forms are present, there are no errors
    return false;
  }

  let hasErrors = false;

  // Perform validation on child forms (when the field is an array that includes child forms)
  await Promise.all(
    childForms.map(async childForm => {
      if (!(await childForm.validateForm())) {
        hasErrors = true;
      }
    }),
  );

  return hasErrors;
};

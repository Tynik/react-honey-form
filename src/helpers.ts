import React from 'react';
import type {
  HoneyFormBaseForm,
  HoneyFormFields,
  HoneyFormField,
  HoneyFormChildFormContext,
  HoneyFormId,
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
  HoneyFormValues,
  HoneyFormNestedFormsFieldConfig,
  KeysWithArrayValues,
} from './types';
import { HONEY_FORM_ERRORS } from './constants';

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
 * @param {(fieldName: keyof Form, fieldConfig: HoneyFormFieldConfig<Form, keyof Form, FormContext>) => HoneyFormField<Form, keyof Form, FormContext>} callback - Callback function
 *   invoked for each field configuration, providing the field name and the entire field configuration.
 *
 * @returns {HoneyFormFields<Form, FormContext>} - Object containing mapped form fields.
 */
export const mapFieldsConfigs = <Form extends HoneyFormBaseForm, FormContext>(
  fieldsConfigs: HoneyFormFieldsConfigs<Form, FormContext>,
  callback: (
    fieldName: keyof Form,
    fieldConfig: HoneyFormFieldConfig<Form, keyof Form, FormContext>,
  ) => HoneyFormField<Form, keyof Form, FormContext>,
): HoneyFormFields<Form, FormContext> =>
  Object.keys(fieldsConfigs).reduce(
    (nextFormFields, fieldName: keyof Form) => {
      nextFormFields[fieldName] = callback(fieldName, fieldsConfigs[fieldName]);

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
 * @param {(erredFieldName: keyof Form, fieldErrors: HoneyFormFieldErrorMessage[]) => HoneyFormFieldError[]} callback
 *   - The callback function to transform server errors for each field.
 *
 * @returns {HoneyFormErrors<Form>} - The mapped server errors.
 */
export const mapServerErrors = <Form extends HoneyFormBaseForm>(
  serverErrors: HoneyFormServerErrors<Form>,
  callback: (
    erredFieldName: keyof Form,
    fieldErrors: HoneyFormFieldErrorMessage[],
  ) => HoneyFormFieldError[],
): HoneyFormErrors<Form> =>
  Object.keys(serverErrors).reduce((nextFormErrors, erredFieldName: keyof Form) => {
    nextFormErrors[erredFieldName] = callback(erredFieldName, serverErrors[erredFieldName]);

    return nextFormErrors;
  }, {} as HoneyFormErrors<Form>);

/**
 * Iterates over each form field and invokes the provided callback.
 *
 * @template Form - The type representing the form structure.
 * @template FormContext - The type representing the context associated with the form.
 *
 * @param {HoneyFormFields<Form, FormContext>} formFields - An object containing the form fields.
 * @param {(fieldName: keyof Form, formField: HoneyFormField<Form, keyof Form, FormContext>) => void} callback - A callback function
 *   that is invoked for each form field, providing the field name and the entire form field object.
 */
export const forEachFormField = <Form extends HoneyFormBaseForm, FormContext>(
  formFields: HoneyFormFields<Form, FormContext>,
  callback: (
    fieldName: keyof Form,
    formField: HoneyFormField<Form, keyof Form, FormContext>,
  ) => void,
) => {
  Object.keys(formFields).forEach((fieldName: keyof Form) =>
    callback(fieldName, formFields[fieldName]),
  );
};

/**
 * Iterates over each form field error and invokes the provided callback.
 *
 * @template Form - The type representing the form structure.
 *
 * @param {HoneyFormErrors<Form>} formErrors - An object containing form field errors.
 * @param {(fieldName: keyof Form, fieldErrors: HoneyFormFieldError[]) => void} callback - A callback function
 *   that is invoked for each form field, providing the field name and its associated errors.
 */
export const forEachFormError = <Form extends HoneyFormBaseForm>(
  formErrors: HoneyFormErrors<Form>,
  callback: (erredFieldName: keyof Form, fieldErrors: HoneyFormFieldError[]) => void,
) => {
  Object.keys(formErrors).forEach((erredFieldName: keyof Form) =>
    callback(erredFieldName, formErrors[erredFieldName]),
  );
};

/**
 * Transforms each field in the provided form fields object by applying a callback function,
 * with an optional filter to exclude specific fields.
 *
 * @param formFields - An object containing the form fields to be mapped over.
 * @param callback - A function that takes a field name and its configuration, and returns a transformed item.
 *                   This function is applied to each field in the formFields object.
 * @param filterCallback - (Optional) A function that takes a field name and its configuration, and returns a boolean.
 *                         If the function returns true for a field, that field is excluded from the result.
 *
 * @returns A new object where each field is transformed according to the callback function.
 */
export const mapFormFields = <Form extends HoneyFormBaseForm, FormContext, Item>(
  formFields: HoneyFormFields<Form, FormContext>,
  callback: (
    fieldName: keyof Form,
    formField: HoneyFormField<Form, keyof Form, FormContext>,
  ) => Item,
  filterCallback?: (
    fieldName: keyof Form,
    formField: HoneyFormField<Form, keyof Form, FormContext>,
  ) => boolean,
): Record<keyof Form, Item> =>
  Object.keys(formFields).reduce(
    (result, fieldName: keyof Form) => {
      if (filterCallback?.(fieldName, formFields[fieldName]) === false) {
        return result;
      }

      result[fieldName] = callback(fieldName, formFields[fieldName]);

      return result;
    },
    {} as Record<keyof Form, Item>,
  );

/**
 * Get the current values of all form fields.
 *
 * @param {HoneyFormFields<Form, FormContext>} formFields - The form fields.
 *
 * @returns {Form} - The values of all form fields as a form object.
 */
export const getFormValues = <Form extends HoneyFormBaseForm, FormContext>(
  formFields: HoneyFormFields<Form, FormContext>,
): Form => mapFormFields(formFields, (_, formField) => formField.value) as Form;

/**
 * Checks if the given form field configuration is interactive.
 *
 * @template ParentForm - Type representing the parent form.
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template FormContext - Contextual information for the form.
 *
 * @param {HoneyFormFieldConfig<Form, FieldName, FormContext>} fieldConfig - The configuration of the form field.
 *
 * @returns {fieldConfig is HoneyFormInteractiveFieldConfig<Form, FieldName, FormContext>} - A boolean indicating whether the field is interactive.
 */
export const checkIfFieldIsInteractive = <
  ParentForm extends HoneyFormBaseForm,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext,
>(
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext>,
): fieldConfig is HoneyFormInteractiveFieldConfig<
  ParentForm,
  Form,
  FieldName,
  ParentFieldName,
  FormContext
> =>
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
 * Checks if a given form field is nested forms.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 *
 * @param fieldConfig - Configuration options for the form field.
 *
 * @returns A boolean indicating whether the field is nested forms.
 */
export const checkIfFieldIsNestedForms = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext>,
): fieldConfig is HoneyFormNestedFormsFieldConfig<Form, FieldName, FormContext> =>
  fieldConfig.type === 'nestedForms';

/**
 * Options object for determining whether to skip a form field.
 *
 * @template ParentForm - Type representing the parent form.
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 */
type CheckIsSkipFieldOptions<
  ParentForm extends HoneyFormBaseForm,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
> = {
  parentField: HoneyFormParentField<ParentForm> | undefined;
  /**
   * Name of the field.
   */
  fieldName: FieldName;
  /**
   * The context object for the entire form.
   */
  formContext: FormContext;
  /**
   * An object containing all form fields and their properties.
   */
  formFields: HoneyFormFields<Form, FormContext>;
  /**
   * Form values.
   */
  formValues: HoneyFormValues<Form>;
};

/**
 * Determines whether a specific form field should be skipped based on the skip function defined in its configuration.
 *
 * @template ParentForm - Type representing the parent form.
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 *
 * @param {CheckIsSkipFieldOptions<ParentForm, Form, FormContext>} options - Options object containing form context and form fields.
 *
 * @returns {boolean} - A boolean indicating whether the field should be skipped.
 */
export const checkIsSkipField = <
  ParentForm extends HoneyFormBaseForm,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>({
  fieldName,
  formFields,
  ...options
}: CheckIsSkipFieldOptions<ParentForm, Form, FieldName, FormContext>): boolean =>
  formFields[fieldName].config.skip?.({
    formFields,
    ...options,
  }) === true;

/**
 * Schedules the validation for a specific form field.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field to validate.
 *
 * @param {HoneyFormField<Form, FieldName>} formField - The form field for which validation is to be scheduled.
 */
export const scheduleFieldValidation = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
>(
  formField: HoneyFormField<Form, FieldName>,
) => {
  formField.__meta__.isValidationScheduled = true;
};

/**
 * Retrieves the values of the form fields suitable for form submission.
 *
 * @template ParentForm - Type representing the parent form.
 * @template Form - Type representing the entire form.
 * @template FormContext - The type representing the context associated with the form.
 *
 * @param {HoneyFormParentField<ParentForm>} parentField - The parent form field where the child form is associated.
 * @param {FormContext} formContext - The context associated with the form.
 * @param {HoneyFormFields<Form, FormContext>} formFields - The form fields to extract values from.
 *
 * @returns {Form} - Object containing values of the form fields suitable for submission.
 */
export const getSubmitFormValues = <
  ParentForm extends HoneyFormBaseForm,
  Form extends HoneyFormBaseForm,
  FormContext,
>(
  parentField: HoneyFormParentField<ParentForm> | undefined,
  formContext: FormContext,
  formFields: HoneyFormFields<Form, FormContext>,
): Form => {
  const formValues = getFormValues(formFields);

  return mapFormFields(
    formFields,
    (_, formField) => {
      if (formField.__meta__.childForms) {
        const childFormsCleanValues: ChildHoneyFormBaseForm[] = [];

        formField.__meta__.childForms.forEach(childForm => {
          const childFormFields = childForm.formFieldsRef.current;
          if (!childFormFields) {
            throw new Error(HONEY_FORM_ERRORS.emptyFormFieldsRef);
          }

          childFormsCleanValues.push(
            getSubmitFormValues(parentField, formContext, childFormFields),
          );
        });

        return childFormsCleanValues as Form[keyof Form];
      }

      const isFieldInteractive = checkIfFieldIsInteractive(formField.config);

      return !isFieldInteractive || formField.config.submitFormattedValue
        ? formField.value
        : formField.cleanValue;
    },
    fieldName =>
      !checkIsSkipField({
        fieldName,
        parentField,
        formContext,
        formFields,
        formValues,
      }),
  ) as Form;
};

/**
 * Retrieves form errors for each form field.
 *
 * @template Form - Type representing the entire form.
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
 * @template ParentForm - Type representing the parent form.
 * @template ChildForm - Type representing the entire child form.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template FormContext - The type representing the context associated with the forms.
 *
 * @param {HoneyFormParentField<ParentForm>} parentField - The parent form field where the child form is associated.
 * @param {HoneyFormChildFormContext<ChildForm, FormContext>} childFormContext - The context information for the child form.
 */
export const registerChildForm = <
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext,
>(
  parentField: HoneyFormParentField<ParentForm>,
  childFormContext: HoneyFormChildFormContext<ParentForm, ChildForm, ParentFieldName, FormContext>,
) => {
  // Ensure __meta__ property exists and is an array, then push the child form context
  // @ts-expect-error
  parentField.__meta__.childForms ||= [];
  // @ts-expect-error
  parentField.__meta__.childForms.push(childFormContext);
};

/**
 * Unregisters a child form from a parent form field's metadata using the child form's ID.
 *
 * @template ParentForm - Type representing the parent form.
 *
 * @param {HoneyFormParentField<ParentForm>} parentField - The parent form field from which to unregister the child form.
 * @param {HoneyFormId} formId - The ID of the child form to unregister.
 */
export const unregisterChildForm = <ParentForm extends HoneyFormBaseForm>(
  parentField: HoneyFormParentField<ParentForm>,
  formId: HoneyFormId,
) => {
  // Filter out the child form with the specified ID
  // @ts-expect-error
  parentField.__meta__.childForms = parentField.__meta__.childForms?.filter(
    childForm => childForm.formId !== formId,
  );
};

/**
 * Retrieves the index of a child form within a parent form field's list of child forms.
 *
 * @template ParentForm - Type representing the parent form.
 *
 * @param {HoneyFormParentField<ParentForm>} parentField - The parent form field containing the child forms.
 * @param {HoneyFormId} formId - The ID of the child form to find.
 *
 * @returns {number} - The index of the child form within the parent form field's list of child forms, or -1 if not found.
 */
export const getChildFormIndex = <ParentForm extends HoneyFormBaseForm>(
  parentField: HoneyFormParentField<ParentForm>,
  formId: HoneyFormId,
): number =>
  parentField.__meta__.childForms?.findIndex(childForm => childForm.formId === formId) ?? -1;

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

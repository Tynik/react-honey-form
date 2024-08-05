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
  HoneyFormFieldSerializer,
  HoneyFormFieldDeserializer,
  HoneyFormInteractiveFieldConfig,
  HoneyFormPassiveFieldConfig,
  HoneyFormObjectFieldConfig,
  HoneyFormValues,
  HoneyFormNestedFormsFieldConfig,
  KeysWithArrayValues,
  HoneyFormExtractChildForm,
  JSONValue,
  BaseHoneyFormFieldsConfigs,
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
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 */
type CheckIsSkipFieldOptions<
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
> = {
  parentField: HoneyFormParentField<ParentForm, ParentFieldName> | undefined;
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
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
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
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>({
  fieldName,
  formFields,
  ...options
}: CheckIsSkipFieldOptions<ParentForm, ParentFieldName, Form, FieldName, FormContext>): boolean =>
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
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template Form - Type representing the entire form.
 * @template FormContext - The type representing the context associated with the form.
 *
 * @param {HoneyFormParentField<ParentForm, ParentFieldName>} parentField - The parent form field where the child form is associated.
 * @param {FormContext} formContext - The context associated with the form.
 * @param {HoneyFormFields<Form, FormContext>} formFields - The form fields to extract values from.
 *
 * @returns {Form} - Object containing values of the form fields suitable for submission.
 */
export const getSubmitFormValues = <
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  Form extends HoneyFormBaseForm,
  FormContext,
>(
  parentField: HoneyFormParentField<ParentForm, ParentFieldName> | undefined,
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
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template FormContext - The type representing the context associated with the forms.
 * @template ChildForm - Type representing the entire child form.
 *
 * @param {HoneyFormParentField<ParentForm, ParentFieldName>} parentField - The parent form field where the child form is associated.
 * @param {HoneyFormChildFormContext<ChildForm, FormContext>} childFormContext - The context information for the child form.
 */
export const registerChildForm = <
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext,
  ChildForm extends HoneyFormExtractChildForm<
    ParentForm[ParentFieldName]
  > = HoneyFormExtractChildForm<ParentForm[ParentFieldName]>,
>(
  parentField: HoneyFormParentField<ParentForm, ParentFieldName>,
  childFormContext: HoneyFormChildFormContext<ParentForm, ChildForm, ParentFieldName, FormContext>,
) => {
  // @ts-expect-error
  parentField.__meta__.childForms ||= [];
  // @ts-expect-error
  parentField.__meta__.childForms.push(childFormContext);
};

/**
 * Retrieves the index of a child form within a parent form field's list of child forms.
 *
 * @template ParentForm - Type representing the parent form.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 *
 * @param {HoneyFormParentField<ParentForm, ParentFieldName>} parentField - The parent form field containing the child forms.
 * @param {HoneyFormId} formId - The ID of the child form to find.
 *
 * @returns {number} - The index of the child form within the parent form field's list of child forms, or -1 if not found.
 */
export const getChildFormIndex = <
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
>(
  parentField: HoneyFormParentField<ParentForm, ParentFieldName>,
  formId: HoneyFormId,
): number =>
  parentField.__meta__.childForms?.findIndex(childForm => childForm.formId === formId) ?? -1;

/**
 * Unregisters a child form from a parent form field's metadata using the child form's ID.
 *
 * @template ParentForm - Type representing the parent form.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 *
 * @param {HoneyFormParentField<ParentForm, ParentFieldName>} parentField - The parent form field from which to unregister the child form.
 * @param {HoneyFormId} formId - The ID of the child form to unregister.
 */
export const unregisterChildForm = <
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
>(
  parentField: HoneyFormParentField<ParentForm, ParentFieldName>,
  formId: HoneyFormId,
) => {
  const childFormIndex = getChildFormIndex(parentField, formId);

  if (childFormIndex === -1) {
    warningMessage('Child form index cannot be resolved.');
  } else {
    parentField.__meta__.childForms.splice(childFormIndex, 1);
  }
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

export const replaceHistoryState = (searchParams: URLSearchParams) => {
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${searchParams.size > 0 ? `?${searchParams.toString()}` : ''}`,
  );
};

export const checkQueryStringLimit = (searchParams: URLSearchParams) => {
  let queryStringLimit = 0;

  if (navigator.userAgent.includes('Firefox')) {
    queryStringLimit = 65_000;
    //
  } else if (navigator.userAgent.includes('Chrome')) {
    queryStringLimit = 80_000;
    //
  } else if (navigator.userAgent.includes('Opera')) {
    queryStringLimit = 190_000;
  }

  if (queryStringLimit && searchParams.toString().length > queryStringLimit) {
    warningMessage(
      `The query string exceeds the limit of ${queryStringLimit} characters. This might cause unexpected behavior or errors. Please reduce the length of the query string.`,
    );
  }
};

/**
 * Serializes a form object into a base64-encoded string.
 *
 * @template Form - Type representing the entire form.
 *
 * @param {Form} formData - The form data to serialize.
 * @param {HoneyFormFieldSerializer<Form>} formFieldSerializer - The serializer function for the form fields.
 *
 * @returns {string} - The base64-encoded string representing the serialized form data.
 */
const serializeForm = <Form extends HoneyFormBaseForm>(
  formData: Form,
  formFieldSerializer: HoneyFormFieldSerializer<Form>,
): string =>
  window.btoa(
    encodeURI(
      JSON.stringify(formData, (key: keyof Form, value: Form[keyof Form]) =>
        formFieldSerializer(key, value),
      ),
    ),
  );

/**
 * Deserializes raw form data into a form object.
 *
 * @template Form - Type representing the entire form.
 *
 * @param {string} rawFormData - The raw form data as a string.
 * @param {HoneyFormFieldDeserializer<Form>} formFieldDeserializer - The deserializer function for the form fields.
 *
 * @returns {Form} - The deserialized form object.
 */
const deserializeForm = <Form extends HoneyFormBaseForm>(
  rawFormData: string,
  formFieldDeserializer: HoneyFormFieldDeserializer<Form>,
): Form =>
  JSON.parse(decodeURI(window.atob(rawFormData)), (key: keyof Form, value: JSONValue) =>
    formFieldDeserializer(key, value),
  ) as Form;

/**
 * Serializes form data and stores it in the query string under the specified form name.
 *
 * @template Form - Type representing the entire form.
 * @template FormContext - Optional context type for the form.
 *
 * @param {BaseHoneyFormFieldsConfigs<Form, FormContext>} fieldsConfigs - Configuration object for the form fields, including serializer functions.
 * @param {string} formName - The name to use as the key in the query string.
 * @param {Form} formData - The form data to serialize and store in the query string.
 */
export const serializeFormToQueryString = <Form extends HoneyFormBaseForm, FormContext = undefined>(
  fieldsConfigs: BaseHoneyFormFieldsConfigs<Form, FormContext>,
  formName: string,
  formData: Form,
) => {
  const searchParams = new URLSearchParams(window.location.search);

  searchParams.set(
    formName,
    serializeForm(
      formData,
      (fieldName, fieldValue) =>
        fieldsConfigs[fieldName].serializer?.(fieldValue) ?? (fieldValue as JSONValue),
    ),
  );

  checkQueryStringLimit(searchParams);
  replaceHistoryState(searchParams);
};

/**
 * Deserializes a form from a query string.
 *
 * @template Form - Type representing the entire form.
 * @template FormContext - Optional context type for the form.
 *
 * @param {BaseHoneyFormFieldsConfigs<Form, FormContext>} fieldsConfigs - Configuration object for the form fields, including deserializer functions.
 * @param {string} formName - The name of the form to deserialize.
 *
 * @returns {Form | undefined} - The deserialized form object, or undefined if the form data is not found in the query string.
 */
export const deserializeFormFromQueryString = <
  Form extends HoneyFormBaseForm,
  FormContext = undefined,
>(
  fieldsConfigs: BaseHoneyFormFieldsConfigs<Form, FormContext>,
  formName: string,
): Form | undefined => {
  const searchParams = new URLSearchParams(window.location.search);
  const rawFormData = searchParams.get(formName);

  return rawFormData
    ? deserializeForm(
        rawFormData,
        (fieldName, rawValue) =>
          fieldsConfigs[fieldName].deserializer?.(rawValue) ?? (rawValue as Form[typeof fieldName]),
      )
    : undefined;
};

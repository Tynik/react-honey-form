import React from 'react';
import type {
  HoneyFormBaseForm,
  HoneyFormFields,
  HoneyFormField,
  HoneyFormErrors,
  HoneyFormChildFormContext,
  HoneyFormChildFormId,
  HoneyFormParentField,
  HoneyFormChildForm,
} from './types';

export const noop = () => {
  //
};

export const genericMemo: <T>(component: T) => T = React.memo;

export const warningMessage = (message: string) => {
  // eslint-disable-next-line no-console
  console.warn(`[use-honey-form]: ${message}`);
};

export const errorMessage = (message: string) => {
  // eslint-disable-next-line no-console
  console.error(`[use-honey-form]: ${message}`);
};

export const getHoneyFormUniqueId = () => {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `${timestamp}${randomNum}`;
};

export const isSkipField = <Form extends HoneyFormBaseForm, FieldName extends keyof Form>(
  fieldName: FieldName,
  formFields: HoneyFormFields<Form>,
) => formFields[fieldName].config.skip?.(formFields) === true;

export const getFormValues = <Form extends HoneyFormBaseForm>(formFields: HoneyFormFields<Form>) =>
  Object.keys(formFields).reduce((formData, fieldName: keyof Form) => {
    formData[fieldName] = formFields[fieldName].value;

    return formData;
  }, {} as Form);

export const getSubmitFormValues = <Form extends HoneyFormBaseForm>(
  formFields: HoneyFormFields<Form>,
) =>
  Object.keys(formFields).reduce((cleanFormFields, fieldName: keyof Form) => {
    if (isSkipField(fieldName, formFields)) {
      return cleanFormFields;
    }

    const formField = formFields[fieldName];

    if (formField.__meta__.childForms) {
      const childFormsCleanValues: HoneyFormChildForm[] = [];

      formField.__meta__.childForms.forEach(childForm => {
        const childFormFields = childForm.formFieldsRef.current;
        if (!childFormFields) {
          throw new Error('The child `formFieldsRef` value is null');
        }

        childFormsCleanValues.push(getSubmitFormValues(childFormFields));
      });

      cleanFormFields[fieldName] = childFormsCleanValues as Form[keyof Form];
    } else {
      cleanFormFields[fieldName] = formField.config.submitFormattedValue
        ? formField.value
        : formField.cleanValue;
    }

    return cleanFormFields;
  }, {} as Form);

export const getFormErrors = <Form extends HoneyFormBaseForm>(formFields: HoneyFormFields<Form>) =>
  Object.keys(formFields).reduce((result, fieldName: keyof Form) => {
    const formField = formFields[fieldName];

    if (formField.errors.length) {
      result[fieldName] = formField.errors;
    }
    return result;
  }, {} as HoneyFormErrors<Form>);

export const registerChildForm = <Form extends HoneyFormBaseForm, Response>(
  parentFormField: HoneyFormParentField<Form>,
  childFormContext: HoneyFormChildFormContext<Form, Response>,
) => {
  parentFormField.__meta__.childForms ||= [];
  // @ts-expect-error
  parentFormField.__meta__.childForms.push(childFormContext);
};

export const unregisterChildForm = <Form extends HoneyFormBaseForm>(
  parentFormField: HoneyFormParentField<Form>,
  childFormId: HoneyFormChildFormId,
) => {
  parentFormField.__meta__.childForms = parentFormField.__meta__.childForms?.filter(
    childForm => childForm.id !== childFormId,
  );
};

export const runChildFormsValidation = async <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
>(
  formField: HoneyFormField<Form, FieldName>,
) => {
  const { childForms } = formField.__meta__;
  if (!childForms?.length) {
    // If children forms are not present, so there are no errors
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

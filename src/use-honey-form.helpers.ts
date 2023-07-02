import React from 'react';
import type {
  UseHoneyFormForm,
  UseHoneyFormFields,
  UseHoneyFormArrayField,
  UseHoneyFormErrors,
  UseHoneyFormChildFormContext,
  UseHoneyFormChildFormId,
  UseHoneyFormField,
} from './use-honey-form.types';

export const noop = () => {
  //
};

export const genericMemo: <T>(component: T) => T = React.memo;

export const warningMessage = (message: string) => {
  // eslint-disable-next-line no-console
  console.warn(`[use-honey-form]: ${message}`);
};

export const getHoneyFormUniqueId = () => {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `${timestamp}${randomNum}`;
};

export const getFormErrors = <Form extends UseHoneyFormForm>(
  formFields: UseHoneyFormFields<Form>
) =>
  Object.keys(formFields).reduce((result, fieldName: keyof Form) => {
    const formField = formFields[fieldName];

    if (formField.errors.length) {
      result[fieldName] = formField.errors;
    }
    return result;
  }, {} as UseHoneyFormErrors<Form>);

export const isSkipField = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
  fieldName: FieldName,
  formFields: UseHoneyFormFields<Form>
) => formFields[fieldName].config.skip?.(formFields) === true;

export const getFieldsValues = <Form extends UseHoneyFormForm>(
  formFields: UseHoneyFormFields<Form>
) =>
  Object.keys(formFields).reduce((formData, fieldName: keyof Form) => {
    formData[fieldName] = formFields[fieldName].value;

    return formData;
  }, {} as Form);

export const getFieldsCleanValues = <Form extends UseHoneyFormForm>(
  formFields: UseHoneyFormFields<Form>
) =>
  Object.keys(formFields).reduce((submitFormData, fieldName: keyof Form) => {
    if (isSkipField(fieldName, formFields)) {
      return submitFormData;
    }

    const formField = formFields[fieldName];

    if ('childForms' in formField.__meta__) {
      const childrenFormCleanValues: Form[] = [];

      formField.__meta__.childForms.forEach(childForm => {
        childrenFormCleanValues.push(getFieldsCleanValues(childForm.formFieldsRef.current));
      });

      submitFormData[fieldName] = childrenFormCleanValues as Form[keyof Form];
    } else {
      submitFormData[fieldName] = formField.cleanValue;
    }

    return submitFormData;
  }, {} as Form);

export const registerChildForm = <Form extends UseHoneyFormForm, Response>(
  formField: UseHoneyFormArrayField<Form, any>,
  childFormContext: UseHoneyFormChildFormContext<Form, Response>
) => {
  formField.__meta__.childForms.push(childFormContext);
};

export const unregisterChildForm = <Form extends UseHoneyFormForm>(
  formField: UseHoneyFormArrayField<Form, any>,
  childFormId: UseHoneyFormChildFormId
) => {
  formField.__meta__.childForms = formField.__meta__.childForms.filter(
    childForm => childForm.id !== childFormId
  );
};

export const captureChildFormsFieldValues = <Form extends UseHoneyFormForm>(
  formField: UseHoneyFormArrayField<Form, any>
) => {
  Object.defineProperty(formField, 'nestedValues', {
    get() {
      return formField.__meta__.childForms.map(childForm =>
        getFieldsValues(childForm.formFieldsRef.current)
      );
    },
  });
};

export const runChildFormsValidation = async <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form
>(
  formField: UseHoneyFormField<Form, FieldName>
) => {
  let hasErrors = false;

  // Perform validation on child forms (when the field is an array that includes child forms)
  if ('childForms' in formField.__meta__) {
    await Promise.all(
      formField.__meta__.childForms.map(async childForm => {
        if (!(await childForm.validateForm())) {
          hasErrors = true;
        }
      })
    );
  }

  return hasErrors;
};

import React from 'react';
import type {
  UseHoneyFormForm,
  UseHoneyFormFields,
  UseHoneyFormField,
  UseHoneyFormErrors,
  UseHoneyFormChildFormApi,
  UseHoneyFormChildFormId,
} from './use-honey-form.types';

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
    const formField = formFields[fieldName];

    if (!isSkipField(fieldName, formFields)) {
      submitFormData[fieldName] = formField.cleanValue;
    }

    return submitFormData;
  }, {} as Form);

export const registerChildForm = <Form extends UseHoneyFormForm, Response>(
  formField: UseHoneyFormField<Form, any>,
  childFormApi: UseHoneyFormChildFormApi<Form, Response>
) => {
  formField.__meta__.childrenForms = formField.__meta__.childrenForms || [];
  formField.__meta__.childrenForms.push(childFormApi);
};

export const unregisterChildForm = <Form extends UseHoneyFormForm>(
  formField: UseHoneyFormField<Form, any>,
  childFormId: UseHoneyFormChildFormId
) => {
  formField.__meta__.childrenForms = formField.__meta__.childrenForms.filter(
    childForm => childForm.id !== childFormId
  );
};

export const captureChildFormsFieldValues = <Form extends UseHoneyFormForm>(
  formField: UseHoneyFormField<Form, any>
) => {
  const { value, cleanValue } = formField;

  // Override the 'value' property to capture child forms field values
  Object.defineProperty(formField, 'value', {
    get() {
      if (formField.__meta__.childrenForms) {
        return formField.__meta__.childrenForms.map(childForm =>
          getFieldsValues(childForm.formFieldsRef.current)
        );
      }
      //
      return value;
    },
    set(v) {
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      formField.value = v;
    },
  });

  Object.defineProperty(formField, 'cleanValue', {
    get() {
      if (formField.__meta__.childrenForms) {
        return formField.__meta__.childrenForms.map(childForm =>
          getFieldsCleanValues(childForm.formFieldsRef.current)
        );
      }
      //
      return cleanValue;
    },
    set(v) {
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      formField.cleanValue = v;
    },
  });
};

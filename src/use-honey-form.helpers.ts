import React from 'react';
import type {
  UseHoneyFormForm,
  UseHoneyFormFields,
  UseHoneyFormField,
  UseHoneyFormErrors,
  UseHoneyFormChildFormApi,
} from './use-honey-form.types';

export const genericMemo: <T>(component: T) => T = React.memo;

export const warningMessage = (message: string) => {
  // eslint-disable-next-line no-console
  console.warn(`[use-honey-form]: ${message}`);
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
  Object.keys(formFields).reduce((formData, fieldName: keyof Form) => {
    formData[fieldName] = formFields[fieldName].cleanValue;

    return formData;
  }, {} as Form);

export const getHoneyFormNextChildFormId = () => {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `${timestamp}${randomNum}`;
};

export const registerChildForm = <Form extends UseHoneyFormForm, Response>(
  formField: UseHoneyFormField<Form, any>,
  formIndex: number,
  childFormApi: UseHoneyFormChildFormApi<Form, Response>
) => {
  formField.__meta__.childrenForms = formField.__meta__.childrenForms || [];
  formField.__meta__.childrenForms.splice(formIndex, 1, childFormApi);
};

export const unregisterChildForm = <Form extends UseHoneyFormForm>(
  formField: UseHoneyFormField<Form, any>,
  formIndex: number
) => {
  formField.__meta__.childrenForms.splice(formIndex, 1);
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      formField.cleanValue = v;
    },
  });
};

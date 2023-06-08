import React from 'react';
import type { UseHoneyForm, UseHoneyFormFields } from './use-honey-form.types';

export const genericMemo: <T>(component: T) => T = React.memo;

export const warningMessage = (message: string) => {
  // eslint-disable-next-line no-console
  console.warn(`[use-honey-form]: ${message}`);
};

export const getSubmitHoneyFormData = <Form extends UseHoneyForm>(
  formFields: UseHoneyFormFields<Form>
) =>
  Object.keys(formFields).reduce((formData, fieldName: keyof Form) => {
    const formField = formFields[fieldName];

    formData[fieldName] = formField.cleanValue;

    return formData;
  }, {} as Form);

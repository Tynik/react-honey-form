import React from 'react';
import type {
  UseHoneyFormForm,
  UseHoneyFormFields,
  UseHoneyFormField,
  UseHoneyFormErrors,
  UseHoneyFormChildFormContext,
  UseHoneyFormChildFormId,
  UseHoneyFormParentField,
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

export const isSkipField = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
  fieldName: FieldName,
  formFields: UseHoneyFormFields<Form>,
) => formFields[fieldName].config.skip?.(formFields) === true;

export const getFormValues = <Form extends UseHoneyFormForm>(
  formFields: UseHoneyFormFields<Form>,
) =>
  Object.keys(formFields).reduce((formData, fieldName: keyof Form) => {
    formData[fieldName] = formFields[fieldName].value;

    return formData;
  }, {} as Form);

export const getFormCleanValues = <Form extends UseHoneyFormForm>(
  formFields: UseHoneyFormFields<Form>,
) =>
  Object.keys(formFields).reduce((cleanFormFields, fieldName: keyof Form) => {
    if (isSkipField(fieldName, formFields)) {
      return cleanFormFields;
    }

    const formField = formFields[fieldName];

    if (formField.__meta__.childrenForms) {
      const childrenFormCleanValues: Form[] = [];

      formField.__meta__.childrenForms.forEach(childForm => {
        const childFormFields = childForm.formFieldsRef.current;
        if (!childFormFields) {
          throw new Error('The child `formFieldsRef` value is null');
        }

        childrenFormCleanValues.push(getFormCleanValues(childFormFields));
      });

      cleanFormFields[fieldName] = childrenFormCleanValues as Form[keyof Form];
    } else {
      cleanFormFields[fieldName] = formField.cleanValue;
    }

    return cleanFormFields;
  }, {} as Form);

export const getFormErrors = <Form extends UseHoneyFormForm>(
  formFields: UseHoneyFormFields<Form>,
) =>
  Object.keys(formFields).reduce((result, fieldName: keyof Form) => {
    const formField = formFields[fieldName];

    if (formField.errors.length) {
      result[fieldName] = formField.errors;
    }
    return result;
  }, {} as UseHoneyFormErrors<Form>);

export const registerChildForm = <Form extends UseHoneyFormForm, Response>(
  parentFormField: UseHoneyFormParentField<Form>,
  childFormContext: UseHoneyFormChildFormContext<Form, Response>,
) => {
  parentFormField.__meta__.childrenForms ||= [];
  parentFormField.__meta__.childrenForms.push(childFormContext);
};

export const unregisterChildForm = <Form extends UseHoneyFormForm>(
  parentFormField: UseHoneyFormParentField<Form>,
  childFormId: UseHoneyFormChildFormId,
) => {
  parentFormField.__meta__.childrenForms = parentFormField.__meta__.childrenForms?.filter(
    childForm => childForm.id !== childFormId,
  );
};

export const captureChildrenFormsValues = <Form extends UseHoneyFormForm>(
  parentFormField: UseHoneyFormParentField<Form>,
) => {
  const { value } = parentFormField;

  Object.defineProperty(parentFormField, 'value', {
    get() {
      return (
        parentFormField.__meta__.childrenForms?.map(childForm => {
          const childFormFields = childForm.formFieldsRef.current;
          if (!childFormFields) {
            throw new Error('The child `formFieldsRef` value is null');
          }

          return getFormValues<Form>(childFormFields);
        }) ?? value
      );
    },
  });
};

export const runChildrenFormsValidation = async <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
>(
  formField: UseHoneyFormField<Form, FieldName>,
) => {
  const { childrenForms } = formField.__meta__;
  if (!childrenForms?.length) {
    // no errors
    return false;
  }

  let hasErrors = false;

  // Perform validation on children forms (when the field is an array that includes child forms)
  await Promise.all(
    childrenForms.map(async childForm => {
      if (!(await childForm.validateForm())) {
        hasErrors = true;
      }
    }),
  );

  return hasErrors;
};

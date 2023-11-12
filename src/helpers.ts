import React from 'react';
import type {
  HoneyFormBaseForm,
  HoneyFormFields,
  HoneyFormField,
  HoneyFormErrors,
  HoneyFormChildFormContext,
  HoneyFormChildFormId,
  HoneyFormParentField,
  ChildHoneyFormBaseForm,
  HoneyFormValues,
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

type IsSkipFieldOptions<Form extends HoneyFormBaseForm, FormContext> = {
  formFields: HoneyFormFields<Form, FormContext>;
};

export const isSkipField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formContext: FormContext,
  fieldName: FieldName,
  { formFields }: IsSkipFieldOptions<Form, FormContext>,
) => formFields[fieldName].config.skip?.({ formContext, formFields }) === true;

export const getFormValues = <Form extends HoneyFormBaseForm, FormContext>(
  formFields: HoneyFormFields<Form, FormContext>,
) =>
  Object.keys(formFields).reduce((formData, fieldName: keyof Form) => {
    formData[fieldName] = formFields[fieldName].value;

    return formData;
  }, {} as HoneyFormValues<Form>);

export const getSubmitFormValues = <Form extends HoneyFormBaseForm, FormContext>(
  formContext: FormContext,
  formFields: HoneyFormFields<Form, FormContext>,
) =>
  Object.keys(formFields).reduce((submitFormValues, fieldName: keyof Form) => {
    if (isSkipField(formContext, fieldName, { formFields })) {
      return submitFormValues;
    }

    const formField = formFields[fieldName];

    if (formField.__meta__.childForms) {
      const childFormsCleanValues: ChildHoneyFormBaseForm[] = [];

      formField.__meta__.childForms.forEach(childForm => {
        const childFormFields = childForm.formFieldsRef.current;
        if (!childFormFields) {
          throw new Error('The child `formFieldsRef` value is null');
        }

        childFormsCleanValues.push(getSubmitFormValues(formContext, childFormFields));
      });

      submitFormValues[fieldName] = childFormsCleanValues as Form[keyof Form];
    } else {
      submitFormValues[fieldName] = formField.config.submitFormattedValue
        ? formField.value
        : formField.cleanValue;
    }

    return submitFormValues;
  }, {} as Form);

export const getFormErrors = <Form extends HoneyFormBaseForm, FormContext>(
  formFields: HoneyFormFields<Form, FormContext>,
) =>
  Object.keys(formFields).reduce((result, fieldName: keyof Form) => {
    const formField = formFields[fieldName];

    if (formField.errors.length) {
      result[fieldName] = formField.errors;
    }

    return result;
  }, {} as HoneyFormErrors<Form>);

export const registerChildForm = <
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext,
>(
  parentFormField: HoneyFormParentField<ParentForm>,
  childFormContext: HoneyFormChildFormContext<ChildForm, FormContext>,
) => {
  // @ts-expect-error
  parentFormField.__meta__.childForms ||= [];
  // @ts-expect-error
  parentFormField.__meta__.childForms.push(childFormContext);
};

export const unregisterChildForm = <ParentForm extends HoneyFormBaseForm>(
  parentFormField: HoneyFormParentField<ParentForm>,
  childFormId: HoneyFormChildFormId,
) => {
  // @ts-expect-error
  parentFormField.__meta__.childForms = parentFormField.__meta__.childForms?.filter(
    childForm => childForm.id !== childFormId,
  );
};

export const runChildFormsValidation = async <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
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

import type {
  HoneyFormBaseForm,
  HoneyFormOptions,
  HoneyFormFieldsConfigs,
  HoneyFormApi,
  InitialFormFieldsStateResolverOptions,
} from './types';

import { createField } from './field';
import { useForm } from './hooks';
import { mapFieldsConfigs } from './helpers';

type CreateInitialFormFieldsOptions<
  Form extends HoneyFormBaseForm,
  FormContext,
> = InitialFormFieldsStateResolverOptions<Form, FormContext> & {
  fieldsConfigs: HoneyFormFieldsConfigs<Form, FormContext>;
};

const createInitialFormFields = <Form extends HoneyFormBaseForm, FormContext>({
  formContext,
  fieldsConfigs,
  formFieldsRef,
  formDefaultsRef,
  setFieldValue,
  clearFieldErrors,
  validateField,
  pushFieldValue,
  removeFieldValue,
  addFormFieldError,
}: CreateInitialFormFieldsOptions<Form, FormContext>) => {
  const formFields = mapFieldsConfigs(fieldsConfigs, (fieldName, fieldConfig) =>
    createField(
      fieldName,
      {
        ...fieldConfig,
        defaultValue: formDefaultsRef.current[fieldName] ?? fieldConfig.defaultValue,
      },
      {
        formContext,
        formFieldsRef,
        formDefaultsRef,
        setFieldValue,
        clearFieldErrors,
        validateField,
        pushFieldValue,
        removeFieldValue,
        addFormFieldError,
      },
    ),
  );

  return formFields;
};

export const useHoneyForm = <Form extends HoneyFormBaseForm, FormContext = undefined>({
  fields: fieldsConfigs = {} as never,
  ...options
}: HoneyFormOptions<Form, FormContext>): HoneyFormApi<Form, FormContext> => {
  return useForm({
    initialFormFieldsStateResolver: config => createInitialFormFields({ fieldsConfigs, ...config }),
    ...options,
  });
};

import { useContext, useEffect } from 'react';
import type {
  HoneyFormBaseForm,
  HoneyFormOptions,
  HoneyFormFieldsConfigs,
  HoneyFormApi,
  InitialFormFieldsStateResolverOptions,
} from './types';
import type { MultiHoneyFormsContextValue } from './components/multi-honey-forms';

import { createField } from './field';
import { useForm } from './hooks';
import { deserializeFormFromQS, mapFieldsConfigs, noop } from './helpers';
import { MultiHoneyFormsContext } from './components/multi-honey-forms';

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
  addFormFieldErrors,
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
        addFormFieldErrors,
      },
    ),
  );

  return formFields;
};

export const useHoneyForm = <Form extends HoneyFormBaseForm, FormContext = undefined>({
  storage,
  name: formName,
  fields: fieldsConfigs = {} as never,
  ...options
}: HoneyFormOptions<Form, FormContext>): HoneyFormApi<Form, FormContext> => {
  const multiFormsContext = useContext<MultiHoneyFormsContextValue<Form, FormContext> | undefined>(
    MultiHoneyFormsContext,
  );

  const formApi = useForm<never, never, Form, FormContext>({
    initialFormFieldsStateResolver: config => createInitialFormFields({ fieldsConfigs, ...config }),
    ...options,
  });

  useEffect(() => {
    if (!multiFormsContext || multiFormsContext.disableFormsManagement) {
      return noop;
    }
    // Add this form to multi forms context if present
    multiFormsContext.addForm(formApi);

    return () => {
      multiFormsContext.removeForm(formApi);
    };
  }, []);

  useEffect(() => {
    if (storage === 'qs') {
      const formData = deserializeFormFromQS<Form>(
        formName,
        (fieldName, rawValue) =>
          fieldsConfigs[fieldName].deserializer?.(rawValue) ?? (rawValue as Form[keyof Form]),
      );

      if (formData !== undefined) {
        formApi.setFormValues(formData);
      }
    }
  }, []);

  return formApi;
};

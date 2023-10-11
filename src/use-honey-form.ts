import type {
  HoneyFormBaseForm,
  HoneyFormFields,
  HoneyFormOptions,
  HoneyFormFieldsConfigs,
  HoneyFormApi,
  InitialFormFieldsStateResolverOptions,
} from './types';

import { createField } from './field';
import { useForm } from './hooks';

type CreateInitialFormFieldsOptions<
  Form extends HoneyFormBaseForm,
  FormContext,
> = InitialFormFieldsStateResolverOptions<Form, FormContext> & {
  fieldsConfigs: HoneyFormFieldsConfigs<Form, FormContext>;
};

const createInitialFormFields = <Form extends HoneyFormBaseForm, FormContext>({
  context,
  fieldsConfigs,
  formFieldsRef,
  formDefaultValuesRef,
  setFieldValue,
  clearFieldErrors,
  pushFieldValue,
  removeFieldValue,
  addFormFieldError,
}: CreateInitialFormFieldsOptions<Form, FormContext>) =>
  Object.keys(fieldsConfigs).reduce(
    (initialFormFields, fieldName: keyof Form) => {
      const fieldConfig = fieldsConfigs[fieldName];

      initialFormFields[fieldName] = createField(
        fieldName,
        {
          ...fieldConfig,
          defaultValue: fieldConfig.defaultValue ?? formDefaultValuesRef.current[fieldName],
        },
        {
          context,
          formFieldsRef,
          formDefaultValuesRef,
          setFieldValue,
          clearFieldErrors,
          pushFieldValue,
          removeFieldValue,
          addFormFieldError,
        },
      );

      return initialFormFields;
    },
    {} as HoneyFormFields<Form, FormContext>,
  );

export const useHoneyForm = <Form extends HoneyFormBaseForm, FormContext = undefined>({
  fields: fieldsConfigs = {} as never,
  ...options
}: HoneyFormOptions<Form, FormContext>): HoneyFormApi<Form, FormContext> => {
  const formApi = useForm({
    initialFormFieldsStateResolver: config => createInitialFormFields({ fieldsConfigs, ...config }),
    ...options,
  });

  return formApi;
};

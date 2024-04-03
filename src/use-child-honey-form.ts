import { useEffect } from 'react';
import type {
  HoneyFormBaseForm,
  HoneyFormApi,
  ChildHoneyFormOptions,
  HoneyFormParentField,
  ChildHoneyFormBaseForm,
  InitialFormFieldsStateResolverOptions,
  HoneyFormFieldsConfigs,
} from './types';
import { HONEY_FORM_ERRORS } from './constants';
import {
  getHoneyFormUniqueId,
  registerChildForm,
  mapFieldsConfigs,
  unregisterChildForm,
} from './helpers';

import { createField } from './field';
import { useForm } from './hooks';

type CreateInitialFormFieldsOptions<
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext,
> = InitialFormFieldsStateResolverOptions<ChildForm, FormContext> & {
  formIndex: number | undefined;
  parentField: HoneyFormParentField<ParentForm> | undefined;
  fieldsConfigs: HoneyFormFieldsConfigs<ChildForm, FormContext>;
};

const createInitialFormFields = <
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext,
>({
  formContext,
  formIndex,
  parentField,
  fieldsConfigs,
  formFieldsRef,
  formDefaultsRef,
  setFieldValue,
  clearFieldErrors,
  validateField,
  pushFieldValue,
  removeFieldValue,
  addFormFieldErrors,
  setFieldChildFormsErrors,
}: CreateInitialFormFieldsOptions<ParentForm, ChildForm, FormContext>) => {
  const formFields = mapFieldsConfigs(fieldsConfigs, (fieldName, fieldConfig) => {
    let childFormFieldValue: ChildForm[keyof ChildForm] | null | undefined = null;

    if (formIndex !== undefined && parentField) {
      const childForm = Array.isArray(parentField.value)
        ? parentField.value[formIndex]
        : parentField.value;

      childFormFieldValue = childForm?.[fieldName];
    }

    return createField(
      fieldName,
      {
        ...fieldConfig,
        defaultValue:
          childFormFieldValue ?? formDefaultsRef.current[fieldName] ?? fieldConfig.defaultValue,
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
        setFieldChildFormsErrors,
      },
    );
  });

  return formFields;
};

export const useChildHoneyForm = <
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
>({
  formIndex,
  parentField,
  fields: fieldsConfigs = {} as never,
  ...options
}: ChildHoneyFormOptions<ParentForm, ChildForm, FormContext>): HoneyFormApi<
  ChildForm,
  FormContext
> => {
  const { formIdRef, formFieldsRef, ...childFormApi } = useForm<ChildForm, ParentForm, FormContext>(
    {
      parentField,
      initialFormFieldsStateResolver: config =>
        createInitialFormFields({ formIndex, parentField, fieldsConfigs, ...config }),
      ...options,
    },
  );

  const { submitForm, validateForm } = childFormApi;

  useEffect(() => {
    if (parentField) {
      if (!Array.isArray(parentField.defaultValue)) {
        throw new Error(HONEY_FORM_ERRORS.parentFieldValue);
      }

      if (parentField.defaultValue.length && formIndex === undefined) {
        throw new Error(HONEY_FORM_ERRORS.parentFieldFormIndex);
      }

      formIdRef.current = getHoneyFormUniqueId();

      registerChildForm(parentField, {
        formFieldsRef,
        submitForm,
        validateForm,
        formId: formIdRef.current,
      });
    }

    return () => {
      if (parentField && formIdRef.current) {
        unregisterChildForm(parentField, formIdRef.current);
      }
    };
  }, []);

  return childFormApi;
};

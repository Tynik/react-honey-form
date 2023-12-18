import { useEffect, useRef } from 'react';
import type {
  HoneyFormChildFormId,
  HoneyFormBaseForm,
  HoneyFormApi,
  ChildHoneyFormOptions,
  HoneyFormParentField,
  ChildHoneyFormBaseForm,
  InitialFormFieldsStateResolverOptions,
  HoneyFormFieldsConfigs,
} from './types';
import { USE_HONEY_FORM_ERRORS } from './constants';
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
  pushFieldValue,
  removeFieldValue,
  addFormFieldError,
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
          childFormFieldValue ?? fieldConfig.defaultValue ?? formDefaultsRef.current[fieldName],
      },
      {
        formContext,
        formFieldsRef,
        formDefaultsRef,
        setFieldValue,
        clearFieldErrors,
        pushFieldValue,
        removeFieldValue,
        addFormFieldError,
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
  const childFormIdRef = useRef<HoneyFormChildFormId | null>(null);

  const { formFieldsRef, ...childFormApi } = useForm({
    initialFormFieldsStateResolver: config =>
      createInitialFormFields({ formIndex, parentField, fieldsConfigs, ...config }),
    ...options,
  });

  const { submitForm, validateForm } = childFormApi;

  useEffect(() => {
    if (parentField) {
      if (!Array.isArray(parentField.value)) {
        throw new Error(USE_HONEY_FORM_ERRORS.parentFieldValue);
      }

      if (parentField.value.length && formIndex === undefined) {
        throw new Error(USE_HONEY_FORM_ERRORS.parentFieldFormIndex);
      }

      childFormIdRef.current = getHoneyFormUniqueId();

      registerChildForm(parentField, {
        id: childFormIdRef.current,
        formFieldsRef,
        submitForm,
        validateForm,
      });
    }

    return () => {
      if (parentField && childFormIdRef.current) {
        unregisterChildForm(parentField, childFormIdRef.current);
      }
    };
  }, []);

  return childFormApi;
};

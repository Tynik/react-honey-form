import { useEffect } from 'react';
import type {
  HoneyFormBaseForm,
  HoneyFormApi,
  ChildHoneyFormOptions,
  HoneyFormParentField,
  InitialFormFieldsStateResolverOptions,
  HoneyFormFieldsConfigs,
  KeysWithArrayValues,
  HoneyFormExtractChildForm,
} from '../types';
import {
  getHoneyFormUniqueId,
  registerChildForm,
  mapFieldsConfigs,
  unregisterChildForm,
} from '../helpers';

import { useBaseHoneyForm } from './use-base-honey-form';
import { createField } from '../field';

type CreateInitialFormFieldsOptions<
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext,
  ChildForm extends HoneyFormExtractChildForm<ParentForm[ParentFieldName]>,
> = InitialFormFieldsStateResolverOptions<ChildForm, FormContext> & {
  formIndex: number | undefined;
  parentField: HoneyFormParentField<ParentForm, ParentFieldName> | undefined;
  fieldsConfigs: HoneyFormFieldsConfigs<ChildForm, FormContext>;
};

const createInitialFormFields = <
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext,
  ChildForm extends HoneyFormExtractChildForm<ParentForm[ParentFieldName]>,
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
}: CreateInitialFormFieldsOptions<ParentForm, ParentFieldName, FormContext, ChildForm>) => {
  const formFields = mapFieldsConfigs(fieldsConfigs, (fieldName, fieldConfig) => {
    let childFormFieldValue: ChildForm[keyof ChildForm] | null | undefined = null;

    if (formIndex !== undefined && parentField) {
      const childForm = Array.isArray(parentField.value)
        ? (parentField.value[formIndex] as ChildForm)
        : parentField.value;

      // @ts-expect-error
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
      },
    );
  });

  return formFields;
};

/**
 * Hook for managing a child form within a parent form. This hook integrates with the parent form and allows for the
 * creation and validation of nested forms.
 *
 * @template ParentForm - The type representing the parent form structure.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template FormContext - The type representing the context associated with the form.
 * @template ChildForm - The type representing the child form structure.
 *
 * @param {Object} options - Options for the child form hook.
 *
 * @returns {HoneyFormApi<ChildForm, FormContext>} - The API for interacting with the child form.
 */
export const useChildHoneyForm = <
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext = undefined,
  ChildForm extends HoneyFormExtractChildForm<
    ParentForm[ParentFieldName]
  > = HoneyFormExtractChildForm<ParentForm[ParentFieldName]>,
>({
  formIndex,
  parentField,
  fields: fieldsConfigs = {} as never,
  ...options
}: ChildHoneyFormOptions<ParentForm, ParentFieldName, FormContext>): HoneyFormApi<
  ChildForm,
  FormContext
> => {
  const { formIdRef, formFieldsRef, ...childFormApi } = useBaseHoneyForm<
    ParentForm,
    ParentFieldName,
    ChildForm,
    FormContext
  >({
    parentField,
    fieldsConfigs,
    initialFormFieldsStateResolver: config =>
      // @ts-expect-error
      createInitialFormFields({
        formIndex,
        parentField,
        fieldsConfigs,
        ...config,
      }),
    ...options,
  });

  const { submitForm, validateForm } = childFormApi;

  useEffect(() => {
    if (parentField) {
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

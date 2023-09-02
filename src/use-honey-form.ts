import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  UseHoneyFormForm,
  UseHoneyFormAddFormField,
  UseHoneyFormFieldConfig,
  UseHoneyFormFields,
  UseHoneyFormSetFieldValueInternal,
  UseHoneyFormOptions,
  UseHoneyFormFieldsConfigs,
  UseHoneyFormRemoveFormField,
  UseHoneyFormSubmit,
  UseHoneyFormAddFieldError,
  UseHoneyFormReset,
  UseHoneyFormClearErrors,
  UseHoneyFormSetFormValues,
  UseHoneyFormDefaults,
  UseHoneyFormApi,
  UseHoneyFormPushFieldValue,
  UseHoneyFormValidate,
  UseHoneyFormRemoveFieldValue,
  UseHoneyFormParentField,
  UseHoneyFormChildFormId,
  UseHoneyFormClearFieldErrors,
  UseHoneyFormValidateField,
  UseHoneyFormField,
  UseHoneyFormFormState,
} from './types';

import {
  clearDependentFields,
  createField,
  executeFieldValidator,
  triggerScheduledFieldsValidations,
  clearAllFields,
  getNextFreeErrorsField,
  executeFieldValidatorAsync,
  checkSkippableFields,
} from './field';
import {
  getFormErrors,
  getFormCleanValues,
  warningMessage,
  unregisterChildForm,
  registerChildForm,
  getHoneyFormUniqueId,
  isSkipField,
  runChildrenFormsValidation,
  getFormValues,
  captureChildrenFormsValues,
} from './helpers';
import { USE_HONEY_FORM_ERRORS } from './constants';

type CreateInitialFormFieldsGetterOptions<Form extends UseHoneyFormForm> = {
  formIndex: number | undefined;
  parentField: UseHoneyFormParentField<Form> | undefined;
  fieldsConfigs: UseHoneyFormFieldsConfigs<Form>;
  defaults: UseHoneyFormDefaults<Form>;
  setFieldValue: UseHoneyFormSetFieldValueInternal<Form>;
  clearFieldErrors: UseHoneyFormClearFieldErrors<Form>;
  pushFieldValue: UseHoneyFormPushFieldValue<Form>;
  removeFieldValue: UseHoneyFormRemoveFieldValue<Form>;
  addFormFieldError: UseHoneyFormAddFieldError<Form>;
};

const createInitialFormFieldsGetter =
  <Form extends UseHoneyFormForm>({
    formIndex,
    parentField,
    fieldsConfigs,
    defaults,
    setFieldValue,
    clearFieldErrors,
    pushFieldValue,
    removeFieldValue,
    addFormFieldError,
  }: CreateInitialFormFieldsGetterOptions<Form>) =>
  () =>
    Object.keys(fieldsConfigs).reduce((initialFormFields, fieldName: keyof Form) => {
      const fieldConfig = fieldsConfigs[fieldName];

      let childFormFieldValue: Form[keyof Form] | null | undefined = null;

      if (formIndex !== undefined && parentField) {
        const childForm = Array.isArray(parentField.value)
          ? parentField.value[formIndex]
          : parentField.value;

        childFormFieldValue = childForm?.[fieldName];
      }

      const defaultFieldValue = typeof defaults === 'function' ? undefined : defaults[fieldName];

      initialFormFields[fieldName] = createField(
        fieldName,
        {
          ...fieldConfig,
          defaultValue: childFormFieldValue ?? fieldConfig.defaultValue ?? defaultFieldValue,
        },
        {
          setFieldValue,
          clearFieldErrors,
          pushFieldValue,
          removeFieldValue,
          addFormFieldError,
        },
      );

      return initialFormFields;
    }, {} as UseHoneyFormFields<Form>);

const getNextHoneyFormFieldsState = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName],
>(
  fieldName: FieldName,
  fieldValue: FieldValue | undefined,
  {
    formFields,
    isValidate,
  }: {
    formFields: UseHoneyFormFields<Form>;
    isValidate: boolean;
  },
) => {
  const nextFormFields = { ...formFields };

  const formField = formFields[fieldName];

  const fieldConfig = formField.config as UseHoneyFormFieldConfig<Form, FieldName, FieldValue>;

  let filteredValue = fieldValue;
  if (fieldConfig.filter) {
    filteredValue = fieldConfig.filter(fieldValue);

    if (filteredValue === formField.props.value) {
      // Do not re-render, nothing changed. Return previous state
      return formFields;
    }
  }

  let nextFormField: UseHoneyFormField<Form, FieldName> = formField;

  if (isValidate) {
    clearDependentFields(nextFormFields, fieldName);

    nextFormField = executeFieldValidator(nextFormFields, fieldName, filteredValue);
  }

  const formattedValue = fieldConfig.format?.(filteredValue) ?? filteredValue;

  nextFormField = {
    ...nextFormField,
    rawValue: filteredValue,
    value: formattedValue,
    props: {
      ...nextFormField.props,
      value: formattedValue,
    },
  };

  nextFormFields[fieldName] = nextFormField;

  checkSkippableFields(nextFormFields, fieldName);
  triggerScheduledFieldsValidations(nextFormFields, fieldName);

  return nextFormFields;
};

export const useHoneyForm = <Form extends UseHoneyFormForm, Response = void>({
  formIndex,
  parentField,
  fields: fieldsConfigs = {} as never,
  defaults = {},
  onSubmit,
  onChange,
  onChangeDebounce,
}: UseHoneyFormOptions<Form, Response>): UseHoneyFormApi<Form, Response> => {
  const [formState, setFormState] = useState<UseHoneyFormFormState>({
    isValidating: false,
    isSubmitting: false,
  });

  const [isFormDefaultsFetching, setIsFormDefaultsFetching] = useState(false);
  const [isFormDefaultsFetchingErred, setIsFormDefaultsFetchingErred] = useState(false);

  const formDefaultValuesRef = useRef<Partial<Form>>(
    typeof defaults === 'function' ? {} : defaults,
  );
  const formFieldsRef = useRef<UseHoneyFormFields<Form> | null>(null);
  const childFormIdRef = useRef<UseHoneyFormChildFormId | null>(null);
  const isFormDirtyRef = useRef(false);
  const isFormValidRef = useRef(false);
  const onChangeTimeoutRef = useRef<number | null>(null);

  const updateFormState = useCallback((newFormState: Partial<UseHoneyFormFormState>) => {
    setFormState(prevFormState => ({ ...prevFormState, ...newFormState }));
  }, []);

  const setFieldValue: UseHoneyFormSetFieldValueInternal<Form> = (
    fieldName,
    fieldValue,
    { isValidate = true, isPushValue = false, isDirty = true } = {},
  ) => {
    isFormValidRef.current = false;

    if (isDirty) {
      isFormDirtyRef.current = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current);
      }

      const formField = formFields[fieldName];

      const nextFormFields = getNextHoneyFormFieldsState(
        fieldName,
        // @ts-expect-error
        isPushValue ? [...formField.value, fieldValue] : fieldValue,
        {
          formFields,
          isValidate,
        },
      );

      if (parentField) {
        captureChildrenFormsValues(parentField);
      }

      const fieldConfig = nextFormFields[fieldName].config;

      if (fieldConfig.onChange) {
        window.setTimeout(() => {
          fieldConfig.onChange?.(nextFormFields[fieldName].cleanValue, {
            formFields: nextFormFields,
          });
        }, 0);
      }

      // call onChange() on next iteration to do not affect new state return
      if (onChange) {
        onChangeTimeoutRef.current = window.setTimeout(() => {
          onChangeTimeoutRef.current = null;

          onChange(getFormCleanValues(nextFormFields), {
            formErrors: getFormErrors(nextFormFields),
          });
        }, onChangeDebounce ?? 0);
      }

      return nextFormFields;
    });
  };

  const clearFieldErrors: UseHoneyFormClearFieldErrors<Form> = fieldName => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => ({
      ...formFields,
      [fieldName]: getNextFreeErrorsField(formFields[fieldName]),
    }));
  };

  const pushFieldValue: UseHoneyFormPushFieldValue<Form> = (fieldName, value) => {
    // @ts-expect-error
    setFieldValue(fieldName, value, { isPushValue: true });
  };

  const removeFieldValue: UseHoneyFormRemoveFieldValue<Form> = (fieldName, formIndex) => {
    const formFields = formFieldsRef.current;
    if (!formFields) {
      throw new Error('The `formFieldsRef` value is null');
    }

    const formField = formFields[fieldName];

    setFieldValue(
      fieldName,
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      formField.value.filter((_, index) => index !== formIndex),
    );
  };

  // TODO: not used
  const validateField: UseHoneyFormValidateField<Form> = fieldName => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const formField = formFields[fieldName];

      const filteredValue = formField.config.filter
        ? formField.config.filter(formField.rawValue)
        : formField.rawValue;

      return {
        ...formFields,
        [fieldName]: executeFieldValidator(formFields, fieldName, filteredValue),
      };
    });
  };

  const addFormFieldError = useCallback<UseHoneyFormAddFieldError<Form>>((fieldName, error) => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const formField = formFields[fieldName];

      return {
        ...formFields,
        [fieldName]: {
          ...formField,
          // When the form can have alien field errors when the server can return non-existed form fields
          errors: [...(formField?.errors ?? []), error],
        },
      };
    });
  }, []);

  const initialFormFieldsGetter = createInitialFormFieldsGetter({
    formIndex,
    parentField,
    fieldsConfigs,
    defaults,
    setFieldValue,
    clearFieldErrors,
    pushFieldValue,
    removeFieldValue,
    addFormFieldError,
  });

  const [formFields, setFormFields] = useState<UseHoneyFormFields<Form>>(initialFormFieldsGetter);
  formFieldsRef.current = formFields;

  const setFormValues = useCallback<UseHoneyFormSetFormValues<Form>>(
    (values, { clearAll = false } = {}) => {
      setFormFields(formFields => {
        const nextFormFields = { ...formFields };

        if (clearAll) {
          clearAllFields(nextFormFields);
        }

        Object.keys(values).forEach((fieldName: keyof Form) => {
          const fieldConfig = nextFormFields[fieldName].config;

          const filteredValue = fieldConfig.filter
            ? fieldConfig.filter(values[fieldName])
            : values[fieldName];

          let nextFormField: UseHoneyFormField<Form, keyof Form> = executeFieldValidator(
            nextFormFields,
            fieldName,
            filteredValue,
          );

          const formattedValue = nextFormField.config.format
            ? nextFormField.config.format(filteredValue)
            : filteredValue;

          nextFormField = {
            ...nextFormField,
            rawValue: filteredValue,
            value: formattedValue,
            props: {
              ...nextFormField.props,
              value: formattedValue,
            },
          };

          nextFormFields[fieldName] = nextFormField;
        });

        return nextFormFields;
      });
    },
    [],
  );

  const addFormField = useCallback<UseHoneyFormAddFormField<Form>>(
    <FieldName extends keyof Form, FieldValue extends Form[FieldName]>(
      fieldName: FieldName,
      config: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
    ) => {
      setFormFields(formFields => {
        if (formFields[fieldName]) {
          warningMessage(`Form field "${fieldName.toString()}" is already present`);
        }

        return {
          ...formFields,
          [fieldName]: createField(fieldName, config, {
            setFieldValue,
            clearFieldErrors,
            pushFieldValue,
            removeFieldValue,
            addFormFieldError,
          }),
        };
      });
    },
    [],
  );

  const removeFormField = useCallback<UseHoneyFormRemoveFormField<Form>>(fieldName => {
    setFormFields(formFields => {
      const newFormFields = { ...formFields };
      //
      delete newFormFields[fieldName];
      //
      return newFormFields;
    });
  }, []);

  const clearFormErrors = useCallback<UseHoneyFormClearErrors>(() => {
    setFormFields(formFields =>
      Object.keys(formFields).reduce((nextFormFields, fieldName: keyof Form) => {
        nextFormFields[fieldName] = getNextFreeErrorsField(formFields[fieldName]);

        return nextFormFields;
      }, {} as UseHoneyFormFields<Form>),
    );
  }, []);

  const validateForm = useCallback<UseHoneyFormValidate<Form>>(async fieldNames => {
    const formFields = formFieldsRef.current;
    if (!formFields) {
      throw new Error('The `formFieldsRef` value is null');
    }

    let hasErrors = false;

    const nextFormFields = {} as UseHoneyFormFields<Form>;

    await Promise.all(
      Object.keys(formFields).map(async (fieldName: keyof Form) => {
        const formField = formFields[fieldName];

        const isSkipFieldValidation = fieldNames ? !fieldNames.includes(fieldName) : false;

        if (isSkipFieldValidation || isSkipField(fieldName, formFields)) {
          nextFormFields[fieldName] = getNextFreeErrorsField(formField);
          return;
        }

        const hasChildFormsErrors = await runChildrenFormsValidation(formField);
        hasErrors ||= hasChildFormsErrors;

        const nextField = await executeFieldValidatorAsync(formFields, fieldName);
        if (nextField.errors.length) {
          hasErrors = true;
        }

        nextFormFields[fieldName] = {
          ...nextField,
        };
      }),
    );

    isFormValidRef.current = !hasErrors;

    // Set the new `nextFormFields` value to ref to access it at getting clean values at submitting
    formFieldsRef.current = nextFormFields;
    setFormFields(nextFormFields);

    return !hasErrors;
  }, []);

  const outerValidateForm = useCallback<UseHoneyFormValidate<Form>>(async fieldNames => {
    updateFormState({
      isValidating: true,
    });

    try {
      return await validateForm(fieldNames);
    } finally {
      updateFormState({
        isValidating: false,
      });
    }
  }, []);

  const submitForm = useCallback<UseHoneyFormSubmit<Form, Response>>(
    async submitHandler => {
      if (!formFieldsRef.current) {
        throw new Error('The `formFieldsRef` value is null');
      }

      updateFormState({
        isValidating: true,
      });

      try {
        if (await validateForm()) {
          updateFormState({
            isValidating: false,
            isSubmitting: true,
          });

          const submitData = getFormCleanValues(formFieldsRef.current);

          await (submitHandler || onSubmit)?.(submitData);

          // Only submitting the form can clear the dirty state
          isFormDirtyRef.current = false;
        }
      } finally {
        updateFormState({
          isValidating: false,
          isSubmitting: false,
        });
      }
    },
    [validateForm],
  );

  useEffect(() => {
    if (parentField) {
      if (!Array.isArray(parentField.value)) {
        throw new Error(USE_HONEY_FORM_ERRORS.parentFieldValue);
      }

      if (parentField.value.length && formIndex === undefined) {
        throw new Error(USE_HONEY_FORM_ERRORS.parentFieldFormIndex);
      }

      childFormIdRef.current = getHoneyFormUniqueId();

      registerChildForm<Form, Response>(parentField, {
        id: childFormIdRef.current,
        formFieldsRef,
        submitForm,
        validateForm,
      });

      captureChildrenFormsValues(parentField);
    }

    if (typeof defaults === 'function') {
      setIsFormDefaultsFetching(true);

      defaults()
        .then(defaultValues => {
          formDefaultValuesRef.current = defaultValues;

          setFormValues(defaultValues);
        })
        .catch(() => {
          setIsFormDefaultsFetchingErred(true);
        })
        .finally(() => {
          setIsFormDefaultsFetching(false);
        });
    }

    return () => {
      if (parentField && childFormIdRef.current) {
        unregisterChildForm(parentField, childFormIdRef.current);

        captureChildrenFormsValues(parentField);
      }
    };
  }, []);

  const resetForm: UseHoneyFormReset = () => {
    setFormFields(initialFormFieldsGetter);
  };

  const formValues = useMemo(() => getFormValues(formFields), [formFields]);

  const formErrors = useMemo(() => getFormErrors(formFields), [formFields]);

  const hasFormErrors = Object.keys(formErrors).length > 0;

  return {
    formFields,
    isFormDefaultsFetching,
    isFormDefaultsFetchingErred,
    isFormDirty: isFormDirtyRef.current,
    isFormValidating: formState.isValidating,
    isFormValid: isFormValidRef.current,
    isFormSubmitting: formState.isSubmitting,
    formDefaultValues: formDefaultValuesRef.current,
    formValues,
    formErrors,
    hasFormErrors,
    // functions
    setFormValues,
    addFormField,
    removeFormField,
    addFormFieldError,
    clearFormErrors,
    validateForm: outerValidateForm,
    submitForm,
    resetForm,
  };
};

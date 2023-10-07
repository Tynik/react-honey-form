import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  HoneyFormBaseForm,
  HoneyFormAddFormField,
  HoneyFormFields,
  HoneyFormSetFieldValueInternal,
  HoneyFormOptions,
  HoneyFormFieldsConfigs,
  HoneyFormRemoveFormField,
  HoneyFormSubmit,
  HoneyFormAddFieldError,
  HoneyFormReset,
  HoneyFormClearErrors,
  HoneyFormSetFormValues,
  HoneyFormApi,
  HoneyFormPushFieldValue,
  HoneyFormValidate,
  HoneyFormRemoveFieldValue,
  HoneyFormParentField,
  HoneyFormChildFormId,
  HoneyFormClearFieldErrors,
  HoneyFormValidateField,
  HoneyFormFormState,
  HoneyFormSetFormErrors,
  HoneyFormErrors,
  HoneyFormFieldError,
  HoneyFormDefaultsRef,
} from './types';

import {
  createField,
  executeFieldValidator,
  clearAllFields,
  getNextFreeErrorsField,
  executeFieldValidatorAsync,
  getNextErredField,
  getNextFieldsState,
} from './field';
import {
  getFormErrors,
  getSubmitFormValues,
  warningMessage,
  unregisterChildForm,
  registerChildForm,
  getHoneyFormUniqueId,
  isSkipField,
  runChildFormsValidation,
  getFormValues,
} from './helpers';
import { USE_HONEY_FORM_ERRORS } from './constants';

type CreateInitialFormFieldsGetterOptions<Form extends HoneyFormBaseForm, FormContext> = {
  context: FormContext;
  formIndex: number | undefined;
  parentField: HoneyFormParentField<Form> | undefined;
  fieldsConfigs: HoneyFormFieldsConfigs<Form>;
  formDefaultValuesRef: HoneyFormDefaultsRef<Form>;
  setFieldValue: HoneyFormSetFieldValueInternal<Form>;
  clearFieldErrors: HoneyFormClearFieldErrors<Form>;
  pushFieldValue: HoneyFormPushFieldValue<Form>;
  removeFieldValue: HoneyFormRemoveFieldValue<Form>;
  addFormFieldError: HoneyFormAddFieldError<Form>;
};

const createInitialFormFieldsGetter =
  <Form extends HoneyFormBaseForm, FormContext>({
    context,
    formIndex,
    parentField,
    fieldsConfigs,
    formDefaultValuesRef,
    setFieldValue,
    clearFieldErrors,
    pushFieldValue,
    removeFieldValue,
    addFormFieldError,
  }: CreateInitialFormFieldsGetterOptions<Form, FormContext>) =>
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

      initialFormFields[fieldName] = createField(
        fieldName,
        {
          ...fieldConfig,
          defaultValue:
            childFormFieldValue ??
            fieldConfig.defaultValue ??
            formDefaultValuesRef.current[fieldName],
        },
        {
          context,
          formDefaultValuesRef,
          setFieldValue,
          clearFieldErrors,
          pushFieldValue,
          removeFieldValue,
          addFormFieldError,
        },
      );

      return initialFormFields;
    }, {} as HoneyFormFields<Form>);

export const useHoneyForm = <Form extends HoneyFormBaseForm, FormContext = undefined>({
  formIndex,
  parentField,
  fields: fieldsConfigs = {} as never,
  defaults = {},
  context,
  onSubmit,
  onChange,
  onChangeDebounce,
}: HoneyFormOptions<Form, FormContext>): HoneyFormApi<Form, FormContext> => {
  const [formState, setFormState] = useState<HoneyFormFormState>({
    isValidating: false,
    isSubmitting: false,
  });

  const [isFormDefaultsFetching, setIsFormDefaultsFetching] = useState(false);
  const [isFormDefaultsFetchingErred, setIsFormDefaultsFetchingErred] = useState(false);

  const formDefaultValuesRef = useRef<Partial<Form>>(
    typeof defaults === 'function' ? {} : defaults,
  );
  const formFieldsRef = useRef<HoneyFormFields<Form> | null>(null);
  const childFormIdRef = useRef<HoneyFormChildFormId | null>(null);
  const isFormDirtyRef = useRef(false);
  const isFormValidRef = useRef(false);
  const isFormSubmittedRef = useRef(false);
  const onChangeTimeoutRef = useRef<number | null>(null);

  const updateFormState = useCallback((newFormState: Partial<HoneyFormFormState>) => {
    setFormState(prevFormState => ({ ...prevFormState, ...newFormState }));
  }, []);

  const setFieldValue: HoneyFormSetFieldValueInternal<Form> = (
    fieldName,
    fieldValue,
    { isValidate = true, isDirty = true, isFormat = true, isPushValue = false } = {},
  ) => {
    // Any new field value clears the next form states
    isFormValidRef.current = false;
    isFormSubmittedRef.current = false;

    if (isDirty) {
      isFormDirtyRef.current = true;
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current);
      }

      const formField = formFields[fieldName];

      const nextFormFields = getNextFieldsState(
        fieldName,
        // @ts-expect-error
        isPushValue ? [...formField.value, fieldValue] : fieldValue,
        {
          context,
          formFields,
          isFormat,
          // Forcibly re-validate the new field value even validation field mode is `blur` if there is any error
          isValidate: isValidate || formField.errors.length > 0,
        },
      );

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

          onChange(getSubmitFormValues(context, nextFormFields), {
            formErrors: getFormErrors(nextFormFields),
          });
        }, onChangeDebounce ?? 0);
      }

      return nextFormFields;
    });
  };

  const clearFieldErrors: HoneyFormClearFieldErrors<Form> = fieldName => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => ({
      ...formFields,
      [fieldName]: getNextFreeErrorsField(formFields[fieldName]),
    }));
  };

  const pushFieldValue: HoneyFormPushFieldValue<Form> = (fieldName, value) => {
    // @ts-expect-error
    setFieldValue(fieldName, value, { isPushValue: true });
  };

  const removeFieldValue: HoneyFormRemoveFieldValue<Form> = (fieldName, formIndex) => {
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
  const validateField: HoneyFormValidateField<Form> = fieldName => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const formField = formFields[fieldName];

      const filteredValue = formField.config.filter
        ? formField.config.filter(formField.rawValue, { context })
        : formField.rawValue;

      return {
        ...formFields,
        [fieldName]: executeFieldValidator(context, formFields, fieldName, filteredValue),
      };
    });
  };

  const addFormFieldError = useCallback<HoneyFormAddFieldError<Form>>((fieldName, error) => {
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
    context,
    formIndex,
    parentField,
    fieldsConfigs,
    formDefaultValuesRef,
    setFieldValue,
    clearFieldErrors,
    pushFieldValue,
    removeFieldValue,
    addFormFieldError,
  });

  const [formFields, setFormFields] =
    useState<HoneyFormFields<Form, FormContext>>(initialFormFieldsGetter);

  formFieldsRef.current = formFields;

  const setFormValues = useCallback<HoneyFormSetFormValues<Form>>(
    (values, { clearAll = false } = {}) => {
      setFormFields(formFields => {
        const nextFormFields = { ...formFields };

        if (clearAll) {
          clearAllFields(nextFormFields);
        }

        Object.keys(values).forEach((fieldName: keyof Form) => {
          const fieldConfig = nextFormFields[fieldName].config;

          const filteredValue = fieldConfig.filter
            ? fieldConfig.filter(values[fieldName], { context })
            : values[fieldName];

          let nextFormField = executeFieldValidator(
            context,
            nextFormFields,
            fieldName,
            filteredValue,
          );

          const formattedValue = nextFormField.config.format
            ? nextFormField.config.format(filteredValue, { context })
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

  const setFormErrors = useCallback<HoneyFormSetFormErrors<Form>>(formErrors => {
    setFormFields(formFields => {
      const nextFormFields = { ...formFields };

      Object.keys(formErrors).forEach((fieldName: keyof Form) => {
        nextFormFields[fieldName] = getNextErredField(
          nextFormFields[fieldName],
          formErrors[fieldName],
        );
      });

      return nextFormFields;
    });
  }, []);

  const clearFormErrors = useCallback<HoneyFormClearErrors>(() => {
    setFormFields(formFields =>
      Object.keys(formFields).reduce((nextFormFields, fieldName: keyof Form) => {
        nextFormFields[fieldName] = getNextFreeErrorsField(formFields[fieldName]);

        return nextFormFields;
      }, {} as HoneyFormFields<Form>),
    );
  }, []);

  const addFormField = useCallback<HoneyFormAddFormField<Form, FormContext>>(
    (fieldName, config) => {
      setFormFields(formFields => {
        if (formFields[fieldName]) {
          warningMessage(`Form field "${fieldName.toString()}" is already present`);
        }

        return {
          ...formFields,
          [fieldName]: createField(fieldName, config, {
            context,
            formDefaultValuesRef,
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

  const removeFormField = useCallback<HoneyFormRemoveFormField<Form>>(fieldName => {
    // Clearing the default field value
    delete formDefaultValuesRef.current[fieldName];

    setFormFields(formFields => {
      const newFormFields = { ...formFields };
      //
      delete newFormFields[fieldName];
      //
      return newFormFields;
    });
  }, []);

  const validateForm = useCallback<HoneyFormValidate<Form>>(async fieldNames => {
    const formFields = formFieldsRef.current;
    if (!formFields) {
      throw new Error('The `formFieldsRef` value is null');
    }

    let hasErrors = false;

    const nextFormFields = {} as HoneyFormFields<Form>;

    await Promise.all(
      Object.keys(formFields).map(async (fieldName: keyof Form) => {
        const formField = formFields[fieldName];

        const isSkipFieldValidation = fieldNames ? !fieldNames.includes(fieldName) : false;

        if (isSkipFieldValidation || isSkipField(context, fieldName, formFields)) {
          nextFormFields[fieldName] = getNextFreeErrorsField(formField);
          return;
        }

        const hasChildFormsErrors = await runChildFormsValidation(formField);
        hasErrors ||= hasChildFormsErrors;

        const nextField = await executeFieldValidatorAsync(context, formFields, fieldName);

        // We skip errors of type 'server' to avoid blocking the form submission trigger
        const fieldErrors = nextField.errors.filter(error => error.type !== 'server');
        if (fieldErrors.length) {
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

  const outerValidateForm = useCallback<HoneyFormValidate<Form>>(async fieldNames => {
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

  const submitForm = useCallback<HoneyFormSubmit<Form, FormContext>>(
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

          const submitData = getSubmitFormValues(context, formFieldsRef.current);

          const serverErrors = await (submitHandler || onSubmit)?.(submitData, { context });

          if (serverErrors && Object.keys(serverErrors).length) {
            setFormErrors(
              Object.keys(serverErrors).reduce((formErrorsResult, erredFieldName: keyof Form) => {
                formErrorsResult[erredFieldName] = serverErrors[erredFieldName].map(
                  errorMsg =>
                    ({
                      type: 'server',
                      message: errorMsg,
                    }) as HoneyFormFieldError,
                );

                return formErrorsResult;
              }, {} as HoneyFormErrors<Form>),
            );
          }

          // Only submitting the form can clear the dirty state
          isFormDirtyRef.current = false;
          isFormSubmittedRef.current = true;
        }
      } finally {
        updateFormState({
          isValidating: false,
          isSubmitting: false,
        });
      }
    },
    [validateForm, onSubmit],
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

      registerChildForm(parentField, {
        id: childFormIdRef.current,
        formFieldsRef,
        submitForm,
        validateForm,
      });
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
      }
    };
  }, []);

  const resetForm: HoneyFormReset = () => {
    setFormFields(initialFormFieldsGetter);
  };

  const formValues = useMemo(() => getFormValues(formFields), [formFields]);

  const formErrors = useMemo(() => getFormErrors(formFields), [formFields]);

  const isFormErred = Object.keys(formErrors).length > 0;

  return {
    formFields,
    formValues,
    formErrors,
    isFormDefaultsFetching,
    isFormDefaultsFetchingErred,
    isFormErred,
    isFormDirty: isFormDirtyRef.current,
    isFormValidating: formState.isValidating,
    isFormValid: isFormValidRef.current,
    isFormSubmitting: formState.isSubmitting,
    isFormSubmitted: isFormSubmittedRef.current,
    formDefaultValues: formDefaultValuesRef.current,
    // functions
    setFormValues,
    setFormErrors,
    addFormField,
    removeFormField,
    addFormFieldError,
    clearFormErrors,
    validateForm: outerValidateForm,
    submitForm,
    resetForm,
  };
};

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  HoneyFormAddFieldError,
  HoneyFormClearFieldErrors,
  HoneyFormDefaultValues,
  HoneyFormFields,
  HoneyFormFormState,
  HoneyFormPushFieldValue,
  HoneyFormRemoveFieldValue,
  HoneyFormSetFieldValueInternal,
  HoneyFormValidateField,
  HoneyFormBaseForm,
  FormOptions,
  HoneyFormAddFormField,
  HoneyFormClearErrors,
  HoneyFormRemoveFormField,
  HoneyFormReset,
  HoneyFormSetFormErrors,
  HoneyFormSetFormValues,
  HoneyFormSubmit,
  HoneyFormValidate,
} from './types';
import {
  clearAllFields,
  createField,
  executeFieldValidator,
  executeFieldValidatorAsync,
  getNextErredField,
  getNextFieldsState,
  getNextErrorsFreeField,
} from './field';
import {
  forEachFormError,
  getFormErrors,
  getFormValues,
  getSubmitFormValues,
  isSkipField,
  mapFormFields,
  mapServerErrors,
  runChildFormsValidation,
  warningMessage,
} from './helpers';

export const useForm = <Form extends HoneyFormBaseForm, FormContext = undefined>({
  initialFormFieldsStateResolver,
  defaults = {},
  context: formContext,
  onSubmit,
  onChange,
  onChangeDebounce,
}: FormOptions<Form, FormContext>) => {
  const [formState, setFormState] = useState<HoneyFormFormState>({
    isValidating: false,
    isSubmitting: false,
  });

  const [isFormDefaultsFetching, setIsFormDefaultsFetching] = useState(false);
  const [isFormDefaultsFetchingErred, setIsFormDefaultsFetchingErred] = useState(false);

  const formDefaultValuesRef = useRef<HoneyFormDefaultValues<Form>>(
    typeof defaults === 'function' ? {} : defaults,
  );
  const formFieldsRef = useRef<HoneyFormFields<Form, FormContext> | null>(null);
  const isFormDirtyRef = useRef(false);
  const isFormValidRef = useRef(false);
  const isFormSubmittedRef = useRef(false);
  const onChangeTimeoutRef = useRef<number | null>(null);

  const updateFormState = useCallback((newFormState: Partial<HoneyFormFormState>) => {
    setFormState(prevFormState => ({ ...prevFormState, ...newFormState }));
  }, []);

  const setFormValues = useCallback<HoneyFormSetFormValues<Form>>(
    (values, { clearAll = false } = {}) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      setFormFields(formFields => {
        const nextFormFields = { ...formFields };

        if (clearAll) {
          clearAllFields(nextFormFields);
        }

        Object.keys(values).forEach((fieldName: keyof Form) => {
          const fieldConfig = nextFormFields[fieldName].config;

          const filteredValue = fieldConfig.filter
            ? fieldConfig.filter(values[fieldName], { formContext })
            : values[fieldName];

          let nextFormField = executeFieldValidator(
            formContext,
            nextFormFields,
            fieldName,
            filteredValue,
          );

          const formattedValue = nextFormField.config.formatter
            ? nextFormField.config.formatter(filteredValue, { formContext })
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
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const nextFormFields = { ...formFields };

      forEachFormError(formErrors, (fieldName, fieldErrors) => {
        nextFormFields[fieldName] = getNextErredField(nextFormFields[fieldName], fieldErrors);
      });

      return nextFormFields;
    });
  }, []);

  const clearFormErrors = useCallback<HoneyFormClearErrors>(() => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(
      formFields =>
        mapFormFields(formFields, (_, formField) =>
          getNextErrorsFreeField(formField),
        ) as HoneyFormFields<Form, FormContext>,
    );
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
          formContext,
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

          onChange(getSubmitFormValues(formContext, nextFormFields), {
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
      [fieldName]: getNextErrorsFreeField(formFields[fieldName]),
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateField: HoneyFormValidateField<Form> = fieldName => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const formField = formFields[fieldName];

      const filteredValue = formField.config.filter
        ? formField.config.filter(formField.rawValue, { formContext })
        : formField.rawValue;

      return {
        ...formFields,
        [fieldName]: executeFieldValidator(formContext, formFields, fieldName, filteredValue),
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

  const addFormField = useCallback<HoneyFormAddFormField<Form, FormContext>>(
    (fieldName, config) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      setFormFields(formFields => {
        if (formFields[fieldName]) {
          warningMessage(`Form field "${fieldName.toString()}" is already present`);
        }

        return {
          ...formFields,
          [fieldName]: createField(fieldName, config, {
            formContext,
            formFieldsRef,
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

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const newFormFields = { ...formFields };
      //
      delete newFormFields[fieldName];
      //
      return newFormFields;
    });
  }, []);

  /**
   * Validates the form fields based on the specified field names.
   *
   * @param {Array<keyof Form>?} fieldNames - Optional array of field names to validate. If provided, only these fields will be validated.
   * @returns {Promise<boolean>} - A promise that resolves to `true` if there are no validation errors, otherwise `false`.
   */
  const validateForm = useCallback<HoneyFormValidate<Form>>(async fieldNames => {
    const formFields = formFieldsRef.current;
    if (!formFields) {
      throw new Error('The `formFields` value is null');
    }

    // Variable to track if any errors are found during validation
    let hasErrors = false;

    const nextFormFields = {} as HoneyFormFields<Form, FormContext>;

    await Promise.all(
      Object.keys(formFields).map(async (fieldName: keyof Form) => {
        const formField = formFields[fieldName];

        const isSkipFieldValidation = fieldNames ? !fieldNames.includes(fieldName) : false;

        if (isSkipFieldValidation || isSkipField(fieldName, { formContext, formFields })) {
          nextFormFields[fieldName] = getNextErrorsFreeField(formField);
          return;
        }

        const hasChildFormsErrors = await runChildFormsValidation(formField);
        hasErrors ||= hasChildFormsErrors;

        // Execute the field validator asynchronously
        const nextField = await executeFieldValidatorAsync(formContext, formFields, fieldName);

        // Filter out errors of type 'server' to avoid blocking the form submission trigger
        const fieldErrors = nextField.errors.filter(fieldError => fieldError.type !== 'server');
        if (fieldErrors.length) {
          hasErrors = true;
        }

        nextFormFields[fieldName] = nextField;
      }),
    );

    isFormValidRef.current = !hasErrors;

    // Set the new `nextFormFields` value to the ref to access it at getting clean values at submitting
    formFieldsRef.current = nextFormFields;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(nextFormFields);

    return !hasErrors;
  }, []);

  /**
   * Validates the form fields, updating the form state to indicate validation status.
   *
   * @param {Array<keyof Form>?} fieldNames - Optional array of field names to validate. If provided, only these fields will be validated.
   * @returns {Promise<boolean>} - A promise that resolves to `true` if there are no validation errors, otherwise `false`.
   */
  const outerValidateForm = useCallback<HoneyFormValidate<Form>>(async fieldNames => {
    // Update the form state to indicate that validation is in progress
    updateFormState({
      isValidating: true,
    });

    try {
      return await validateForm(fieldNames);
    } finally {
      // Update the form state to indicate that validation is complete
      updateFormState({
        isValidating: false,
      });
    }
  }, []);

  /**
   * Submits the form by invoking the submit handler and handling server errors.
   */
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
          // Only submitting the form can clear the dirty state
          updateFormState({
            isValidating: false,
            isSubmitting: true,
          });

          // Prepare data for submission
          const submitData = getSubmitFormValues(formContext, formFieldsRef.current);

          // Call the submitHandler or onSubmit function for actual submission
          const serverErrors = await (submitHandler || onSubmit)?.(submitData, { formContext });

          if (serverErrors && Object.keys(serverErrors).length) {
            setFormErrors(
              mapServerErrors(serverErrors, (_, fieldErrors) =>
                fieldErrors.map(errorMsg => ({
                  type: 'server',
                  message: errorMsg,
                })),
              ),
            );
          }

          // Only submitting the form can clear the dirty state
          isFormDirtyRef.current = false;
          isFormSubmittedRef.current = true;
        }
      } finally {
        // Only submitting the form can clear the dirty state
        updateFormState({
          isValidating: false,
          isSubmitting: false,
        });
      }
    },
    [validateForm, onSubmit],
  );

  const getInitialFormFieldsState = () =>
    initialFormFieldsStateResolver({
      formContext,
      formFieldsRef,
      formDefaultValuesRef,
      setFieldValue,
      clearFieldErrors,
      pushFieldValue,
      removeFieldValue,
      addFormFieldError,
    });

  const resetForm: HoneyFormReset = () => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(getInitialFormFieldsState);
  };

  const [formFields, setFormFields] = useState(getInitialFormFieldsState);
  //
  formFieldsRef.current = formFields;

  useEffect(() => {
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
  }, []);

  const formValues = useMemo(() => getFormValues(formFields), [formFields]);

  const formErrors = useMemo(() => getFormErrors(formFields), [formFields]);

  const isFormErred = Object.keys(formErrors).length > 0;

  return {
    formFieldsRef,
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

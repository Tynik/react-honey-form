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
  resetAllFields,
  createField,
  executeFieldValidator,
  executeFieldValidatorAsync,
  getNextErredField,
  getNextFieldsState,
  getNextErrorsFreeField,
  getNextSingleFieldState,
} from './field';
import {
  checkIfFieldIsInteractive,
  checkIfFieldIsNestedForms,
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

const DEFAULTS = {};

export const useForm = <Form extends HoneyFormBaseForm, FormContext = undefined>({
  initialFormFieldsStateResolver,
  defaults = DEFAULTS,
  values: externalValues,
  resetAfterSubmit = false,
  context: formContext,
  onSubmit,
  onChange,
  onChangeDebounce = 0,
}: FormOptions<Form, FormContext>) => {
  const [formState, setFormState] = useState<HoneyFormFormState>({
    isValidating: false,
    isSubmitting: false,
  });

  const [isFormDefaultsFetching, setIsFormDefaultsFetching] = useState(false);
  const [isFormDefaultsFetchingErred, setIsFormDefaultsFetchingErred] = useState(false);

  const formDefaultsRef = useRef<HoneyFormDefaultValues<Form>>(
    typeof defaults === 'function' ? {} : { ...defaults },
  );
  const formFieldsRef = useRef<HoneyFormFields<Form, FormContext> | null>(null);
  const isFormDirtyRef = useRef(false);
  const isFormValidRef = useRef(false);
  const isFormSubmittedRef = useRef(false);
  const onChangeTimeoutRef = useRef<number | null>(null);

  const updateFormState = useCallback((newFormState: Partial<HoneyFormFormState>) => {
    setFormState(prevFormState => ({ ...prevFormState, ...newFormState }));
  }, []);

  /**
   * Handles form field changes with optional debouncing.
   *
   * @param fn - A function that returns the next form fields.
   * @param isSkipOnChange - If true, skips the debouncing mechanism and directly returns the result of the provided function.
   *
   * @returns The next form fields after handling the change.
   */
  const debouncedOnChangeHandler = (
    fn: () => HoneyFormFields<Form, FormContext>,
    isSkipOnChange = false,
  ) => {
    // If `isSkipOnChange` is `true`, skip debouncing and directly return the result of the provided function.
    if (isSkipOnChange) {
      return fn();
    }

    if (onChangeTimeoutRef.current) {
      clearTimeout(onChangeTimeoutRef.current);
    }

    const nextFormFields = fn();

    // If `onChange` is provided, set a timeout for debouncing and call onChange after the timeout.
    if (onChange) {
      const formFields = formFieldsRef.current;
      if (!formFields) {
        throw new Error('The `formFieldsRef` value is null');
      }

      onChangeTimeoutRef.current = window.setTimeout(() => {
        onChangeTimeoutRef.current = null;

        onChange(getSubmitFormValues(formContext, nextFormFields), {
          formFields,
          formErrors: getFormErrors(nextFormFields),
        });
      }, onChangeDebounce);
    }

    return nextFormFields;
  };

  /**
   * Updates form field values based on the provided values object.
   *
   * @param values - The values to set for each form field.
   * @param options - Additional options for setting form values.
   *   @param isClearAll - If true, clears all existing form field values before setting new values.
   *   @param isSkipOnChange - If true, skips the debounced `onChange` handling.
   */
  const setFormValues = useCallback<HoneyFormSetFormValues<Form>>(
    (values, { isClearAll = false, isSkipOnChange = false } = {}) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      setFormFields(formFields =>
        debouncedOnChangeHandler(() => {
          const nextFormFields = { ...formFields };

          if (isClearAll) {
            resetAllFields(nextFormFields);
          }

          Object.keys(values).forEach((fieldName: keyof Form) => {
            const fieldConfig = nextFormFields[fieldName].config;

            const filteredValue =
              checkIfFieldIsInteractive(fieldConfig) && fieldConfig.filter
                ? fieldConfig.filter(values[fieldName], { formContext })
                : values[fieldName];

            const nextFormField = executeFieldValidator(
              formContext,
              nextFormFields,
              fieldName,
              filteredValue,
            );

            nextFormFields[fieldName] = getNextSingleFieldState(nextFormField, filteredValue, {
              formContext,
              isFormat: true,
            });
          });

          return nextFormFields;
        }, isSkipOnChange),
      );
    },
    [formContext],
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
        ) as unknown as HoneyFormFields<Form, FormContext>,
    );
  }, []);

  /**
   * Set the value of a form field and update the form state accordingly.
   *
   * @template Form - The form type.
   */
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
    setFormFields(formFields =>
      debouncedOnChangeHandler(() => {
        const formField = formFields[fieldName];

        const isFieldErred = formField.errors.length > 0;

        const nextFormFields = getNextFieldsState(
          fieldName,
          // @ts-expect-error
          isPushValue ? [...formField.value, fieldValue] : fieldValue,
          {
            formContext,
            formFields,
            isFormat,
            // Forcibly re-validate the new field value even validation field mode is `blur` if there is any error
            isValidate: isValidate || isFieldErred,
          },
        );

        const fieldConfig = nextFormFields[fieldName].config;

        if (fieldConfig.onChange) {
          window.setTimeout(() => {
            fieldConfig.onChange(nextFormFields[fieldName].cleanValue, {
              formFields: nextFormFields,
            });
          }, 0);
        }

        return nextFormFields;
      }),
    );
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

  const validateField: HoneyFormValidateField<Form> = fieldName => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const formField = formFields[fieldName];

      let filteredValue: Form[typeof fieldName];

      if (checkIfFieldIsInteractive(formField.config) && formField.config.filter) {
        filteredValue = formField.config.filter(formField.rawValue, { formContext });
        //
      } else if (checkIfFieldIsNestedForms(formField.config)) {
        filteredValue = formField.getChildFormsValues() as Form[typeof fieldName];
        //
      } else {
        filteredValue = formField.rawValue;
      }

      const nextFormField = executeFieldValidator(
        formContext,
        formFields,
        fieldName,
        filteredValue,
      );

      return {
        ...formFields,
        [fieldName]: nextFormField,
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
            formDefaultsRef,
            setFieldValue,
            clearFieldErrors,
            validateField,
            pushFieldValue,
            removeFieldValue,
            addFormFieldError,
          }),
        };
      });
    },
    [formContext],
  );

  const removeFormField = useCallback<HoneyFormRemoveFormField<Form>>(fieldName => {
    // Clearing the default field value
    delete formDefaultsRef.current[fieldName];

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
  const validateForm = useCallback<HoneyFormValidate<Form>>(
    async ({ targetFields, excludeFields } = {}) => {
      const formFields = formFieldsRef.current;
      if (!formFields) {
        throw new Error('The `formFields` value is null');
      }

      // Variable to track if any errors are found during validation
      let hasErrors = false;

      const nextFormFields = {} as HoneyFormFields<Form, FormContext>;

      const formValues = getFormValues(formFields);

      await Promise.all(
        Object.keys(formFields).map(async (fieldName: keyof Form) => {
          const formField = formFields[fieldName];

          const isTargetFieldValidation = targetFields?.length
            ? targetFields.includes(fieldName)
            : true;

          const isExcludeFieldFromValidation = excludeFields
            ? excludeFields.includes(fieldName)
            : false;

          if (
            isExcludeFieldFromValidation ||
            !isTargetFieldValidation ||
            isSkipField(fieldName, { formContext, formFields, formValues })
          ) {
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
    },
    [formContext],
  );

  /**
   * Validates the form fields, updating the form state to indicate validation status.
   *
   * @param {Array<keyof Form>?} fieldNames - Optional array of field names to validate. If provided, only these fields will be validated.
   * @returns {Promise<boolean>} - A promise that resolves to `true` if there are no validation errors, otherwise `false`.
   */
  const outerValidateForm = useCallback<HoneyFormValidate<Form>>(
    async validateOptions => {
      // Update the form state to indicate that validation is in progress
      updateFormState({
        isValidating: true,
      });

      try {
        return await validateForm(validateOptions);
      } finally {
        // Update the form state to indicate that validation is complete
        updateFormState({
          isValidating: false,
        });
      }
    },
    [validateForm],
  );

  const getInitialFormFieldsState = () =>
    initialFormFieldsStateResolver({
      formContext,
      formFieldsRef,
      formDefaultsRef,
      setFieldValue,
      clearFieldErrors,
      validateField,
      pushFieldValue,
      removeFieldValue,
      addFormFieldError,
    });

  const resetForm: HoneyFormReset = () => {
    isFormDirtyRef.current = false;
    isFormValidRef.current = false;
    isFormSubmittedRef.current = false;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(getInitialFormFieldsState);
  };

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
          } else if (resetAfterSubmit) {
            resetForm();
            return;
          }

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

  const [formFields, setFormFields] = useState(getInitialFormFieldsState);
  //
  formFieldsRef.current = formFields;

  // Detect changes in `externalValues` and update the form values accordingly
  useEffect(() => {
    if (externalValues) {
      setFormValues(externalValues, { isSkipOnChange: true });
    }
  }, [externalValues]);

  useEffect(() => {
    if (typeof defaults === 'function') {
      setIsFormDefaultsFetching(true);

      defaults()
        .then(defaultValues => {
          formDefaultsRef.current = defaultValues;

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
    formContext,
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
    formDefaultValues: formDefaultsRef.current,
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

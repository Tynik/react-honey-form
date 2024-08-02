import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  FormOptions,
  HoneyFormId,
  HoneyFormBaseForm,
  HoneyFormFieldAddError,
  HoneyFormFieldClearErrors,
  HoneyFormDefaultValues,
  HoneyFormFields,
  HoneyFormState,
  HoneyFormFieldPushValue,
  HoneyFormFieldRemoveValue,
  HoneyFormFieldSetInternalValue,
  HoneyFormFieldAddErrors,
  HoneyFormFieldFinishAsyncValidation,
  HoneyFormValidateField,
  HoneyFormAddFormField,
  HoneyFormClearErrors,
  HoneyFormRemoveFormField,
  HoneyFormReset,
  HoneyFormSetFormErrors,
  HoneyFormSetFormValues,
  HoneyFormSubmit,
  HoneyFormValidate,
  HoneyFormErrors,
  KeysWithArrayValues,
  HoneyFormRestoreUnfinishedForm,
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
  getNextAsyncValidatedField,
} from './field';
import {
  checkIfFieldIsInteractive,
  checkIfFieldIsNestedForms,
  forEachFormError,
  getFormErrors,
  getFormValues,
  getSubmitFormValues,
  checkIsSkipField,
  mapFormFields,
  mapServerErrors,
  runChildFormsValidation,
  warningMessage,
  errorMessage,
} from './helpers';
import { HONEY_FORM_ERRORS } from './constants';

const FORM_DEFAULTS = {};

const INITIAL_FORM_STATE: HoneyFormState = {
  isValidating: false,
  isSubmitting: false,
};

export const useForm = <
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  Form extends HoneyFormBaseForm,
  FormContext = undefined,
>({
  initialFormFieldsStateResolver,
  parentField,
  defaults = FORM_DEFAULTS,
  values: externalValues,
  resetAfterSubmit = false,
  validateExternalValues = false,
  alwaysValidateParentField = false,
  context: formContext,
  onSubmit,
  onChange,
  onChangeDebounce = 0,
}: FormOptions<ParentForm, ParentFieldName, Form, FormContext>) => {
  const formIdRef = useRef<HoneyFormId | null>(null);

  const [formState, setFormState] = useState<HoneyFormState>(INITIAL_FORM_STATE);

  const [isFormDefaultsFetching, setIsFormDefaultsFetching] = useState(false);
  const [isFormDefaultsFetchingErred, setIsFormDefaultsFetchingErred] = useState(false);

  const formDefaultsRef = useRef<HoneyFormDefaultValues<Form>>(
    typeof defaults === 'function' ? {} : { ...defaults },
  );
  const formFieldsRef = useRef<HoneyFormFields<Form, FormContext> | null>(null);
  const formValuesRef = useRef<Form | null>(null);
  const formErrorsRef = useRef<HoneyFormErrors<Form> | null>(null);
  const isFormDirtyRef = useRef(false);
  const isFormValidRef = useRef(false);
  const isUnfinishedFormDetected = useRef(false);
  const isFormSubmittedRef = useRef(false);
  const onChangeTimeoutRef = useRef<number | null>(null);

  const updateFormState = useCallback((newFormState: Partial<HoneyFormState>) => {
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

    // If `onChange` is provided, set a timeout for debouncing and call `onChange` after the timeout.
    if (onChange) {
      const formFields = formFieldsRef.current;
      if (!formFields) {
        throw new Error(HONEY_FORM_ERRORS.emptyFormFieldsRef);
      }

      onChangeTimeoutRef.current = window.setTimeout(() => {
        onChangeTimeoutRef.current = null;

        const submitFormValues = getSubmitFormValues(parentField, formContext, nextFormFields);
        const formErrors = getFormErrors(nextFormFields);

        onChange(submitFormValues, {
          formFields,
          formErrors,
        });
      }, onChangeDebounce);
    }

    return nextFormFields;
  };

  const setFormValues = useCallback<HoneyFormSetFormValues<Form>>(
    (
      values,
      { isValidate = true, isDirty = true, isClearAll = false, isSkipOnChange = false } = {},
    ) => {
      if (isDirty) {
        isFormDirtyRef.current = true;
      }

      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      setFormFields(formFields =>
        debouncedOnChangeHandler(() => {
          const nextFormFields = { ...formFields };

          if (isClearAll) {
            resetAllFields(nextFormFields);
          }

          Object.keys(values).forEach((fieldName: keyof Form) => {
            if (!(fieldName in nextFormFields)) {
              throw new Error(
                `[honey-form]: Attempted to set value for non-existent field "${fieldName.toString()}"`,
              );
            }

            const fieldConfig = nextFormFields[fieldName].config;

            const filteredValue =
              checkIfFieldIsInteractive(fieldConfig) && fieldConfig.filter
                ? fieldConfig.filter(values[fieldName], { formContext })
                : values[fieldName];

            const nextFormField = isValidate
              ? executeFieldValidator({
                  formContext,
                  fieldName,
                  formFields: nextFormFields,
                  fieldValue: filteredValue,
                })
              : nextFormFields[fieldName];

            nextFormFields[fieldName] = getNextSingleFieldState(nextFormField, filteredValue, {
              formContext,
              isFormat: true,
            });
          });

          formFieldsRef.current = nextFormFields;
          return nextFormFields;
        }, isSkipOnChange),
      );

      if (parentField) {
        parentField.validate();
      }
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

      formFieldsRef.current = nextFormFields;
      return nextFormFields;
    });
  }, []);

  const clearFormErrors = useCallback<HoneyFormClearErrors>(() => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const nextFormFields = mapFormFields(formFields, (_, formField) =>
        getNextErrorsFreeField(formField),
      ) as unknown as HoneyFormFields<Form, FormContext>;

      formFieldsRef.current = nextFormFields;
      return nextFormFields;
    });
  }, []);

  const finishFieldAsyncValidation: HoneyFormFieldFinishAsyncValidation<Form> = fieldName => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const nextFormFields = {
        ...formFields,
        [fieldName]: getNextAsyncValidatedField(formFields[fieldName]),
      };

      formFieldsRef.current = nextFormFields;
      return nextFormFields;
    });
  };

  /**
   * Set the value of a form field and update the form state accordingly.
   *
   * @template Form - The form type.
   */
  const setFieldValue: HoneyFormFieldSetInternalValue<Form> = (
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
            parentField,
            formContext,
            formFields,
            isFormat,
            finishFieldAsyncValidation,
            // Re-validate the field immediately if it previously had errors or if forced to validate
            isValidate: isValidate || isFieldErred,
          },
        );

        if (parentField) {
          if (
            alwaysValidateParentField ||
            isFieldErred ||
            nextFormFields[fieldName].errors.length
          ) {
            // Use a timeout to avoid rendering the parent form during this field's render cycle
            setTimeout(() => {
              parentField.validate();
            }, 0);
          }
        }

        // Extract the configuration of the updated field
        const fieldConfig = nextFormFields[fieldName].config;

        if (fieldConfig.onChange) {
          window.setTimeout(() => {
            const cleanValue = checkIfFieldIsNestedForms(fieldConfig)
              ? (nextFormFields[fieldName].getChildFormsValues() as Form[typeof fieldName])
              : nextFormFields[fieldName].cleanValue;

            fieldConfig.onChange(cleanValue, {
              formFields: nextFormFields,
            });
          }, 0);
        }

        formFieldsRef.current = nextFormFields;
        return nextFormFields;
      }),
    );
  };

  const clearFieldErrors: HoneyFormFieldClearErrors<Form> = fieldName => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const nextFormFields = {
        ...formFields,
        [fieldName]: getNextErrorsFreeField(formFields[fieldName]),
      };

      formFieldsRef.current = nextFormFields;
      return nextFormFields;
    });
  };

  const pushFieldValue: HoneyFormFieldPushValue<Form> = (fieldName, value) => {
    // @ts-expect-error
    setFieldValue(fieldName, value, { isPushValue: true });
  };

  const removeFieldValue: HoneyFormFieldRemoveValue<Form> = (fieldName, formIndex) => {
    const formFields = formFieldsRef.current;
    if (!formFields) {
      throw new Error(HONEY_FORM_ERRORS.emptyFormFieldsRef);
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

      const nextFormField = executeFieldValidator({
        formContext,
        formFields,
        fieldName,
        fieldValue: filteredValue,
      });

      const nextFormFields = {
        ...formFields,
        [fieldName]: nextFormField,
      };

      formFieldsRef.current = nextFormFields;
      return nextFormFields;
    });
  };

  const addFormFieldErrors = useCallback<HoneyFormFieldAddErrors<Form>>((fieldName, errors) => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const formField = formFields[fieldName];

      const nextFormFields = {
        ...formFields,
        [fieldName]: {
          ...formField,
          // When the form can have alien field errors when the server can return non-existed form fields
          errors: [...(formField?.errors ?? []), ...errors],
        },
      };

      formFieldsRef.current = nextFormFields;
      return nextFormFields;
    });
  }, []);

  const addFormFieldError = useCallback<HoneyFormFieldAddError<Form>>(
    (fieldName, error) => addFormFieldErrors(fieldName, [error]),
    [addFormFieldErrors],
  );

  const addFormField = useCallback<HoneyFormAddFormField<Form, FormContext>>(
    (fieldName, fieldConfig) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      setFormFields(formFields => {
        if (formFields[fieldName]) {
          warningMessage(`Form field "${fieldName.toString()}" is already present.`);
        }

        const nextFormFields = {
          ...formFields,
          [fieldName]: createField(fieldName, fieldConfig, {
            formContext,
            formFieldsRef,
            formDefaultsRef,
            setFieldValue,
            clearFieldErrors,
            validateField,
            pushFieldValue,
            removeFieldValue,
            addFormFieldErrors,
            form: {
              //
            },
          }),
        };

        formFieldsRef.current = nextFormFields;
        return nextFormFields;
      });
    },
    [formContext],
  );

  const removeFormField = useCallback<HoneyFormRemoveFormField<Form>>(fieldName => {
    // Clearing the default field value
    delete formDefaultsRef.current[fieldName];

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const nextFormFields = { ...formFields };
      //
      delete nextFormFields[fieldName];
      //
      formFieldsRef.current = nextFormFields;
      return nextFormFields;
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
        throw new Error(HONEY_FORM_ERRORS.emptyFormFieldsRef);
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
            checkIsSkipField({
              parentField,
              fieldName,
              formContext,
              formFields,
              formValues,
            })
          ) {
            nextFormFields[fieldName] = getNextErrorsFreeField<Form, typeof fieldName, FormContext>(
              formField,
            );
            return;
          }

          const hasChildFormsErrors = await runChildFormsValidation(formField);
          if (hasChildFormsErrors) {
            hasErrors = true;
          }

          const nextField = await executeFieldValidatorAsync({
            parentField,
            fieldName,
            formFields,
            formContext,
          });

          hasErrors ||= nextField.errors.some(fieldError => fieldError.type !== 'server');

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
      try {
        // Update the form state to indicate that validation is in progress
        updateFormState({
          isValidating: true,
        });

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
      addFormFieldErrors,
    });

  const resetForm: HoneyFormReset<Form> = newFormDefaults => {
    isFormDirtyRef.current = false;
    isFormValidRef.current = false;
    isFormSubmittedRef.current = false;

    if (newFormDefaults) {
      formDefaultsRef.current = { ...formDefaultsRef.current, ...newFormDefaults };
    }

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(getInitialFormFieldsState);

    if (parentField) {
      parentField.validate();
    }
  };

  const restoreUnfinishedForm = useCallback<HoneyFormRestoreUnfinishedForm>(() => {
    isUnfinishedFormDetected.current = false;

    setFormValues({});
  }, []);

  const submitForm = useCallback<HoneyFormSubmit<Form, FormContext>>(
    async formSubmitHandler => {
      if (!formFieldsRef.current) {
        throw new Error(HONEY_FORM_ERRORS.emptyFormFieldsRef);
      }

      if (!formSubmitHandler && !onSubmit) {
        throw new Error(HONEY_FORM_ERRORS.submitHandlerOrOnSubmit);
      }

      try {
        updateFormState({
          isValidating: true,
        });

        if (await validateForm()) {
          // Only submitting the form can clear the dirty state
          updateFormState({
            isValidating: false,
            isSubmitting: true,
          });

          // Prepare data for submission
          const submitData = getSubmitFormValues(parentField, formContext, formFieldsRef.current);

          // Choose form submit handler
          const submitHandler = formSubmitHandler || onSubmit;
          // Call the `submitHandler` or `onSubmit` function for actual submission
          const serverErrors = await submitHandler(submitData, { formContext });

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
      setFormValues(externalValues, {
        isValidate: validateExternalValues,
        isDirty: false,
        isSkipOnChange: true,
      });
    }
  }, [externalValues]);

  useEffect(() => {
    if (typeof defaults === 'function') {
      setIsFormDefaultsFetching(true);

      defaults()
        .then(defaultValues => {
          formDefaultsRef.current = defaultValues;

          setFormValues(defaultValues, { isValidate: false, isDirty: false, isSkipOnChange: true });
        })
        .catch(() => {
          errorMessage('Unable to fetch or process the form default values.');
          setIsFormDefaultsFetchingErred(true);
        })
        .finally(() => setIsFormDefaultsFetching(false));
    }
  }, []);

  const formValues = useMemo(() => getFormValues(formFields), [formFields]);
  formValuesRef.current = formValues;

  const formErrors = useMemo(() => getFormErrors(formFields), [formFields]);
  formErrorsRef.current = formErrors;

  const isAnyFormFieldValidating = useMemo(
    () => Object.keys(formFields).some(formField => formFields[formField].isValidating),
    [formFields],
  );

  const isFormErred = Object.keys(formErrors).length > 0;

  const isFormSubmitAllowed =
    !isFormDefaultsFetching &&
    !isFormDefaultsFetchingErred &&
    !isAnyFormFieldValidating &&
    !formState.isSubmitting;

  return {
    formIdRef,
    formContext,
    formFieldsRef,
    // Getters are needed to get the form fields, values and etc. using multi forms
    get formDefaultValues() {
      return formDefaultsRef.current;
    },
    get formFields() {
      return formFieldsRef.current;
    },
    get formValues() {
      return formValuesRef.current;
    },
    get formErrors() {
      return formErrorsRef.current;
    },
    get isFormDirty() {
      return isFormDirtyRef.current;
    },
    get isFormValidating() {
      return formState.isValidating;
    },
    get isFormValid() {
      return isFormValidRef.current;
    },
    get isFormSubmitting() {
      return formState.isSubmitting;
    },
    get isFormSubmitted() {
      return isFormSubmittedRef.current;
    },
    isFormDefaultsFetching,
    isFormDefaultsFetchingErred,
    isFormErred,
    isAnyFormFieldValidating,
    isFormSubmitAllowed,
    // functions
    setFormValues,
    setFormErrors,
    addFormField,
    removeFormField,
    addFormFieldErrors,
    addFormFieldError,
    clearFormErrors,
    validateForm: outerValidateForm,
    submitForm,
    resetForm,
    restoreUnfinishedForm,
  };
};

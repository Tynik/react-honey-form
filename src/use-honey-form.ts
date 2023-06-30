import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  UseHoneyFormForm,
  UseHoneyFormAddFormField,
  UseHoneyFormErrors,
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
  UseHoneyFormFieldError,
  UseHoneyFormClearFieldErrors,
  UseHoneyFormValidateField,
} from './use-honey-form.types';

import {
  sanitizeFieldValue,
  clearDependentFields,
  createField,
  executeFieldValidator,
  triggerScheduledFieldsValidations,
  clearAllFields,
  runFieldValidation,
} from './use-honey-form.field';
import {
  getFormErrors,
  getFieldsCleanValues,
  warningMessage,
  unregisterChildForm,
  registerChildForm,
  getHoneyFormUniqueId,
  isSkipField,
  captureChildFormsFieldValues,
} from './use-honey-form.helpers';
import { USE_HONEY_FORM_ERRORS } from './use-honey-form.constants';

type CreateInitialFormFieldsGetterOptions<Form extends UseHoneyFormForm> = {
  formIndex: number;
  parentField: UseHoneyFormParentField<Form>;
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

      let childFormFieldValue: Form[keyof Form];
      if (parentField) {
        const childForm = Array.isArray(parentField.value)
          ? parentField.value[formIndex]
          : parentField.value;

        childFormFieldValue = childForm?.[fieldName];
      }

      const defaultFieldValue = typeof defaults === 'function' ? undefined : defaults[fieldName];

      // @ts-expect-error
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
        }
      );

      return initialFormFields;
    }, {} as UseHoneyFormFields<Form>);

const getNextHoneyFormFieldsState = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>(
  fieldName: FieldName,
  fieldValue: FieldValue,
  {
    formFields,
    isValidate,
  }: {
    formFields: UseHoneyFormFields<Form>;
    isValidate: boolean;
  }
): UseHoneyFormFields<Form> => {
  const nextFormFields = { ...formFields };

  let filteredValue = fieldValue;

  const formField = formFields[fieldName];

  const fieldConfig = formField.config as UseHoneyFormFieldConfig<Form, FieldName, FieldValue>;

  if (fieldConfig.filter) {
    filteredValue = fieldConfig.filter(fieldValue);

    if ('props' in formField && filteredValue === formField.props.value) {
      // Do not re-render, nothing changed. Return previous state
      return formFields;
    }
  }

  let cleanValue: FieldValue;
  let errors: UseHoneyFormFieldError[] = [];

  if (isValidate) {
    clearDependentFields(nextFormFields, fieldName);

    cleanValue = sanitizeFieldValue(fieldConfig.type, filteredValue);
    errors = executeFieldValidator(nextFormFields, fieldName, cleanValue);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const formattedValue = fieldConfig.format?.(filteredValue) ?? filteredValue;

  nextFormFields[fieldName] = {
    ...formField,
    errors,
    value: formattedValue,
    // set clean value as undefined if any error is present
    cleanValue: errors.length ? undefined : cleanValue,
    ...('props' in formField && {
      props: {
        ...formField.props,
        value: formattedValue,
        'aria-invalid': Boolean(errors.length),
      },
    }),
  };

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
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [isFormDefaultsFetching, setIsFormDefaultsFetching] = useState(false);
  const [isFormDefaultsFetchingErred, setIsFormDefaultsFetchingErred] = useState(false);

  const formFieldsRef = useRef<UseHoneyFormFields<Form> | null>(null);
  const childFormIdRef = useRef<UseHoneyFormChildFormId | null>(null);
  const isFormDirtyRef = useRef(false);
  const onChangeTimeoutRef = useRef<number | null>(null);

  const setFieldValue: UseHoneyFormSetFieldValueInternal<Form> = (
    fieldName,
    fieldValue,
    { isValidate = true, isPushValue = false, isDirty = true } = {}
  ) => {
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
        }
      );

      const nextFormField = nextFormFields[fieldName];
      if ('nestedValues' in nextFormField) {
        captureChildFormsFieldValues(nextFormField);
      }

      const fieldConfig = nextFormFields[fieldName].config;

      if (fieldConfig.onChange) {
        window.setTimeout(() => {
          fieldConfig.onChange(nextFormFields[fieldName].cleanValue, {
            formFields: nextFormFields,
          });
        }, 0);
      }

      // call onChange() on next iteration to do not affect new state return
      if (onChange) {
        onChangeTimeoutRef.current = window.setTimeout(() => {
          onChangeTimeoutRef.current = null;

          onChange(getFieldsCleanValues(nextFormFields), getFormErrors(nextFormFields));
        }, onChangeDebounce ?? 0);
      }

      return nextFormFields;
    });
  };

  const clearFieldErrors: UseHoneyFormClearFieldErrors<Form> = fieldName => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const formField = formFields[fieldName];

      return {
        ...formFields,
        [fieldName]: {
          ...formField,
          errors: [],
        },
      };
    });
  };

  const pushFieldValue: UseHoneyFormPushFieldValue<Form> = (fieldName, value) => {
    // @ts-expect-error
    setFieldValue(fieldName, value, { isPushValue: true });
  };

  const removeFieldValue: UseHoneyFormRemoveFieldValue<Form> = (fieldName, formIndex) => {
    const formField = formFieldsRef.current[fieldName];

    setFieldValue(
      fieldName,
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      formField.value.filter((_, index) => index !== formIndex)
    );
  };

  const validateField: UseHoneyFormValidateField<Form> = fieldName => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => runFieldValidation(formFields, fieldName));
  };

  const addFormFieldError = useCallback<UseHoneyFormAddFieldError<Form>>((fieldName, error) => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const formField = formFields[fieldName];

      return {
        ...formFields,
        [fieldName]: {
          ...formField,
          // there are some cases when the form can have alien field errors when the server can return non existed form fields
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
          const formField = nextFormFields[fieldName];

          const filteredValue = formField.config.filter
            ? formField.config.filter(values[fieldName])
            : values[fieldName];

          const cleanValue = sanitizeFieldValue(formField.config.type, filteredValue);
          const errors = executeFieldValidator(nextFormFields, fieldName, cleanValue);

          const formattedValue = formField.config.format?.(filteredValue) ?? filteredValue;

          nextFormFields[fieldName] = {
            ...formField,
            errors,
            value: formattedValue,
            cleanValue: errors.length ? undefined : cleanValue,
            ...('props' in formField && {
              props: {
                ...formField.props,
                value: formattedValue,
                'aria-invalid': Boolean(errors.length),
              },
            }),
          };
        });

        return nextFormFields;
      });
    },
    []
  );

  const addFormField = useCallback<UseHoneyFormAddFormField<Form>>(
    <FieldName extends keyof Form, FieldValue extends Form[FieldName]>(
      fieldName: FieldName,
      config: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>
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
    []
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
      Object.keys(formFields).reduce((result, fieldName: keyof Form) => {
        result[fieldName] = {
          ...result[fieldName],
          errors: [],
        };
        return result;
      }, {} as UseHoneyFormFields<Form>)
    );
  }, []);

  const validateForm: UseHoneyFormValidate = () => {
    let hasErrors = false;

    const nextFormFields = Object.keys(formFieldsRef.current).reduce(
      (formFields, fieldName: keyof Form) => {
        const formField = formFieldsRef.current[fieldName];

        if (isSkipField(fieldName, formFieldsRef.current)) {
          formFields[fieldName] = {
            ...formField,
            cleanValue: undefined,
            errors: [],
            ...('props' in formField && {
              props: {
                ...formField.props,
                'aria-invalid': false,
              },
            }),
          };

          return formFields;
        }

        // Perform validation on child forms (when the field is an array that includes child forms)
        if ('childForms' in formField.__meta__) {
          formField.__meta__.childForms.forEach(childForm => {
            if (!childForm.validateForm()) {
              hasErrors = true;
            }
          });
        }

        const cleanValue = sanitizeFieldValue(formField.config.type, formField.value);
        const errors = executeFieldValidator(formFieldsRef.current, fieldName, cleanValue);

        if (errors.length) {
          hasErrors = true;
        }

        formFields[fieldName] = {
          ...formField,
          errors,
          cleanValue: errors.length ? undefined : cleanValue,
          ...('props' in formField && {
            props: {
              ...formField.props,
              'aria-invalid': Boolean(errors.length),
            },
          }),
        };

        return formFields;
      },
      {} as UseHoneyFormFields<Form>
    );

    formFieldsRef.current = nextFormFields;
    setFormFields(nextFormFields);

    return !hasErrors;
  };

  const submitForm: UseHoneyFormSubmit<Form, Response> = useCallback(async submitHandler => {
    if (!validateForm()) {
      // TODO: maybe reject should be provided? Left a comment after decision
      return Promise.resolve();
    }
    const submitData = getFieldsCleanValues(formFieldsRef.current);

    setIsFormSubmitting(true);
    try {
      await (submitHandler || onSubmit)?.(submitData);

      isFormDirtyRef.current = false;
    } finally {
      setIsFormSubmitting(false);
    }

    return Promise.resolve();
  }, []);

  const resetForm = useCallback<UseHoneyFormReset>(() => {
    setFormFields(initialFormFieldsGetter);
  }, []);

  const formErrors = useMemo<UseHoneyFormErrors<Form>>(
    () => getFormErrors(formFields),
    [formFields]
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
        .then(setFormValues)
        .catch(() => {
          setIsFormDefaultsFetchingErred(true);
        })
        .finally(() => {
          setIsFormDefaultsFetching(false);
        });
    }

    return () => {
      if (parentField) {
        unregisterChildForm(parentField, childFormIdRef.current);
      }
    };
  }, []);

  return {
    formFields,
    isFormDefaultsFetching,
    isFormDefaultsFetchingErred,
    isFormDirty: isFormDirtyRef.current,
    isFormSubmitting,
    formErrors,
    // functions
    setFormValues,
    addFormField,
    removeFormField,
    addFormFieldError,
    clearFormErrors,
    validateForm,
    submitForm,
    resetForm,
  };
};

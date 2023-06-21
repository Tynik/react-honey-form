import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  UseHoneyFormForm,
  UseHoneyFormAddFormField,
  UseHoneyFormErrors,
  UseHoneyFormFieldConfig,
  UseHoneyFormFields,
  UseHoneyFormSetFieldValue,
  UseHoneyFormOptions,
  UseHoneyFormFieldsConfigs,
  UseHoneyFormRemoveFormField,
  UseHoneyFormSubmit,
  UseHoneyFormAddFieldError,
  UseHoneyFormReset,
  UseHoneyFormResetErrors,
  UseHoneyFormSetFormValues,
  UseHoneyFormDefaults,
  UseHoneyFormApi,
  UseHoneyFormPushFieldValue,
  UseHoneyFormValidate,
  UseHoneyFormRemoveFieldValue,
  UseHoneyFormParentField,
  UseHoneyFormChildFormId,
  UseHoneyFormFieldError,
} from './use-honey-form.types';

import {
  sanitizeFieldValue,
  clearDependentFields,
  createField,
  validateField,
  triggerScheduledFieldsValidations,
  clearAllFields,
} from './use-honey-form.field';
import {
  getFormErrors,
  getFieldsCleanValues,
  captureChildFormsFieldValues,
  warningMessage,
  unregisterChildForm,
  registerChildForm,
  getHoneyFormUniqueId,
  isSkipField,
} from './use-honey-form.helpers';

const createInitialFormFieldsGetter =
  <Form extends UseHoneyFormForm>(
    formIndex: number,
    parentField: UseHoneyFormParentField<Form>,
    fieldsConfigs: UseHoneyFormFieldsConfigs<Form>,
    defaults: UseHoneyFormDefaults<Form>,
    setFieldValue: UseHoneyFormSetFieldValue<Form>,
    pushFieldValue: UseHoneyFormPushFieldValue<Form>,
    removeFieldValue: UseHoneyFormRemoveFieldValue<Form>
  ) =>
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

      initialFormFields[fieldName] = createField(
        fieldName,
        {
          ...fieldConfig,
          defaultValue: childFormFieldValue ?? fieldConfig.defaultValue ?? defaultFieldValue,
        },
        {
          setFieldValue,
          pushFieldValue,
          removeFieldValue,
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
    validate,
  }: {
    formFields: UseHoneyFormFields<Form>;
    validate: boolean;
  }
): UseHoneyFormFields<Form> => {
  const nextFormFields = { ...formFields };

  let filteredValue = fieldValue;

  const formField = formFields[fieldName];

  const fieldConfig = formField.config as UseHoneyFormFieldConfig<Form, FieldName, FieldValue>;

  if (fieldConfig.filter) {
    filteredValue = fieldConfig.filter(fieldValue);

    if (filteredValue === formField.props.value) {
      // Do not re-render, nothing change. Return previous state
      return formFields;
    }
  }

  let cleanValue: FieldValue;
  let errors: UseHoneyFormFieldError[] = [];

  if (validate) {
    clearDependentFields(nextFormFields, fieldName);

    cleanValue = sanitizeFieldValue(fieldConfig.type, filteredValue);
    errors = validateField(cleanValue, fieldConfig, formFields);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const formattedValue = fieldConfig.format?.(filteredValue) ?? filteredValue;

  nextFormFields[fieldName] = {
    ...formField,
    errors,
    value: formattedValue as never,
    // set clean value as undefined if any error is present
    cleanValue: errors.length ? undefined : cleanValue,
    props: {
      ...formField.props,
      value: formattedValue as never,
      'aria-invalid': Boolean(errors.length),
    },
  };

  triggerScheduledFieldsValidations(fieldName, nextFormFields);

  return nextFormFields;
};

export const useHoneyForm = <Form extends UseHoneyFormForm, Response = void>({
  formIndex,
  parentField,
  fields: fieldsConfig = {} as never,
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

  const setFieldValue: UseHoneyFormSetFieldValue<Form> = (
    fieldName,
    fieldValue,
    { validate = true, pushValue = false } = {}
  ) => {
    isFormDirtyRef.current = true;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current);
      }

      const formField = formFields[fieldName];

      const nextFormFields = getNextHoneyFormFieldsState(
        fieldName,
        // @ts-expect-error
        pushValue ? [...formField.value, fieldValue] : fieldValue,
        {
          formFields,
          validate,
        }
      );

      const fieldConfig = nextFormFields[fieldName].config;

      if (fieldConfig.onChange) {
        window.setTimeout(() => {
          fieldConfig.onChange(nextFormFields[fieldName].cleanValue, {
            setFieldValue,
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

  const pushFieldValue: UseHoneyFormPushFieldValue<Form> = (fieldName, value) => {
    // @ts-expect-error
    setFieldValue(fieldName, value, { pushValue: true });
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

  const initialFormFieldsGetter = createInitialFormFieldsGetter(
    formIndex,
    parentField,
    fieldsConfig,
    defaults,
    setFieldValue,
    pushFieldValue,
    removeFieldValue
  );

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
          const value = values[fieldName];

          const filteredValue = formField.config.filter ? formField.config.filter(value) : value;
          const formattedValue = formField.config.format?.(filteredValue) ?? filteredValue;

          const cleanValue = sanitizeFieldValue(formField.config.type, filteredValue);
          const errors = validateField(cleanValue, formField.config, nextFormFields);

          nextFormFields[fieldName] = {
            ...formField,
            errors,
            value: formattedValue,
            cleanValue: errors.length ? undefined : cleanValue,
            props: {
              ...formField.props,
              value: formattedValue,
              'aria-invalid': Boolean(errors.length),
            },
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
            // work with nested form
            pushFieldValue,
            removeFieldValue,
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

  const addFormFieldError = useCallback<UseHoneyFormAddFieldError<Form>>((fieldName, error) => {
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

  const resetFormErrors = useCallback<UseHoneyFormResetErrors>(() => {
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
          };
          return formFields;
        }

        if (formField.__meta__.childrenForms) {
          formField.__meta__.childrenForms.forEach(childForm => {
            if (!childForm.validateForm()) {
              hasErrors = true;
            }
          });

          captureChildFormsFieldValues(formField);

          formFields[fieldName] = {
            ...formField,
          };
        } else {
          const cleanValue = sanitizeFieldValue(formField.config.type, formField.value);

          const errors = validateField(cleanValue, formField.config, formFieldsRef.current);
          if (errors.length) {
            hasErrors = true;
          }

          formFields[fieldName] = {
            ...formField,
            cleanValue,
            errors,
          };
        }

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
      if (Array.isArray(parentField.value) && parentField.value.length && formIndex === undefined) {
        throw new Error(
          '[use-honey-form]: When using `parentField` with an existing value, the `formIndex` option must be provided. Please specify the `formIndex` when rendering the child form.'
        );
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
    resetFormErrors,
    validateForm,
    submitForm,
    resetForm,
  };
};

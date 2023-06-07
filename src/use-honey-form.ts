import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  UseHoneyBaseFormFields,
  UseHoneyFormAddFormField,
  UseHoneyFormErrors,
  UseHoneyFormFieldConfig,
  UseHoneyFormFields,
  UseHoneyFormFieldSetValue,
  UseHoneyFormOptions,
  UseHoneyFormFieldsConfigs,
  UseHoneyFormRemoveFormField,
  UseHoneyFormSubmit,
  UseHoneyFormAddError,
  UseHoneyFormReset,
  UseHoneyFormResetErrors,
  UseHoneyFormSetFormValues,
  UseHoneyFormDefaults,
  UseHoneyFormApi,
} from './use-honey-form.types';

import {
  sanitizeHoneyFormFieldValue,
  clearHoneyFormDependentFields,
  createHoneyFormField,
  validateHoneyFormField,
} from './use-honey-form.field';
import { warningMessage } from './use-honey-form.helpers';

const getInitialHoneyFormFieldsGetter =
  <Form extends UseHoneyBaseFormFields>(
    fieldsConfigs: UseHoneyFormFieldsConfigs<Form>,
    defaults: UseHoneyFormDefaults<Form>,
    setValue: UseHoneyFormFieldSetValue<Form>
  ) =>
  () =>
    Object.keys(fieldsConfigs).reduce((initialFormFields, fieldName: keyof Form) => {
      const fieldConfig = fieldsConfigs[fieldName];

      const defaultFieldValue = typeof defaults === 'function' ? undefined : defaults[fieldName];

      initialFormFields[fieldName] = createHoneyFormField(
        fieldName,
        {
          ...fieldConfig,
          defaultValue: fieldConfig.defaultValue ?? defaultFieldValue,
        },
        {
          setValue,
        }
      );

      return initialFormFields;
    }, {} as UseHoneyFormFields<Form>);

const getSubmitHoneyFormData = <Form extends UseHoneyBaseFormFields>(
  formFields: UseHoneyFormFields<Form>
) =>
  Object.keys(formFields).reduce((formData, fieldName: keyof Form) => {
    const formField = formFields[fieldName];

    formData[fieldName] = formField.cleanValue;

    return formData;
  }, {} as Form);

const getNextHoneyFormFieldsState = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>(
  fieldName: FieldName,
  value: FieldValue,
  {
    formFields,
  }: {
    formFields: UseHoneyFormFields<Form>;
  }
): UseHoneyFormFields<Form> => {
  const nextFormFields = { ...formFields };

  let filteredValue = value;

  const formField = formFields[fieldName];

  const fieldConfig = formField.config as UseHoneyFormFieldConfig<Form, FieldName, FieldValue>;

  if (fieldConfig.filter) {
    filteredValue = fieldConfig.filter(value);

    if (filteredValue === formField.props.value) {
      // Do not re-render, nothing change. Return previous state
      return formFields;
    }
  }

  clearHoneyFormDependentFields(nextFormFields, fieldName);

  const cleanValue = sanitizeHoneyFormFieldValue(fieldConfig.type, filteredValue);

  const errors = validateHoneyFormField(cleanValue, fieldConfig, formFields);

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
    },
  };

  Object.keys(nextFormFields).forEach((otherFieldName: keyof Form) => {
    if (fieldName === otherFieldName) {
      return;
    }

    // eslint-disable-next-line no-underscore-dangle
    if (nextFormFields[otherFieldName].__meta__.isScheduleValidation) {
      const otherFormField = nextFormFields[otherFieldName];

      const otherFieldErrors = validateHoneyFormField(
        otherFormField.cleanValue,
        otherFormField.config,
        nextFormFields
      );

      nextFormFields[otherFieldName] = {
        ...otherFormField,
        errors: otherFieldErrors,
        // set clean value as undefined if any error is present
        cleanValue: otherFieldErrors.length
          ? undefined
          : sanitizeHoneyFormFieldValue(otherFormField.config.type, otherFormField.value),
      };

      // eslint-disable-next-line no-underscore-dangle
      nextFormFields[otherFieldName].__meta__.isScheduleValidation = false;
    }
  });

  return nextFormFields;
};

const getHoneyFormErrors = <Form extends UseHoneyBaseFormFields>(
  formFields: UseHoneyFormFields<Form>
) =>
  Object.keys(formFields).reduce((result, fieldName: keyof Form) => {
    const formField = formFields[fieldName];

    if (formField.errors.length) {
      result[fieldName] = formField.errors;
    }
    return result;
  }, {} as UseHoneyFormErrors<Form>);

/**
 *
 * @param defaults
 * @param fieldsConfig
 * @param onSubmit
 * @param onChange: When any field value is changed.
 *  That callback function is called on next iteration after any change
 * @param onChangeDebounce number: Debounce time for onChange() callback
 */
export const useHoneyForm = <Form extends UseHoneyBaseFormFields, Response = void>({
  fields: fieldsConfig = {} as never,
  defaults = {},
  onSubmit,
  onChange,
  onChangeDebounce,
}: UseHoneyFormOptions<Form, Response>): UseHoneyFormApi<Form, Response> => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirtyRef = useRef(false);

  const [areDefaultsFetching, setAreFetchingDefaults] = useState(false);
  const [areDefaultsFetchingErred, setAreFetchingDefaultsErred] = useState(false);

  const formFieldsRef = useRef<UseHoneyFormFields<Form> | null>(null);
  const onChangeTimeoutRef = useRef<number | null>(null);

  const setFieldValue: UseHoneyFormFieldSetValue<Form> = (fieldName, value) => {
    isDirtyRef.current = true;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current);
      }

      const nextFormFields = getNextHoneyFormFieldsState(fieldName, value, {
        formFields,
      });

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

          onChange(
            getSubmitHoneyFormData<Form>(nextFormFields),
            getHoneyFormErrors(nextFormFields)
          );
        }, onChangeDebounce || 0);
      }

      return nextFormFields;
    });
  };

  const initialFormFieldsGetter = getInitialHoneyFormFieldsGetter<Form>(
    fieldsConfig,
    defaults,
    setFieldValue
  );

  const [formFields, setFormFields] = useState<UseHoneyFormFields<Form>>(initialFormFieldsGetter);
  formFieldsRef.current = formFields;

  const setFormValues = useCallback<UseHoneyFormSetFormValues<Form>>(
    (values, { clearAll = false } = {}) => {
      setFormFields(formFields => {
        const nextFormFields = { ...formFields };

        if (clearAll) {
          Object.keys(nextFormFields).forEach((fieldName: keyof Form) => {
            nextFormFields[fieldName] = {
              ...nextFormFields[fieldName],
              value: undefined,
              cleanValue: undefined,
              errors: [],
              props: {
                ...nextFormFields[fieldName].props,
                value: undefined,
              },
            };
          });
        }

        Object.keys(values).forEach((fieldName: keyof Form) => {
          const fieldConfig = nextFormFields[fieldName].config;

          const filteredValue = fieldConfig.filter
            ? fieldConfig.filter(values[fieldName])
            : values[fieldName];

          const formattedValue = fieldConfig.format?.(filteredValue) ?? filteredValue;

          nextFormFields[fieldName] = {
            ...nextFormFields[fieldName],
            value: formattedValue,
            cleanValue: sanitizeHoneyFormFieldValue(fieldConfig.type, filteredValue),
            errors: [],
            props: {
              ...nextFormFields[fieldName].props,
              value: formattedValue,
            },
          };
        });

        return nextFormFields;
      });
    },
    []
  );

  useEffect(() => {
    if (typeof defaults === 'function') {
      setAreFetchingDefaults(true);

      defaults()
        .then(setFormValues)
        .catch(() => {
          setAreFetchingDefaultsErred(true);
        })
        .finally(() => {
          setAreFetchingDefaults(false);
        });
    }
  }, []);

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
          [fieldName]: createHoneyFormField(fieldName, config, {
            setValue: setFieldValue,
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

  const addError = useCallback<UseHoneyFormAddError<Form>>((fieldName, error) => {
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

  const resetErrors = useCallback<UseHoneyFormResetErrors>(() => {
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

  const validate = () => {
    let hasError = false;

    const nextFormFields = Object.keys(formFieldsRef.current).reduce(
      (formFields, fieldName: keyof Form) => {
        const formField = formFieldsRef.current[fieldName];

        const { value } = formField;

        const cleanValue = sanitizeHoneyFormFieldValue(formField.config.type, value);

        const errors = validateHoneyFormField(cleanValue, formField.config, formFieldsRef.current);
        if (errors.length) {
          hasError = true;
        }

        formFields[fieldName] = { ...formField, cleanValue, errors };

        return formFields;
      },
      {} as UseHoneyFormFields<Form>
    );

    formFieldsRef.current = nextFormFields;
    setFormFields(nextFormFields);

    return !hasError;
  };

  const submit: UseHoneyFormSubmit<Form, Response> = useCallback(async submitHandler => {
    if (!validate()) {
      // TODO: maybe reject should be provided? Left a comment after decision
      return Promise.resolve();
    }
    const submitData = getSubmitHoneyFormData(formFieldsRef.current);

    setIsSubmitting(true);
    try {
      await (submitHandler || onSubmit)?.(submitData);

      isDirtyRef.current = false;
    } finally {
      setIsSubmitting(false);
    }

    return Promise.resolve();
  }, []);

  const reset = useCallback<UseHoneyFormReset>(() => {
    setFormFields(initialFormFieldsGetter);
  }, []);

  const errors = useMemo<UseHoneyFormErrors<Form>>(
    () => getHoneyFormErrors(formFields),
    [formFields]
  );

  return {
    formFields,
    areDefaultsFetching,
    areDefaultsFetchingErred,
    isDirty: isDirtyRef.current,
    isSubmitting,
    errors,
    // functions
    setFormValues,
    addFormField,
    removeFormField,
    addError,
    resetErrors,
    submit,
    reset,
  };
};

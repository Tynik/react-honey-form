import { useCallback, useMemo, useRef, useState } from 'react';

import type {
  UseHoneyBaseFormFields,
  UseHoneyFormAddFormField,
  UseHoneyFormErrors,
  UseHoneyFormFieldConfig,
  UseHoneyFormFields,
  UseHoneyFormFieldSetValue,
  UseHoneyFormFieldType,
  UseHoneyFormOptions,
  UseHoneyFormFieldsConfigs,
  UseHoneyFormRemoveFormField,
  UseHoneyFormSubmit,
  UseHoneyFormAddError,
  UseHoneyFormReset,
  UseHoneyFormResetErrors,
  UseHoneyFormFieldValueConvertor,
} from './use-honey-form.types';

import {
  clearDependentFields,
  createHoneyFormField,
  validateHoneyFormField,
} from './use-honey-form.field';

const DEFAULT_HONEY_VALUE_CONVERTORS_MAP: Partial<
  Record<UseHoneyFormFieldType, UseHoneyFormFieldValueConvertor>
> = {
  number: value => (value ? Number(value) : undefined),
};

const getInitialHoneyFormFieldsGetter =
  <Form extends UseHoneyBaseFormFields>(
    fieldsConfigs: UseHoneyFormFieldsConfigs<Form>,
    {
      setValue,
    }: {
      setValue: UseHoneyFormFieldSetValue<Form>;
    }
  ) =>
  () =>
    Object.keys(fieldsConfigs).reduce((initialFormFields, fieldName: keyof Form) => {
      const fieldConfig = fieldsConfigs[fieldName];

      initialFormFields[fieldName] = createHoneyFormField<Form>(fieldName, fieldConfig, {
        setValue,
      });

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
  Value extends Form[FieldName]
>(
  fieldName: FieldName,
  value: Value,
  {
    formFields,
    validate,
  }: {
    formFields: UseHoneyFormFields<Form>;
    validate: boolean;
  }
): UseHoneyFormFields<Form> => {
  const nextFormFields = { ...formFields };

  let filteredValue = value;

  const formField = formFields[fieldName];

  const fieldConfig = formField.config as UseHoneyFormFieldConfig<Form, Value>;

  if (fieldConfig.filter) {
    filteredValue = fieldConfig.filter(value);

    if (filteredValue === formField.props.value) {
      // Do not re-render, nothing change. Return previous state
      return formFields;
    }
  }

  clearDependentFields(nextFormFields, fieldName);

  const valueConvertor = fieldConfig.type
    ? (DEFAULT_HONEY_VALUE_CONVERTORS_MAP[
        fieldConfig.type
      ] as UseHoneyFormFieldValueConvertor<Value>)
    : null;

  const cleanValue = valueConvertor ? valueConvertor(filteredValue as never) : filteredValue;

  const errors = validate
    ? validateHoneyFormField<Form, FieldName, Value>(cleanValue, fieldConfig, formFields)
    : [];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const formattedValue = fieldConfig.format?.(value) ?? filteredValue;

  nextFormFields[fieldName] = {
    ...formField,
    cleanValue,
    value: formattedValue as never,
    props: {
      ...formField.props,
      value: formattedValue as never,
    },
    errors,
  };

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
 * @param fieldsConfig
 * @param onSubmit
 * @param onChange: When any field value is changed.
 *  That callback function is called on next iteration after any change
 * @param onChangeDebounce number: Debounce time for onChange() callback
 */
export const useHoneyForm = <Form extends UseHoneyBaseFormFields, Response = void>({
  fields: fieldsConfig,
  schema,
  onSubmit,
  onChange,
  onChangeDebounce,
}: UseHoneyFormOptions<Form, Response>): {
  formFields: UseHoneyFormFields<Form>;
  isDirty: boolean;
  isSubmitting: boolean;
  errors: UseHoneyFormErrors<Form>;
  // functions
  addFormField: UseHoneyFormAddFormField<Form>;
  removeFormField: UseHoneyFormRemoveFormField<Form>;
  addError: UseHoneyFormAddError<Form>;
  resetErrors: UseHoneyFormResetErrors;
  submit: UseHoneyFormSubmit<Form, Response>;
  reset: UseHoneyFormReset;
} => {
  if (!fieldsConfig && !schema) {
    throw new Error('[use-honey-form] fields or schema should be provided as option');
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirtyRef = useRef<boolean>(false);

  const formFieldsRef = useRef<UseHoneyFormFields<Form> | null>(null);
  const onChangeTimeoutRef = useRef<number | null>(null);

  const setFieldValue = <FieldName extends keyof Form, Value extends Form[FieldName]>(
    fieldName: FieldName,
    value: Value,
    validate: boolean
  ) => {
    isDirtyRef.current = true;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      if (onChangeTimeoutRef.current) {
        clearTimeout(onChangeTimeoutRef.current);
      }

      const nextFormFields = getNextHoneyFormFieldsState<Form, FieldName, Value>(fieldName, value, {
        formFields,
        validate,
      });

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

  const initialFormFieldsGetter = getInitialHoneyFormFieldsGetter<Form>(fieldsConfig, {
    setValue: setFieldValue,
  });

  const [formFields, setFormFields] = useState<UseHoneyFormFields<Form>>(initialFormFieldsGetter);
  formFieldsRef.current = formFields;

  const addFormField = useCallback<UseHoneyFormAddFormField<Form>>(
    <FieldName extends keyof Form, Value extends Form[FieldName]>(
      fieldName: FieldName,
      config: UseHoneyFormFieldConfig<Form, Value>
    ) => {
      setFormFields(formFields => {
        if (formFields[fieldName]) {
          // eslint-disable-next-line no-console
          console.warn(`[use-honey-form] Form field "${fieldName.toString()}" is already present`);
        }
        return {
          ...formFields,
          [fieldName]: createHoneyFormField<Form, FieldName, Value>(fieldName, config, {
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

    const newFormFields = Object.keys(formFieldsRef.current).reduce(
      (formFields, fieldName: keyof Form) => {
        const formField = formFieldsRef.current[fieldName];

        const { cleanValue } = formField;

        const errors = validateHoneyFormField<Form>(
          cleanValue,
          formField.config,
          formFieldsRef.current
        );
        if (errors.length) {
          hasError = true;
        }
        formFields[fieldName] = { ...formField, errors };

        return formFields;
      },
      {} as UseHoneyFormFields<Form>
    );

    setFormFields(newFormFields);

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
    isDirty: isDirtyRef.current,
    isSubmitting,
    errors,
    // functions
    addFormField,
    removeFormField,
    addError,
    resetErrors,
    submit,
    reset,
  };
};

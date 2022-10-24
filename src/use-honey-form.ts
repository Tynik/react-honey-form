import { createRef, useCallback, useMemo, useRef, useState } from 'react';

import type {
  UseHoneyBaseFormFields,
  UseHoneyFormAddFormField,
  UseHoneyFormErrors,
  UseHoneyFormField,
  UseHoneyFormFieldConfig,
  UseHoneyFormFieldError,
  UseHoneyFormFields,
  UseHoneyFormFieldSetValue,
  UseHoneyFormFieldType,
  UseHoneyFormFieldValidationResult,
  UseHoneyFormFieldValidator,
  UseHoneyFormOptions,
  UseHoneyFormFieldsConfigs,
  UseHoneyFormRemoveFormField,
  UseHoneyFormSubmit,
  UseHoneyFormAddError,
  UseHoneyFormReset,
  UseHoneyFormResetErrors,
  UseHoneyFormFieldValueConvertor,
  UseHoneyFormNestedField,
} from './use-honey-form.types';

import {
  maxLengthInternalHoneyFieldValidator,
  maxValueInternalHoneyFieldValidator,
  minLengthInternalHoneyFieldValidator,
  minMaxLengthInternalHoneyFieldValidator,
  minMaxValueInternalHoneyFieldValidator,
  minValueInternalHoneyFieldValidator,
  requiredInternalHoneyFieldValidator,
} from './use-honey-form.validators';

const createHoneyFormField = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form = keyof Form,
  Value extends Form[FieldName] = Form[FieldName]
>(
  fieldName: FieldName,
  { mode = 'onChange', ...config }: UseHoneyFormFieldConfig<Form, Value>,
  {
    setValue,
  }: {
    setValue: UseHoneyFormFieldSetValue<Form>;
  }
): UseHoneyFormField<Form, Value> | UseHoneyFormNestedField<Form, Value> => {
  const ref = createRef<HTMLElement>();

  if (Array.isArray(config.value)) {
    return {
      config,
      length: config.value.length,
      add: value => {},
      map: callback => [],
      __nested__: true,
    };
  }

  return {
    config,
    cleanValue: config.value,
    value: config.value,
    errors: [],
    props: {
      ref,
      value: config.value,
      // TODO: when element is touched
      onFocus: e => {},
      //
      ...(mode === 'onChange' && {
        onChange: e => {
          setValue(fieldName, e.target.value as never, true);
        },
      }),
      ...(mode === 'onBlur' && {
        onBlur: e => {
          setValue(fieldName, e.target.value as never, true);
        },
      }),
    },
    setValue: value => setValue(fieldName, value, true),
    focus: () => {
      ref.current.focus();
    },
  };
};

const getInitialHoneyFormFields =
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

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      initialFormFields[fieldName] = createHoneyFormField<Form>(fieldName, fieldConfig, {
        setValue,
      });
      //
      return initialFormFields;
    }, {} as UseHoneyFormFields<Form>);

const getSubmitHoneyFormData = <Form extends UseHoneyBaseFormFields>(
  formFields: UseHoneyFormFields<Form>
) =>
  Object.keys(formFields).reduce((formData, fieldName: keyof Form) => {
    const formField = formFields[fieldName];

    if ('__nested__' in formField) {
      return formData;
    }
    formData[fieldName] = formField.cleanValue;

    return formData;
  }, {} as Form);

const defaultHoneyValidatorsMap: Record<
  UseHoneyFormFieldType,
  UseHoneyFormFieldValidator<never, never>
> = {
  number: (value, { decimal = false, negative = true, maxFraction = 2 }) => {
    return !value ||
      new RegExp(
        `^${negative ? '-?' : ''}\\d+${decimal ? `(\\.\\d{1,${maxFraction}})?` : ''}$`
      ).test((value as string).toString())
      ? true
      : {
          errors: [
            {
              type: 'invalid',
              message: `Only ${negative ? '' : 'positive '}${
                decimal ? `decimals with max fraction ${maxFraction}` : 'numerics'
              } are allowed`,
            },
          ],
        };
  },
};

const defaultHoneyValueConvertorsMap: Partial<
  Record<UseHoneyFormFieldType, UseHoneyFormFieldValueConvertor>
> = {
  number: value => Number(value),
};

const validateHoneyFormField = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form = keyof Form,
  Value extends Form[FieldName] = Form[FieldName]
>(
  value: Value,
  fieldConfig: UseHoneyFormFieldConfig<Form, Value>
) => {
  let validationResult: UseHoneyFormFieldValidationResult | null = null;

  const errors: UseHoneyFormFieldError[] = [];

  [
    // all
    requiredInternalHoneyFieldValidator,
    // number
    minValueInternalHoneyFieldValidator,
    maxValueInternalHoneyFieldValidator,
    minMaxValueInternalHoneyFieldValidator,
    // string
    minLengthInternalHoneyFieldValidator,
    maxLengthInternalHoneyFieldValidator,
    minMaxLengthInternalHoneyFieldValidator,
  ].forEach(fn => fn<Form, Value>(value, fieldConfig, errors));

  // custom validator
  if (fieldConfig.validator) {
    validationResult = fieldConfig.validator(value, fieldConfig);
    //
  } else if (fieldConfig.type) {
    validationResult = defaultHoneyValidatorsMap[fieldConfig.type](
      value as never,
      fieldConfig as never
    );
  }

  if (validationResult && typeof validationResult === 'object') {
    errors.push(...validationResult.errors);
    //
  } else if (validationResult === false) {
    errors.push({
      type: 'invalid',
      message: 'Invalid value',
    });
  }

  return errors;
};

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
) => {
  const newFormFields = { ...formFields };

  let filteredValue = value;

  const formField = formFields[fieldName];

  if ('__nested__' in formField) {
    return newFormFields;
  }

  const fieldConfig = formField.config as UseHoneyFormFieldConfig<Form, Value>;

  if (fieldConfig.filter) {
    filteredValue = fieldConfig.filter(value);

    if (filteredValue === formField.props.value) {
      // Do not re-render, nothing change. Return previous state
      return formFields;
    }
  }

  const errors = validate
    ? validateHoneyFormField<Form, FieldName, Value>(filteredValue, fieldConfig)
    : [];

  // clearing dependent fields
  Object.keys(newFormFields).forEach((otherFieldName: keyof Form) => {
    const newFormField = newFormFields[otherFieldName];

    if ('__nested__' in newFormField) {
      return;
    }

    if (fieldName === newFormField.config.dependsOn) {
      newFormFields[otherFieldName] = {
        ...newFormFields[otherFieldName],
        value: undefined,
      };
    }
  });

  const valueConvertor = fieldConfig.type ? defaultHoneyValueConvertorsMap[fieldConfig.type] : null;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const formattedValue = fieldConfig.format?.(value) ?? filteredValue;

  newFormFields[fieldName] = {
    ...formField,
    cleanValue: valueConvertor?.(value as never) ?? value,
    value: formattedValue as never,
    props: { ...formField.props, value: formattedValue as never },
    errors,
  };

  return newFormFields;
};

/**
 *
 * @param fieldsConfig
 * @param onSubmit
 * @param onChange: When any field value is changed.
 *  That callback function is called on next iteration after any change
 */
export const useHoneyForm = <Form extends UseHoneyBaseFormFields, Response = never>({
  fields: fieldsConfig,
  onSubmit,
  onChange,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirtyRef = useRef<boolean>(false);

  const setFieldValue = <FieldName extends keyof Form, Value extends Form[FieldName]>(
    fieldName: FieldName,
    value: Value,
    validate: boolean
  ) => {
    isDirtyRef.current = true;

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    setFormFields(formFields => {
      const nextFormFields = getNextHoneyFormFieldsState<Form, FieldName, Value>(fieldName, value, {
        formFields,
        validate,
      });

      // call onChange() on next iteration to do not affect new state return
      if (onChange) {
        setTimeout(() => {
          onChange(getSubmitHoneyFormData<Form>(nextFormFields));
        });
      }
      return nextFormFields;
    });
  };

  const initialFormFields = getInitialHoneyFormFields<Form>(fieldsConfig, {
    setValue: setFieldValue,
  });

  const [formFields, setFormFields] = useState<UseHoneyFormFields<Form>>(initialFormFields);

  const formFieldsRef = useRef(formFields);
  formFieldsRef.current = formFields;

  const addFormField = useCallback<UseHoneyFormAddFormField<Form>>(
    <FieldName extends keyof Form, Value extends Form[FieldName]>(
      fieldName: FieldName,
      config: UseHoneyFormFieldConfig<Form, Value>
    ) => {
      setFormFields(formFields => {
        if (formFields[fieldName]) {
          // eslint-disable-next-line no-console
          console.warn(`[use-form] Form field "${fieldName.toString()}" is already present`);
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

      if (typeof formField === 'object' && '__nested__' in formField) {
        return formFields;
      }

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

        if ('__nested__' in formField) {
          return formFields;
        }

        const { value } = formField;

        const errors = validateHoneyFormField<Form>(value, formField.config);
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
      return Promise.resolve();
    }
    const submitData = getSubmitHoneyFormData<Form>(formFieldsRef.current);

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
    setFormFields(initialFormFields);
  }, []);

  const errors = useMemo<UseHoneyFormErrors<Form>>(() => {
    return Object.keys(formFields).reduce((result, fieldName: keyof Form) => {
      const formField = formFields[fieldName];

      if ('__nested__' in formField) {
        return result;
      }
      if (formField.errors.length) {
        result[fieldName] = formField.errors;
      }
      return result;
    }, {} as UseHoneyFormErrors<Form>);
  }, [formFields]);

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

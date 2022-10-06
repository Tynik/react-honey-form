import { createRef, useCallback, useRef, useState } from 'react';

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
  config: UseHoneyFormFieldConfig<Form, Value>,
  {
    setValue,
  }: {
    setValue: UseHoneyFormFieldSetValue<Form>;
  }
): UseHoneyFormField<Form, Value> => {
  const ref = createRef<HTMLElement>();

  return {
    config,
    cleanValue: config.value as never,
    value: config.value as never,
    errors: [],
    props: {
      ref,
      value: config.value as never,
      onChange: e => {
        setValue(fieldName, e.target.value as never, true);
      },
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
      initialFormFields[fieldName] = createHoneyFormField<Form>(
        fieldName,
        fieldsConfigs[fieldName],
        {
          setValue,
        }
      );
      //
      return initialFormFields;
    }, {} as UseHoneyFormFields<Form>);

const getSubmitHoneyFormData = <Form extends UseHoneyBaseFormFields>(
  formFields: UseHoneyFormFields<Form>
) =>
  Object.keys(formFields).reduce((formData, fieldName: keyof Form) => {
    formData[fieldName] = formFields[fieldName].value as never;
    return formData;
  }, {} as Form);

const defaultHoneyValidatorsMap: Record<
  UseHoneyFormFieldType,
  UseHoneyFormFieldValidator<any, any>
> = {
  string: () => {
    return true;
  },
  number: (value, { decimal = false, negative = true, maxFraction = 2 }) => {
    return !value ||
      new RegExp(
        `^${negative ? '-?' : ''}\\d+${decimal ? `(\\.\\d{1,${maxFraction}})?` : ''}$`
      ).test((value as string).toString())
      ? true
      : {
          errors: [
            {
              type: 'invalidValue',
              message: `Only ${negative ? '' : 'positive '}${
                decimal ? `decimals with max fraction ${maxFraction}` : 'numerics'
              } are allowed`,
            },
          ],
        };
  },
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
    validationResult = defaultHoneyValidatorsMap[fieldConfig.type](value, fieldConfig);
  }

  if (validationResult && typeof validationResult === 'object') {
    errors.push(...validationResult.errors);
    //
  } else if (validationResult === false) {
    errors.push({
      type: 'invalidValue',
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

  const fieldConfig = formFields[fieldName].config as UseHoneyFormFieldConfig<Form, Value>;

  if (fieldConfig.filter) {
    filteredValue = fieldConfig.filter(value);

    if (filteredValue === value) {
      // Do not re-render, nothing change. Return previous state
      return formFields;
    }
  }

  const errors = validate
    ? validateHoneyFormField<Form, FieldName, Value>(filteredValue, fieldConfig)
    : [];

  // clearing dependent fields
  Object.keys(newFormFields).forEach((otherFieldName: keyof Form) => {
    if (fieldName === newFormFields[otherFieldName].config.dependsOn) {
      newFormFields[otherFieldName] = {
        ...newFormFields[otherFieldName],
        value: undefined,
      };
    }
  });

  const formattedValue = fieldConfig.format?.(value) ?? filteredValue;

  newFormFields[fieldName] = {
    ...formFields[fieldName],
    cleanValue: value,
    value: formattedValue,
    props: { ...formFields[fieldName].props, value: formattedValue },
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
export const useHoneyForm = <Form extends UseHoneyBaseFormFields>({
  fields: fieldsConfig,
  onSubmit,
  onChange,
}: UseHoneyFormOptions<Form>): {
  formFields: UseHoneyFormFields<Form>;
  addFormField: UseHoneyFormAddFormField<Form>;
  removeFormField: UseHoneyFormRemoveFormField<Form>;
  isDirty: boolean;
  isSubmitting: boolean;
  submit: UseHoneyFormSubmit;
  errors: UseHoneyFormErrors<Form>;
  reset: () => void;
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

  const addFormField = useCallback<UseHoneyFormAddFormField<Form>>(
    <FieldName extends keyof Form, Value extends Form[FieldName]>(
      fieldName: FieldName,
      config: UseHoneyFormFieldConfig<Form, Value>
    ) => {
      setFormFields(formFields => {
        if (formFields[fieldName]) {
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

  const validate = () => {
    let hasError = false;

    const newFormFields = Object.keys(formFields).reduce((result, fieldName: keyof Form) => {
      const { value } = formFields[fieldName];

      const errors = validateHoneyFormField<Form>(value as never, formFields[fieldName].config);
      //
      if (errors.length) {
        hasError = true;
      }
      //
      result[fieldName] = {
        ...formFields[fieldName],
        errors,
      };
      return result;
    }, {} as UseHoneyFormFields<Form>);
    //
    setFormFields(newFormFields);
    //
    return !hasError;
  };

  const submit: UseHoneyFormSubmit = async () => {
    if (!validate()) {
      return Promise.resolve();
    }
    const submitData = getSubmitHoneyFormData<Form>(formFields);

    setIsSubmitting(true);
    try {
      await onSubmit?.(submitData);

      isDirtyRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
    return Promise.resolve();
  };

  const reset = useCallback(() => {
    setFormFields(initialFormFields);
  }, []);

  return {
    formFields,
    isDirty: isDirtyRef.current,
    isSubmitting,
    errors: null,
    // functions
    addFormField,
    removeFormField,
    submit,
    reset,
  };
};

import { createRef } from 'react';

import type {
  CreateHoneyFormField,
  UseHoneyBaseFormFields,
  UseHoneyFormFieldConfig,
  UseHoneyFormFieldError,
  UseHoneyFormFields,
  UseHoneyFormFieldValidationResult,
  UseHoneyFormFieldType,
  UseHoneyFormFieldValueConvertor,
} from './use-honey-form.types';
import {
  DEFAULT_HONEY_VALIDATORS_MAP,
  maxLengthInternalHoneyFieldValidator,
  maxValueInternalHoneyFieldValidator,
  minLengthInternalHoneyFieldValidator,
  minMaxLengthInternalHoneyFieldValidator,
  minMaxValueInternalHoneyFieldValidator,
  minValueInternalHoneyFieldValidator,
  requiredInternalHoneyFieldValidator,
} from './use-honey-form.validators';

const DEFAULT_HONEY_VALUE_CONVERTORS_MAP: Partial<
  Record<UseHoneyFormFieldType, UseHoneyFormFieldValueConvertor>
> = {
  number: value => (value ? Number(value) : undefined),
};

export const createHoneyFormField: CreateHoneyFormField = (
  fieldName,
  fieldDefaultValue,
  { mode = 'onChange', ...config },
  { setValue }
) => {
  const ref = createRef<HTMLElement>();

  const defaultValue = fieldDefaultValue ?? config.value;

  return {
    config,
    cleanValue: defaultValue,
    value: defaultValue,
    errors: [],
    props: {
      ref,
      value: defaultValue,
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

export const validateHoneyFormField = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form = keyof Form,
  Value extends Form[FieldName] = Form[FieldName]
>(
  value: Value,
  fieldConfig: UseHoneyFormFieldConfig<Form, Value>,
  formFields: UseHoneyFormFields<Form>
) => {
  let validationResult: UseHoneyFormFieldValidationResult | null = null;

  const errors: UseHoneyFormFieldError[] = [];

  if (fieldConfig.type) {
    validationResult = DEFAULT_HONEY_VALIDATORS_MAP[fieldConfig.type](
      value,
      fieldConfig,
      formFields
    );
  }

  // do not run additional validators if default field type validator is failed
  if (validationResult === null || validationResult === true) {
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
    ].forEach(fn => fn(value, fieldConfig, errors));

    // execute custom validator. Can be run only when default validator return true or not run at all
    if (fieldConfig.validator) {
      validationResult = fieldConfig.validator(value, fieldConfig, formFields);
    }
  }

  if (validationResult) {
    if (typeof validationResult === 'string') {
      errors.push({
        type: 'invalid',
        message: validationResult,
      });
      //
    } else if (typeof validationResult === 'object') {
      errors.push(...validationResult);
    }
    //
  } else if (validationResult === false) {
    errors.push({
      type: 'invalid',
      message: 'Invalid value',
    });
  }

  return errors;
};

export const clearHoneyFormDependentFields = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form
>(
  formFields: UseHoneyFormFields<Form>,
  fieldName: FieldName,
  initiatorFieldName: FieldName = null
) => {
  initiatorFieldName = initiatorFieldName || fieldName;

  Object.keys(formFields).forEach((otherFieldName: keyof Form) => {
    if (otherFieldName === fieldName) {
      return;
    }

    const { dependsOn } = formFields[otherFieldName].config;

    const isDependent = Array.isArray(dependsOn)
      ? dependsOn.includes(fieldName)
      : fieldName === dependsOn;

    if (isDependent) {
      formFields[otherFieldName] = {
        ...formFields[otherFieldName],
        value: undefined,
        cleanValue: undefined,
        props: {
          ...formFields[otherFieldName].props,
          value: undefined,
        },
      };

      if (otherFieldName !== initiatorFieldName) {
        clearHoneyFormDependentFields(formFields, otherFieldName, fieldName);
      }
    }
  });
};

export const cleanHoneyFormFieldValue = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form,
  Value extends Form[FieldName]
>(
  fieldType: UseHoneyFormFieldType | undefined,
  value: Value
) => {
  const valueConvertor = fieldType
    ? (DEFAULT_HONEY_VALUE_CONVERTORS_MAP[fieldType] as UseHoneyFormFieldValueConvertor<Value>)
    : null;

  return valueConvertor ? valueConvertor(value) : value;
};

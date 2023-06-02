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
  name,
  { mode = 'onChange', ...config },
  { setValue }
) => {
  const ref = createRef<HTMLElement>();

  const value = config.value === undefined ? config.defaultValue : config.value;

  return {
    config,
    value,
    cleanValue: value,
    defaultValue: config.defaultValue,
    errors: [],
    isTouched: false,
    props: {
      ref,
      value,
      // TODO: when element is touched
      onFocus: e => {},
      //
      ...(mode === 'onChange' && {
        onChange: e => {
          setValue(name, e.target.value as never, true);
        },
      }),
      ...(mode === 'onBlur' && {
        onBlur: e => {
          setValue(name, e.target.value as never, true);
        },
      }),
    },
    setValue: value => setValue(name, value, true),
    focus: () => {
      ref.current.focus();
    },
  };
};

export const validateHoneyFormField = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>(
  value: FieldValue,
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
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
      const otherField = formFields[otherFieldName];

      formFields[otherFieldName] = {
        ...otherField,
        value: otherField.defaultValue,
        cleanValue: otherField.defaultValue,
        errors: [],
        props: {
          ...otherField.props,
          value: otherField.defaultValue,
        },
      };

      if (otherFieldName !== initiatorFieldName) {
        clearHoneyFormDependentFields(formFields, otherFieldName, fieldName);
      }
    }
  });
};

/**
 * Sanitizes the value of a Honey form field based on its type.
 * If a convertor for the provided field type exists in the default map, it uses it to convert the value.
 * If a convertor does not exist, it returns the original value.
 *
 * @param {UseHoneyFormFieldType | undefined} fieldType The type of the form field.
 * @param {Value} value The value of the form field that needs to be cleaned.
 * @returns {Value} The cleaned or original value depending on whether a convertor was found.
 */
export const sanitizeHoneyFormFieldValue = <
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

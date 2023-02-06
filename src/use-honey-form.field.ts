import { createRef } from 'react';

import type {
  CreateHoneyFormField,
  UseHoneyBaseFormFields,
  UseHoneyFormFieldConfig,
  UseHoneyFormFieldError,
  UseHoneyFormFields,
  UseHoneyFormFieldValidationResult,
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

export const createHoneyFormField: CreateHoneyFormField = (
  fieldName,
  { mode = 'onChange', ...config },
  { setValue }
) => {
  const ref = createRef<HTMLElement>();

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

  if (fieldConfig.type) {
    validationResult = DEFAULT_HONEY_VALIDATORS_MAP[fieldConfig.type](
      value,
      fieldConfig,
      formFields
    );
  }

  // execute custom validator. Can be run only when default validator return true or not run at all
  if ((validationResult === null || validationResult === true) && fieldConfig.validator) {
    validationResult = fieldConfig.validator(value, fieldConfig, formFields);
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

export const clearDependentFields = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form
>(
  formFields: UseHoneyFormFields<Form>,
  fieldName: FieldName
) => {
  Object.keys(formFields).forEach((otherFieldName: keyof Form) => {
    const newFormField = formFields[otherFieldName];

    if (fieldName === newFormField.config.dependsOn) {
      formFields[otherFieldName] = {
        ...formFields[otherFieldName],
        value: undefined,
        cleanValue: undefined,
      };

      clearDependentFields(formFields, otherFieldName);
    }
  });
};

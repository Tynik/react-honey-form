import type { UseHoneyFormFieldInternalValidator } from './use-honey-form.types';

export const requiredInternalHoneyFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if ((value === undefined || value === '') && fieldConfig.required) {
    errors.push({
      type: 'required',
      message: 'The value is required',
    });
  }
};

export const minValueInternalHoneyFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.max === undefined && fieldConfig.min !== undefined) {
    if (typeof value === 'number' && value < fieldConfig.min) {
      errors.push({
        type: 'invalidValue',
        message: `The value should be greater or equal to ${fieldConfig.min}`,
      });
    }
  }
};

export const maxValueInternalHoneyFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.min === undefined && fieldConfig.max !== undefined) {
    if (typeof value === 'number' && value > fieldConfig.max) {
      errors.push({
        type: 'invalidValue',
        message: `The value should be less or equal to ${fieldConfig.max}`,
      });
    }
  }
};

export const minMaxValueInternalHoneyFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.min !== undefined && fieldConfig.max !== undefined) {
    if (typeof value === 'number' && (value < fieldConfig.min || value > fieldConfig.max)) {
      errors.push({
        type: 'invalidValue',
        message: `The value should be between ${fieldConfig.min} and ${fieldConfig.max}`,
      });
    }
  }
};

export const minLengthInternalHoneyFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.max === undefined && fieldConfig.min !== undefined) {
    if (typeof value === 'string' && value.length < fieldConfig.min) {
      errors.push({
        type: 'invalidValue',
        message: `The length should be greater or equal to ${fieldConfig.min}`,
      });
    }
  }
};

export const maxLengthInternalHoneyFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.min === undefined && fieldConfig.max !== undefined) {
    if (typeof value === 'string' && value.length > fieldConfig.max) {
      errors.push({
        type: 'invalidValue',
        message: `The length should be less or equal to ${fieldConfig.max}`,
      });
    }
  }
};

export const minMaxLengthInternalHoneyFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.min !== undefined && fieldConfig.max !== undefined) {
    if (
      typeof value === 'string' &&
      (value.length < fieldConfig.min || value.length > fieldConfig.max)
    ) {
      errors.push({
        type: 'invalidValue',
        message: `The length should be between ${fieldConfig.min} and ${fieldConfig.max}`,
      });
    }
  }
};

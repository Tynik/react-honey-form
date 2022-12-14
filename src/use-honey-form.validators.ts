import type { UseHoneyFormFieldInternalValidator } from './use-honey-form.types';

export const requiredInternalHoneyFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.required && (value === undefined || value === null || value === '')) {
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
    if (Number.isNaN(value) || (typeof value === 'number' && value < fieldConfig.min)) {
      errors.push({
        type: 'invalid',
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
    if (Number.isNaN(value) || (typeof value === 'number' && value > fieldConfig.max)) {
      errors.push({
        type: 'invalid',
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
    if (
      Number.isNaN(value) ||
      (typeof value === 'number' && (value < fieldConfig.min || value > fieldConfig.max))
    ) {
      errors.push({
        type: 'invalid',
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
        type: 'invalid',
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
        type: 'invalid',
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
        type: 'invalid',
        message: `The length should be between ${fieldConfig.min} and ${fieldConfig.max}`,
      });
    }
  }
};

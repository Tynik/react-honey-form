import type {
  UseHoneyFormFieldInternalValidator,
  UseHoneyFormFieldType,
  UseHoneyFormFieldValidator,
} from './use-honey-form.types';

export const DEFAULT_VALIDATORS_MAP: Record<
  UseHoneyFormFieldType,
  UseHoneyFormFieldValidator<any, any, any>
> = {
  number: (value, { decimal = false, negative = true, maxFraction = 2 }) => {
    if (value === '' || value === undefined) {
      return true;
    }

    const regValidationResult = new RegExp(
      `^${negative ? '-?' : ''}\\d+${decimal ? `(\\.\\d{1,${maxFraction}})?` : ''}$`
    ).test((value as string).toString());

    return (
      regValidationResult || [
        {
          type: 'invalid',
          message: `Only ${negative ? '' : 'positive '}${
            decimal ? `decimals with max fraction ${maxFraction}` : 'numerics'
          } are allowed`,
        },
      ]
    );
  },
};

export const requiredInternalFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (
    fieldConfig.required &&
    (value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && !value.length))
  ) {
    errors.push({
      type: 'required',
      message: fieldConfig.errorMessages?.required ?? 'The value is required',
    });
  }
};

export const minValueInternalFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.max === undefined && fieldConfig.min !== undefined) {
    if (
      value === undefined ||
      Number.isNaN(value) ||
      (typeof value === 'number' && value < fieldConfig.min)
    ) {
      errors.push({
        type: 'min',
        message:
          fieldConfig.errorMessages?.min ??
          `The value must be greater than or equal to ${fieldConfig.min}`,
      });
    }
  }
};

export const maxValueInternalFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.min === undefined && fieldConfig.max !== undefined) {
    if (
      value === undefined ||
      Number.isNaN(value) ||
      (typeof value === 'number' && value > fieldConfig.max)
    ) {
      errors.push({
        type: 'max',
        message:
          fieldConfig.errorMessages?.max ??
          `The value must be less than or equal to ${fieldConfig.max}`,
      });
    }
  }
};

export const minMaxValueInternalFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.min !== undefined && fieldConfig.max !== undefined) {
    if (
      value === undefined ||
      Number.isNaN(value) ||
      (typeof value === 'number' && (value < fieldConfig.min || value > fieldConfig.max))
    ) {
      errors.push({
        type: 'minMax',
        message:
          fieldConfig.errorMessages?.minMax ??
          `The value must be between ${fieldConfig.min} and ${fieldConfig.max}`,
      });
    }
  }
};

export const minLengthInternalFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.max === undefined && fieldConfig.min !== undefined) {
    if (value === undefined || (typeof value === 'string' && value.length < fieldConfig.min)) {
      errors.push({
        type: 'min',
        message:
          fieldConfig.errorMessages?.min ??
          `The length must be greater than or equal to ${fieldConfig.min} characters`,
      });
    }
  }
};

export const maxLengthInternalFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.min === undefined && fieldConfig.max !== undefined) {
    if (value === undefined || (typeof value === 'string' && value.length > fieldConfig.max)) {
      errors.push({
        type: 'max',
        message:
          fieldConfig.errorMessages?.max ??
          `The length must be less than or equal to ${fieldConfig.max} characters`,
      });
    }
  }
};

export const minMaxLengthInternalFieldValidator: UseHoneyFormFieldInternalValidator = (
  value,
  fieldConfig,
  errors
) => {
  if (fieldConfig.min !== undefined && fieldConfig.max !== undefined) {
    if (
      value === undefined ||
      (typeof value === 'string' &&
        (value.length < fieldConfig.min || value.length > fieldConfig.max))
    ) {
      if (fieldConfig.min === fieldConfig.max) {
        errors.push({
          type: 'minMax',
          message:
            fieldConfig.errorMessages?.minMax ??
            `The length must be exactly ${fieldConfig.min} characters`,
        });
        return;
      }

      errors.push({
        type: 'minMax',
        message:
          fieldConfig.errorMessages?.minMax ??
          `The length must be between ${fieldConfig.min} and ${fieldConfig.max} characters`,
      });
    }
  }
};

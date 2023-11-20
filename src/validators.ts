import type {
  HoneyFormFieldInternalValidator,
  HoneyFormFieldType,
  HoneyFormFieldValidator,
} from './types';

import type { CustomDateRangeForm } from './form.types';

export const FIELD_TYPE_VALIDATORS_MAP: Record<
  HoneyFormFieldType,
  HoneyFormFieldValidator<any, any, any>
> = {
  string: () => true,
  numeric: (value: string | undefined, { fieldConfig: { errorMessages = {} } }) => {
    if (value === '' || value === undefined) {
      return true;
    }

    const isValidNumber = /^\d+$/.test(value);

    return (
      isValidNumber || [
        {
          type: 'invalid',
          message: errorMessages.invalid ?? 'Invalid format',
        },
      ]
    );
  },
  number: (
    value: string | undefined,
    { fieldConfig: { errorMessages = {}, decimal = false, negative = true, maxFraction = 2 } },
  ) => {
    if (value === '' || value === undefined) {
      return true;
    }

    const isValidNumber = new RegExp(
      `^${negative ? '-?' : ''}\\d+${decimal ? `(\\.\\d{1,${maxFraction}})?` : ''}$`,
    ).test(value.toString());

    return (
      isValidNumber || [
        {
          type: 'invalid',
          message:
            errorMessages.invalid ??
            `Only ${negative ? '' : 'positive '}${
              decimal ? `decimals with max fraction ${maxFraction}` : 'numerics'
            } are allowed`,
        },
      ]
    );
  },
  email: (value: string | undefined, { fieldConfig: { errorMessages = {} } }) => {
    if (value === '' || value === undefined) {
      return true;
    }

    const isValidEmail =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        value,
      );

    return (
      isValidEmail || [
        {
          type: 'invalid',
          message: errorMessages.invalid ?? 'Invalid email format',
        },
      ]
    );
  },
};

/**
 * Internal field validator for checking if a field is required.
 */
export const requiredInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (!fieldConfig.required) {
    return;
  }

  if (
    fieldValue === undefined ||
    fieldValue === null ||
    fieldValue === '' ||
    (Array.isArray(fieldValue) && !fieldValue.length)
  ) {
    fieldErrors.push({
      type: 'required',
      message: fieldConfig.errorMessages?.required ?? 'The value is required',
    });
  }
};

/**
 * Internal field validator for checking if a numeric field meets a minimum value requirement.
 */
export const minValueInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.min === undefined || fieldConfig.max !== undefined) {
    return;
  }

  if (
    fieldValue === undefined ||
    Number.isNaN(fieldValue) ||
    (typeof fieldValue === 'number' && fieldValue < fieldConfig.min)
  ) {
    fieldErrors.push({
      type: 'min',
      message:
        fieldConfig.errorMessages?.min ??
        `The value must be greater than or equal to ${fieldConfig.min}`,
    });
  }
};

/**
 * Internal field validator for checking if a numeric field meets a maximum value requirement.
 */
export const maxValueInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.max === undefined || fieldConfig.min !== undefined) {
    return;
  }

  if (
    fieldValue === undefined ||
    Number.isNaN(fieldValue) ||
    (typeof fieldValue === 'number' && fieldValue > fieldConfig.max)
  ) {
    fieldErrors.push({
      type: 'max',
      message:
        fieldConfig.errorMessages?.max ??
        `The value must be less than or equal to ${fieldConfig.max}`,
    });
  }
};

export const minMaxValueInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.min === undefined || fieldConfig.max === undefined) {
    return;
  }

  if (
    fieldValue === undefined ||
    Number.isNaN(fieldValue) ||
    (typeof fieldValue === 'number' &&
      (fieldValue < fieldConfig.min || fieldValue > fieldConfig.max))
  ) {
    fieldErrors.push({
      type: 'minMax',
      message:
        fieldConfig.errorMessages?.minMax ??
        `The value must be between ${fieldConfig.min} and ${fieldConfig.max}`,
    });
  }
};

/**
 * Internal field validator for checking if a string field meets minimum length requirements.
 */
export const minLengthInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.min === undefined || fieldConfig.max !== undefined) {
    return;
  }

  if (
    fieldValue === undefined ||
    (typeof fieldValue === 'string' && fieldValue.length < fieldConfig.min)
  ) {
    fieldErrors.push({
      type: 'min',
      message:
        fieldConfig.errorMessages?.min ??
        `The length must be greater than or equal to ${fieldConfig.min} characters`,
    });
  }
};

/**
 * Internal field validator for checking if a string field meets maximum length requirements.
 */
export const maxLengthInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.max === undefined || fieldConfig.min !== undefined) {
    return;
  }

  if (
    fieldValue === undefined ||
    (typeof fieldValue === 'string' && fieldValue.length > fieldConfig.max)
  ) {
    fieldErrors.push({
      type: 'max',
      message:
        fieldConfig.errorMessages?.max ??
        `The length must be less than or equal to ${fieldConfig.max} characters`,
    });
  }
};

/**
 * Internal field validator for checking if a string field meets minimum and maximum length requirements.
 */
export const minMaxLengthInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.min === undefined || fieldConfig.max === undefined) {
    return;
  }

  if (
    fieldValue === undefined ||
    (typeof fieldValue === 'string' &&
      (fieldValue.length < fieldConfig.min || fieldValue.length > fieldConfig.max))
  ) {
    if (fieldConfig.min === fieldConfig.max) {
      fieldErrors.push({
        type: 'minMax',
        message:
          fieldConfig.errorMessages?.minMax ??
          `The length must be exactly ${fieldConfig.min} characters`,
      });
      //
      return;
    }

    fieldErrors.push({
      type: 'minMax',
      message:
        fieldConfig.errorMessages?.minMax ??
        `The length must be between ${fieldConfig.min} and ${fieldConfig.max} characters`,
    });
  }
};

//
// Data Range Validators
//

type DatePropertyKey<Form> = string & keyof Form;

type CreateHoneyFormDateFromValidatorOptions<
  Form extends CustomDateRangeForm<DateFromKey, DateToKey>,
  DateFromKey extends DatePropertyKey<Form>,
  DateToKey extends DatePropertyKey<Form>,
> = {
  dateToKey: DateToKey;
  minDate?: Date;
  maxDate?: Date;
  errorMsg?: string;
  ignoreTime?: boolean;
  inclusiveRange?: boolean;
};

/**
 * Creates a validator function for ensuring a "Date From" field is valid in the context of a date range.
 *
 * @param {CreateHoneyFormDateFromValidatorOptions<Form, DateFromKey, DateToKey>} options - Options for creating the validator.
 * @returns {HoneyFormFieldValidator<Form, DateFromKey>} - The validator function.
 */
export const createHoneyFormDateFromValidator =
  <
    Form extends CustomDateRangeForm<DateFromKey, DateToKey>,
    DateFromKey extends DatePropertyKey<Form> = DatePropertyKey<Form>,
    DateToKey extends DatePropertyKey<Form> = DatePropertyKey<Form>,
  >({
    dateToKey,
    minDate,
    maxDate,
    errorMsg = '"Date From" should be equal or less than "Date To"',
    ignoreTime = true,
    inclusiveRange = true,
  }: CreateHoneyFormDateFromValidatorOptions<
    Form,
    DateFromKey,
    DateToKey
  >): HoneyFormFieldValidator<Form, DateFromKey> =>
  /**
   * Validator function for "Date From" field.
   *
   * @param dateFrom - The value of the "Date From" field.
   * @param params - Validation parameters.
   * @returns {boolean | string} - `true` if valid, error message if invalid.
   */
  (dateFrom, { formFields }): boolean | string => {
    // Schedule validation for the associated "Date To" field
    formFields[dateToKey].scheduleValidation();

    // If "Date From" is not set, consider it valid
    if (!dateFrom) {
      return true;
    }

    const dateTo = formFields[dateToKey].value;

    // If ignoring time, reset hours, minutes, seconds, and milliseconds
    if (ignoreTime) {
      minDate?.setHours(0, 0, 0, 0);
      maxDate?.setHours(0, 0, 0, 0);

      dateFrom.setHours(0, 0, 0, 0);
      dateTo?.setHours(0, 0, 0, 0);
    }

    if (
      (!minDate || dateFrom.getTime() >= minDate.getTime()) &&
      (!maxDate || dateFrom.getTime() <= maxDate.getTime()) &&
      (!dateTo ||
        (inclusiveRange
          ? dateFrom.getTime() <= dateTo.getTime()
          : dateFrom.getTime() < dateTo.getTime()))
    ) {
      return true;
    }

    return errorMsg;
  };

type CreateHoneyFormDateToValidatorOptions<
  Form extends CustomDateRangeForm<DateFromKey, DateToKey>,
  DateFromKey extends DatePropertyKey<Form>,
  DateToKey extends DatePropertyKey<Form>,
> = {
  dateFromKey: DateFromKey;
  minDate?: Date;
  maxDate?: Date;
  errorMsg?: string;
  ignoreTime?: boolean;
  inclusiveRange?: boolean;
};

/**
 * Creates a validator function for ensuring a "Date To" field is valid in the context of a date range.
 *
 * @param {CreateHoneyFormDateToValidatorOptions<Form, DateFromKey, DateToKey>} options - Options for creating the validator.
 * @returns {HoneyFormFieldValidator<Form, DateToKey>} - The validator function.
 */
export const createHoneyFormDateToValidator =
  <
    Form extends CustomDateRangeForm<DateFromKey, DateToKey>,
    DateFromKey extends DatePropertyKey<Form> = DatePropertyKey<Form>,
    DateToKey extends DatePropertyKey<Form> = DatePropertyKey<Form>,
  >({
    dateFromKey,
    minDate,
    maxDate,
    errorMsg = '"Date To" should be equal or greater than "Date From"',
    ignoreTime = true,
    inclusiveRange = true,
  }: CreateHoneyFormDateToValidatorOptions<Form, DateFromKey, DateToKey>): HoneyFormFieldValidator<
    Form,
    DateToKey
  > =>
  /**
   * Validator function for "Date To" field.
   *
   * @param dateTo - The value of the "Date To" field.
   * @param params - Validation parameters.
   * @returns {boolean | string} - `true` if valid, error message if invalid.
   */
  (dateTo, { formFields }): boolean | string => {
    // Schedule validation for the associated "Date From" field
    formFields[dateFromKey].scheduleValidation();

    // If "Date To" is not set, consider it valid
    if (!dateTo) {
      return true;
    }

    const dateFrom = formFields[dateFromKey].value;

    // If ignoring time, reset hours, minutes, seconds, and milliseconds
    if (ignoreTime) {
      minDate?.setHours(0, 0, 0, 0);
      maxDate?.setHours(0, 0, 0, 0);

      dateTo.setHours(0, 0, 0, 0);
      dateFrom?.setHours(0, 0, 0, 0);
    }

    if (
      (!minDate || dateTo.getTime() >= minDate.getTime()) &&
      (!maxDate || dateTo.getTime() <= maxDate.getTime()) &&
      (!dateFrom ||
        (inclusiveRange
          ? dateFrom.getTime() <= dateTo.getTime()
          : dateFrom.getTime() < dateTo.getTime()))
    ) {
      return true;
    }

    return errorMsg;
  };

export const INTERNAL_FIELD_VALIDATORS = [
  // all
  requiredInternalFieldValidator,
  // number
  minValueInternalFieldValidator,
  maxValueInternalFieldValidator,
  minMaxValueInternalFieldValidator,
  // string
  minLengthInternalFieldValidator,
  maxLengthInternalFieldValidator,
  minMaxLengthInternalFieldValidator,
];

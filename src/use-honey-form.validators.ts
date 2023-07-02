import type {
  UseHoneyFormFieldInternalValidator,
  UseHoneyFormFieldType,
  UseHoneyFormFieldValidator,
} from './use-honey-form.types';

import type { CustomDateRangeForm } from './use-honey-form.form-types';

export const FIELD_TYPE_VALIDATORS_MAP: Record<
  UseHoneyFormFieldType,
  UseHoneyFormFieldValidator<any, any>
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
    { fieldConfig: { errorMessages = {}, decimal = false, negative = true, maxFraction = 2 } }
  ) => {
    if (value === '' || value === undefined) {
      return true;
    }

    const isValidNumber = new RegExp(
      `^${negative ? '-?' : ''}\\d+${decimal ? `(\\.\\d{1,${maxFraction}})?` : ''}$`
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

    const isValidEmail = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(value);

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

//
// Data Range Validators
//

type DatePropertyKey<Form> = string & keyof Form;

type CreateHoneyFormDateFromValidatorOptions<
  Form extends CustomDateRangeForm<DateFromKey, DateToKey>,
  DateFromKey extends DatePropertyKey<Form>,
  DateToKey extends DatePropertyKey<Form>
> = {
  dateToKey: DateToKey;
  errorMsg?: string;
  ignoreTime?: boolean;
};

export const createHoneyFormDateFromValidator =
  <
    Form extends CustomDateRangeForm<DateFromKey, DateToKey>,
    DateFromKey extends DatePropertyKey<Form> = DatePropertyKey<Form>,
    DateToKey extends DatePropertyKey<Form> = DatePropertyKey<Form>
  >({
    dateToKey,
    errorMsg = '"Date From" should be equal or less than "Date To"',
    ignoreTime = true,
  }: CreateHoneyFormDateFromValidatorOptions<
    Form,
    DateFromKey,
    DateToKey
  >): UseHoneyFormFieldValidator<Form, DateFromKey> =>
  (dateFrom, { formFields }) => {
    formFields[dateToKey].scheduleValidation();

    const dateTo = formFields[dateToKey].value;

    if (!dateFrom || !dateTo) {
      return true;
    }

    if (ignoreTime) {
      dateFrom.setHours(0, 0, 0, 0);
      dateTo.setHours(0, 0, 0, 0);
    }

    if (dateFrom.getTime() > dateTo.getTime()) {
      return errorMsg;
    }

    return true;
  };

type CreateHoneyFormDateToValidatorOptions<
  Form extends CustomDateRangeForm<DateFromKey, DateToKey>,
  DateFromKey extends DatePropertyKey<Form>,
  DateToKey extends DatePropertyKey<Form>
> = {
  dateFromKey: DateFromKey;
  errorMsg?: string;
  ignoreTime?: boolean;
};

export const createHoneyFormDateToValidator =
  <
    Form extends CustomDateRangeForm<DateFromKey, DateToKey>,
    DateFromKey extends DatePropertyKey<Form> = DatePropertyKey<Form>,
    DateToKey extends DatePropertyKey<Form> = DatePropertyKey<Form>
  >({
    dateFromKey,
    errorMsg = '"Date To" should be equal or greater than "Date From"',
    ignoreTime = true,
  }: CreateHoneyFormDateToValidatorOptions<
    Form,
    DateFromKey,
    DateToKey
  >): UseHoneyFormFieldValidator<Form, DateToKey> =>
  (dateTo, { formFields }) => {
    formFields[dateFromKey].scheduleValidation();

    const dateFrom = formFields[dateFromKey].value;

    if (!dateTo || !dateFrom) {
      return true;
    }

    if (ignoreTime) {
      dateTo.setHours(0, 0, 0, 0);
      dateFrom.setHours(0, 0, 0, 0);
    }

    if (dateFrom.getTime() > dateTo.getTime()) {
      return errorMsg;
    }

    return true;
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

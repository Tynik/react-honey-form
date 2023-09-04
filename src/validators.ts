import type {
  HoneyFormFieldInternalValidator,
  HoneyFormFieldType,
  HoneyFormFieldValidator,
} from './types';

import type { CustomDateRangeForm } from './form.types';

export const FIELD_TYPE_VALIDATORS_MAP: Record<
  HoneyFormFieldType,
  HoneyFormFieldValidator<any, any>
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

export const requiredInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (
    fieldConfig.required &&
    (fieldValue === undefined ||
      fieldValue === null ||
      fieldValue === '' ||
      (Array.isArray(fieldValue) && !fieldValue.length))
  ) {
    fieldErrors.push({
      type: 'required',
      message: fieldConfig.errorMessages?.required ?? 'The value is required',
    });
  }
};

export const minValueInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.max === undefined && fieldConfig.min !== undefined) {
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
  }
};

export const maxValueInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.min === undefined && fieldConfig.max !== undefined) {
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
  }
};

export const minMaxValueInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.min !== undefined && fieldConfig.max !== undefined) {
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
  }
};

export const minLengthInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.max === undefined && fieldConfig.min !== undefined) {
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
  }
};

export const maxLengthInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.min === undefined && fieldConfig.max !== undefined) {
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
  }
};

export const minMaxLengthInternalFieldValidator: HoneyFormFieldInternalValidator = (
  fieldValue,
  fieldConfig,
  fieldErrors,
) => {
  if (fieldConfig.min !== undefined && fieldConfig.max !== undefined) {
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
        return;
      }

      fieldErrors.push({
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
  DateToKey extends DatePropertyKey<Form>,
> = {
  dateToKey: DateToKey;
  minDate?: Date;
  maxDate?: Date;
  errorMsg?: string;
  ignoreTime?: boolean;
  inclusiveRange?: boolean;
};

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
  (dateFrom, { formFields }) => {
    formFields[dateToKey].scheduleValidation();

    if (!dateFrom) {
      return true;
    }

    const dateTo = formFields[dateToKey].value;

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
  (dateTo, { formFields }) => {
    formFields[dateFromKey].scheduleValidation();

    if (!dateTo) {
      return true;
    }

    const dateFrom = formFields[dateFromKey].value;

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
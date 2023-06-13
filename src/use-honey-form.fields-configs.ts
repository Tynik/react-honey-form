import type { CustomDateRangeForm } from './use-honey-form.forms-types';
import type { UseHoneyFormFieldValidator } from './use-honey-form.types';

type CreateDateRangeValidatorOptions = {
  errorMsg?: string;
  ignoreTime?: boolean;
};

export const createDateFromValidator =
  <Form extends CustomDateRangeForm>({
    errorMsg = '"Date From" should be equal or less than "Date To"',
    ignoreTime = true,
  }: CreateDateRangeValidatorOptions = {}): UseHoneyFormFieldValidator<Form, 'dateFrom'> =>
  (dateFrom, { formFields }) => {
    formFields.dateTo.scheduleValidation();

    const dateTo = formFields.dateTo.value;

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

export const createDateToValidator =
  <Form extends CustomDateRangeForm>({
    errorMsg = '"Date To" should be equal or greater than "Date From"',
    ignoreTime = true,
  }: CreateDateRangeValidatorOptions = {}): UseHoneyFormFieldValidator<Form, 'dateTo'> =>
  (dateTo, { formFields }) => {
    formFields.dateFrom.scheduleValidation();

    const dateFrom = formFields.dateFrom.value;

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

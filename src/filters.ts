import type { HoneyFormFieldFilter } from './types';

type NumberFilterOptions = {
  maxLength?: number;
  maxLengthBeforeDecimal?: number;
  maxLengthAfterDecimal?: number;
  decimal?: boolean;
  negative?: boolean;
};

/**
 * Creates a filter function to allow numbers and format them based on provided options.
 *
 * @param {NumberFilterOptions} options - Options for the filter.
 * @returns {function(string): string} - The filter function.
 *
 * @remarks
 * This function filters and formats numeric input strings according to the specified options.
 *
 * @param {number} options.maxLength - The maximum total length of the resulting string.
 * @param {number} options.maxLengthBeforeDecimal - The maximum length of characters before the decimal point.
 * @param {number} options.maxLengthAfterDecimal - The maximum length of characters after the decimal point.
 * @param {boolean} options.decimal - Whether to allow decimal numbers (e.g., allow a decimal point '.').
 * @param {boolean} options.negative - Whether to allow negative numbers (e.g., allow a minus sign '-' at the beginning).
 *
 * @returns {string} - The filtered and formatted numeric string.
 */
export const createHoneyFormNumberFilter =
  <FieldValue extends string>({
    maxLength,
    maxLengthBeforeDecimal = maxLength,
    maxLengthAfterDecimal = 2,
    decimal = false,
    negative = true,
  }: NumberFilterOptions = {}): HoneyFormFieldFilter<FieldValue> =>
  value => {
    const pattern = new RegExp(`[^0-9${decimal ? '.' : ''}${negative ? '-' : ''}]+`, 'g');

    // Remove non-numeric characters and split by the decimal point
    const parts = value?.replace(pattern, '').split('.');
    if (!parts?.length) {
      return value;
    }

    if (!parts[0]) {
      return parts[0] as FieldValue;
    }

    const isNegativeSignPresent = parts[0][0] === '-';

    // Limit the lengths of the parts based on the maxLength options
    const limitedBeforeDecimal = parts[0].slice(
      0,
      isNegativeSignPresent ? maxLengthBeforeDecimal + 1 : maxLengthBeforeDecimal,
    );
    const limitedAfterDecimal = parts[1]?.slice(0, maxLengthAfterDecimal);

    // Combine the parts back together with the decimal point
    const result =
      limitedAfterDecimal === undefined
        ? limitedBeforeDecimal
        : `${limitedBeforeDecimal}.${limitedAfterDecimal}`;

    return result as FieldValue;
  };

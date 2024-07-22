import type { HoneyFormFieldFilter } from './types';

type NumericFilterOptions = {
  maxLength?: number;
};

/**
 * Creates a filter function to allow only numbers.
 *
 * @param {NumericFilterOptions} options - Options for the filter.
 *
 * @returns {function(string): string} - The filter function.
 */
export const createHoneyFormNumericFilter =
  <FieldValue extends string | number | undefined, FormContext = undefined>({
    maxLength,
  }: NumericFilterOptions = {}): HoneyFormFieldFilter<FieldValue, FormContext> =>
  value =>
    // Remove non-numeric characters and limit the result to N characters
    value
      ?.toString()
      .replace(/[^0-9]+/g, '')
      .slice(0, maxLength) as FieldValue;

/**
 * Options for configuring the number filter function.
 */
export type HoneyFormNumberFilterOptions = {
  /**
   * The maximum total length of the resulting string, including the decimal point and negative sign.
   */
  maxLength?: number;
  /**
   * Whether to allow negative numbers (e.g., allow a minus sign '-' at the beginning).
   *
   * @default true
   */
  negative?: boolean;
  /**
   * Whether to allow decimal numbers (e.g., allow a decimal point '.').
   *
   * @default true
   */
  decimal?: boolean;
  /**
   * The maximum length of characters before the decimal point.
   *
   * @default `maxLength`
   */
  maxLengthBeforeDecimal?: number;
  /**
   * The maximum length of characters after the decimal point.
   *
   * @default 2
   */
  maxLengthAfterDecimal?: number;
};

/**
 * Creates a filter function to allow numbers and format them based on provided options.
 *
 * @param {HoneyFormNumberFilterOptions} options - Options for configuring the number filter.
 *
 * @returns {function(string): string} - The filter function that formats and filters the numeric string.
 *
 * @remarks
 * The filter function performs the following operations:
 * 1. Removes non-numeric characters (except for optional decimal point and minus sign).
 * 2. Handles leading zeros in the integer part.
 * 3. Limits the length of integer and fractional parts based on the provided options.
 * 4. Ensures proper filtering with optional negative sign and decimal point.
 */
export const createHoneyFormNumberFilter =
  <FieldValue extends string | number | undefined, FormContext = undefined>({
    maxLength,
    maxLengthBeforeDecimal = maxLength,
    maxLengthAfterDecimal = 2,
    decimal = true,
    negative = true,
  }: HoneyFormNumberFilterOptions = {}): HoneyFormFieldFilter<FieldValue, FormContext> =>
  value => {
    if (!value) {
      return value;
    }

    const pattern = new RegExp(`[^0-9${decimal ? '.' : ''}${negative ? '-' : ''}]+`, 'g');
    let cleanedValue = value.toString().replace(pattern, '');

    // Check and handle the negative sign
    let isNegativeSignPresent = false;
    if (negative) {
      isNegativeSignPresent = cleanedValue.startsWith('-');
      // Remove any additional minus signs that may be present
      cleanedValue = cleanedValue.replace(/-/g, '');
    }

    // Split by the decimal point
    const [integerPart, fractionPart] = cleanedValue.split('.');

    // Remove leading zeros while preserving a single zero if that's the entire integer part
    const limitedIntegerPart = integerPart.replace(/^0+(?=\d)/, '');

    // Limit the lengths of the parts based on the maxLength options
    const limitedBeforeDecimal = limitedIntegerPart.slice(0, maxLengthBeforeDecimal);
    const limitedAfterDecimal = fractionPart?.slice(0, maxLengthAfterDecimal);

    // Combine the parts back together with the decimal point
    const result =
      limitedAfterDecimal === undefined
        ? limitedBeforeDecimal
        : `${limitedBeforeDecimal}.${limitedAfterDecimal}`;

    // Prepend the negative sign if the original value was negative
    return (isNegativeSignPresent ? `-${result}` : result) as FieldValue;
  };

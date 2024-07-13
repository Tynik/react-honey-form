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
 * @param {HoneyFormNumberFilterOptions} options - Options for the filter.
 *
 * @returns {function(string): string} - The filter function.
 *
 * @returns {string} - The filtered and formatted numeric string.
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

    let isNegativeSignPresent = false;
    if (negative) {
      isNegativeSignPresent = cleanedValue.startsWith('-');

      if (isNegativeSignPresent) {
        cleanedValue = `-${cleanedValue.slice(1).replace(/-/g, '')}`;
      } else {
        cleanedValue = cleanedValue.replace(/-/g, '');
      }
    }

    // Split by the decimal point
    const [integerPart, fractionPart] = cleanedValue.split('.');

    // Limit the lengths of the parts based on the maxLength options
    const limitedBeforeDecimal = integerPart.slice(
      0,
      isNegativeSignPresent ? maxLengthBeforeDecimal + 1 : maxLengthBeforeDecimal,
    );
    const limitedAfterDecimal = fractionPart?.slice(0, maxLengthAfterDecimal);

    // Combine the parts back together with the decimal point
    const result =
      limitedAfterDecimal === undefined
        ? limitedBeforeDecimal
        : `${limitedBeforeDecimal}.${limitedAfterDecimal}`;

    return result as FieldValue;
  };

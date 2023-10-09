import type { HoneyFormFieldFormatter } from './types';

/**
 * Creates a string formatter that splits a string into segments of a specified length
 * and joins them using a delimiter.
 *
 * @param {number} segmentLength - The length of each segment.
 * @param {string} delimiter - The delimiter used to join segments. Default: "space".
 * @returns {function(string): string} - The string formatter function.
 */
export const createHoneyFormSplitStringFormatter =
  <FieldValue extends string | undefined>(
    segmentLength: number,
    delimiter: string = ' ',
  ): HoneyFormFieldFormatter<FieldValue> =>
  value => {
    if (!value) {
      return value;
    }

    const segments = [];

    for (let i = 0; i < value.length; i += segmentLength) {
      segments.push(value.substring(i, i + segmentLength));
    }

    return segments.join(delimiter) as FieldValue;
  };

export type HoneyFormNumberFormatterOptions = {
  decimal?: boolean;
  maxLengthAfterDecimal?: number;
};

/**
 * Creates a number formatter function to format numeric values based on provided options.
 *
 * @param {HoneyFormNumberFormatterOptions} options - Options for the number formatter.
 * @returns {function(string): string} - The number formatter function.
 *
 * @remarks
 * This function formats numeric input strings according to the specified options.
 *
 * @param {boolean} options.decimal - Whether to format as a decimal number (e.g., add trailing zeros). Default: true.
 * @param {number} options.maxLengthAfterDecimal - The maximum number of digits after the decimal point. Default: 2.
 *
 * @returns {string} - The formatted numeric string.
 */
export const createHoneyFormNumberFormatter =
  <FieldValue extends string | undefined>({
    decimal = true,
    maxLengthAfterDecimal = 2,
  }: HoneyFormNumberFormatterOptions = {}): HoneyFormFieldFormatter<FieldValue> =>
  value => {
    if (!value || !decimal) {
      return value;
    }

    const parts = value.split('.');

    const limitedAfterDecimal = parts[1]?.slice(0, maxLengthAfterDecimal) ?? '';

    if (!parts[0] && !limitedAfterDecimal) {
      return '' as FieldValue;
    }

    return `${parts[0]}.${limitedAfterDecimal.padEnd(maxLengthAfterDecimal, '0')}` as FieldValue;
  };

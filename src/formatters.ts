import type { HoneyFormFieldFormatter } from './types';

/**
 * Creates a string formatter that splits a string into segments of a specified length
 * and joins them using a delimiter.
 *
 * @param {number} segmentLength - The length of each segment.
 * @param {string} delimiter - The delimiter used to join segments (default is a space).
 * @returns {function(string): string} - The string formatter function.
 */
export const createHoneyFormSplitStringFormatter =
  <FieldValue extends string>(
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

type NumberFormatterOptions = {
  decimal?: boolean;
  maxLengthAfterDecimal?: number;
};

export const createHoneyFormNumberFormatter =
  <FieldValue extends string>({
    decimal = false,
    maxLengthAfterDecimal = 2,
  }: NumberFormatterOptions = {}): HoneyFormFieldFormatter<FieldValue> =>
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

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

import type { HoneyFormFieldFormatter } from './types';

/**
 * Creates a string formatter that formats a string into segments separated by delimiter.
 * @param {number} segmentLength - The length of each segment.
 * @param {string} delimiter - The delimiter to join segments (default is a space).
 * @returns {function(string): string} - The string formatter function.
 */
export const createHoneyFormSplitStringFormatter =
  (segmentLength: number, delimiter: string = ' '): HoneyFormFieldFormatter<string> =>
  (value = '') => {
    const segments = [];

    for (let i = 0; i < value.length; i += segmentLength) {
      segments.push(value.substring(i, i + segmentLength));
    }

    return segments.join(delimiter);
  };

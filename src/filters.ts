type FilterOptions = {
  maxLength?: number;
};

/**
 * Creates a filter function to allow only numbers.
 * @param {FilterOptions} options - Options for the filter.
 * @returns {function(string): string} - The filter function.
 */
export const createHoneyFormNumbersFilter =
  ({ maxLength }: FilterOptions = {}): ((value: string) => string) =>
  (value = '') =>
    // Remove non-numeric characters and limit the result to N characters
    value.replace(/[^0-9]+/g, '').slice(0, maxLength);

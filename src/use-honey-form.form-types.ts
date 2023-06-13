type DateFrom = Date | null;
type DateTo = Date | null;

export type CustomDateRangeForm<DateFromKey extends string, DateToKey extends string> = {
  [K in DateFromKey]: DateFrom;
} & {
  [K in DateToKey]: DateTo;
};

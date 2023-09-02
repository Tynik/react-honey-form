type DateFrom = Date | null | undefined;
type DateTo = Date | null | undefined;

export type CustomDateRangeForm<DateFromKey extends string, DateToKey extends string> = {
  [K in DateFromKey]: DateFrom;
} & {
  [K in DateToKey]: DateTo;
};

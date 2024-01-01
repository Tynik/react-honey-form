type DateFrom = Date | null | undefined;
type DateTo = Date | null | undefined;

export type CustomDateRangeForm<DateFromKey extends string, DateToKey extends string> = {
  [K in DateFromKey]: K extends DateToKey ? never : DateFrom;
} & {
  [K in DateToKey]: K extends DateFromKey ? never : DateTo;
};

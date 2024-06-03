interface JSONObject {
  [key: string]: JSONValue;
}

interface JSONArray extends Array<JSONValue> {}

export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;

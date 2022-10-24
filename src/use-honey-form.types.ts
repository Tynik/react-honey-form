import type { ChangeEvent, RefObject } from 'react';
import { FocusEvent } from 'react';

type UseFormFieldName = string;

export type UseHoneyFormFieldType = 'number';

export type UseHoneyFormFieldValidationResult =
  | boolean
  | {
      errors: UseHoneyFormFieldError[];
    };

export type UseHoneyFormFieldConfig<Form extends UseHoneyBaseFormFields, CleanValue> = {
  value?: CleanValue;
  type?: UseHoneyFormFieldType;
  required?: boolean;
  min?: number;
  max?: number;
  decimal?: boolean;
  negative?: boolean;
  maxFraction?: number;
  // clear that field value when dependent field is changed
  dependsOn?: keyof Form;
  mode?: 'onChange' | 'onBlur';
  validator?: UseHoneyFormFieldValidator<Form, CleanValue>;
  // Remove some chars from value
  filter?: (value: CleanValue) => CleanValue;
  // Modify a value
  format?: (value: CleanValue) => unknown;
};

export type UseHoneyFormFieldValidator<Form extends UseHoneyBaseFormFields, Value> = (
  value: Value,
  options: UseHoneyFormFieldConfig<Form, Value>
) => UseHoneyFormFieldValidationResult;

export type UseHoneyFormFieldInternalValidator = <
  Form extends UseHoneyBaseFormFields,
  Value extends Form[keyof Form]
>(
  value: Value,
  fieldConfig: UseHoneyFormFieldConfig<Form, Value>,
  errors: UseHoneyFormFieldError[]
) => void;

export type UseHoneyFormFieldValueConvertor<Value = unknown> = (value: string) => Value;

export type UseHoneyFormFieldError = {
  type: 'required' | 'invalid' | 'server';
  message: string;
};

export type UseHoneyFormAddError<Form extends UseHoneyBaseFormFields> = <
  FieldName extends keyof Form
>(
  fieldName: FieldName,
  error: UseHoneyFormFieldError
) => void;

export type UseHoneyFormResetErrors = () => void;

export type UseHoneyFormField<
  Form extends UseHoneyBaseFormFields,
  CleanValue,
  FormattedValue = CleanValue
> = {
  readonly cleanValue: CleanValue;
  // the value after formatting when specific format function was executed
  readonly value: FormattedValue;
  readonly errors: UseHoneyFormFieldError[];
  // to destruct these props directly to a component
  readonly props: {
    ref: RefObject<any>;
    value: CleanValue;
    onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
  };
  readonly config: UseHoneyFormFieldConfig<Form, CleanValue>;
  // functions
  readonly setValue: (value: CleanValue) => void;
  readonly focus: () => void;
};

export type UseHoneyFormNestedField<Form extends UseHoneyBaseFormFields, Value> = {
  readonly length: number;
  readonly add: (value: Value) => void;
  readonly map: <R = unknown>(callback: (value: Value) => R) => R[];
  readonly config: UseHoneyFormFieldConfig<Form, Value>;
  readonly __nested__: boolean;
};

export type UseHoneyBaseFormFields = Record<UseFormFieldName, unknown>;

export type UseHoneyFormFields<Form extends UseHoneyBaseFormFields> = {
  [K in keyof Form]: Form[K] extends unknown[]
    ? UseHoneyFormNestedField<Form, Form[K][0]>
    : UseHoneyFormField<Form, Form[K]>;
};

export type UseHoneyFormFieldsConfigs<Form extends UseHoneyBaseFormFields> = {
  [K in keyof Form]: UseHoneyFormFieldConfig<Form, Form[K]>;
};

export type UseHoneyFormOptions<Form extends UseHoneyBaseFormFields, Response> = {
  fields: UseHoneyFormFieldsConfigs<Form>;
  onSubmit?: (data: Form) => Promise<Response>;
  onChange?: (data: Form) => void;
};

export type UseHoneyFormErrors<Form extends UseHoneyBaseFormFields> =
  | { [K in keyof Form]: UseHoneyFormFieldError[] };

export type UseHoneyFormSubmit<Form extends UseHoneyBaseFormFields, Response> = (
  submitHandler?: (data: Form) => Promise<Response>
) => Promise<void>;

export type UseHoneyFormReset = () => void;

export type UseHoneyFormFieldSetValue<Form extends UseHoneyBaseFormFields> = <
  FieldName extends keyof Form,
  Value extends Form[FieldName]
>(
  fieldName: FieldName,
  value: Value,
  validate: boolean
) => void;

export type UseHoneyFormAddFormField<Form extends UseHoneyBaseFormFields> = <
  FieldName extends keyof Form,
  Value extends Form[FieldName]
>(
  fieldName: FieldName,
  config: UseHoneyFormFieldConfig<Form, Value>
) => void;

/**
 * Non-optional fields cannot be removed
 */
export type UseHoneyFormRemoveFormField<Form extends UseHoneyBaseFormFields> = <
  FieldName extends keyof Form
>(
  fieldName: FieldName
) => void;

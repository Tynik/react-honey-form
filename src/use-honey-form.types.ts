import type { ChangeEvent, RefObject } from 'react';

type UseFormFieldName = string;

export type UseHoneyFormFieldType = 'string' | 'number';

export type UseHoneyFormFieldValidationResult =
  | boolean
  | {
      errors: UseHoneyFormFieldError[];
    };

export type UseHoneyFormFieldConfig<
  Form extends UseHoneyBaseFormFields,
  CleanValue,
  FormattedValue = any
> = {
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
  validator?: UseHoneyFormFieldValidator<Form, CleanValue>;
  // Remove some chars from value
  filter?: (value: CleanValue) => CleanValue;
  // Modify a value
  format?: (value: CleanValue) => FormattedValue;
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
  type: 'required' | 'invalidValue' | 'server';
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
  FormattedValue = any
> = {
  readonly cleanValue: CleanValue;
  // the value after formatting when specific format function was executed
  readonly value: FormattedValue;
  readonly errors: UseHoneyFormFieldError[];
  // to destruct these props directly to a component
  readonly props: {
    ref: RefObject<any>;
    value: CleanValue;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  };
  readonly config: UseHoneyFormFieldConfig<Form, CleanValue, FormattedValue>;
  // functions
  readonly setValue: (value: CleanValue) => void;
  readonly focus: () => void;
};

export type UseHoneyBaseFormFields = Record<UseFormFieldName, unknown>;

export type UseHoneyFormFields<Form extends UseHoneyBaseFormFields> = {
  [K in keyof Form]: UseHoneyFormField<Form, Form[K]>;
};

export type UseHoneyFormFieldsConfigs<Form extends UseHoneyBaseFormFields> = {
  [K in keyof Form]: UseHoneyFormFieldConfig<Form, Form[K]>;
};

export type UseHoneyFormOptions<Form extends UseHoneyBaseFormFields> = {
  fields: UseHoneyFormFieldsConfigs<Form>;
  onSubmit?: (data: Form) => Promise<void>;
  onChange?: (data: Form) => void;
};

export type UseHoneyFormErrors<Form extends UseHoneyBaseFormFields> =
  | { [K in keyof Form]: UseHoneyFormFieldError[] };

export type UseHoneyFormSubmit = () => Promise<void>;

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

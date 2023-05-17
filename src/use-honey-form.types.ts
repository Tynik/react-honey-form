// https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3

import type { ChangeEvent, FocusEvent, RefObject } from 'react';

type UseFormFieldName = string;

// TODO: implement date type
export type UseHoneyFormFieldType = 'number';

/**
 * true: when validation is passed and false otherwise
 * string: the custom error string value
 */
export type UseHoneyFormFieldValidationResult = boolean | string | UseHoneyFormFieldError[];

export type UseHoneyFormFieldSetValue<Form extends UseHoneyBaseFormFields> = <
  FieldName extends keyof Form,
  Value extends Form[FieldName]
>(
  fieldName: FieldName,
  value: Value,
  validate: boolean
) => void;

type UseHoneyFormFieldOnChangeFormApi<Form extends UseHoneyBaseFormFields> = {
  setFieldValue: UseHoneyFormFieldSetValue<Form>;
};

export type UseHoneyFormFieldOnChange<Form extends UseHoneyBaseFormFields, CleanValue> = (
  value: CleanValue,
  formApi: UseHoneyFormFieldOnChangeFormApi<Form>
) => void;

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
  dependsOn?: keyof Form | (keyof Form)[];
  mode?: 'onChange' | 'onBlur';
  validator?: UseHoneyFormFieldValidator<Form, CleanValue>;
  // Remove some chars from value
  filter?: (value: CleanValue) => CleanValue;
  // Modify a value
  format?: (value: CleanValue) => unknown;
  onChange?: UseHoneyFormFieldOnChange<Form, CleanValue>;
};

export type CreateHoneyFormField = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form = keyof Form,
  Value extends Form[FieldName] = Form[FieldName]
>(
  name: FieldName,
  defaultValue: Value,
  config: UseHoneyFormFieldConfig<Form, Value>,
  options: {
    setValue: UseHoneyFormFieldSetValue<Form>;
  }
) => UseHoneyFormField<Form, Value>;

export type UseHoneyFormFieldValidator<Form extends UseHoneyBaseFormFields, Value> = (
  value: Value,
  fieldConfig: UseHoneyFormFieldConfig<Form, Value>,
  formFields: UseHoneyFormFields<Form>
) => UseHoneyFormFieldValidationResult;

export type UseHoneyFormFieldInternalValidator = <
  Form extends UseHoneyBaseFormFields,
  Value extends Form[keyof Form]
>(
  value: Value,
  fieldConfig: UseHoneyFormFieldConfig<Form, Value>,
  errors: UseHoneyFormFieldError[]
) => void;

export type UseHoneyFormFieldValueConvertor<Value = unknown> = (value: any) => Value;

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

export type UseHoneyFormFieldProps<CleanValue> = {
  ref: RefObject<any>;
  value: CleanValue;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
};

export type UseHoneyFormField<
  Form extends UseHoneyBaseFormFields,
  CleanValue,
  FormattedValue = CleanValue,
  DefaultValue extends Form[keyof Form] = Form[keyof Form]
> = {
  readonly defaultValue: DefaultValue;
  // a value should be undefined when error for a field is present
  readonly cleanValue: CleanValue;
  // the value after formatting when specific format function was executed
  readonly value: FormattedValue;
  readonly errors: UseHoneyFormFieldError[];
  // to destruct these props directly to a component
  readonly props: UseHoneyFormFieldProps<CleanValue>;
  readonly config: UseHoneyFormFieldConfig<Form, CleanValue>;
  readonly isTouched: boolean;
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

export type UseHoneyFormDefaults<Form extends UseHoneyBaseFormFields> =
  | Partial<Form>
  | (() => Promise<Partial<Form>>);

export type UseHoneyFormOnSubmit<Form extends UseHoneyBaseFormFields, Response> = (
  data: Form
) => Promise<Response>;

export type UseHoneyFormOnChange<Form extends UseHoneyBaseFormFields, Response> = (
  data: Form,
  errors: UseHoneyFormErrors<Form>
) => void;

export type UseHoneyFormOptions<Form extends UseHoneyBaseFormFields, Response> = {
  fields?: UseHoneyFormFieldsConfigs<Form>;
  // TODO: not implemented
  schema?: unknown;
  defaults?: UseHoneyFormDefaults<Form>;
  onSubmit?: UseHoneyFormOnSubmit<Form, Response>;
  onChange?: UseHoneyFormOnChange<Form, Response>;
  onChangeDebounce?: number;
};

export type UseHoneyFormApi<Form extends UseHoneyBaseFormFields, Response> = {
  formFields: UseHoneyFormFields<Form>;
  areDefaultsFetching: boolean;
  areDefaultsFetchingErred: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  errors: UseHoneyFormErrors<Form>;
  // functions
  setFormValues: UseHoneyFormSetFormValues<Form>;
  addFormField: UseHoneyFormAddFormField<Form>;
  removeFormField: UseHoneyFormRemoveFormField<Form>;
  addError: UseHoneyFormAddError<Form>;
  resetErrors: UseHoneyFormResetErrors;
  submit: UseHoneyFormSubmit<Form, Response>;
  reset: UseHoneyFormReset;
};

export type UseHoneyFormErrors<Form extends UseHoneyBaseFormFields> =
  | { [K in keyof Form]: UseHoneyFormFieldError[] };

export type UseHoneyFormSubmit<Form extends UseHoneyBaseFormFields, Response> = (
  submitHandler?: (data: Form) => Promise<Response>
) => Promise<void>;

export type UseHoneyFormReset = () => void;

type UseHoneyFormSetFormValuesOptions = {
  clearAll?: boolean;
};

export type UseHoneyFormSetFormValues<Form extends UseHoneyBaseFormFields> = (
  values: Partial<Form>,
  options?: UseHoneyFormSetFormValuesOptions
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

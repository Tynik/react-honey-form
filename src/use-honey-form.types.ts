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
  FieldValue extends Form[FieldName] = Form[FieldName]
>(
  fieldName: FieldName,
  value: FieldValue,
  validate: boolean
) => void;

type UseHoneyFormFieldOnChangeFormApi<Form extends UseHoneyBaseFormFields> = {
  setFieldValue: UseHoneyFormFieldSetValue<Form>;
};

export type UseHoneyFormFieldOnChange<Form extends UseHoneyBaseFormFields, FieldValue> = (
  value: FieldValue,
  formApi: UseHoneyFormFieldOnChangeFormApi<Form>
) => void;

export type UseHoneyFormFieldConfig<
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = {
  value?: FieldValue;
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
  validator?: UseHoneyFormFieldValidator<Form, FieldName, FieldValue>;
  // Remove some chars from value
  filter?: (value: FieldValue) => FieldValue;
  // Modify a value
  format?: (value: FieldValue) => unknown;
  onChange?: UseHoneyFormFieldOnChange<Form, FieldValue>;
};

export type CreateHoneyFormField = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
>(
  name: FieldName,
  defaultValue: FieldValue,
  config: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
  options: {
    setValue: UseHoneyFormFieldSetValue<Form>;
  }
) => UseHoneyFormField<Form, FieldName, FieldValue>;

export type UseHoneyFormFieldValidator<
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = (
  value: FieldValue,
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
  formFields: UseHoneyFormFields<Form>
) => UseHoneyFormFieldValidationResult;

export type UseHoneyFormFieldInternalValidator = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
>(
  value: FieldValue,
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
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

export type UseHoneyFormFieldProps<
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = {
  ref: RefObject<any>;
  value: FieldValue;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
};

export type UseHoneyFormField<
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = {
  readonly defaultValue: FieldValue;
  // a value should be undefined when error for a field is present
  readonly cleanValue: FieldValue;
  // the value after formatting when specific format function was executed
  readonly value: FieldValue;
  readonly errors: UseHoneyFormFieldError[];
  // to destruct these props directly to a component
  readonly props: UseHoneyFormFieldProps<Form, FieldName, FieldValue>;
  readonly config: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>;
  readonly isTouched: boolean;
  // functions
  readonly setValue: (value: FieldValue) => void;
  readonly focus: () => void;
};

export type UseHoneyBaseFormFields = Record<UseFormFieldName, unknown>;

export type UseHoneyFormFields<Form extends UseHoneyBaseFormFields> = {
  [FieldName in keyof Form]: UseHoneyFormField<Form, FieldName, Form[FieldName]>;
};

export type UseHoneyFormFieldsConfigs<Form extends UseHoneyBaseFormFields> = {
  [FieldName in keyof Form]: UseHoneyFormFieldConfig<Form, FieldName, Form[FieldName]>;
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
  FieldName extends keyof Form
>(
  fieldName: FieldName,
  config: UseHoneyFormFieldConfig<Form, FieldName, Form[FieldName]>
) => void;

/**
 * Non-optional fields cannot be removed
 */
export type UseHoneyFormRemoveFormField<Form extends UseHoneyBaseFormFields> = <
  FieldName extends keyof Form
>(
  fieldName: FieldName
) => void;

// https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3

import type { ChangeEvent, FocusEvent, MutableRefObject, RefObject } from 'react';

type UseHoneyFormFieldName = string;

type UseHoneyFormFieldMode = 'onChange' | 'onBlur';

// TODO: implement date type
export type UseHoneyFormFieldType = 'number';

type UseHoneyFormFieldErrorType = 'required' | 'invalid' | 'server' | 'min' | 'max' | 'minMax';

type UseHoneyFormFieldErrorMessage = string;

export type UseHoneyForm = Record<UseHoneyFormFieldName, unknown>;

type UseHoneyFormFieldErrorMessages = Partial<
  Record<UseHoneyFormFieldErrorType, UseHoneyFormFieldErrorMessage>
>;

export type UseHoneyFormFieldError = {
  type: UseHoneyFormFieldErrorType;
  message: UseHoneyFormFieldErrorMessage;
};

/**
 * true: when validation is passed and false otherwise
 * string: the custom error string value
 */
export type UseHoneyFormFieldValidationResult = boolean | string | UseHoneyFormFieldError[];

export type UseHoneyFormFieldSetValue<Form extends UseHoneyForm> = <
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
>(
  fieldName: FieldName,
  value: FieldValue
) => void;

type UseHoneyFormFieldOnChangeFormApi<Form extends UseHoneyForm> = {
  setFieldValue: UseHoneyFormFieldSetValue<Form>;
};

export type UseHoneyFormFieldOnChange<
  Form extends UseHoneyForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = (value: FieldValue, formApi: UseHoneyFormFieldOnChangeFormApi<Form>) => void;

export type UseHoneyFormFieldConfig<
  Form extends UseHoneyForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = {
  value?: FieldValue;
  defaultValue?: FieldValue;
  type?: UseHoneyFormFieldType;
  required?: boolean;
  min?: number;
  max?: number;
  decimal?: boolean;
  negative?: boolean;
  maxFraction?: number;
  // clear that field value when dependent field is changed
  dependsOn?: keyof Form | (keyof Form)[];
  mode?: UseHoneyFormFieldMode;
  errorMessages?: UseHoneyFormFieldErrorMessages;
  validator?: UseHoneyFormFieldValidator<Form, FieldName, FieldValue>;
  // Remove some chars from value
  filter?: (value: FieldValue) => FieldValue;
  // Modify a value
  format?: (value: FieldValue) => unknown;
  onChange?: UseHoneyFormFieldOnChange<Form, FieldName, FieldValue>;
};

export type UseHoneyFormFieldValidator<
  Form extends UseHoneyForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = (
  value: FieldValue,
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
  formFields: UseHoneyFormFields<Form>
) => UseHoneyFormFieldValidationResult;

export type UseHoneyFormFieldInternalValidator = <
  Form extends UseHoneyForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
>(
  value: FieldValue,
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
  errors: UseHoneyFormFieldError[]
) => void;

export type UseHoneyFormFieldValueConvertor<Value = unknown> = (value: any) => Value;

export type UseHoneyFormAddError<Form extends UseHoneyForm> = <FieldName extends keyof Form>(
  fieldName: FieldName,
  error: UseHoneyFormFieldError
) => void;

export type UseHoneyFormResetErrors = () => void;

export type UseHoneyFormFieldProps<
  Form extends UseHoneyForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = {
  ref: RefObject<any>;
  value: FieldValue;
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
};

export type UseHoneyFormFieldMeta<Form extends UseHoneyForm> = {
  isValidationScheduled: boolean;
  /**
   * undefined: as initial state when child forms are not mounted yet.
   * When child forms are mounted/unmounted the array or empty array is present
   */
  childrenForms: MutableRefObject<UseHoneyFormFields<Form>>[] | undefined;
};

export type UseHoneyFormField<
  Form extends UseHoneyForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = {
  defaultValue: FieldValue;
  // a value should be undefined when error for a field is present
  cleanValue: FieldValue;
  // the value after formatting when specific format function was executed
  value: FieldValue;
  errors: UseHoneyFormFieldError[];
  // to destruct these props directly to a component
  props: UseHoneyFormFieldProps<Form, FieldName, FieldValue>;
  config: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>;
  isTouched: boolean;
  // functions
  setValue: (value: FieldValue) => void;
  scheduleValidation: () => void;
  focus: () => void;
  __meta__: UseHoneyFormFieldMeta<Form>;
};

export type UseHoneyFormFields<Form extends UseHoneyForm> = {
  [FieldName in keyof Form]: UseHoneyFormField<Form, FieldName, Form[FieldName]>;
};

export type UseHoneyFormFieldsConfigs<Form extends UseHoneyForm> = {
  [FieldName in keyof Form]: UseHoneyFormFieldConfig<Form, FieldName, Form[FieldName]>;
};

export type UseHoneyFormDefaults<Form extends UseHoneyForm> =
  | Partial<Form>
  | (() => Promise<Partial<Form>>);

export type UseHoneyFormOnSubmit<Form extends UseHoneyForm, Response> = (
  data: Form
) => Promise<Response>;

export type UseHoneyFormOnChange<Form extends UseHoneyForm, Response> = (
  data: Form,
  errors: UseHoneyFormErrors<Form>
) => void;

export type UseHoneyFormParentField<Form extends UseHoneyForm> = UseHoneyFormField<
  any,
  any,
  Form[]
>;

export type UseHoneyFormOptions<Form extends UseHoneyForm, Response> = {
  formIndex?: number;
  parentField?: UseHoneyFormParentField<Form>;
  //
  fields?: UseHoneyFormFieldsConfigs<Form>;
  defaults?: UseHoneyFormDefaults<Form>;
  //
  onSubmit?: UseHoneyFormOnSubmit<Form, Response>;
  onChange?: UseHoneyFormOnChange<Form, Response>;
  onChangeDebounce?: number;
};

export type UseHoneyFormApi<Form extends UseHoneyForm, Response> = {
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

export type UseHoneyFormErrors<Form extends UseHoneyForm> =
  | { [K in keyof Form]: UseHoneyFormFieldError[] };

export type UseHoneyFormSubmit<Form extends UseHoneyForm, Response> = (
  submitHandler?: (data: Form) => Promise<Response>
) => Promise<void>;

export type UseHoneyFormReset = () => void;

type UseHoneyFormSetFormValuesOptions = {
  clearAll?: boolean;
};

export type UseHoneyFormSetFormValues<Form extends UseHoneyForm> = (
  values: Partial<Form>,
  options?: UseHoneyFormSetFormValuesOptions
) => void;

export type UseHoneyFormAddFormField<Form extends UseHoneyForm> = <FieldName extends keyof Form>(
  fieldName: FieldName,
  config: UseHoneyFormFieldConfig<Form, FieldName, Form[FieldName]>
) => void;

/**
 * Non-optional fields cannot be removed
 */
export type UseHoneyFormRemoveFormField<Form extends UseHoneyForm> = <FieldName extends keyof Form>(
  fieldName: FieldName
) => void;

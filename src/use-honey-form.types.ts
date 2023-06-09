// https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3

import type { ChangeEvent, FocusEvent, MutableRefObject, RefObject } from 'react';

type UseHoneyFormFieldName = string;

type UseHoneyFormFieldMode = 'onChange' | 'onBlur';

// TODO: implement date type
export type UseHoneyFormFieldType = 'number';

type UseHoneyFormFieldErrorType = 'required' | 'invalid' | 'server' | 'min' | 'max' | 'minMax';

type UseHoneyFormFieldErrorMessage = string;

export type UseHoneyFormForm = Record<UseHoneyFormFieldName, unknown>;

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

export type UseHoneyFormSetFieldValue<Form extends UseHoneyFormForm> = <
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
>(
  fieldName: FieldName,
  value: FieldValue
) => void;

export type UseHoneyFormPushFieldValue<Form extends UseHoneyFormForm> = <
  FieldName extends keyof { [F in keyof Form]: Form[F] extends unknown[] ? F : never },
  FieldValue extends Form[FieldName] = Form[FieldName]
>(
  fieldName: FieldName,
  value: FieldValue extends (infer Item)[] ? Item : never
) => void;

export type UseHoneyFormRemoveFieldValue<Form extends UseHoneyFormForm> = <
  FieldName extends keyof { [F in keyof Form]: Form[F] extends unknown[] ? F : never }
>(
  fieldName: FieldName,
  formIndex: number
) => void;

type UseHoneyFormFieldOnChangeFormApi<Form extends UseHoneyFormForm> = {
  setFieldValue: UseHoneyFormSetFieldValue<Form>;
};

export type UseHoneyFormFieldOnChange<
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = (value: FieldValue, formApi: UseHoneyFormFieldOnChangeFormApi<Form>) => void;

export type UseHoneyFormFieldConfig<
  Form extends UseHoneyFormForm,
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
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = (
  value: FieldValue,
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
  formFields: UseHoneyFormFields<Form>
) => UseHoneyFormFieldValidationResult;

export type UseHoneyFormFieldInternalValidator = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
>(
  value: FieldValue,
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
  errors: UseHoneyFormFieldError[]
) => void;

export type UseHoneyFormFieldValueConvertor<Value = unknown> = (value: any) => Value;

export type UseHoneyFormFieldProps<
  Form extends UseHoneyFormForm,
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
  Form extends UseHoneyFormForm,
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
  // functions
  setValue: (value: FieldValue) => void;
  pushValue: (value: FieldValue extends (infer Item)[] ? Item : never) => void;
  removeValue: (formIndex: number) => void;
  scheduleValidation: () => void;
  focus: () => void;
  __meta__: UseHoneyFormFieldMeta<Form>;
};

export type UseHoneyFormFields<Form extends UseHoneyFormForm> = {
  [FieldName in keyof Form]: UseHoneyFormField<Form, FieldName, Form[FieldName]>;
};

export type UseHoneyFormFieldsConfigs<Form extends UseHoneyFormForm> = {
  [FieldName in keyof Form]: UseHoneyFormFieldConfig<Form, FieldName, Form[FieldName]>;
};

export type UseHoneyFormDefaults<Form extends UseHoneyFormForm> =
  | Partial<Form>
  | (() => Promise<Partial<Form>>);

export type UseHoneyFormOnSubmit<Form extends UseHoneyFormForm, Response> = (
  data: Form
) => Promise<Response>;

export type UseHoneyFormOnChange<Form extends UseHoneyFormForm, Response> = (
  data: Form,
  errors: UseHoneyFormErrors<Form>
) => void;

export type UseHoneyFormParentField<Form extends UseHoneyFormForm> = UseHoneyFormField<
  any,
  any,
  Form[]
>;

export type UseHoneyFormOptions<Form extends UseHoneyFormForm, Response> = {
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

export type UseHoneyFormErrors<Form extends UseHoneyFormForm> =
  | { [K in keyof Form]: UseHoneyFormFieldError[] };

export type UseHoneyFormSetFormValues<Form extends UseHoneyFormForm> = (
  values: Partial<Form>,
  options?: UseHoneyFormSetFormValuesOptions
) => void;

export type UseHoneyFormAddFormField<Form extends UseHoneyFormForm> = <
  FieldName extends keyof Form
>(
  fieldName: FieldName,
  config: UseHoneyFormFieldConfig<Form, FieldName, Form[FieldName]>
) => void;

/**
 * Non-optional fields cannot be removed
 */
export type UseHoneyFormRemoveFormField<Form extends UseHoneyFormForm> = <
  FieldName extends keyof Form
>(
  fieldName: FieldName
) => void;

export type UseHoneyFormAddFieldError<Form extends UseHoneyFormForm> = <
  FieldName extends keyof Form
>(
  fieldName: FieldName,
  error: UseHoneyFormFieldError
) => void;

export type UseHoneyFormResetErrors = () => void;

export type UseHoneyFormValidate = () => boolean;

export type UseHoneyFormSubmit<Form extends UseHoneyFormForm, Response> = (
  submitHandler?: (data: Form) => Promise<Response>
) => Promise<void>;

type UseHoneyFormSetFormValuesOptions = {
  clearAll?: boolean;
};

export type UseHoneyFormReset = () => void;

export type UseHoneyFormChildFormApi<Form extends UseHoneyFormForm, Response> = {
  formFieldsRef: MutableRefObject<UseHoneyFormFields<Form>>;
  submit: UseHoneyFormSubmit<Form, Response>;
  validate: UseHoneyFormValidate;
};

export type UseHoneyFormFieldMeta<Form extends UseHoneyFormForm> = {
  isValidationScheduled: boolean;
  /**
   * undefined: as initial state when child forms are not mounted yet.
   * When child forms are mounted/unmounted the array or empty array is present
   */
  childrenForms: UseHoneyFormChildFormApi<Form, any>[] | undefined;
};

export type UseHoneyFormApi<Form extends UseHoneyFormForm, Response> = {
  formFields: UseHoneyFormFields<Form>;
  isFormDefaultsFetching: boolean;
  isFormDefaultsFetchingErred: boolean;
  isFormDirty: boolean;
  isFormSubmitting: boolean;
  formErrors: UseHoneyFormErrors<Form>;
  // functions
  setFormValues: UseHoneyFormSetFormValues<Form>;
  addFormField: UseHoneyFormAddFormField<Form>;
  removeFormField: UseHoneyFormRemoveFormField<Form>;
  addFormFieldError: UseHoneyFormAddFieldError<Form>;
  resetFormErrors: UseHoneyFormResetErrors;
  validateForm: UseHoneyFormValidate;
  submitForm: UseHoneyFormSubmit<Form, Response>;
  resetForm: UseHoneyFormReset;
};

// https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3

import type { HTMLAttributes, MutableRefObject, RefObject } from 'react';

type UseHoneyFormFieldName = string;

export type UseHoneyFormChildFormId = string;

// TODO: implement date type
export type UseHoneyFormFieldType = 'number' | 'email';

type UseHoneyFormFieldErrorType = 'required' | 'invalid' | 'server' | 'min' | 'max' | 'minMax';

type UseHoneyFormFieldErrorMessage = string;

export type UseHoneyFormForm = Record<UseHoneyFormFieldName, unknown>;

type UseHoneyFormFieldMode = 'change' | 'blur';

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

type UseHoneyFormSetFieldValueOptions = {
  validate?: boolean;
  pushValue?: boolean;
};

export type UseHoneyFormSetFieldValue<Form extends UseHoneyFormForm> = <
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
>(
  fieldName: FieldName,
  value: FieldValue,
  options?: UseHoneyFormSetFieldValueOptions
) => void;

export type UseHoneyFormClearFieldErrors<Form extends UseHoneyFormForm> = <
  FieldName extends keyof Form
>(
  fieldName: FieldName
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
> = Readonly<{
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
  skip?: (formFields: UseHoneyFormFields<Form>) => boolean;
  onChange?: UseHoneyFormFieldOnChange<Form, FieldName, FieldValue>;
}>;

export type UseHoneyFormFieldValidatorApi<
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = {
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>;
  formFields: UseHoneyFormFields<Form>;
};

export type UseHoneyFormFieldValidator<
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = (
  value: FieldValue,
  api: UseHoneyFormFieldValidatorApi<Form, FieldName, FieldValue>
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
> = Readonly<
  Pick<HTMLAttributes<HTMLInputElement>, 'aria-invalid' | 'onFocus' | 'onChange' | 'onBlur'> & {
    ref: RefObject<any>;
    value: FieldValue;
  }
>;

export type UseHoneyFormField<
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
> = Readonly<
  {
    defaultValue: FieldValue;
    // a value is `undefined` when any error for the field is present
    cleanValue: FieldValue;
    // the value after formatting when specific format function was executed
    value: FieldValue;
    errors: UseHoneyFormFieldError[];
    // to destruct these props directly to a component
    props: UseHoneyFormFieldProps<Form, FieldName, FieldValue>;
    config: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>;
    // functions
    setValue: (value: FieldValue) => void;
    scheduleValidation: () => void;
    clearErrors: () => void;
    focus: () => void;
    __meta__: UseHoneyFormFieldMeta<Form>;
  } & {
    pushValue: (value: FieldValue extends (infer Item)[] ? Item : never) => void;
    removeValue: (formIndex: number) => void;
  }
>;

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
  id: UseHoneyFormChildFormId;
  formFieldsRef: MutableRefObject<UseHoneyFormFields<Form>>;
  submitForm: UseHoneyFormSubmit<Form, Response>;
  validateForm: UseHoneyFormValidate;
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

// https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3

import type {
  ReactElement,
  HTMLAttributes,
  MutableRefObject,
  RefObject,
  InputHTMLAttributes,
} from 'react';

type HoneyFormFieldName = string;

export type HoneyFormChildFormId = string;

// TODO: implement date type
export type HoneyFormFieldType = 'string' | 'numeric' | 'number' | 'email';

type HoneyFormFieldErrorType = 'required' | 'invalid' | 'server' | 'min' | 'max' | 'minMax';

type HoneyFormFieldErrorMessage = string | ReactElement;

export type HoneyFormBaseForm = Record<HoneyFormFieldName, unknown>;

type HoneyFormFieldMode = 'change' | 'blur';

type HoneyFormFieldErrorMessages = Partial<
  Record<HoneyFormFieldErrorType, HoneyFormFieldErrorMessage>
>;

export type HoneyFormFieldError = {
  type: HoneyFormFieldErrorType;
  message: HoneyFormFieldErrorMessage;
};

/**
 * true: when validation is passed and false otherwise
 * string: the custom error string value
 */
export type HoneyFormFieldValidationResult =
  | boolean
  | string
  | ReactElement
  | HoneyFormFieldError[];

type HoneyFormFieldSetValueOptions = {
  isDirty?: boolean;
  isValidate?: boolean;
};

type HoneyFormSetFieldValueOptionsInternal = HoneyFormFieldSetValueOptions & {
  isPushValue?: boolean;
};

export type HoneyFormSetFieldValueInternal<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
>(
  fieldName: FieldName,
  value: FieldValue,
  options?: HoneyFormSetFieldValueOptionsInternal,
) => void;

export type HoneyFormClearFieldErrors<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof Form,
>(
  fieldName: FieldName,
) => void;

export type HoneyFormPushFieldValue<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof { [F in keyof Form]: Form[F] extends unknown[] ? F : never },
  FieldValue extends Form[FieldName] = Form[FieldName],
>(
  fieldName: FieldName,
  value: FieldValue extends (infer Item)[] ? Item : never,
) => void;

export type HoneyFormRemoveFieldValue<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof { [F in keyof Form]: Form[F] extends unknown[] ? F : never },
>(
  fieldName: FieldName,
  formIndex: number,
) => void;

type HoneyFormFieldOnChangeContext<Form extends HoneyFormBaseForm> = {
  formFields: HoneyFormFields<Form>;
};

export type HoneyFormFieldOnChange<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = (cleanValue: FieldValue | undefined, context: HoneyFormFieldOnChangeContext<Form>) => void;

export type HoneyFormFieldConfig<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = Readonly<{
  type?: HoneyFormFieldType;
  required?: boolean;
  value?: FieldValue;
  defaultValue?: FieldValue;
  /**
   * The minimum allowed value for numbers or minimum length for strings
   */
  min?: number;
  /**
   * The maximum allowed value for numbers or maximum length for strings
   */
  max?: number;
  /**
   * Indicates if decimal values are allowed
   */
  decimal?: boolean;
  /**
   * Indicates if negative values for number field type are allowed
   */
  negative?: boolean;
  /**
   * The maximum number of decimal places allowed for number field type
   */
  maxFraction?: number;
  /**
   * Clears that field value when dependent field is changed
   */
  dependsOn?: keyof Form | (keyof Form)[];
  /**
   * In depends on mode, the validation process is changed.
   * - If `change` mode is set, each typed character triggers the validation process.
   * - If `blur` mode is set, the validation will be triggered when focus leaves the input firstly,
   *    but the re-validate the new field value even validation field mode is `blur` if there is any error.
   */
  mode?: HoneyFormFieldMode;
  /**
   * Custom error messages for this field
   */
  errorMessages?: HoneyFormFieldErrorMessages;
  /**
   * Custom validation function
   */
  validator?: HoneyFormFieldValidator<Form, FieldName, FieldValue>;
  /**
   * A function to filter characters from the value
   * @param value
   */
  filter?: (value: FieldValue | undefined) => FieldValue | undefined;
  /**
   * A function to modify the field's value
   * @param value
   */
  format?: (value: FieldValue | undefined) => FieldValue | undefined;
  /**
   * A function to determine whether to skip validation and submission for this field
   * @param formFields
   */
  skip?: (formFields: HoneyFormFields<Form>) => boolean;
  /**
   * Callback function triggered when the field value changes
   */
  onChange?: HoneyFormFieldOnChange<Form, FieldName, FieldValue>;
}>;

export type HoneyFormFieldValidatorContext<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = {
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FieldValue>;
  formFields: HoneyFormFields<Form>;
};

/**
 * A custom validation function for the field. Should return either `true` (indicating the value is valid), an error message (indicating the value is invalid), or an array of `UseHoneyFormFieldError` objects. It can also be a `Promise` function that should resolve to the same response.
 *
 * @param fieldValue - The current value of the field.
 * @param validatorContext - The validation context, containing the field configuration and other form fields.
 * @returns `true` if the value is valid, an error message if the value is invalid, an array of `UseHoneyFormFieldError` objects, or a `Promise` that resolves to any of these.
 */
export type HoneyFormFieldValidator<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = (
  fieldValue: FieldValue | undefined,
  context: HoneyFormFieldValidatorContext<Form, FieldName, FieldValue>,
) => HoneyFormFieldValidationResult | Promise<HoneyFormFieldValidationResult>;

export type HoneyFormFieldInternalValidator = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
>(
  fieldValue: FieldValue | undefined,
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FieldValue>,
  fieldErrors: HoneyFormFieldError[],
) => void;

export type HoneyFormValidateField<Form extends HoneyFormBaseForm> = <FieldName extends keyof Form>(
  fieldName: FieldName,
) => void;

export type HoneyFormFieldValueConvertor<Value = unknown> = (value: any) => Value;

export type HoneyFormFieldProps<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = Readonly<
  Pick<HTMLAttributes<any>, 'onFocus' | 'onBlur' | 'aria-required' | 'aria-invalid'> &
    Pick<InputHTMLAttributes<any>, 'onChange'> & {
      ref: RefObject<any>;
      value: FieldValue | undefined;
    }
>;

export type HoneyFormChildFormContext<Form extends HoneyFormBaseForm, Response> = {
  id: HoneyFormChildFormId;
  formFieldsRef: MutableRefObject<HoneyFormFields<Form> | null>;
  submitForm: HoneyFormSubmit<Form, Response>;
  validateForm: HoneyFormValidate<Form>;
};

export type HoneyFormFieldMeta<Form extends HoneyFormBaseForm> = {
  isValidationScheduled: boolean;
  /**
   * `undefined`: as initial state when child forms are not mounted yet.
   * When child forms are mounted/unmounted the array or empty array is present
   */
  childrenForms: HoneyFormChildFormContext<Form, any>[] | undefined;
};

export type HoneyFormField<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = Readonly<{
  defaultValue: FieldValue | undefined;
  /**
   * The unprocessed, filtered, but not formatted value
   */
  rawValue: FieldValue | undefined;
  /**
   * The value after filtering and formatting, with `undefined` indicating errors
   */
  cleanValue: FieldValue | undefined;
  /**
   * The final processed and formatted value, directly shown to the end user
   */
  value: FieldValue | undefined;
  /**
   * An array of errors associated with this field
   */
  errors: HoneyFormFieldError[];
  /**
   * Properties used for component destructuring
   */
  props: HoneyFormFieldProps<Form, FieldName, FieldValue>;
  /**
   * Configuration options for this field
   */
  config: HoneyFormFieldConfig<Form, FieldName, FieldValue>;
  /**
   * A function to set the field's value
   * @param value
   * @param options
   */
  setValue: (value: FieldValue, options?: HoneyFormFieldSetValueOptions) => void;
  /**
   * A function to add a value to an array field
   * @param value
   */
  pushValue: (value: FieldValue extends (infer Item)[] ? Item : never) => void;
  /**
   * A function to remove a value from an array field by index
   * @param formIndex
   */
  removeValue: (formIndex: number) => void;
  /**
   * A function to schedule validation for this field. Can only be used inside field's validator
   */
  scheduleValidation: () => void;
  /**
   * A function to add an error to the field's error array
   * @param error
   */
  addError: (error: HoneyFormFieldError) => void;
  /**
   * A function to clear all errors associated with this field
   */
  clearErrors: () => void;
  /**
   * A function to focus on this field. Can only be used when `props` are destructured within a component
   */
  focus: () => void;
  /**
   * Internal metadata used by the library
   */
  __meta__: HoneyFormFieldMeta<Form>;
}>;

export type HoneyFormParentField<Form extends HoneyFormBaseForm> = HoneyFormField<any, any, Form[]>;

export type HoneyFormFields<Form extends HoneyFormBaseForm> = {
  [FieldName in keyof Form]: HoneyFormField<Form, FieldName>;
};

export type HoneyFormFieldsConfigs<Form extends HoneyFormBaseForm> = {
  [FieldName in keyof Form]: HoneyFormFieldConfig<Form, FieldName, Form[FieldName]>;
};

export type HoneyFormErrors<Form extends HoneyFormBaseForm> = {
  [K in keyof Form]: HoneyFormFieldError[];
};

export type HoneyFormDefaults<Form extends HoneyFormBaseForm> =
  | Partial<Form>
  | (() => Promise<Partial<Form>>);

export type HoneyFormOnSubmit<Form extends HoneyFormBaseForm, Response> = (
  data: Form,
) => Promise<Response>;

type HoneyFormOnChangeContext<Form extends HoneyFormBaseForm> = {
  formErrors: HoneyFormErrors<Form>;
};

export type HoneyFormOnChange<Form extends HoneyFormBaseForm> = (
  data: Form,
  context: HoneyFormOnChangeContext<Form>,
) => void;

export type HoneyFormOptions<Form extends HoneyFormBaseForm, Response> = {
  formIndex?: number;
  parentField?: HoneyFormParentField<Form>;
  //
  fields?: HoneyFormFieldsConfigs<Form>;
  defaults?: HoneyFormDefaults<Form>;
  //
  onSubmit?: HoneyFormOnSubmit<Form, Response>;
  onChange?: HoneyFormOnChange<Form>;
  onChangeDebounce?: number;
};

export type HoneyFormSetFormValues<Form extends HoneyFormBaseForm> = (
  values: Partial<Form>,
  options?: UseHoneyFormSetFormValuesOptions,
) => void;

export type HoneyFormAddFormField<Form extends HoneyFormBaseForm> = <FieldName extends keyof Form>(
  fieldName: FieldName,
  config: HoneyFormFieldConfig<Form, FieldName, Form[FieldName]>,
) => void;

/**
 * Non-optional fields cannot be removed
 */
export type HoneyFormRemoveFormField<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof Form,
>(
  fieldName: FieldName,
) => void;

export type HoneyFormAddFieldError<Form extends HoneyFormBaseForm> = <FieldName extends keyof Form>(
  fieldName: FieldName,
  error: HoneyFormFieldError,
) => void;

export type HoneyFormClearErrors = () => void;

export type HoneyFormValidate<Form extends HoneyFormBaseForm> = (
  fieldNames?: (keyof Form)[],
) => Promise<boolean>;

export type HoneyFormSubmit<Form extends HoneyFormBaseForm, Response> = (
  submitHandler?: (data: Form) => Promise<Response>,
) => Promise<void>;

type UseHoneyFormSetFormValuesOptions = {
  /**
   * Clear all field values before setting new values
   */
  clearAll?: boolean;
};

export type HoneyFormReset = () => void;

export type HoneyFormFormState = {
  isValidating: boolean;
  isSubmitting: boolean;
};

export type HoneyFormApi<Form extends HoneyFormBaseForm, Response> = {
  formFields: HoneyFormFields<Form>;
  formValues: Form;
  formDefaultValues: Partial<Form>;
  formErrors: HoneyFormErrors<Form>;
  isFormErred: boolean;
  isFormDefaultsFetching: boolean;
  isFormDefaultsFetchingErred: boolean;
  isFormDirty: boolean;
  isFormValidating: boolean;
  isFormValid: boolean;
  isFormSubmitting: boolean;
  isFormSubmitted: boolean;
  setFormValues: HoneyFormSetFormValues<Form>;
  addFormField: HoneyFormAddFormField<Form>;
  removeFormField: HoneyFormRemoveFormField<Form>;
  addFormFieldError: HoneyFormAddFieldError<Form>;
  clearFormErrors: HoneyFormClearErrors;
  validateForm: HoneyFormValidate<Form>;
  submitForm: HoneyFormSubmit<Form, Response>;
  resetForm: HoneyFormReset;
};

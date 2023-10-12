// https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3

import type {
  ReactElement,
  HTMLAttributes,
  MutableRefObject,
  RefObject,
  InputHTMLAttributes,
} from 'react';

type ArrayKeys<T> = {
  [K in keyof T]: T[K] extends any[] ? K : never;
}[keyof T];

type HoneyFormFieldName = string;

export type HoneyFormChildFormId = string;

// TODO: implement date type
export type HoneyFormFieldType = 'string' | 'numeric' | 'number' | 'email';

/**
 * Field error type.
 *
 * @remarks
 * The 'server' error type does not block the form submission flow.
 */
type HoneyFormFieldErrorType = 'required' | 'invalid' | 'server' | 'min' | 'max' | 'minMax';

/**
 * Represents an error message for a form field.
 * It can be a string or a React element.
 */
type HoneyFormFieldErrorMessage = string | ReactElement;

/**
 * Defines the structure of a basic form.
 */
export type HoneyFormBaseForm = Record<HoneyFormFieldName, unknown>;

/**
 * Represents a child form.
 */
export type ChildHoneyFormBaseForm = HoneyFormBaseForm;

/**
 * Utility type that extracts an array of child forms from a given field value.
 */
type ExtractHoneyFormChildForms<FieldValue> = FieldValue extends (infer ChildForm extends
  ChildHoneyFormBaseForm)[]
  ? ChildForm[]
  : never;

/**
 * Utility type that extracts a single child form from a given field value.
 */
type ExtractHoneyFormChildForm<FieldValue> = FieldValue extends (infer ChildForm extends
  ChildHoneyFormBaseForm)[]
  ? ChildForm
  : never;

/**
 * Defines two possible modes for form field interactions: `'change'` and `'blur'`.
 * This could be used to specify when field validation or other actions should occur.
 */
type HoneyFormFieldMode = 'change' | 'blur';

/**
 * Represents a mapping of error types.
 * This allows for custom error messages for different error types.
 */
type HoneyFormFieldErrorMessages = Partial<
  Record<HoneyFormFieldErrorType, HoneyFormFieldErrorMessage>
>;

/**
 * Represents a form field error with a specific error type and an associated error message.
 */
export type HoneyFormFieldError = {
  type: HoneyFormFieldErrorType;
  message: HoneyFormFieldErrorMessage;
};

/**
 * Result types that a field validator can return:
 * - `true`: Indicates a successful validation.
 * - `string`: Represents a custom error message.
 * - `ReactElement`: Denotes a custom error component (e.g., a translated message).
 * - `HoneyFormFieldError[]`: An array of error objects for more complex error handling.
 */
export type HoneyFormFieldValidationResult =
  | boolean
  | string
  | ReactElement
  | HoneyFormFieldError[];

/**
 * Options for setting a new field value
 */
type HoneyFormFieldSetValueOptions = {
  /**
   * Indicates whether setting a new field value should mark the form as "dirty".
   *
   * @default true
   */
  isDirty?: boolean;
  /**
   * Indicates whether the new field value should be formatted (e.g., run the format function).
   *
   * @default true
   */
  isFormat?: boolean;
  /**
   * Indicates whether the validation function should be executed after setting the new field value.
   *
   * @remarks
   * The validation will be run even if `false` is passed when any field error is present.
   *
   * @default true
   */
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
  value: ExtractHoneyFormChildForm<FieldValue>,
) => void;

export type HoneyFormRemoveFieldValue<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof { [F in keyof Form]: Form[F] extends unknown[] ? F : never },
>(
  fieldName: FieldName,
  formIndex: number,
) => void;

export type HoneyFormAddFieldError<Form extends HoneyFormBaseForm> = <FieldName extends keyof Form>(
  fieldName: FieldName,
  error: HoneyFormFieldError,
) => void;

type HoneyFormFieldOnChangeContext<Form extends HoneyFormBaseForm, FormContext> = {
  formFields: HoneyFormFields<Form, FormContext>;
};

export type HoneyFormFieldOnChange<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = (
  cleanValue: FieldValue | undefined,
  context: HoneyFormFieldOnChangeContext<Form, FormContext>,
) => void;

export type HoneyFormFieldValidatorContext<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = {
  context: FormContext;
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext, FieldValue>;
  formFields: HoneyFormFields<Form, FormContext>;
};

/**
 * A custom validation function for a form field. It should return one of the following:
 * - `true` (indicating the value is valid).
 * - An error message (indicating the value is invalid).
 * - An array of `HoneyFormFieldError` objects (for multiple errors).
 * - A `Promise` that resolves to any of the above responses.
 *
 * @param fieldValue - The current value of the field.
 * @param context - The validation context, containing the field configuration and other form fields.
 * @returns `true` if the value is valid, an error message if the value is invalid,
 *  an array of `HoneyFormFieldError` objects, or a `Promise` that resolves to any of these.
 */
export type HoneyFormFieldValidator<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = (
  fieldValue: FieldValue | undefined,
  context: HoneyFormFieldValidatorContext<Form, FieldName, FormContext, FieldValue>,
) => HoneyFormFieldValidationResult | Promise<HoneyFormFieldValidationResult>;

type HoneyFormFieldFilterContext<FormContext> = {
  context: FormContext;
};

export type HoneyFormFieldFilter<FieldValue, FormContext = undefined> = (
  value: FieldValue | undefined,
  context: HoneyFormFieldFilterContext<FormContext>,
) => FieldValue | undefined;

type HoneyFormFieldFormatterContext<FormContext> = {
  context: FormContext;
};

export type HoneyFormFieldFormatter<FieldValue, FormContext = undefined> = (
  value: FieldValue | undefined,
  context: HoneyFormFieldFormatterContext<FormContext>,
) => FieldValue | undefined;

type HoneyFormSkipFieldContext<Form extends HoneyFormBaseForm, FormContext> = {
  context: FormContext;
  formFields: HoneyFormFields<Form, FormContext>;
};

type HoneyFormSkipField<Form extends HoneyFormBaseForm, FormContext> = (
  context: HoneyFormSkipFieldContext<Form, FormContext>,
) => boolean;

/**
 * Base form field configuration.
 */
type BaseHoneyFormFieldConfig<
  T,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = Readonly<
  {
    /**
     * @default string
     */
    type?: HoneyFormFieldType;
    /**
     * @default false
     */
    required?: boolean;
    /**
     * @deprecated Please, use `defaultValue` field property or `defaults` form property
     * @default undefined
     */
    value?: FieldValue;
    /**
     * @default undefined
     */
    defaultValue?: FieldValue;
    /**
     * The minimum allowed value for numbers or minimum length for strings.
     *
     * @default undefined
     */
    min?: number;
    /**
     * The maximum allowed value for numbers or maximum length for strings.
     *
     * @default undefined
     */
    max?: number;
    /**
     * Indicates if decimal values are allowed.
     *
     * @default false
     */
    decimal?: boolean;
    /**
     * Indicates if negative values for number field type are allowed.
     *
     * @default true
     */
    negative?: boolean;
    /**
     * The maximum number of decimal places allowed for number field type.
     *
     * @default 2
     */
    maxFraction?: number;
    /**
     * Clears that field value when dependent field is changed.
     */
    dependsOn?: keyof Form | (keyof Form)[];
    /**
     * In depends on mode, the validation process is changed.
     *
     * @example
     * - If `change` mode is set, each typed character triggers the validation process.
     * - If `blur` mode is set, the validation will be triggered when focus leaves the input firstly,
     *  but the re-validate the new field value even validation field mode is `blur` if there is any error.
     *
     * @default change
     */
    mode?: HoneyFormFieldMode;
    /**
     * Custom error messages for this field.
     */
    errorMessages?: HoneyFormFieldErrorMessages;
    /**
     * Custom validation function.
     */
    validator?: HoneyFormFieldValidator<Form, FieldName, FormContext, FieldValue>;
    /**
     * A function to filter characters from the value.
     */
    filter?: HoneyFormFieldFilter<FieldValue, FormContext>;
    /**
     * A function to modify the field's value.
     */
    format?: HoneyFormFieldFormatter<FieldValue, FormContext>;
    /**
     * A boolean flag indicating whether the formatter function should be applied to the field's value when the focus is removed from the input (on blur).
     *
     * When set to `true`, the formatter is applied `onBlur`, allowing users to see the formatted value after they have finished editing.
     * When set to `false` (or omitted), the formatter is applied as characters are typed.
     *
     * @example
     * - If `true`, the formatter will be applied when focus leaves the input.
     * - If `false` (or omitted), the formatter is applied with each typed character.
     *
     * @remarks
     * Use this option to control the timing of applying the formatter function.
     * Set to `true` to show a formatted value after the user has completed input.
     *
     * @default false
     */
    formatOnBlur?: boolean;
    /**
     * Set as `true` when formatted field value should be submitted instead of clean value.
     */
    submitFormattedValue?: boolean;
    /**
     * Callback function triggered when the field value changes.
     */
    onChange?: HoneyFormFieldOnChange<Form, FieldName, FormContext, FieldValue>;
  } & T
>;

/**
 * Form field configuration.
 */
export type HoneyFormFieldConfig<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = BaseHoneyFormFieldConfig<
  {
    /**
     * A function to determine whether to skip validation and submission for this field.
     */
    skip?: HoneyFormSkipField<Form, FormContext>;
  },
  Form,
  FieldName,
  FormContext,
  FieldValue
>;

export type HoneyFormFieldInternalValidator = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
>(
  fieldValue: FieldValue | undefined,
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, any, FieldValue>,
  fieldErrors: HoneyFormFieldError[],
) => void;

export type HoneyFormValidateField<Form extends HoneyFormBaseForm> = <FieldName extends keyof Form>(
  fieldName: FieldName,
) => void;

export type HoneyFormFieldValueConvertor<FieldValue> = (value: any) => FieldValue;

/**
 * Represents the props for a form field component.
 * These props are typically used for input elements.
 *
 * @example
 * - `onFocus`: Callback function triggered when the field receives focus.
 * - `onBlur`: Callback function triggered when the field loses focus.
 * - `onChange`: Callback function triggered when the field value changes.
 * - `ref`: A reference to the field element.
 * - `value`: The current value of the field.
 * - `aria-required`: ARIA attribute indicating whether the field is required for accessibility.
 * - `aria-invalid`: ARIA attribute indicating whether the field is in an invalid state for accessibility.
 *
 * @remarks
 * When the `onBlur` event is triggered, and the field's mode is set to 'blur', the validation process
 *  will not be run if the field has the `readonly` property set to `true`.
 */
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

export type HoneyFormFieldsRef<
  Form extends ChildHoneyFormBaseForm,
  FormContext,
> = MutableRefObject<HoneyFormFields<Form, FormContext> | null>;

/**
 * Contextual information for child forms within a parent form.
 */
export type HoneyFormChildFormContext<ChildForm extends ChildHoneyFormBaseForm, FormContext> = {
  /**
   * The unique identifier for the child form.
   */
  id: HoneyFormChildFormId;
  /**
   * A reference to the form fields of the child form.
   */
  formFieldsRef: HoneyFormFieldsRef<ChildForm, FormContext>;
  /**
   * A function to submit the child form.
   */
  submitForm: HoneyFormSubmit<ChildForm, FormContext>;
  /**
   * A function to validate the child form.
   */
  validateForm: HoneyFormValidate<ChildForm>;
};

/**
 * Metadata associated with a form field.
 */
export type HoneyFormFieldMeta<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
> = {
  /**
   * Reference to form fields.
   */
  formFieldsRef: HoneyFormFieldsRef<Form, FormContext>;
  /**
   * Indicates if field validation is scheduled.
   */
  isValidationScheduled: boolean;
  /**
   * An array of child form contexts when applicable, or `undefined` initially.
   */
  childForms: Form[FieldName] extends (infer ChildForm extends ChildHoneyFormBaseForm)[]
    ? HoneyFormChildFormContext<ChildForm, undefined>[] | undefined
    : never;
};

export type HoneyFormField<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = Readonly<{
  /**
   * The default value initially set for the field.
   */
  defaultValue: FieldValue | undefined;
  /**
   * The unprocessed value, before any filtering or formatting.
   */
  rawValue: FieldValue | undefined;
  /**
   * The processed value after filtering and formatting. If there are errors, this may be `undefined`.
   */
  cleanValue: FieldValue | undefined;
  /**
   * The final, formatted value ready to be displayed to the user.
   */
  value: FieldValue | undefined;
  /**
   * An array of errors associated with this field.
   */
  errors: HoneyFormFieldError[];
  /**
   * An object with the necessary props to bind to the corresponding input element in the form.
   */
  props: HoneyFormFieldProps<Form, FieldName, FieldValue>;
  /**
   * Configuration options for this field.
   */
  config: HoneyFormFieldConfig<Form, FieldName, FormContext, FieldValue>;
  /**
   * A function to retrieve child forms' values if the field is a parent field.
   */
  getChildFormsValues: () => ExtractHoneyFormChildForms<FieldValue>;
  /**
   * A function to set the field's value.
   */
  setValue: (value: FieldValue, options?: HoneyFormFieldSetValueOptions) => void;
  /**
   * A function to add a new value to a parent field that can have child forms.
   */
  pushValue: (value: ExtractHoneyFormChildForm<FieldValue>) => void;
  /**
   * A function to remove a value from a parent field by its index.
   */
  removeValue: (formIndex: number) => void;
  /**
   * Reset field value to default value and clear all errors
   */
  resetValue: () => void;
  /**
   * A function to schedule validation for this field. Can only be used inside field's validator.
   */
  scheduleValidation: () => void;
  /**
   * A function to add an error to the field's error array.
   */
  addError: (error: HoneyFormFieldError) => void;
  /**
   * A function to clear all errors associated with this field.
   */
  clearErrors: () => void;
  /**
   * A function to focus on this field. Note: Can only be used when `props` are destructured within a component.
   */
  focus: () => void;
  /**
   * Internal metadata used by the library.
   */
  __meta__: HoneyFormFieldMeta<Form, FieldName, FormContext>;
}>;

export type HoneyFormParentField<
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  ParentFieldName extends ArrayKeys<ParentForm> = ArrayKeys<ParentForm>,
> = HoneyFormField<
  ParentForm,
  ParentFieldName,
  undefined,
  ParentForm[ParentFieldName] extends ChildForm[] ? ParentForm[ParentFieldName] : never
>;

export type HoneyFormFields<Form extends HoneyFormBaseForm, FormContext = undefined> = {
  [FieldName in keyof Form]: HoneyFormField<Form, FieldName, FormContext>;
};

/**
 * Field value can be `undefined` when default value was not set.
 */
export type HoneyFormValues<Form extends HoneyFormBaseForm> = {
  [FieldName in keyof Form]: Form[FieldName] | undefined;
};

/**
 * Form fields configuration.
 */
export type HoneyFormFieldsConfigs<Form extends HoneyFormBaseForm, FormContext = undefined> = {
  [FieldName in keyof Form]: HoneyFormFieldConfig<Form, FieldName, FormContext, Form[FieldName]>;
};

export type HoneyFormErrors<Form extends HoneyFormBaseForm> = {
  [FieldName in keyof Form]: HoneyFormFieldError[];
};

export type HoneyFormServerErrors<Form extends HoneyFormBaseForm> = {
  [FieldName in keyof Form]: HoneyFormFieldErrorMessage[];
};

export type HoneyFormDefaultValues<Form extends HoneyFormBaseForm> = Partial<Form>;

export type HoneyFormDefaultsRef<Form extends HoneyFormBaseForm> = MutableRefObject<
  HoneyFormDefaultValues<Form>
>;

export type HoneyFormDefaults<Form extends HoneyFormBaseForm> =
  | HoneyFormDefaultValues<Form>
  | (() => Promise<HoneyFormDefaultValues<Form>>);

type HoneyFormOnSubmitContext<FormContext> = {
  context: FormContext;
};

export type HoneyFormOnSubmit<Form extends HoneyFormBaseForm, FormContext = undefined> = (
  data: Form,
  context: HoneyFormOnSubmitContext<FormContext>,
) => Promise<HoneyFormServerErrors<Form> | void>;

/**
 * The context object provided to the `HoneyFormOnChange` callback function, containing information about form field changes.
 */
type HoneyFormOnChangeContext<Form extends HoneyFormBaseForm> = {
  /**
   * An object that includes all field errors.
   * When a field has any error, the field appears in this object as a key, and the value is an array of field errors.
   *
   * @default {}
   */
  formErrors: HoneyFormErrors<Form>;
};

/**
 * Represents a callback function triggered when any form field value changes.
 *
 * @param data - The current data of the form, including all form field values.
 * @param context - The context object providing additional information about the change, such as form field errors.
 */
export type HoneyFormOnChange<Form extends HoneyFormBaseForm> = (
  data: Form,
  context: HoneyFormOnChangeContext<Form>,
) => void;

export type InitialFormFieldsStateResolverOptions<Form extends HoneyFormBaseForm, FormContext> = {
  context: FormContext;
  formFieldsRef: HoneyFormFieldsRef<Form, FormContext>;
  formDefaultValuesRef: HoneyFormDefaultsRef<Form>;
  setFieldValue: HoneyFormSetFieldValueInternal<Form>;
  clearFieldErrors: HoneyFormClearFieldErrors<Form>;
  pushFieldValue: HoneyFormPushFieldValue<Form>;
  removeFieldValue: HoneyFormRemoveFieldValue<Form>;
  addFormFieldError: HoneyFormAddFieldError<Form>;
};

export type FormOptions<Form extends HoneyFormBaseForm, FormContext = undefined> = {
  initialFormFieldsStateResolver: (
    options: InitialFormFieldsStateResolverOptions<Form, FormContext>,
  ) => HoneyFormFields<Form, FormContext>;
  /**
   * Default values for the form fields.
   * Can be a Promise function to asynchronously retrieve defaults.
   */
  defaults?: HoneyFormDefaults<Form>;
  /**
   * Any object that can be used to pass contextual data to field functions.
   * This provides a way to share additional information or context with field-specific logic.
   */
  context?: FormContext;
  /**
   * A callback function triggered when the form is submitted.
   */
  onSubmit?: HoneyFormOnSubmit<Form, FormContext>;
  /**
   * A callback function triggered whenever the value of any form field changes.
   */
  onChange?: HoneyFormOnChange<Form>;
  /**
   * The debounce time in milliseconds for the `onChange` callback.
   * This sets a delay before the callback is invoked after a field value change.
   */
  onChangeDebounce?: number;
};

type BaseHoneyFormOptions<T, Form extends HoneyFormBaseForm, FormContext = undefined> = Omit<
  FormOptions<Form, FormContext>,
  'initialFormFieldsStateResolver'
> & {
  /**
   * Configuration for the form fields.
   */
  fields?: HoneyFormFieldsConfigs<Form, FormContext>;
} & T;

export type HoneyFormOptions<
  Form extends HoneyFormBaseForm,
  FormContext = undefined,
> = BaseHoneyFormOptions<
  {
    //
  },
  Form,
  FormContext
>;

export type ChildHoneyFormOptions<
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
> = BaseHoneyFormOptions<
  {
    /**
     * The index of a child form within a parent form, if applicable.
     */
    formIndex?: number;
    /**
     * A reference to a parent form field.
     * Use this to create nested forms where the parent field can have child forms.
     */
    parentField: HoneyFormParentField<ParentForm, ChildForm>;
  },
  ChildForm,
  FormContext
>;

type UseHoneyFormSetFormValuesOptions = {
  /**
   * Clear all field values before setting new values.
   */
  clearAll?: boolean;
};

export type HoneyFormSetFormValues<Form extends HoneyFormBaseForm> = (
  values: Partial<Form>,
  options?: UseHoneyFormSetFormValuesOptions,
) => void;

export type HoneyFormSetFormErrors<Form extends HoneyFormBaseForm> = (
  formErrors: HoneyFormErrors<Form>,
) => void;

export type HoneyFormAddFormField<Form extends HoneyFormBaseForm, FormContext> = <
  FieldName extends keyof Form,
>(
  fieldName: FieldName,
  config: HoneyFormFieldConfig<Form, FieldName, FormContext, Form[FieldName]>,
) => void;

/**
 * Non-optional fields cannot be removed.
 */
export type HoneyFormRemoveFormField<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof Form,
>(
  fieldName: FieldName,
) => void;

export type HoneyFormClearErrors = () => void;

/**
 * @param fieldNames - Optional list of field names for validation
 */
export type HoneyFormValidate<Form extends HoneyFormBaseForm> = (
  fieldNames?: (keyof Form)[],
) => Promise<boolean>;

type HoneyFormSubmitHandlerContext<FormContext> = {
  context: FormContext;
};

export type HoneyFormSubmit<Form extends HoneyFormBaseForm, FormContext = undefined> = (
  submitHandler?: (
    data: Form,
    context: HoneyFormSubmitHandlerContext<FormContext>,
  ) => Promise<HoneyFormServerErrors<Form> | void>,
) => Promise<void>;

export type HoneyFormReset = () => void;

export type HoneyFormFormState = {
  isValidating: boolean;
  isSubmitting: boolean;
};

export type HoneyFormApi<Form extends HoneyFormBaseForm, FormContext = undefined> = {
  /**
   * An object that contains the state of the form fields.
   *
   * @default {}
   */
  formFields: HoneyFormFields<Form, FormContext>;
  /**
   * Provides quick access to the current values of all form fields.
   *
   * @default {}
   */
  formValues: HoneyFormValues<Form>;
  /**
   * Provides quick access to the default values of all form fields.
   *
   * @default {}
   */
  formDefaultValues: HoneyFormDefaultValues<Form>;
  /**
   * @default {}
   */
  formErrors: HoneyFormErrors<Form>;
  /**
   * A boolean value that becomes `true` when the form has any error.
   * It remains `false` when the form is error-free.
   *
   * @default false
   */
  isFormErred: boolean;
  /**
   * @default false
   */
  isFormDefaultsFetching: boolean;
  /**
   * @default false
   */
  isFormDefaultsFetchingErred: boolean;
  /**
   * A boolean value that indicates whether any field value in the form has changed.
   * It is `false` by default and becomes `true` when any field value is changed.
   * It returns to `false` when the form is successfully submitted.
   *
   * @default false
   */
  isFormDirty: boolean;
  /**
   * A boolean value that becomes `true` when the form is in the process of validation.
   * It indicates that the validation of the form's fields is currently underway.
   *
   * @default false
   */
  isFormValidating: boolean;
  /**
   * A boolean value that becomes `true` when the process of form validation has successfully finished,
   *  and no errors have been detected in any of the form's fields.
   *
   * @default false
   */
  isFormValid: boolean;
  /**
   * A boolean value that indicates whether the form is currently submitting.
   *
   * @default false
   */
  isFormSubmitting: boolean;
  /**
   * A boolean value that becomes `true` when the form has been successfully submitted.
   * It resets to `false` when any field value is changed.
   *
   * @default false
   */
  isFormSubmitted: boolean;
  setFormValues: HoneyFormSetFormValues<Form>;
  setFormErrors: HoneyFormSetFormErrors<Form>;
  /**
   * Add a new field to the form.
   */
  addFormField: HoneyFormAddFormField<Form, FormContext>;
  removeFormField: HoneyFormRemoveFormField<Form>;
  addFormFieldError: HoneyFormAddFieldError<Form>;
  clearFormErrors: HoneyFormClearErrors;
  validateForm: HoneyFormValidate<Form>;
  submitForm: HoneyFormSubmit<Form, FormContext>;
  /**
   * Reset the form to the initial state.
   */
  resetForm: HoneyFormReset;
};

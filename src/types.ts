import type { ReactElement, MutableRefObject, RefObject, InputHTMLAttributes } from 'react';

type KeysWithArrayValues<T> = {
  [K in keyof T]: T[K] extends unknown[] ? K : never;
}[keyof T];

type HoneyFormFieldName = string;

export type HoneyFormChildFormId = string;

/**
 * Represents the types of interactive form fields that support dynamic user input.
 */
export type HoneyFormInteractiveFieldType = 'string' | 'numeric' | 'number' | 'email';

/**
 * Represents the types of static form fields that typically don't change based on user input.
 */
export type HoneyFormStaticFieldType = 'checkbox' | 'radio' | 'file';

/**
 * Represents the type of field to work with any object: array or object.
 */
export type HoneyFormObjectFieldType = 'object';

/**
 * Represents the array type of field to work with nested forms
 */
export type HoneyFormNestedFormsFieldType = 'nestedForms';

export type HoneyFormFieldType =
  | HoneyFormInteractiveFieldType
  | HoneyFormStaticFieldType
  | HoneyFormObjectFieldType
  | HoneyFormNestedFormsFieldType;

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
export type HoneyFormFieldErrorMessage = string | ReactElement;

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
 * Defines two possible modes for form field interactions: `change` and `blur`.
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

/**
 * Context object for interactive field validators. This includes information about the form,
 * the specific field being validated, and the context of the form.
 */
export type HoneyFormInteractiveFieldValidatorContext<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = {
  formContext: FormContext;
  fieldConfig: HoneyFormInteractiveFieldConfig<Form, FieldName, FormContext, FieldValue>;
  formFields: HoneyFormFields<Form, FormContext>;
};

/**
 * A custom validation function for an interactive form field. It should return one of the following:
 * - `true` (indicating the value is valid).
 * - An error message (indicating the value is invalid).
 * - An array of `HoneyFormFieldError` objects (for multiple errors).
 * - A `Promise` that resolves to any of the above responses.
 *
 * @returns `true` if the value is valid, an error message if the value is invalid,
 *  an array of `HoneyFormFieldError` objects, or a `Promise` that resolves to any of these.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormInteractiveFieldValidator<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = (
  /**
   * The current value of the field.
   */
  value: FieldValue | undefined,
  /**
   * The validation context, containing the field configuration and other form fields.
   */
  context: HoneyFormInteractiveFieldValidatorContext<Form, FieldName, FormContext, FieldValue>,
) => HoneyFormFieldValidationResult | Promise<HoneyFormFieldValidationResult>;

/**
 * Context object for static field validators. This includes information about the form,
 * the specific field being validated, and the context of the form.
 */
export type HoneyFormStaticFieldValidatorContext<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = {
  formContext: FormContext;
  fieldConfig: HoneyFormStaticFieldConfig<Form, FieldName, FormContext, FieldValue>;
  formFields: HoneyFormFields<Form, FormContext>;
};

/**
 * A custom validation function for a static form field. It should return one of the following:
 * - `true` (indicating the value is valid).
 * - An error message (indicating the value is invalid).
 * - An array of `HoneyFormFieldError` objects (for multiple errors).
 * - A `Promise` that resolves to any of the above responses.
 *
 * @returns `true` if the value is valid, an error message if the value is invalid,
 *  an array of `HoneyFormFieldError` objects, or a `Promise` that resolves to any of these.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormStaticFieldValidator<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = (
  /**
   * The current value of the object field.
   */
  value: FieldValue | undefined,
  /**
   * The validation context, containing the field configuration and other form fields.
   */
  context: HoneyFormStaticFieldValidatorContext<Form, FieldName, FormContext, FieldValue>,
) => HoneyFormFieldValidationResult | Promise<HoneyFormFieldValidationResult>;

/**
 * Context object passed to the validator function for an object field.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormObjectFieldValidatorContext<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = {
  /**
   * The context object for the entire form.
   */
  formContext: FormContext;
  /**
   * The configuration for the object field.
   */
  fieldConfig: HoneyFormObjectFieldConfig<Form, FieldName, FormContext, FieldValue>;
  /**
   * An object containing all form fields and their properties.
   */
  formFields: HoneyFormFields<Form, FormContext>;
};

/**
 * Validator function for an object field.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormObjectFieldValidator<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = (
  /**
   * The current value of the object field.
   */
  value: FieldValue | undefined,
  /**
   * Context object containing information about the form and field.
   */
  context: HoneyFormObjectFieldValidatorContext<Form, FieldName, FormContext, FieldValue>,
) => HoneyFormFieldValidationResult | Promise<HoneyFormFieldValidationResult>;

/**
 * Context object passed to the validator function for a nested forms field.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormNestedFormsFieldValidatorContext<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = {
  /**
   * The context object for the entire form.
   */
  formContext: FormContext;
  /**
   * The configuration for the object field.
   */
  fieldConfig: HoneyFormNestedFormsFieldConfig<Form, FieldName, FormContext, FieldValue>;
  /**
   * An object containing all form fields and their properties.
   */
  formFields: HoneyFormFields<Form, FormContext>;
};

/**
 * Validator function for a nested forms field within a larger form.
 *
 * @returns `true` if the value is valid, an error message if the value is invalid,
 *  an array of `HoneyFormFieldError` objects, or a `Promise` that resolves to any of these.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormNestedFormsFieldValidator<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = (
  /**
   * The current value of the field.
   */
  value: FieldValue | undefined,
  /**
   * The validation context, containing the field configuration and other form fields.
   */
  context: HoneyFormNestedFormsFieldValidatorContext<Form, FieldName, FormContext, FieldValue>,
) => HoneyFormFieldValidationResult | Promise<HoneyFormFieldValidationResult>;

type HoneyFormFieldFilterContext<FormContext> = {
  formContext: FormContext;
};

export type HoneyFormFieldFilter<FieldValue, FormContext = undefined> = (
  value: FieldValue | undefined,
  context: HoneyFormFieldFilterContext<FormContext>,
) => FieldValue | undefined;

type HoneyFormFieldFormatterContext<FormContext> = {
  formContext: FormContext;
};

export type HoneyFormFieldFormatter<FieldValue, FormContext = undefined> = (
  value: FieldValue | undefined,
  context: HoneyFormFieldFormatterContext<FormContext>,
) => FieldValue | undefined;

type HoneyFormSkipFieldContext<Form extends HoneyFormBaseForm, FormContext> = {
  formContext: FormContext;
  formFields: HoneyFormFields<Form, FormContext>;
};

type HoneyFormSkipField<Form extends HoneyFormBaseForm, FormContext> = (
  context: HoneyFormSkipFieldContext<Form, FormContext>,
) => boolean;

/**
 * Represents the base configuration for a form field.
 *
 * @template T - Additional properties specific to the field.
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
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
     * The type of the form field.
     */
    type: HoneyFormFieldType;
    /**
     * Indicates whether the field is required.
     *
     * @default false
     */
    required?: boolean;
    /**
     * The default value for the field.
     *
     * @default undefined
     */
    defaultValue?: FieldValue;
    /**
     * Clears the field value when the dependent field is changed.
     */
    dependsOn?: keyof Form | (keyof Form)[];
    /**
     * Custom error messages for this field.
     */
    errorMessages?: HoneyFormFieldErrorMessages;
    /**
     * Additional properties for configuring the field's HTML input element.
     *
     * @remarks
     * These properties can be used to customize the behavior of the HTML input element associated with the field.
     * This includes properties like field name, type, and any other valid HTML input attributes.
     */
    props?: Omit<
      /**
       * Base input HTML attributes excluding 'value', 'onChange', 'aria-required', and 'aria-invalid'.
       *
       * @remarks
       * These properties are excluded as they are handled internally by the form library.
       */
      InputHTMLAttributes<any>,
      'value' | 'onChange' | 'aria-required' | 'aria-invalid'
    >;
    /**
     * A function to determine whether to skip validation and submission for this field.
     */
    skip?: HoneyFormSkipField<Form, FormContext>;
    /**
     * Callback function triggered when the field value changes.
     */
    onChange?: HoneyFormFieldOnChange<Form, FieldName, FormContext, FieldValue>;
  } & T
>;

/**
 * Represents the configuration for an interactive form field within the context of a specific form.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormInteractiveFieldConfig<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = BaseHoneyFormFieldConfig<
  {
    /**
     * The type of the interactive form field.
     */
    type: HoneyFormInteractiveFieldType;
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
     * Custom validation function.
     */
    validator?: HoneyFormInteractiveFieldValidator<Form, FieldName, FormContext, FieldValue>;
    /**
     * A function to filter characters from the value.
     */
    filter?: HoneyFormFieldFilter<FieldValue, FormContext>;
    /**
     * A function to modify the field's value.
     */
    formatter?: HoneyFormFieldFormatter<FieldValue, FormContext>;
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
     *
     * @default false
     */
    submitFormattedValue?: boolean;
  },
  Form,
  FieldName,
  FormContext,
  FieldValue
>;

/**
 * Represents the configuration for a static form field within the context of a specific form.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
type HoneyFormStaticFieldConfig<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = BaseHoneyFormFieldConfig<
  {
    /**
     * The type of the static form field.
     */
    type: HoneyFormStaticFieldType;
    /**
     * Custom validation function.
     */
    validator?: HoneyFormStaticFieldValidator<Form, FieldName, FormContext, FieldValue>;
  },
  Form,
  FieldName,
  FormContext,
  FieldValue
>;

/**
 * Configuration for an object field within a larger form.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
type HoneyFormObjectFieldConfig<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = BaseHoneyFormFieldConfig<
  {
    /**
     * Type identifier for the object field.
     */
    type: HoneyFormNestedFormsFieldType;
    /**
     * Custom validator function for the object field.
     */
    validator?: HoneyFormObjectFieldValidator<Form, FieldName, FormContext, FieldValue>;
  },
  Form,
  FieldName,
  FormContext,
  FieldValue
>;

/**
 * Configuration for a nested forms field within a larger form.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
type HoneyFormNestedFormsFieldConfig<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = BaseHoneyFormFieldConfig<
  {
    type: HoneyFormNestedFormsFieldType;
    validator?: HoneyFormNestedFormsFieldValidator<Form, FieldName, FormContext, FieldValue>;
  },
  Form,
  FieldName,
  FormContext,
  FieldValue
>;

/**
 * Represents the configuration for a form field within the context of a specific form.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormFieldConfig<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> =
  | HoneyFormInteractiveFieldConfig<Form, FieldName, FormContext, FieldValue>
  | HoneyFormStaticFieldConfig<Form, FieldName, FormContext, FieldValue>
  | HoneyFormObjectFieldConfig<Form, FieldName, FormContext, FieldValue>
  | HoneyFormNestedFormsFieldConfig<Form, FieldName, FormContext, FieldValue>;

/**
 * Represents the configuration for a child form field within the context of a specific parent form.
 *
 * @template ParentForm - Type representing the parent form.
 * @template ChildForm - Type representing the child form.
 * @template FieldName - Name of the field in the child form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field in the child form.
 */
export type ChildHoneyFormFieldConfig<
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FieldName extends keyof ChildForm,
  FormContext = undefined,
  FieldValue extends ChildForm[FieldName] = ChildForm[FieldName],
> =
  | HoneyFormInteractiveFieldConfig<ChildForm, FieldName, FormContext, FieldValue>
  | HoneyFormStaticFieldConfig<ChildForm, FieldName, FormContext, FieldValue>;

/**
 * Represents a built-in form field validator function.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormFieldBuiltInValidator = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
>(
  fieldValue: FieldValue | undefined,
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, any, FieldValue>,
  fieldErrors: HoneyFormFieldError[],
) => void;

/**
 * Represents a built-in form field validator function specifically for interactive form fields.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormInteractiveFieldBuiltInValidator = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
>(
  fieldValue: FieldValue | undefined,
  fieldConfig: HoneyFormInteractiveFieldConfig<Form, FieldName, any, FieldValue>,
  fieldErrors: HoneyFormFieldError[],
) => void;

export type HoneyFormValidateField<Form extends HoneyFormBaseForm> = <FieldName extends keyof Form>(
  fieldName: FieldName,
) => void;

export type HoneyFormFieldValueConvertor<FieldValue> = (value: any) => FieldValue;

type GenericFieldHTMLAttributes<T> = Pick<
  InputHTMLAttributes<T>,
  'type' | 'name' | 'inputMode' | 'aria-required' | 'aria-invalid'
>;

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
export type HoneyFormInteractiveFieldProps<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = Readonly<
  GenericFieldHTMLAttributes<any> &
    Pick<InputHTMLAttributes<any>, 'onChange' | 'onBlur'> & {
      ref: RefObject<any>;
      value: FieldValue | undefined;
    }
>;

export type HoneyFormObjectFieldProps<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = Readonly<
  GenericFieldHTMLAttributes<any> & {
    ref: RefObject<any>;
    value: FieldValue | undefined;
    onChange: (value: FieldValue) => void;
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

/**
 * Represents the base structure and functionality of a form field.
 *
 * @template T - Additional properties specific to the field.
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
type BaseHoneyFormField<
  T,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = Readonly<
  {
    /**
     * Configuration options for this field.
     */
    config: HoneyFormFieldConfig<Form, FieldName, FormContext, FieldValue>;
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
     * A function to set the field's value.
     */
    setValue: (value: FieldValue, options?: HoneyFormFieldSetValueOptions) => void;
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
     * Built-in metadata used by the library.
     */
    __meta__: HoneyFormFieldMeta<Form, FieldName, FormContext>;
  } & T
>;

/**
 * Represents the state and functionality of a form field.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormField<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = BaseHoneyFormField<
  {
    /**
     * An object with the necessary props to bind to the corresponding input element in the form.
     */
    props: HoneyFormInteractiveFieldProps<Form, FieldName, FieldValue>;
    /**
     * A function to add a new value to a parent field that can have child forms.
     */
    pushValue: (value: ExtractHoneyFormChildForm<FieldValue>) => void;
    /**
     * A function to retrieve child forms' values if the field is a parent field.
     */
    getChildFormsValues: () => ExtractHoneyFormChildForms<FieldValue>;
    /**
     * A function to focus on this field. Note: Can only be used when `props` are destructured within a component.
     */
    focus: () => void;
  },
  Form,
  FieldName,
  FormContext,
  FieldValue
>;

/**
 * Represents the state and functionality of a parent field.
 *
 * @template ParentForm - Type representing the entire form where the parent field resides.
 * @template ParentFieldName - Name of the parent field in the form with array values.
 */
export type HoneyFormParentField<
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm> = KeysWithArrayValues<ParentForm>,
> = HoneyFormField<ParentForm, ParentFieldName>;

/**
 * Represents a collection of form fields.
 *
 * @template Form - Type representing the entire form.
 * @template FormContext - Contextual information for the form.
 */
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

/**
 * Child form fields configuration.
 */
export type ChildHoneyFormFieldsConfigs<
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
> = {
  [FieldName in keyof ChildForm]: ChildHoneyFormFieldConfig<
    ParentForm,
    ChildForm,
    FieldName,
    FormContext,
    ChildForm[FieldName]
  >;
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
  formContext: FormContext;
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
  formContext: FormContext;
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
   * Determines whether the form should be reset to its initial state after a successful submit.
   * The form will be reset only when the `onSubmit` callback does not return any errors.
   *
   * @default false
   */
  resetAfterSubmit?: boolean;
  /**
   * Any object that can be used to pass contextual data to field functions.
   * This provides a way to share additional information or context with field-specific logic.
   *
   * @remarks
   * Context data should be wrapped in `useMemo` to prevent unnecessary recalculations.
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
> &
  T;

export type HoneyFormOptions<
  Form extends HoneyFormBaseForm,
  FormContext = undefined,
> = BaseHoneyFormOptions<
  {
    /**
     * Configuration for the form fields.
     */
    fields?: HoneyFormFieldsConfigs<Form, FormContext>;
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
     * A reference to a parent form field.
     * Use this to create nested forms where the parent field can have child forms.
     */
    parentField: HoneyFormParentField<ParentForm>;
    /**
     * The index of a child form within a parent form, if applicable.
     */
    formIndex?: number;
    /**
     * Configuration for the form fields.
     */
    fields?: ChildHoneyFormFieldsConfigs<ParentForm, ChildForm, FormContext>;
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
 * Options for form validating
 */
type HoneyFormValidateOptions<Form extends HoneyFormBaseForm> = {
  /**
   * The names of the fields to be targeted for validation.
   * If provided, only these fields will be validated.
   */
  targetFields?: (keyof Form)[];
  /**
   * The names of the fields to be excluded from validation.
   * If provided, these fields will be skipped during validation.
   */
  excludeFields?: (keyof Form)[];
};

/**
 * @param fieldNames - Optional list of field names for validation
 */
export type HoneyFormValidate<Form extends HoneyFormBaseForm> = (
  options?: HoneyFormValidateOptions<Form>,
) => Promise<boolean>;

type HoneyFormSubmitHandlerContext<FormContext> = {
  formContext: FormContext;
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

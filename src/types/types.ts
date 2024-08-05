import type { ReactElement, MutableRefObject, RefObject, InputHTMLAttributes } from 'react';
import type { JSONValue } from './generic.types';

export type KeysWithArrayValues<T> = {
  [K in keyof T]: T[K] extends unknown[] ? K : never;
}[keyof T];

type HoneyFormFieldName = string;

export type HoneyFormId = string;

/**
 * Represents the types of interactive form fields that support dynamic user input.
 */
export type HoneyFormInteractiveFieldType = 'string' | 'numeric' | 'number' | 'email';

/**
 * Represents the types of passive form fields that typically don't change based on user input.
 */
export type HoneyFormPassiveFieldType = 'checkbox' | 'radio' | 'file';

/**
 * Represents the type of field to work with any object: array or object.
 */
export type HoneyFormObjectFieldType = 'object';

/**
 * Represents the array type of field to work with nested forms.
 */
export type HoneyFormNestedFormsFieldType = 'nestedForms';

export type HoneyFormFieldType =
  | HoneyFormInteractiveFieldType
  | HoneyFormPassiveFieldType
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
type HoneyFormExtractChildForms<FieldValue> = FieldValue extends (infer ChildForm extends
  ChildHoneyFormBaseForm)[]
  ? ChildForm[]
  : never;

/**
 * Utility type that extracts a single child form from a given field value.
 */
export type HoneyFormExtractChildForm<FieldValue> = FieldValue extends (infer ChildForm extends
  ChildHoneyFormBaseForm)[]
  ? ChildForm
  : never;

/**
 * Defines two possible modes for form field interactions: `change` and `blur`.
 * This could be used to specify when field validation or other actions should occur.
 */
type HoneyFormFieldMode = 'change' | 'blur';

/**
 * Context object for any field function.
 *
 * @template T - Additional properties specific to the field function.
 * @template Form - Type representing the entire form.
 * @template FormContext - Contextual information for the form.
 */
type BaseHoneyFormFieldFunctionContext<T, Form extends HoneyFormBaseForm, FormContext> = {
  /**
   * The contextual information for the form.
   */
  formContext: FormContext;
  /**
   * An object containing all form fields and their properties.
   */
  formFields: HoneyFormFields<Form, FormContext>;
  /**
   * The current values of all form fields.
   */
  formValues: HoneyFormValues<Form>;
} & T;

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
 * Represents the possible result types that a field validator can return:
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

type HoneyFormFieldSetInternalValueOptions = HoneyFormFieldSetValueOptions & {
  isPushValue?: boolean;
};

export type HoneyFormFieldSetInternalValue<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
>(
  fieldName: FieldName,
  value: FieldValue,
  options?: HoneyFormFieldSetInternalValueOptions,
) => void;

/**
 * A type representing a function that completes the asynchronous validation for a specific form field.
 *
 * @template Form - The type representing the form structure.
 * @template FieldName - The name of the field within the form to complete the validation for.
 *
 * @param {FieldName} fieldName - The name of the field whose asynchronous validation is being completed.
 */
export type HoneyFormFieldFinishAsyncValidation<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form = keyof Form,
> = (fieldName: FieldName) => void;

export type HoneyFormFieldClearErrors<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof Form,
>(
  fieldName: FieldName,
) => void;

export type HoneyFormFieldPushValue<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof { [F in keyof Form]: Form[F] extends unknown[] ? F : never },
  FieldValue extends Form[FieldName] = Form[FieldName],
>(
  fieldName: FieldName,
  value: HoneyFormExtractChildForm<FieldValue>,
) => void;

export type HoneyFormFieldRemoveValue<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof { [F in keyof Form]: Form[F] extends unknown[] ? F : never },
>(
  fieldName: FieldName,
  formIndex: number,
) => void;

/**
 * Function type for adding an error to a specific form field.
 *
 * @template Form - Type representing the entire form.
 */
export type HoneyFormFieldAddError<Form extends HoneyFormBaseForm> = <FieldName extends keyof Form>(
  fieldName: FieldName,
  error: HoneyFormFieldError,
) => void;

/**
 * Function type for adding errors to a specific form field.
 *
 * @template Form - Type representing the entire form.
 */
export type HoneyFormFieldAddErrors<Form extends HoneyFormBaseForm> = <
  FieldName extends keyof Form,
>(
  fieldName: FieldName,
  errors: HoneyFormFieldError[],
) => void;

/**
 * Represents the errors associated with each form field in a form.
 *
 * @template Form - Type representing the entire form.
 */
export type HoneyFormErrors<Form extends HoneyFormBaseForm> = {
  [FieldName in keyof Form]?: HoneyFormFieldError[];
};

/**
 * A function type for scheduling validation for another field in the form.
 * It takes the field name (excluding the current field) as a parameter.
 */
type HoneyFormScheduleFieldValidation<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
> = (fieldName: Exclude<keyof Form, FieldName>) => void;

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
 * The base context object for field validators.
 * It includes information about the entire form, specific form field being validated, and the context of the form.
 *
 * @template T - Additional context properties that can be provided by specific field validators.
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 */
type BaseHoneyFormFieldValidatorContext<
  T,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
> = BaseHoneyFormFieldFunctionContext<
  {
    /**
     * A function to schedule validation for another field.
     */
    scheduleValidation: HoneyFormScheduleFieldValidation<Form, FieldName>;
  },
  Form,
  FormContext
> &
  T;

/**
 * Context object for interactive field validators. This includes information about the form,
 * the specific field being validated, and the context of the form.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field being validated.
 * @template FormContext - The context object for the form.
 * @template FieldValue - The type of the field value.
 */
export type HoneyFormInteractiveFieldValidatorContext<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = BaseHoneyFormFieldValidatorContext<
  {
    fieldConfig: HoneyFormInteractiveFieldConfig<Form, FieldName, FormContext, FieldValue>;
  },
  Form,
  FieldName,
  FormContext
>;

/**
 * A custom validation function for an interactive form field. It should return one of the following:
 * - `true` (indicating the value is valid).
 * - An error message (indicating the value is invalid).
 * - An array of `HoneyFormFieldError` objects (for multiple errors).
 * - A `Promise` that resolves to any of the above responses.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 *
 * @returns `true` if the value is valid, an error message if the value is invalid,
 *  an array of `HoneyFormFieldError` objects, or a `Promise` that resolves to any of these.
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
 * Context object for passive field validators. This includes information about the form,
 * the specific field being validated, and the context of the form.
 */
export type HoneyFormPassiveFieldValidatorContext<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = BaseHoneyFormFieldValidatorContext<
  {
    fieldConfig: HoneyFormPassiveFieldConfig<Form, FieldName, FormContext, FieldValue>;
  },
  Form,
  FieldName,
  FormContext
>;

/**
 * A custom validation function for a passive form field. It should return one of the following:
 * - `true` (indicating the value is valid).
 * - An error message (indicating the value is invalid).
 * - An array of `HoneyFormFieldError` objects (for multiple errors).
 * - A `Promise` that resolves to any of the above responses.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 *
 * @returns `true` if the value is valid, an error message if the value is invalid,
 *  an array of `HoneyFormFieldError` objects, or a `Promise` that resolves to any of these.
 */
export type HoneyFormPassiveFieldValidator<
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
  context: HoneyFormPassiveFieldValidatorContext<Form, FieldName, FormContext, FieldValue>,
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
> = BaseHoneyFormFieldValidatorContext<
  {
    fieldConfig: HoneyFormObjectFieldConfig<Form, FieldName, FormContext, FieldValue>;
  },
  Form,
  FieldName,
  FormContext
>;

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
> = BaseHoneyFormFieldValidatorContext<
  {
    fieldConfig: HoneyFormNestedFormsFieldConfig<Form, FieldName, FormContext, FieldValue>;
  },
  Form,
  FieldName,
  FormContext
>;

/**
 * Validator function for a nested forms field within a larger form.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 *
 * @returns `true` if the value is valid, an error message if the value is invalid,
 *  an array of `HoneyFormFieldError` objects, or a `Promise` that resolves to any of these.
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

/**
 * A function type that defines how to deserialize a field's raw value from JSON into a form value.
 *
 * @template Form - The type representing the entire form.
 * @template FieldName - The name of the field being deserialized.
 *
 * @param {FieldName} fieldName - The name of the field for which the raw value is being deserialized.
 * @param {JSONValue} rawValue - The raw value from JSON that needs to be deserialized.
 *
 * @returns {Form[FieldName]} - The deserialized value for the field.
 */
export type HoneyFormFieldDeserializer<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form = keyof Form,
> = (fieldName: FieldName, rawValue: JSONValue) => Form[FieldName];

/**
 * Context object for the filter function of a form field.
 *
 * @template FormContext - Type representing the contextual information for the form.
 *
 * @property formContext - The contextual information for the form.
 */
type HoneyFormFieldFilterContext<FormContext> = {
  formContext: FormContext;
};

/**
 * Function type representing a filter for form field values.
 *
 * @template FieldValue - Type representing the value of the field.
 * @template FormContext - Type representing the contextual information for the form.
 *
 * @param value - The value to be filtered.
 * @param context - The context object containing information relevant to the form.
 *
 * @returns The filtered value, possibly transformed based on the provided context.
 */
export type HoneyFormFieldFilter<FieldValue, FormContext = undefined> = (
  value: FieldValue | undefined,
  context: HoneyFormFieldFilterContext<FormContext>,
) => FieldValue | undefined;

/**
 * Contextual information provided to a form field formatter function.
 *
 * @template FormContext - Type representing the contextual information for the form.
 *
 * @property formContext - The context object containing information relevant to the form.
 */
type HoneyFormFieldFormatterContext<FormContext> = {
  formContext: FormContext;
};

/**
 * Represents a formatter function for formatting the value of a form field.
 *
 * @template FieldValue - Type representing the value of the form field.
 * @template FormContext - Contextual information for the form.
 *
 * @param value - The current value of the form field.
 * @param context - The context object providing additional information for formatting.
 *
 * @returns The formatted value of the form field or undefined if no formatting is applied.
 */
export type HoneyFormFieldFormatter<FieldValue, FormContext = undefined> = (
  value: FieldValue | undefined,
  context: HoneyFormFieldFormatterContext<FormContext>,
) => FieldValue | undefined;

/**
 * Function type for determining whether to skip a field based on the form's context.
 *
 * @template Form - Type representing the entire form.
 * @template FormContext - Contextual information for the form.
 *
 * @param context - The context object containing form context and form fields.
 * @returns `true` if the field should be skipped, `false` otherwise.
 */
type HoneyFormSkipField<Form extends HoneyFormBaseForm, FormContext> = (
  context: BaseHoneyFormFieldFunctionContext<unknown, Form, FormContext>,
) => boolean;

/**
 * Base input HTML attributes excluding 'value', 'onChange', 'aria-required', and 'aria-invalid'.
 *
 * @remarks
 * These properties are excluded as they are handled internally by the form library.
 */
type HoneyFormFieldConfigProps = Omit<
  InputHTMLAttributes<any>,
  'value' | 'onChange' | 'aria-required' | 'aria-invalid'
>;

type HoneyFormFieldDependsOnFn<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = (
  initiatorFieldName: keyof Form,
  value: FieldValue | undefined,
  context: BaseHoneyFormFieldFunctionContext<unknown, Form, FormContext>,
) => boolean;

type HoneyFormFieldDependsOn<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
> = keyof Form | (keyof Form)[] | HoneyFormFieldDependsOnFn<Form, FieldName, FormContext>;

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
     * Note:
     * The default value remains as undefined when the form defaults are provided as a Promise function.
     *
     * @default undefined
     */
    defaultValue?: FieldValue;
    /**
     * Clears the field value when the dependent field is changed.
     */
    dependsOn?: HoneyFormFieldDependsOn<Form, FieldName, FormContext>;
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
    props?: HoneyFormFieldConfigProps;
    /**
     * A function to determine whether to skip validation and submission for this field.
     */
    skip?: HoneyFormSkipField<Form, FormContext>;
    /**
     * A function to serialize the field value into the appropriate JSON value.
     */
    serializer?: (fieldValue: FieldValue) => JSONValue;
    /**
     * A function to deserialize the raw value of the field from JSON into the appropriate form value.
     */
    deserializer?: (rawValue: JSONValue) => FieldValue;
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
 * Represents the configuration for a passive form field within the context of a specific form.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 */
export type HoneyFormPassiveFieldConfig<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = BaseHoneyFormFieldConfig<
  {
    /**
     * The type of the passive form field.
     */
    type: HoneyFormPassiveFieldType;
    /**
     * Custom validation function.
     */
    validator?: HoneyFormPassiveFieldValidator<Form, FieldName, FormContext, FieldValue>;
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
export type HoneyFormObjectFieldConfig<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = BaseHoneyFormFieldConfig<
  {
    /**
     * Type identifier for the object field.
     */
    type: HoneyFormObjectFieldType;
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
export type HoneyFormNestedFormsFieldConfig<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext = undefined,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = BaseHoneyFormFieldConfig<
  {
    /**
     * Type identifier for the nested forms field.
     */
    type: HoneyFormNestedFormsFieldType;
    /**
     * Custom validator function for the nested forms field.
     */
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
  | HoneyFormPassiveFieldConfig<Form, FieldName, FormContext, FieldValue>
  | HoneyFormObjectFieldConfig<Form, FieldName, FormContext, FieldValue>
  | HoneyFormNestedFormsFieldConfig<Form, FieldName, FormContext, FieldValue>;

/**
 * Represents the configuration for a child form field within the context of a specific parent form.
 *
 * @template ParentForm - Type representing the parent form.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template FieldName - Name of the field in the child form.
 * @template FormContext - Contextual information for the form.
 * @template ChildForm - Type representing the child form.
 * @template FieldValue - Type representing the value of the field in the child form.
 */
export type ChildHoneyFormFieldConfig<
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FieldName extends keyof ChildForm,
  FormContext = undefined,
  ChildForm extends HoneyFormExtractChildForm<
    ParentForm[ParentFieldName]
  > = HoneyFormExtractChildForm<ParentForm[ParentFieldName]>,
  FieldValue extends ChildForm[FieldName] = ChildForm[FieldName],
> =
  | HoneyFormInteractiveFieldConfig<ChildForm, FieldName, FormContext, FieldValue>
  | HoneyFormPassiveFieldConfig<ChildForm, FieldName, FormContext, FieldValue>
  | HoneyFormObjectFieldConfig<ChildForm, FieldName, FormContext, FieldValue>
  | HoneyFormNestedFormsFieldConfig<ChildForm, FieldName, FormContext, FieldValue>;

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

export type BaseHoneyFormFieldHTMLAttributes<T> = Omit<InputHTMLAttributes<T>, 'children'> & {
  ref: RefObject<T>;
};

/**
 * Represents the props for a form field component.
 * These props are typically used for input elements.
 *
 * @remarks
 * When the `onBlur` event is triggered, and the field's mode is set to 'blur', the validation process
 *  will not be run if the field has the `readonly` property set to `true`.
 *
 * @template BaseHoneyFormFieldHTMLAttributes - Base HTML attributes for a form field.
 */
export type HoneyFormInteractiveFieldProps<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = Readonly<
  Omit<BaseHoneyFormFieldHTMLAttributes<any>, 'value'> & {
    value: FieldValue | undefined;
  }
>;

/**
 * Represents the props for a passive form field, such as checkbox or radio.
 *
 * @remarks
 * These props include the base HTML attributes, checked state, and `onChange` handler.
 *
 * @template BaseHoneyFormFieldHTMLAttributes - Base HTML attributes for a form field.
 */
export type HoneyFormPassiveFieldProps = Readonly<BaseHoneyFormFieldHTMLAttributes<any>>;

/**
 * Represents the props for an object form field.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FieldValue - Type representing the value of the field.
 *
 * @remarks
 * These props include the base HTML attributes, a ref, the field value, and the `onChange` handler.
 */
export type HoneyFormObjectFieldProps<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = Readonly<
  Omit<BaseHoneyFormFieldHTMLAttributes<any>, 'value' | 'onChange'> & {
    value: FieldValue | undefined;
    onChange: (value: FieldValue | undefined) => void;
  }
>;

export type HoneyFormFieldsRef<
  Form extends ChildHoneyFormBaseForm,
  FormContext,
> = RefObject<HoneyFormFields<Form, FormContext> | null>;

/**
 * Contextual information for child forms within a parent form.
 */
export type HoneyFormChildFormContext<
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext,
> = {
  /**
   * The unique identifier for the form.
   */
  formId: HoneyFormId;
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

export type HoneyFormMeta = {
  //
};

/**
 * Metadata associated with a form field.
 */
export type HoneyFormFieldMeta<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  NestedFormsFieldName extends KeysWithArrayValues<Form> = KeysWithArrayValues<Form>,
> = {
  form: HoneyFormMeta;
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
  childForms: Form[NestedFormsFieldName] extends (infer ChildForm extends ChildHoneyFormBaseForm)[]
    ? HoneyFormChildFormContext<Form, ChildForm, NestedFormsFieldName, undefined>[] | undefined
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
     *
     * @default undefined
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
     *
     * @default []
     */
    errors: HoneyFormFieldError[];
    /**
     * Indicates whether the field is currently undergoing validation.
     *
     * @default false
     */
    isValidating: boolean;
    /**
     * A function to set the field's value.
     */
    setValue: (value: FieldValue, options?: HoneyFormFieldSetValueOptions) => void;
    /**
     * A function to remove a value from a parent field by its index.
     */
    removeValue: (formIndex: number) => void;
    /**
     * Reset field value to default value and clear all errors.
     */
    resetValue: () => void;
    /**
     * A function to add a new error to the field.
     */
    addError: (error: HoneyFormFieldError) => void;
    /**
     * A function to add the new errors to the field.
     */
    addErrors: (errors: HoneyFormFieldError[]) => void;
    /**
     * A function to clear all errors associated with this field.
     */
    clearErrors: () => void;
    /**
     * A function to validate the field.
     */
    validate: () => void;
    /**
     * Built-in metadata used by the library.
     */
    __meta__: HoneyFormFieldMeta<Form, FieldName, FormContext>;
  } & T
>;

export type HoneyFormFieldProps<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
> = {
  /**
   * An object with the necessary props to bind to the corresponding input element in the form.
   */
  props: HoneyFormInteractiveFieldProps<Form, FieldName, FieldValue> | undefined;
  /**
   * Properties for non-interactive fields (e.g., checkbox, radio, file).
   */
  passiveProps: HoneyFormPassiveFieldProps | undefined;
  /**
   * Properties for object fields, enabling direct handling of object values.
   */
  objectProps: HoneyFormObjectFieldProps<Form, FieldName, FieldValue> | undefined;
};

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
  HoneyFormFieldProps<Form, FieldName, FieldValue> & {
    /**
     * A function to add a new value to a parent field that can have child forms.
     */
    pushValue: (value: HoneyFormExtractChildForm<FieldValue>) => void;
    /**
     * A function to retrieve child forms' values if the field is a parent field.
     */
    getChildFormsValues: () => HoneyFormExtractChildForms<FieldValue>;
    /**
     * A function to focus on this field.
     *
     * Note:
     * Can only be used when `props` are destructured within a component.
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
 * Configuration for the fields of a child form within a parent form.
 *
 * @template ParentForm - The type representing the parent form structure.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template FormContext - The type representing the context associated with the form.
 * @template ChildForm - The type representing the child form structure.
 */
export type ChildHoneyFormFieldsConfigs<
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext = undefined,
  ChildForm extends HoneyFormExtractChildForm<
    ParentForm[ParentFieldName]
  > = HoneyFormExtractChildForm<ParentForm[ParentFieldName]>,
> = {
  [FieldName in keyof ChildForm]: ChildHoneyFormFieldConfig<
    ParentForm,
    ParentFieldName,
    FieldName,
    FormContext,
    ChildForm,
    ChildForm[FieldName]
  >;
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
type HoneyFormOnChangeContext<Form extends HoneyFormBaseForm, FormContext> = {
  /**
   * An object that contains the state of the form fields.
   *
   * @default {}
   */
  formFields: HoneyFormFields<Form, FormContext>;
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
export type HoneyFormOnChange<Form extends HoneyFormBaseForm, FormContext> = (
  data: Form,
  context: HoneyFormOnChangeContext<Form, FormContext>,
) => void;

export type InitialFormFieldsStateResolverOptions<Form extends HoneyFormBaseForm, FormContext> = {
  formContext: FormContext;
  formFieldsRef: HoneyFormFieldsRef<Form, FormContext>;
  formDefaultsRef: HoneyFormDefaultsRef<Form>;
  setFieldValue: HoneyFormFieldSetInternalValue<Form>;
  clearFieldErrors: HoneyFormFieldClearErrors<Form>;
  validateField: HoneyFormValidateField<Form>;
  pushFieldValue: HoneyFormFieldPushValue<Form>;
  removeFieldValue: HoneyFormFieldRemoveValue<Form>;
  addFormFieldErrors: HoneyFormFieldAddErrors<Form>;
};

export type FormOptions<
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  Form extends HoneyFormBaseForm,
  FormContext = undefined,
> = {
  initialFormFieldsStateResolver: (
    options: InitialFormFieldsStateResolverOptions<Form, FormContext>,
  ) => HoneyFormFields<Form, FormContext>;
  /**
   * Configuration for the form fields.
   */
  fields: {
    [FieldName in keyof Form]: BaseHoneyFormFieldConfig<
      unknown,
      Form,
      FieldName,
      FormContext,
      Form[FieldName]
    >;
  };
  /**
   * The form name to use the name for saving and restoring not submitted form data.
   *
   * @default undefined
   */
  name?: string;
  /**
   * A reference to a parent form field.
   * Use this to create nested forms where the parent field can have child forms.
   */
  parentField?: HoneyFormParentField<ParentForm, ParentFieldName>;
  /**
   * Default values for the form fields.
   * Can be a Promise function to asynchronously retrieve defaults.
   *
   * @default {}
   */
  defaults?: HoneyFormDefaults<Form>;
  /**
   * External values that can be provided to the form to synchronize its values.
   * If provided, the form will stay in sync with these external values.
   *
   * @remarks
   * The callback `onChange` will not be called when using this form field values synchronization.
   *
   * @default undefined
   */
  values?: Partial<Form>;
  /**
   * Determines whether the form should be reset to its initial state after a successful submit.
   * The form will be reset only when the `onSubmit` callback does not return any errors.
   *
   * @default false
   */
  resetAfterSubmit?: boolean;
  /**
   * Specifies whether the form should perform validation for external values.
   * If true, the form will validate the external values upon being set.
   * If false, the external values will be set without validation.
   *
   * @default false
   */
  validateExternalValues?: boolean;
  /**
   * Always run validation for the parent form field when any child field value is changed.
   *
   * This option ensures that changes in child form fields trigger validation in the
   * corresponding parent form field, maintaining overall form integrity.
   *
   * When set to `false`, the parent field will be validated only when a child field has errors
   * or when errors in a child field are cleared. This helps in notifying the parent form about
   * changes in the validation state of its child fields without performing redundant renders (validations).
   *
   * @default false
   */
  alwaysValidateParentField?: boolean;
  /**
   * Where to store the fields values when they changed and restore the values from storage.
   *
   * @default undefined
   */
  storage?: 'qs' | 'ls';
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
  onChange?: HoneyFormOnChange<Form, FormContext>;
  /**
   * The debounce time in milliseconds for the `onChange` callback.
   * This sets a delay before the callback is invoked after a field value change.
   *
   * @default 0
   */
  onChangeDebounce?: number;
};

type BaseHoneyFormOptions<
  T,
  Form extends HoneyFormBaseForm,
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext = undefined,
> = Omit<
  FormOptions<ParentForm, ParentFieldName, Form, FormContext>,
  'initialFormFieldsStateResolver' | 'fields' | 'parentField'
> &
  T;

export type HoneyFormOptions<Form extends HoneyFormBaseForm, FormContext = undefined> = Omit<
  BaseHoneyFormOptions<
    {
      /**
       * Configuration for the form fields.
       */
      fields?: HoneyFormFieldsConfigs<Form, FormContext>;
    },
    Form,
    never,
    never,
    FormContext
  >,
  'alwaysValidateParentField'
>;

/**
 * Options for configuring a child form within a parent form.
 *
 * @template ParentForm - The type representing the parent form structure.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template FormContext - The type representing the context associated with the form.
 * @template ChildForm - The type representing the child form structure.
 */
export type ChildHoneyFormOptions<
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext = undefined,
  ChildForm extends HoneyFormExtractChildForm<
    ParentForm[ParentFieldName]
  > = HoneyFormExtractChildForm<ParentForm[ParentFieldName]>,
> = Omit<
  BaseHoneyFormOptions<
    {
      /**
       * A reference to a parent form field.
       * Use this to create nested forms where the parent field can have child forms.
       */
      parentField: HoneyFormParentField<ParentForm, ParentFieldName>;
      /**
       * Configuration for the form fields.
       */
      fields?: ChildHoneyFormFieldsConfigs<ParentForm, ParentFieldName, FormContext>;
      /**
       * The index of a child form within a parent form, if applicable.
       */
      formIndex?: number;
    },
    ChildForm,
    ParentForm,
    ParentFieldName,
    FormContext
  >,
  'name' | 'storage'
>;

type MultiHoneyFormsOnSubmitContext<FormContext> = {
  formContext: FormContext;
};

/**
 * Represents the options for configuring the multi forms.
 *
 * @template Form - Type representing the entire form.
 * @template FormContext - Contextual information for the form.
 */
export type MultiHoneyFormOptions<Form extends HoneyFormBaseForm, FormContext = undefined> = {
  /**
   * Any object that can be used to pass contextual data to forms.
   * This provides a way to share additional information or context with field-specific logic.
   *
   * @remarks
   * Context data should be wrapped in `useMemo` to prevent unnecessary recalculations.
   */
  context?: FormContext;
  /**
   * A callback function that will be invoked only when all forms have successfully passed validation.
   *
   * @param {Form[]} data - An array containing the data from all forms.
   * @param {MultiHoneyFormsOnSubmitContext<FormContext>} context - The contextual information for the submission process.
   *
   * @returns {Promise<void>} - A Promise that resolves when the submission process is complete.
   */
  onSubmit?: (data: Form[], context: MultiHoneyFormsOnSubmitContext<FormContext>) => Promise<void>;
};

/**
 * Options allowing customization of form values setting behavior.
 */
type UseHoneyFormSetFormValuesOptions = {
  /**
   * If `true`, the form will be validated after setting these values.
   *
   * @default true
   */
  isValidate?: boolean;
  /**
   * Indicates whether setting a new form values should mark the form as "dirty".
   *
   * @default true
   */
  isDirty?: boolean;
  /**
   * If `true`, clear all field values before setting new values.
   */
  isClearAll?: boolean;
  /**
   * If `true`, skips the debounced `onChange` handling.
   *
   * @default false
   */
  isSkipOnChange?: boolean;
};

/**
 * Type representing a function to set values, allowing partial updates and options customization.
 *
 * @template Form - Type representing the entire form.
 */
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
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext, Form[FieldName]>,
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
 * Represents a function to validate a form.
 *
 * @param {string[]} [fieldNames] - Optional list of field names for validation.
 *
 * @returns {Promise<boolean>} - A Promise that resolves to `true` if the form passes validation, or `false` otherwise.
 */
export type HoneyFormValidate<Form extends HoneyFormBaseForm> = (
  options?: HoneyFormValidateOptions<Form>,
) => Promise<boolean>;

/**
 * Represents a context object for the submit handler function.
 *
 * @template FormContext - Contextual information for the form.
 */
type HoneyFormSubmitHandlerContext<FormContext> = {
  /**
   * The contextual information for the form submission.
   */
  formContext: FormContext;
};

/**
 * Represents a function to handle form submission.
 *
 * @template Form - Type representing the entire form.
 * @template FormContext - Contextual information for the form.
 *
 * @param {Form} data - The data of the form to be submitted.
 * @param {HoneyFormSubmitHandlerContext<FormContext>} context - The context object for the form submission.
 *
 * @returns {Promise<HoneyFormServerErrors<Form> | void>} - A Promise that resolves to server errors if any, or `void` if submission succeeds.
 */
export type HoneyFormSubmitHandler<Form extends HoneyFormBaseForm, FormContext = undefined> = (
  data: Form,
  context: HoneyFormSubmitHandlerContext<FormContext>,
) => Promise<HoneyFormServerErrors<Form> | void>;

/**
 * Represents a function to submit a form.
 *
 * @template Form - Type representing the entire form.
 * @template FormContext - Contextual information for the form.
 *
 * @param {HoneyFormSubmitHandler<Form, FormContext>} [submitHandler] - Optional submit handler function to handle form submission.
 *
 * @returns {Promise<void>} - A Promise that resolves once the form submission is complete.
 */
export type HoneyFormSubmit<Form extends HoneyFormBaseForm, FormContext = undefined> = (
  submitHandler?: HoneyFormSubmitHandler<Form, FormContext>,
) => Promise<void>;

/**
 * Represents a function to reset a form.
 *
 * @template Form - Type representing the entire form.
 *
 * @param {HoneyFormDefaultValues<Form>} [newFormDefaults] - Optional new default values for the form fields.
 */
export type HoneyFormReset<Form extends HoneyFormBaseForm> = (
  newFormDefaults?: HoneyFormDefaultValues<Form>,
) => void;

/**
 * Restore unfinished form from the storage if detected.
 */
export type HoneyFormRestoreUnfinishedForm = () => void;

export type HoneyFormState = {
  isValidating: boolean;
  isSubmitting: boolean;
};

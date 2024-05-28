import type { HTMLAttributes, HTMLInputTypeAttribute, RefObject } from 'react';
import { createRef } from 'react';

import type {
  HoneyFormBaseForm,
  HoneyFormFieldConfig,
  HoneyFormFieldError,
  HoneyFormFields,
  HoneyFormField,
  HoneyFormFieldType,
  HoneyFormFieldValidationResult,
  HoneyFormFieldValueConvertor,
  HoneyFormFieldSetInternalValue,
  HoneyFormFieldPushValue,
  HoneyFormFieldRemoveValue,
  HoneyFormFieldAddErrors,
  HoneyFormFieldClearErrors,
  HoneyFormFieldProps,
  HoneyFormFieldSetChildFormsErrors,
  HoneyFormFieldMeta,
  HoneyFormDefaultsRef,
  HoneyFormFieldsRef,
  BaseHoneyFormFieldHTMLAttributes,
  HoneyFormObjectFieldProps,
  HoneyFormInteractiveFieldConfig,
  HoneyFormPassiveFieldConfig,
  HoneyFormObjectFieldConfig,
  HoneyFormPassiveFieldProps,
  HoneyFormInteractiveFieldProps,
  HoneyFormValidateField,
  HoneyFormParentField,
  KeysWithArrayValues,
} from './types';
import {
  INTERACTIVE_FIELD_TYPE_VALIDATORS_MAP,
  BUILT_IN_FIELD_VALIDATORS,
  BUILT_IN_INTERACTIVE_FIELD_VALIDATORS,
  PASSIVE_FIELD_TYPE_VALIDATORS_MAP,
} from './validators';
import {
  checkIfFieldIsInteractive,
  checkIfFieldIsNestedForms,
  checkIfFieldIsObject,
  checkIfFieldIsPassive,
  forEachFormField,
  getFormValues,
  checkIsSkipField,
  scheduleFieldValidation,
} from './helpers';
import { HONEY_FORM_ERRORS } from './constants';

const FIELD_TYPE_MAP: Partial<Record<HoneyFormFieldType, HTMLInputTypeAttribute>> = {
  email: 'email',
  checkbox: 'checkbox',
  radio: 'radio',
  file: 'file',
};

const DEFAULT_FIELD_VALUE_CONVERTORS_MAP: Partial<
  Record<HoneyFormFieldType, HoneyFormFieldValueConvertor<any>>
> = {
  number: value => (value ? Number(value) : undefined),
};

/**
 * Gets the appropriate input mode for a given form field based on its configuration.
 *
 * @remarks
 * This function is useful for setting the `inputMode` attribute of HTML input elements.
 *
 * @template Form - The form type.
 * @template FieldName - The field name.
 *
 * @param fieldConfig - The configuration of the form field.
 *
 * @returns The HTML input mode for the field, or `undefined` if not specified.
 */
const getFieldInputMode = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext>,
): HTMLAttributes<any>['inputMode'] | undefined => {
  if (fieldConfig.type === 'number' && fieldConfig.decimal) {
    return 'decimal';
  }

  const fieldTypeInputModeMap: Partial<
    Record<HoneyFormFieldType, HTMLAttributes<any>['inputMode']>
  > = {
    email: 'email',
    number: 'numeric',
    numeric: 'numeric',
  };

  return fieldTypeInputModeMap[fieldConfig.type];
};

/**
 * Gets the base HTML attributes for a form field.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 *
 * @param {FieldName} fieldName - The name of the field.
 * @param {RefObject<HTMLElement>} formFieldRef - Reference to the form field element.
 * @param {HoneyFormFieldConfig<Form, FieldName, FormContext>} fieldConfig - Configuration options for the field.
 *
 * @returns {BaseHoneyFormFieldHTMLAttributes<any>} - The base HTML attributes for the form field.
 */
const getBaseFieldProps = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  fieldName: FieldName,
  formFieldRef: RefObject<HTMLElement>,
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext>,
): BaseHoneyFormFieldHTMLAttributes<any> => {
  return {
    ref: formFieldRef,
    type: FIELD_TYPE_MAP[fieldConfig.type],
    inputMode: getFieldInputMode(fieldConfig),
    name: fieldName.toString(),
    // ARIA
    'aria-required': fieldConfig.required,
    'aria-invalid': false,
  };
};

type InteractiveFieldPropsOptions<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
> = {
  formFieldRef: RefObject<HTMLElement>;
  fieldConfig: HoneyFormInteractiveFieldConfig<Form, FieldName, FormContext>;
  setFieldValue: HoneyFormFieldSetInternalValue<Form>;
};

/**
 * Gets the interactive field properties for a form field.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 *
 * @param {FieldName} fieldName - The name of the field.
 * @param {FieldValue} fieldValue - The current value of the field.
 * @param {InteractiveFieldPropsOptions<Form, FieldName, FormContext>} options - Options for interactive field properties.
 *
 * @returns {HoneyFormInteractiveFieldProps<Form, FieldName, FieldValue>} - The interactive field properties.
 */
const getInteractiveFieldProps = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName],
>(
  fieldName: FieldName,
  fieldValue: FieldValue,
  {
    formFieldRef,
    fieldConfig,
    setFieldValue,
  }: InteractiveFieldPropsOptions<Form, FieldName, FormContext>,
): HoneyFormInteractiveFieldProps<Form, FieldName, FieldValue> => {
  const baseFieldProps = getBaseFieldProps(fieldName, formFieldRef, fieldConfig);

  return {
    ...baseFieldProps,
    value: fieldValue ?? ('' as FieldValue),
    //
    onChange: e => {
      setFieldValue(fieldName, e.target.value, {
        isValidate: fieldConfig.mode === 'change',
        isFormat: !fieldConfig.formatOnBlur,
      });
    },
    ...((fieldConfig.mode === 'blur' || fieldConfig.formatOnBlur) && {
      onBlur: e => {
        if (!e.target.readOnly) {
          setFieldValue(fieldName, e.target.value);
        }
      },
    }),
    // Additional field properties from field configuration
    ...fieldConfig.props,
  };
};

type PassiveFieldPropsOptions<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
> = {
  formFieldRef: RefObject<HTMLElement>;
  fieldConfig: HoneyFormPassiveFieldConfig<Form, FieldName, FormContext>;
  setFieldValue: HoneyFormFieldSetInternalValue<Form>;
};

/**
 * Gets the passive field properties for a form field.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 *
 * @param {FieldName} fieldName - The name of the field.
 * @param {PassiveFieldPropsOptions<Form, FieldName, FormContext>} options - Options for passive field properties.
 *
 * @returns {HoneyFormPassiveFieldProps} - The passive field properties.
 */
const getPassiveFieldProps = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  fieldName: FieldName,
  {
    formFieldRef,
    fieldConfig,
    setFieldValue,
  }: PassiveFieldPropsOptions<Form, FieldName, FormContext>,
): HoneyFormPassiveFieldProps => {
  const baseFieldProps = getBaseFieldProps(fieldName, formFieldRef, fieldConfig);

  return {
    ...baseFieldProps,
    ...(fieldConfig.type === 'checkbox' && {
      checked: (fieldConfig.defaultValue as boolean) ?? false,
    }),
    //
    onChange: e => {
      let newFieldValue: Form[FieldName];

      if (fieldConfig.type === 'checkbox') {
        newFieldValue = e.target.checked as Form[FieldName];
        //
      } else if (fieldConfig.type === 'file') {
        newFieldValue = e.target.files as Form[FieldName];
        //
      } else {
        newFieldValue = e.target.value as Form[FieldName];
      }

      setFieldValue(fieldName, newFieldValue, {
        isFormat: false,
      });
    },
    // Additional field properties from field configuration
    ...fieldConfig.props,
  };
};

type ObjectFieldPropsOptions<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
> = {
  formFieldRef: RefObject<HTMLElement>;
  fieldConfig: HoneyFormObjectFieldConfig<Form, FieldName, FormContext>;
  setFieldValue: HoneyFormFieldSetInternalValue<Form>;
};

/**
 * Gets the object field properties for a form field.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 *
 *  @param {FieldName} fieldName - The name of the field.
 * @param {FieldValue} fieldValue - The current value of the field.
 * @param {ObjectFieldPropsOptions<Form, FieldName, FormContext>} options - Options for object field properties.
 *
 * @returns {HoneyFormObjectFieldProps<Form, FieldName, FieldValue>} - The object field properties.
 */
const getObjectFieldProps = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName],
>(
  fieldName: FieldName,
  fieldValue: FieldValue,
  {
    formFieldRef,
    fieldConfig,
    setFieldValue,
  }: ObjectFieldPropsOptions<Form, FieldName, FormContext>,
): HoneyFormObjectFieldProps<Form, FieldName, FieldValue> => {
  const baseFieldProps = getBaseFieldProps(fieldName, formFieldRef, fieldConfig);

  return {
    ...baseFieldProps,
    value: fieldValue,
    //
    onChange: newFieldValue => {
      setFieldValue(fieldName, newFieldValue, {
        isFormat: false,
      });
    },
    // Additional field properties from field configuration
    ...fieldConfig.props,
  };
};

type FieldPropsOptions<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
> = {
  formFieldRef: RefObject<HTMLElement>;
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext>;
  setFieldValue: HoneyFormFieldSetInternalValue<Form>;
};

/**
 * Gets the properties for a form field based on its type.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 *
 * @param {FieldName} fieldName - The name of the field.
 * @param {FieldValue} fieldValue - The current value of the field.
 * @param {FieldPropsOptions<Form, FieldName, FormContext>} options - Options for field properties.
 *
 * @returns {HoneyFormFieldProps<Form, FieldName, FieldValue>} - The field properties.
 */
const getFieldProps = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName],
>(
  fieldName: FieldName,
  fieldValue: FieldValue,
  { formFieldRef, fieldConfig, setFieldValue }: FieldPropsOptions<Form, FieldName, FormContext>,
): HoneyFormFieldProps<Form, FieldName, FieldValue> => {
  const isFieldInteractive = checkIfFieldIsInteractive(fieldConfig);
  if (isFieldInteractive) {
    return {
      passiveProps: undefined,
      objectProps: undefined,
      props: getInteractiveFieldProps(fieldName, fieldValue, {
        formFieldRef,
        fieldConfig,
        setFieldValue,
      }),
    };
  }

  const isFieldPassive = checkIfFieldIsPassive(fieldConfig);
  if (isFieldPassive) {
    return {
      props: undefined,
      objectProps: undefined,
      passiveProps: getPassiveFieldProps(fieldName, {
        formFieldRef,
        fieldConfig,
        setFieldValue,
      }),
    };
  }

  const isFieldObject = checkIfFieldIsObject(fieldConfig);
  if (isFieldObject) {
    return {
      props: undefined,
      passiveProps: undefined,
      objectProps: getObjectFieldProps(fieldName, fieldValue, {
        formFieldRef,
        fieldConfig,
        setFieldValue,
      }),
    };
  }

  return {
    props: undefined,
    passiveProps: undefined,
    objectProps: undefined,
  };
};

type CreateFieldOptions<Form extends HoneyFormBaseForm, FormContext> = {
  formContext: FormContext;
  formFieldsRef: HoneyFormFieldsRef<Form, FormContext>;
  formDefaultsRef: HoneyFormDefaultsRef<Form>;
  setFieldValue: HoneyFormFieldSetInternalValue<Form>;
  clearFieldErrors: HoneyFormFieldClearErrors<Form>;
  validateField: HoneyFormValidateField<Form>;
  pushFieldValue: HoneyFormFieldPushValue<Form>;
  removeFieldValue: HoneyFormFieldRemoveValue<Form>;
  addFormFieldErrors: HoneyFormFieldAddErrors<Form>;
  setFieldChildFormsErrors: HoneyFormFieldSetChildFormsErrors<Form>;
};

export const createField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  fieldName: FieldName,
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext>,
  {
    formContext,
    formFieldsRef,
    formDefaultsRef,
    setFieldValue,
    clearFieldErrors,
    validateField,
    pushFieldValue,
    removeFieldValue,
    addFormFieldErrors,
    setFieldChildFormsErrors,
  }: CreateFieldOptions<Form, FormContext>,
): HoneyFormField<Form, FieldName, FormContext> => {
  const config: HoneyFormFieldConfig<Form, FieldName, FormContext> = {
    required: false,
    ...(checkIfFieldIsInteractive(fieldConfig) && {
      // Set default config values
      mode: 'change',
      formatOnBlur: false,
      submitFormattedValue: false,
    }),
    ...fieldConfig,
  };

  const formFieldRef = createRef<HTMLElement>();

  // Set initial field value as the default value
  formDefaultsRef.current[fieldName] = config.defaultValue;

  const isFieldInteractive = checkIfFieldIsInteractive(config);

  const filteredValue =
    isFieldInteractive && config.filter
      ? config.filter(config.defaultValue, { formContext })
      : config.defaultValue;

  const formattedValue =
    isFieldInteractive && config.formatter
      ? config.formatter(filteredValue, { formContext })
      : filteredValue;

  const fieldMeta: HoneyFormFieldMeta<Form, FieldName, FormContext> = {
    formFieldsRef,
    isValidationScheduled: false,
    childForms: undefined,
  };

  const fieldProps = getFieldProps(fieldName, formattedValue, {
    formFieldRef,
    setFieldValue,
    fieldConfig: config,
  });

  const newFormField: HoneyFormField<Form, FieldName, FormContext> = {
    ...fieldProps,
    config,
    errors: [],
    childFormsErrors: [],
    defaultValue: config.defaultValue,
    rawValue: filteredValue,
    cleanValue: filteredValue,
    value: formattedValue,
    // TODO: try to fix the next error
    // @ts-expect-error
    getChildFormsValues: () => {
      return (
        fieldMeta.childForms?.map(childForm => {
          const childFormFields = childForm.formFieldsRef.current;
          if (!childFormFields) {
            throw new Error(HONEY_FORM_ERRORS.emptyFormFieldsRef);
          }

          return getFormValues(childFormFields);
          // Return field value when child forms are not mounted yet at the beginning, but the field value is set as initial value
        }) ?? formattedValue
      );
    },
    __meta__: fieldMeta,
    // functions
    setValue: (value, options) => setFieldValue(fieldName, value, options),
    pushValue: value => pushFieldValue(fieldName, value),
    removeValue: formIndex => removeFieldValue(fieldName, formIndex),
    resetValue: () => setFieldValue(fieldName, formDefaultsRef.current[fieldName]),
    //
    addErrors: errors => addFormFieldErrors(fieldName, errors),
    addError: error => addFormFieldErrors(fieldName, [error]),
    setChildFormsErrors: errors => setFieldChildFormsErrors(fieldName, errors),
    clearErrors: () => clearFieldErrors(fieldName),
    validate: () => validateField(fieldName),
    focus: () => {
      if (!formFieldRef.current) {
        throw new Error(HONEY_FORM_ERRORS.emptyFormFieldsRef);
      }

      formFieldRef.current.focus();
    },
  };

  return newFormField;
};

/**
 * Returns the next state of a form field with errors cleared.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field.
 * @template FormContext - The context of the form.
 *
 * @param {HoneyFormField<Form, FieldName, FormContext>} formField - The current state of the form field.
 *
 * @returns {HoneyFormField<Form, FieldName, FormContext>} - The next state with errors cleared.
 */
export const getNextErrorsFreeField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
): HoneyFormField<Form, FieldName, FormContext> => {
  const isFieldInteractive = checkIfFieldIsInteractive(formField.config);
  const isFieldPassive = checkIfFieldIsPassive(formField.config);
  const isFieldObject = checkIfFieldIsObject(formField.config);

  const props = isFieldInteractive
    ? {
        ...formField.props,
        'aria-invalid': false,
      }
    : undefined;

  const passiveProps = isFieldPassive
    ? {
        ...formField.passiveProps,
        'aria-invalid': false,
      }
    : undefined;

  const objectProps = isFieldObject
    ? {
        ...formField.objectProps,
        'aria-invalid': false,
      }
    : undefined;

  return {
    ...formField,
    props,
    passiveProps,
    objectProps,
    cleanValue: undefined,
    errors: [],
  };
};

/**
 * Returns the next state of a form field with specified errors.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field.
 * @template FormContext - The context of the form.
 *
 * @param {HoneyFormField<Form, FieldName, FormContext>} formField - The current state of the form field.
 * @param {HoneyFormFieldError[]} fieldErrors - The errors to be set on the form field.
 *
 * @returns {HoneyFormField<Form, FieldName, FormContext>} - The next state with specified errors.
 */
export const getNextErredField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
  fieldErrors: HoneyFormFieldError[],
): HoneyFormField<Form, FieldName, FormContext> => {
  const isFieldInteractive = checkIfFieldIsInteractive(formField.config);
  const isFieldPassive = checkIfFieldIsPassive(formField.config);
  const isFieldObject = checkIfFieldIsObject(formField.config);

  const isFieldErred = fieldErrors.length > 0;

  const props = isFieldInteractive
    ? {
        ...formField.props,
        'aria-invalid': isFieldErred,
      }
    : undefined;

  const passiveProps = isFieldPassive
    ? {
        ...formField.passiveProps,
        'aria-invalid': isFieldErred,
      }
    : undefined;

  const objectProps = isFieldObject
    ? {
        ...formField.objectProps,
        'aria-invalid': isFieldErred,
      }
    : undefined;

  return {
    ...formField,
    props,
    passiveProps,
    objectProps,
    errors: fieldErrors,
    // Set clean value as `undefined` if any error is present
    cleanValue: fieldErrors.length ? undefined : formField.cleanValue,
  };
};

/**
 * Retrieves the next state of a form field after resetting its values and clearing all field errors.
 *
 * @template Form - The type of the form object.
 * @template FieldName - The type of the field name.
 * @template FormContext - The type of the form context.
 *
 * @param {HoneyFormField<Form, FieldName, FormContext>} formField - The form field to reset.
 * @param {boolean} [isResetToDefault=true] - Indicates whether the field should be reset to its default value.
 *
 * @returns {HoneyFormField<Form, FieldName, FormContext>} - The next state of the form field after resetting.
 */
export const getNextResetField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
  isResetToDefault: boolean = true,
): HoneyFormField<Form, FieldName, FormContext> => {
  const isFieldInteractive = checkIfFieldIsInteractive(formField.config);
  const isFieldPassive = checkIfFieldIsPassive(formField.config);
  const isFieldObject = checkIfFieldIsObject(formField.config);

  const errorsFreeField = getNextErrorsFreeField(formField);

  const newFieldValue = isResetToDefault ? errorsFreeField.defaultValue : undefined;

  const props = isFieldInteractive
    ? {
        ...errorsFreeField.props,
        value: newFieldValue ?? ('' as Form[FieldName]),
      }
    : undefined;

  const passiveProps = isFieldPassive
    ? {
        ...errorsFreeField.passiveProps,
        ...(formField.config.type === 'checkbox' && {
          checked: errorsFreeField.defaultValue as boolean,
        }),
      }
    : undefined;

  const objectProps = isFieldObject
    ? {
        ...errorsFreeField.objectProps,
        value: newFieldValue,
      }
    : undefined;

  return {
    ...errorsFreeField,
    props,
    passiveProps,
    objectProps,
    value: newFieldValue,
    rawValue: newFieldValue,
    cleanValue: newFieldValue,
  };
};

/**
 * Handle the result of field validation and update the field errors array accordingly.
 *
 * @param {HoneyFormFieldError[]} fieldErrors - The array to collect validation errors for the field.
 * @param {HoneyFormFieldConfig} fieldConfig - Configuration for the field being validated.
 * @param {HoneyFormFieldValidationResult | null} validationResult - The result of the field validation.
 */
const handleFieldValidationResult = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  fieldErrors: HoneyFormFieldError[],
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext>,
  validationResult: HoneyFormFieldValidationResult | null,
) => {
  if (validationResult) {
    if (Array.isArray(validationResult)) {
      fieldErrors.push(...validationResult);
    }
    // If the result is not a boolean, treat it as an invalid value and add it to fieldErrors
    else if (typeof validationResult !== 'boolean') {
      fieldErrors.push({
        type: 'invalid',
        message: validationResult,
      });
    }
  }
  // If validationResult is explicitly false, add a default invalid value error
  else if (validationResult === false) {
    fieldErrors.push({
      type: 'invalid',
      message: fieldConfig.errorMessages?.invalid ?? 'Invalid value',
    });
  }
};

/**
 * Get the next validated field based on validation results and field errors.
 *
 * @param {HoneyFormFieldError[]} fieldErrors - The array of validation errors for the field.
 * @param {HoneyFormFieldValidationResult | null} validationResult - The result of the field validation.
 * @param {HoneyFormField} formField - The form field being validated.
 * @param {Form[FieldName] | undefined} cleanValue - The cleaned value of the field.
 *
 * @returns {HoneyFormField} - The next form field state after validation.
 */
const getNextValidatedField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  fieldErrors: HoneyFormFieldError[],
  validationResult: HoneyFormFieldValidationResult | null,
  formField: HoneyFormField<Form, FieldName, FormContext>,
  cleanValue: Form[FieldName] | undefined,
): HoneyFormField<Form, FieldName, FormContext> => {
  handleFieldValidationResult(fieldErrors, formField.config, validationResult);

  if (fieldErrors.length) {
    return getNextErredField(formField, fieldErrors);
  }

  const errorsFreeField = getNextErrorsFreeField(formField);

  return {
    ...errorsFreeField,
    cleanValue,
  };
};

/**
 * Execute the validator associated with the type of specific form field.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field to validate.
 * @template FormContext - The context of the form.
 * @template FieldValue - The type of the field's value.
 *
 * @param {FormContext} formContext - The context of the form.
 * @param {HoneyFormFields<Form, FormContext>} formFields - The current state of all form fields.
 * @param {HoneyFormField<Form, FieldName, FormContext>} formField - The current state of the form field.
 * @param {FieldValue | undefined} fieldValue - The current value of the form field.
 *
 * @returns {HoneyFormFieldValidationResult | null} - The result of the field type validation.
 */
const executeFieldTypeValidator = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName],
>(
  formContext: FormContext,
  formFields: HoneyFormFields<Form, FormContext>,
  formField: HoneyFormField<Form, FieldName, FormContext>,
  fieldValue: FieldValue | undefined,
): HoneyFormFieldValidationResult | null => {
  if (formField.config.type === 'object' || formField.config.type === 'nestedForms') {
    return null;
  }

  let validationResult:
    | HoneyFormFieldValidationResult
    | Promise<HoneyFormFieldValidationResult>
    | null = null;

  const formValues = getFormValues(formFields);

  if (checkIfFieldIsInteractive(formField.config)) {
    // Get the validator function associated with the field type
    const validator = INTERACTIVE_FIELD_TYPE_VALIDATORS_MAP[formField.config.type];

    validationResult = validator(fieldValue, {
      formContext,
      formFields,
      formValues,
      fieldConfig: formField.config,
      scheduleValidation: fieldName => scheduleFieldValidation(formFields[fieldName]),
    });
  } else if (checkIfFieldIsPassive(formField.config)) {
    const validator = PASSIVE_FIELD_TYPE_VALIDATORS_MAP[formField.config.type];

    validationResult = validator(fieldValue, {
      formContext,
      formFields,
      formValues,
      fieldConfig: formField.config,
      scheduleValidation: fieldName => scheduleFieldValidation(formFields[fieldName]),
    });
  }

  // If the validation response is not a Promise, return it
  if (!(validationResult instanceof Promise)) {
    return validationResult;
  }

  // If the validation response is a Promise, return null
  return null;
};

/**
 * Executes internal field validators for a given form field.
 *
 * @remarks
 * This function iterates over built-in field validators and executes them for the specified field.
 *
 * @template Form - Type representing the entire form.
 * @template FieldName - Name of the field in the form.
 * @template FormContext - Contextual information for the form.
 * @template FieldValue - Type representing the value of the field.
 *
 * @param fieldValue - The current value of the field.
 * @param fieldConfig - Configuration options for the form field.
 * @param fieldErrors - An array of errors associated with the field.
 */
const executeInternalFieldValidators = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName],
>(
  fieldValue: FieldValue | undefined,
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FormContext>,
  fieldErrors: HoneyFormFieldError[],
) => {
  BUILT_IN_FIELD_VALIDATORS.forEach(validator => {
    validator(fieldValue, fieldConfig, fieldErrors);
  });

  if (checkIfFieldIsInteractive(fieldConfig)) {
    BUILT_IN_INTERACTIVE_FIELD_VALIDATORS.forEach(validator => {
      validator(fieldValue, fieldConfig, fieldErrors);
    });
  }
};

/**
 * Handles the result of a promise-based field validation, adding errors to the form field.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field.
 * @template FormContext - The context of the form.
 *
 * @param {HoneyFormField<Form, FieldName, FormContext>} formField - The form field being validated.
 * @param {Promise<HoneyFormFieldValidationResult>} validationResponse - The result of the promise-based validation.
 */
const handleFieldPromiseValidationResult = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
  validationResponse: Promise<HoneyFormFieldValidationResult>,
) => {
  validationResponse
    .then(validationResult => {
      if (validationResult) {
        if (Array.isArray(validationResult)) {
          formField.addErrors(validationResult);
          //
        } else if (typeof validationResult !== 'boolean') {
          formField.addError({
            type: 'invalid',
            message: validationResult,
          });
        }
      } else if (validationResult === false) {
        formField.addError({
          type: 'invalid',
          message: formField.config.errorMessages?.invalid ?? 'Invalid value',
        });
      }
    })
    .catch((validationResult: Error) => {
      formField.addError({
        type: 'invalid',
        message: formField.config.errorMessages?.invalid ?? validationResult.message,
      });
    });
};

/**
 * Sanitizes the value of a form field based on its type.
 * If a convertor for the provided field type exists in the default map, it uses it to convert the value.
 * If a convertor does not exist, it returns the original value.
 */
const sanitizeFieldValue = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName],
>(
  fieldType: HoneyFormFieldType | undefined,
  fieldValue: FieldValue | undefined,
) => {
  const valueConvertor = fieldType
    ? (DEFAULT_FIELD_VALUE_CONVERTORS_MAP[fieldType] as HoneyFormFieldValueConvertor<FieldValue>)
    : null;

  return valueConvertor ? valueConvertor(fieldValue) : fieldValue;
};

/**
 * Execute the validator for a specific form field.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field to validate.
 * @template FormContext - The context of the form.
 * @template FieldValue - The value of the field.
 *
 * @param {FormContext} formContext - The context of the form.
 * @param {HoneyFormFields<Form, FormContext>} formFields - The current state of all form fields.
 * @param {FieldName} fieldName - The name of the field to validate.
 * @param {FieldValue | undefined} fieldValue - The value of the field.
 *
 * @returns {HoneyFormField<Form, FieldName, FormContext>} - The next state of the validated field.
 */
export const executeFieldValidator = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName],
>(
  formContext: FormContext,
  formFields: HoneyFormFields<Form, FormContext>,
  fieldName: FieldName,
  fieldValue: FieldValue | undefined,
): HoneyFormField<Form, FieldName, FormContext> => {
  const formField = formFields[fieldName];

  const fieldErrors: HoneyFormFieldError[] = [];

  const sanitizedValue = sanitizeFieldValue(formField.config.type, fieldValue);

  let validationResult = executeFieldTypeValidator(
    formContext,
    formFields,
    formField,
    sanitizedValue,
  );

  // Do not run additional validators if the default field type validator failed
  if (validationResult === null || validationResult === true) {
    executeInternalFieldValidators(sanitizedValue, formField.config, fieldErrors);

    // Execute custom validator. Can only run when the default validator returns true
    if (formField.config.validator) {
      const formValues = getFormValues(formFields);

      const validationResponse = formField.config.validator(sanitizedValue, {
        formContext,
        formFields,
        formValues,
        // @ts-expect-error
        fieldConfig: formField.config,
        scheduleValidation: fieldName => scheduleFieldValidation(formFields[fieldName]),
      });

      if (validationResponse instanceof Promise) {
        handleFieldPromiseValidationResult(formField, validationResponse);
      } else {
        validationResult = validationResponse;
      }
    }
  }

  return getNextValidatedField(fieldErrors, validationResult, formField, sanitizedValue);
};

/**
 * Options for executing the field validator asynchronously.
 *
 * @template ParentForm - The parent form type.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template Form - The form type.
 * @template FieldName - The name of the field to validate.
 * @template FormContext - The context of the form.
 */
type ExecuteFieldValidatorAsyncOptions<
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
> = {
  /**
   * The parent field of the current field, if any.
   */
  parentField: HoneyFormParentField<ParentForm, ParentFieldName> | undefined;
  /**
   * The name of the field to validate.
   */
  fieldName: FieldName;
  /**
   * The current state of all form fields.
   */
  formFields: HoneyFormFields<Form, FormContext>;
  /**
   * The context of the form.
   */
  formContext: FormContext;
};

/**
 * Asynchronously execute the validator for a specific form field.
 *
 * @template ParentForm - The parent form type.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template Form - The form type.
 * @template FieldName - The name of the field to validate.
 * @template FormContext - The context of the form.
 *
 * @param {ExecuteFieldValidatorAsyncOptions<ParentForm, Form, FieldName, FormContext>} options - The options for executing the field validator.
 *
 * @returns {Promise<HoneyFormField<Form, FieldName, FormContext>>} - The next state of the validated field.
 */
export const executeFieldValidatorAsync = async <
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>({
  parentField,
  fieldName,
  formFields,
  formContext,
}: ExecuteFieldValidatorAsyncOptions<
  ParentForm,
  ParentFieldName,
  Form,
  FieldName,
  FormContext
>): Promise<HoneyFormField<Form, FieldName, FormContext>> => {
  const formField = formFields[fieldName];

  const fieldErrors: HoneyFormFieldError[] = [];

  let filteredValue: Form[FieldName];

  if (checkIfFieldIsInteractive(formField.config) && formField.config.filter) {
    filteredValue = formField.config.filter(formField.rawValue, { formContext });
    //
  } else if (checkIfFieldIsNestedForms(formField.config)) {
    filteredValue = formField.getChildFormsValues() as Form[FieldName];
    //
  } else {
    filteredValue = formField.rawValue;
  }

  const sanitizedValue = sanitizeFieldValue(formField.config.type, filteredValue);

  let validationResult = executeFieldTypeValidator(
    formContext,
    formFields,
    formField,
    sanitizedValue,
  );

  // Do not run additional validators if the default field type validator failed
  if (validationResult === null || validationResult === true) {
    executeInternalFieldValidators(sanitizedValue, formField.config, fieldErrors);

    // execute custom validator. Can be run only when default validator return true
    if (formField.config.validator) {
      const formValues = getFormValues(formFields);

      const validationResponse = formField.config.validator(sanitizedValue, {
        formContext,
        formFields,
        formValues,
        // @ts-expect-error
        fieldConfig: formField.config,
        scheduleValidation: fieldName => scheduleFieldValidation(formFields[fieldName]),
      });

      // If the validation response is a Promise, handle it asynchronously
      if (validationResponse instanceof Promise) {
        try {
          validationResult = await validationResponse;
        } catch (e) {
          // If there's an error in the promise, set it as the validation result
          const error = e as Error;

          validationResult = error.message;
        }
      } else {
        validationResult = validationResponse;
      }
    }
  }

  return getNextValidatedField(fieldErrors, validationResult, formField, sanitizedValue);
};

/**
 * Options for processing the skippable fields.
 *
 * @template ParentForm - Type representing the parent form.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template Form - Type representing the entire form.
 * @template FormContext - The context of the form.
 */
type ProcessSkippableFieldsOptions<
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  Form extends HoneyFormBaseForm,
  FormContext,
> = {
  /**
   * The parent form field, if any.
   */
  parentField: HoneyFormParentField<ParentForm, ParentFieldName> | undefined;
  /**
   * The next state of the form fields.
   */
  nextFormFields: HoneyFormFields<Form, FormContext>;
  /**
   * The context of the form.
   */
  formContext: FormContext;
};

/**
 * Checks and clears errors for fields that should be skipped based on the current field's value.
 *
 * @template ParentForm - Type representing the parent form.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template Form - Type representing the entire form.
 * @template FormContext - The context of the form.
 *
 * @param {ProcessSkippableFieldsOptions<ParentForm, Form, FormContext>} options - The options for processing skippable fields.
 */
const processSkippableFields = <
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  Form extends HoneyFormBaseForm,
  FormContext,
>({
  parentField,
  nextFormFields,
  formContext,
}: ProcessSkippableFieldsOptions<ParentForm, ParentFieldName, Form, FormContext>) => {
  const formValues = getFormValues(nextFormFields);

  forEachFormField(nextFormFields, otherFieldName => {
    const isSkipField = checkIsSkipField({
      parentField,
      formContext,
      formValues,
      fieldName: otherFieldName,
      formFields: nextFormFields,
    });

    if (isSkipField) {
      nextFormFields[otherFieldName] = getNextErrorsFreeField(nextFormFields[otherFieldName]);
    }
  });
};

/**
 * Reset all fields in the form, resetting their values to default value and removing errors.
 *
 * @template Form - The form type.
 * @template FormContext - The context of the form.
 *
 * @param {HoneyFormFields<Form, FormContext>} nextFormFields - The next form fields state.
 */
export const resetAllFields = <Form extends HoneyFormBaseForm, FormContext>(
  nextFormFields: HoneyFormFields<Form, FormContext>,
) => {
  forEachFormField(nextFormFields, fieldName => {
    nextFormFields[fieldName] = getNextResetField(nextFormFields[fieldName]);
  });
};

/**
 * Reset fields to default values that depend on the specified field,
 *  recursively resetting values to default value of nested dependencies.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field to validate.
 * @template FormContext - The context of the form.
 *
 * @param {FormContext} formContext - The context of the form.
 * @param {HoneyFormFields<Form, FormContext>} nextFormFields - The next form fields state.
 * @param {keyof Form} fieldName - The name of the field triggering the resetting.
 * @param {keyof Form | null} initiatorFieldName - The name of the field that initiated the resetting (optional).
 */
const resetDependentFields = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formContext: FormContext,
  nextFormFields: HoneyFormFields<Form, FormContext>,
  fieldName: FieldName,
  initiatorFieldName: FieldName | null = null,
) => {
  initiatorFieldName = initiatorFieldName || fieldName;

  forEachFormField(nextFormFields, otherFieldName => {
    if (otherFieldName === fieldName) {
      return;
    }

    const { dependsOn } = nextFormFields[otherFieldName].config;

    let isDependent: boolean;

    if (Array.isArray(dependsOn)) {
      isDependent = dependsOn.includes(fieldName);
      //
    } else if (typeof dependsOn === 'function') {
      const formValues = getFormValues(nextFormFields);

      isDependent = dependsOn(initiatorFieldName, nextFormFields[otherFieldName].cleanValue, {
        formContext,
        formValues,
        formFields: nextFormFields,
      });
    } else {
      isDependent = fieldName === dependsOn;
    }

    if (isDependent) {
      const otherField = nextFormFields[otherFieldName];

      nextFormFields[otherFieldName] = getNextResetField(otherField, false);

      if (otherFieldName !== initiatorFieldName) {
        resetDependentFields(formContext, nextFormFields, otherFieldName, fieldName);
      }
    }
  });
};

type TriggerScheduledFieldsValidationsOptions<
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
> = {
  /**
   * The parent form field, if any.
   */
  parentField: HoneyFormParentField<ParentForm, ParentFieldName> | undefined;
  /**
   * The name of the field triggering validations.
   */
  fieldName: FieldName;
  /**
   * The next state of the form fields after a change.
   */
  nextFormFields: HoneyFormFields<Form, FormContext>;
  /**
   * The context of the form.
   */
  formContext: FormContext;
};

/**
 * Triggers validations for fields that have scheduled validations.
 *
 * @template ParentForm - Type representing the parent form.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template Form - Type representing the entire form.
 * @template FieldName - The name of the field to trigger validations for.
 * @template FormContext - The context of the form.
 *
 * @param {TriggerScheduledFieldsValidationsOptions<ParentForm, Form, FieldName, FormContext>} options - The options for triggering scheduled validations.
 */
const triggerScheduledFieldsValidations = <
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>({
  parentField,
  fieldName,
  nextFormFields,
  formContext,
}: TriggerScheduledFieldsValidationsOptions<
  ParentForm,
  ParentFieldName,
  Form,
  FieldName,
  FormContext
>) => {
  const formValues = getFormValues(nextFormFields);

  forEachFormField(nextFormFields, otherFieldName => {
    // Skip validations for the field triggering the change
    if (otherFieldName === fieldName) {
      return;
    }

    const nextFormField = nextFormFields[otherFieldName];

    // Check if validation is scheduled for the field
    if (nextFormField.__meta__.isValidationScheduled) {
      const isSkipField = checkIsSkipField({
        parentField,
        formContext,
        formValues,
        fieldName: otherFieldName,
        formFields: nextFormFields,
      });

      if (!isSkipField) {
        let filteredValue: Form[keyof Form];

        if (checkIfFieldIsInteractive(nextFormField.config) && nextFormField.config.filter) {
          filteredValue = nextFormField.config.filter(nextFormField.rawValue, { formContext });
          //
        } else if (checkIfFieldIsNestedForms(nextFormField.config)) {
          filteredValue = nextFormField.getChildFormsValues() as Form[keyof Form];
          //
        } else {
          filteredValue = nextFormField.rawValue;
        }

        nextFormFields[otherFieldName] = executeFieldValidator(
          formContext,
          nextFormFields,
          otherFieldName,
          filteredValue,
        );
      }

      // Reset the validation scheduled flag for the field
      nextFormFields[otherFieldName].__meta__.isValidationScheduled = false;
    }
  });
};

/**
 * Options for determining the next state of a single form field.
 *
 * @template FormContext - The form context type.
 */
type NextSingleFieldStateOptions<FormContext> = {
  formContext: FormContext;
  isFormat: boolean;
};

/**
 * Gets the next state of a single form field based on the provided field value.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the form field.
 * @template FieldValue - The value type of the form field.
 * @template FormContext - The form context type.
 *
 * @param {HoneyFormField<Form, FieldName, FormContext>} formField - The current state of the form field.
 * @param {FieldValue} fieldValue - The new value for the form field.
 * @param {NextSingleFieldStateOptions<FormContext>} options - Additional options for determining the next field state.
 *
 * @returns {HoneyFormField<Form, FieldName, FormContext>} - The next state of the form field.
 */
export const getNextSingleFieldState = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName],
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
  fieldValue: FieldValue,
  { formContext, isFormat }: NextSingleFieldStateOptions<FormContext>,
): HoneyFormField<Form, FieldName, FormContext> => {
  const isFieldInteractive = checkIfFieldIsInteractive(formField.config);
  const isFieldPassive = checkIfFieldIsPassive(formField.config);
  const isFieldObject = checkIfFieldIsObject(formField.config);

  const formattedValue =
    isFieldInteractive && isFormat && formField.config.formatter
      ? formField.config.formatter(fieldValue, { formContext })
      : fieldValue;

  const props = isFieldInteractive
    ? {
        ...formField.props,
        value: formattedValue,
      }
    : undefined;

  const passiveProps = isFieldPassive
    ? {
        ...formField.passiveProps,
        ...(formField.config.type === 'checkbox' && { checked: fieldValue as boolean }),
      }
    : undefined;

  const objectProps = isFieldObject
    ? {
        ...formField.objectProps,
        value: fieldValue,
      }
    : undefined;

  return {
    ...formField,
    props,
    passiveProps,
    objectProps,
    rawValue: fieldValue,
    value: formattedValue,
  };
};

type NextFieldsStateOptions<
  Form extends HoneyFormBaseForm,
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext,
> = {
  parentField: HoneyFormParentField<ParentForm, ParentFieldName> | undefined;
  formContext: FormContext;
  formFields: HoneyFormFields<Form, FormContext>;
  isValidate: boolean;
  isFormat: boolean;
};

/**
 * Computes the next state of form fields after a change in a specific field.
 *
 * @template Form - Type representing the entire form.
 * @template ParentForm - The type representing the parent form structure.
 * @template ParentFieldName - The field name type for the parent form that will contain the array of child forms.
 * @template FieldName - The name of the field that changed.
 * @template FieldValue - The type of the field's value.
 * @template FormContext - The context type for the form.
 *
 * @param {FieldName} fieldName - The name of the field that changed.
 * @param {FieldValue | undefined} fieldValue - The new value of the changed field.
 * @param {NextFieldsStateOptions<Form, ParentForm, FormContext>} options - Options for computing the next state.
 *
 * @returns {HoneyFormFields<Form, FormContext>} - The next state of form fields.
 */
export const getNextFieldsState = <
  Form extends HoneyFormBaseForm,
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName],
  FormContext,
>(
  fieldName: FieldName,
  fieldValue: FieldValue | undefined,
  {
    parentField,
    formContext,
    formFields,
    isValidate,
    isFormat,
  }: NextFieldsStateOptions<Form, ParentForm, ParentFieldName, FormContext>,
): HoneyFormFields<Form, FormContext> => {
  const fieldConfig = formFields[fieldName].config;

  const nextFormFields = { ...formFields };
  let nextFormField: HoneyFormField<Form, FieldName, FormContext> = formFields[fieldName];

  let filteredValue: Form[FieldName];

  if (checkIfFieldIsInteractive(fieldConfig) && fieldConfig.filter) {
    // Apply filtering to the field value if a filter function is defined
    filteredValue = fieldConfig.filter(fieldValue, { formContext });
    //
  } else {
    filteredValue = fieldValue;
  }

  // If validation is requested, clear dependent fields and execute the field validator
  if (isValidate) {
    resetDependentFields(formContext, nextFormFields, fieldName);

    nextFormField = executeFieldValidator(formContext, nextFormFields, fieldName, filteredValue);
  }

  nextFormFields[fieldName] = getNextSingleFieldState(nextFormField, filteredValue, {
    formContext,
    isFormat,
  });

  processSkippableFields({ parentField, nextFormFields, formContext });
  triggerScheduledFieldsValidations({
    parentField,
    fieldName,
    nextFormFields,
    formContext,
  });

  return nextFormFields;
};

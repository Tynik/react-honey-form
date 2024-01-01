import type { HTMLAttributes, HTMLInputTypeAttribute, RefObject } from 'react';
import { createRef } from 'react';

import type {
  HoneyFormBaseForm,
  HoneyFormFieldConfig,
  HoneyFormFieldError,
  HoneyFormFields,
  HoneyFormFieldValidationResult,
  HoneyFormFieldType,
  HoneyFormFieldValueConvertor,
  HoneyFormSetFieldValueInternal,
  HoneyFormPushFieldValue,
  HoneyFormRemoveFieldValue,
  HoneyFormClearFieldErrors,
  HoneyFormField,
  HoneyFormFieldMeta,
  HoneyFormAddFieldError,
  HoneyFormDefaultsRef,
  HoneyFormFieldsRef,
  BaseHoneyFormFieldHTMLAttributes,
  HoneyFormObjectFieldProps,
  HoneyFormInteractiveFieldConfig,
  HoneyFormPassiveFieldConfig,
  HoneyFormObjectFieldConfig,
  HoneyFormPassiveFieldProps,
  HoneyFormInteractiveFieldProps,
  HoneyFormFieldProps,
} from './types';
import {
  INTERACTIVE_FIELD_TYPE_VALIDATORS_MAP,
  BUILT_IN_FIELD_VALIDATORS,
  BUILT_IN_INTERACTIVE_FIELD_VALIDATORS,
  PASSIVE_FIELD_TYPE_VALIDATORS_MAP,
} from './validators';
import {
  checkIfFieldIsInteractive,
  checkIfFieldIsObject,
  checkIfFieldIsPassive,
  forEachFormField,
  getFormValues,
  isSkipField,
  scheduleValidation,
} from './helpers';

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
  setFieldValue: HoneyFormSetFieldValueInternal<Form>;
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
    value: fieldValue,
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
  setFieldValue: HoneyFormSetFieldValueInternal<Form>;
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
  setFieldValue: HoneyFormSetFieldValueInternal<Form>;
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
  setFieldValue: HoneyFormSetFieldValueInternal<Form>;
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
  setFieldValue: HoneyFormSetFieldValueInternal<Form>;
  clearFieldErrors: HoneyFormClearFieldErrors<Form>;
  pushFieldValue: HoneyFormPushFieldValue<Form>;
  removeFieldValue: HoneyFormRemoveFieldValue<Form>;
  addFormFieldError: HoneyFormAddFieldError<Form>;
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
    pushFieldValue,
    removeFieldValue,
    addFormFieldError,
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
    fieldConfig: config,
    setFieldValue,
  });

  const newFormField: HoneyFormField<Form, FieldName, FormContext> = {
    ...fieldProps,
    config,
    errors: [],
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
            throw new Error('The child `formFieldsRef` value is null');
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
    addError: error => addFormFieldError(fieldName, error),
    clearErrors: () => clearFieldErrors(fieldName),
    focus: () => {
      if (!formFieldRef.current) {
        throw new Error('The `formFieldRef` is not available');
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
 * Get the next reset field state by setting the values to default value and clear all field errors.
 *
 * @param {HoneyFormField} formField - The form field to reset.
 *
 * @returns {HoneyFormField} - The next form field state after resetting.
 */
export const getNextResetField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
): HoneyFormField<Form, FieldName, FormContext> => {
  const isFieldInteractive = checkIfFieldIsInteractive(formField.config);
  const isFieldObject = checkIfFieldIsObject(formField.config);

  const errorsFreeField = getNextErrorsFreeField(formField);

  const props = isFieldInteractive
    ? {
        ...errorsFreeField.props,
        value: errorsFreeField.defaultValue,
      }
    : undefined;

  const objectProps = isFieldObject
    ? {
        ...errorsFreeField.objectProps,
        value: errorsFreeField.defaultValue,
      }
    : undefined;

  return {
    ...errorsFreeField,
    props,
    objectProps,
    value: errorsFreeField.defaultValue,
    rawValue: errorsFreeField.defaultValue,
    cleanValue: errorsFreeField.defaultValue,
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
      scheduleValidation: fieldName => scheduleValidation(formFields[fieldName]),
    });
  } else if (checkIfFieldIsPassive(formField.config)) {
    const validator = PASSIVE_FIELD_TYPE_VALIDATORS_MAP[formField.config.type];

    validationResult = validator(fieldValue, {
      formContext,
      formFields,
      formValues,
      fieldConfig: formField.config,
      scheduleValidation: fieldName => scheduleValidation(formFields[fieldName]),
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
          // TODO: each error triggers one re-render
          validationResult.forEach(formField.addError);
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
  rawFieldValue: FieldValue | undefined,
) => {
  const valueConvertor = fieldType
    ? (DEFAULT_FIELD_VALUE_CONVERTORS_MAP[fieldType] as HoneyFormFieldValueConvertor<FieldValue>)
    : null;

  return valueConvertor ? valueConvertor(rawFieldValue) : rawFieldValue;
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
        scheduleValidation: fieldName => scheduleValidation(formFields[fieldName]),
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
 * Asynchronously execute the validator for a specific form field.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field to validate.
 * @template FormContext - The context of the form.
 *
 * @param {FormContext} formContext - The context of the form.
 * @param {HoneyFormFields<Form, FormContext>} formFields - The current state of all form fields.
 * @param {FieldName} fieldName - The name of the field to validate.
 *
 * @returns {Promise<HoneyFormField<Form, FieldName, FormContext>>} - The next state of the validated field.
 */
export const executeFieldValidatorAsync = async <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formContext: FormContext,
  formFields: HoneyFormFields<Form, FormContext>,
  fieldName: FieldName,
): Promise<HoneyFormField<Form, FieldName, FormContext>> => {
  const formField = formFields[fieldName];

  const fieldErrors: HoneyFormFieldError[] = [];

  const filteredValue =
    checkIfFieldIsInteractive(formField.config) && formField.config.filter
      ? formField.config.filter(formField.rawValue, { formContext })
      : formField.rawValue;

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
        scheduleValidation: fieldName => scheduleValidation(formFields[fieldName]),
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
 * Checks and clears errors for fields that should be skipped based on the current field's value.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field.
 * @template FormContext - The context of the form.
 *
 * @param {FormContext} formContext - The context of the form.
 * @param {HoneyFormFields<Form, FormContext>} nextFormFields - The next form fields state.
 * @param {FieldName} fieldName - The name of the current field.
 */
const checkSkippableFields = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formContext: FormContext,
  nextFormFields: HoneyFormFields<Form, FormContext>,
  fieldName: FieldName,
) => {
  const formValues = getFormValues(nextFormFields);

  forEachFormField(nextFormFields, otherFieldName => {
    if (fieldName === otherFieldName) {
      return;
    }

    if (
      isSkipField(otherFieldName, {
        formContext,
        formValues,
        formFields: nextFormFields,
      })
    ) {
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
 * @template FormContext - The context of the form.
 *
 * @param {HoneyFormFields<Form, FormContext>} nextFormFields - The next form fields state.
 * @param {keyof Form} fieldName - The name of the field triggering the resetting.
 * @param {keyof Form | null} initiatorFieldName - The name of the field that initiated the resetting (optional).
 */
const resetDependentFields = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
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

    const isDependent = Array.isArray(dependsOn)
      ? dependsOn.includes(fieldName)
      : fieldName === dependsOn;

    if (isDependent) {
      const otherField = nextFormFields[otherFieldName];

      nextFormFields[otherFieldName] = getNextResetField(otherField);

      if (otherFieldName !== initiatorFieldName) {
        resetDependentFields(nextFormFields, otherFieldName, fieldName);
      }
    }
  });
};

/**
 * Triggers validations for fields that have scheduled validations.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field to trigger validations for.
 *
 * @param {FormContext} formContext - The context object for the form.
 * @param {HoneyFormFields<Form, FormContext>} nextFormFields - The next form fields after a change.
 * @param {FieldName} fieldName - The name of the field triggering validations.
 */
const triggerScheduledFieldsValidations = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formContext: FormContext,
  nextFormFields: HoneyFormFields<Form, FormContext>,
  fieldName: FieldName,
) => {
  const formValues = getFormValues(nextFormFields);

  forEachFormField(nextFormFields, otherFieldName => {
    // Skip validations for the field triggering the change
    if (otherFieldName === fieldName) {
      return;
    }

    const nextFormField = nextFormFields[otherFieldName];

    // Check if validation is scheduled for the field
    if (nextFormField.__meta__.isValidationScheduled) {
      // Skip validation if the field is marked to be skipped
      if (
        !isSkipField(otherFieldName, {
          formContext,
          formValues,
          formFields: nextFormFields,
        })
      ) {
        const filteredValue =
          checkIfFieldIsInteractive(nextFormField.config) && nextFormField.config.filter
            ? nextFormField.config.filter(nextFormField.rawValue, { formContext })
            : nextFormField.rawValue;

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
        value: fieldValue,
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

type NextFieldsStateOptions<Form extends HoneyFormBaseForm, FormContext> = {
  formContext: FormContext;
  formFields: HoneyFormFields<Form, FormContext>;
  isValidate: boolean;
  isFormat: boolean;
};

/**
 * Computes the next state of form fields after a change in a specific field.
 *
 * @template Form - The form type.
 * @template FieldName - The name of the field that changed.
 * @template FieldValue - The type of the field's value.
 * @template FormContext - The context type for the form.
 *
 * @param {FieldName} fieldName - The name of the field that changed.
 * @param {FieldValue | undefined} fieldValue - The new value of the changed field.
 * @param {NextFieldsStateOptions<Form, FormContext>} options - Options for computing the next state.
 *
 * @returns {HoneyFormFields<Form, FormContext>} - The next state of form fields.
 */
export const getNextFieldsState = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName],
  FormContext,
>(
  fieldName: FieldName,
  fieldValue: FieldValue | undefined,
  { formContext, formFields, isValidate, isFormat }: NextFieldsStateOptions<Form, FormContext>,
): HoneyFormFields<Form, FormContext> => {
  const fieldConfig = formFields[fieldName].config;

  const nextFormFields = { ...formFields };
  let nextFormField: HoneyFormField<Form, FieldName, FormContext> = formFields[fieldName];

  const isFieldInteractive = checkIfFieldIsInteractive(fieldConfig);

  // Apply filtering to the field value if a filter function is defined
  const filteredValue =
    isFieldInteractive && fieldConfig.filter
      ? fieldConfig.filter(fieldValue, { formContext })
      : fieldValue;

  // If validation is requested, clear dependent fields and execute the field validator
  if (isValidate) {
    resetDependentFields(nextFormFields, fieldName);

    nextFormField = executeFieldValidator(formContext, nextFormFields, fieldName, filteredValue);
  }

  nextFormFields[fieldName] = getNextSingleFieldState(nextFormField, filteredValue, {
    formContext,
    isFormat,
  });

  checkSkippableFields(formContext, nextFormFields, fieldName);
  triggerScheduledFieldsValidations(formContext, nextFormFields, fieldName);

  return nextFormFields;
};

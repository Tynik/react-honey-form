import type { HTMLAttributes, HTMLInputTypeAttribute } from 'react';
import { createRef } from 'react';

import type {
  HoneyFormBaseForm,
  HoneyFormFieldConfig,
  HoneyFormFieldError,
  HoneyFormFields,
  HoneyFormFieldValidationResult,
  HoneyFormFieldType,
  HoneyFormFieldValueConvertor,
  HoneyFormInteractiveFieldProps,
  HoneyFormSetFieldValueInternal,
  HoneyFormPushFieldValue,
  HoneyFormRemoveFieldValue,
  HoneyFormClearFieldErrors,
  HoneyFormField,
  HoneyFormFieldMeta,
  HoneyFormAddFieldError,
  HoneyFormDefaultsRef,
  HoneyFormFieldsRef,
  BaseFieldHTMLAttributes,
  HoneyFormPassiveFieldProps,
  HoneyFormObjectFieldProps,
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

type CreateFieldOptions<Form extends HoneyFormBaseForm, FormContext> = {
  formContext: FormContext;
  formFieldsRef: HoneyFormFieldsRef<Form, FormContext>;
  formDefaultValuesRef: HoneyFormDefaultsRef<Form>;
  setFieldValue: HoneyFormSetFieldValueInternal<Form>;
  clearFieldErrors: HoneyFormClearFieldErrors<Form>;
  pushFieldValue: HoneyFormPushFieldValue<Form>;
  removeFieldValue: HoneyFormRemoveFieldValue<Form>;
  addFormFieldError: HoneyFormAddFieldError<Form>;
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
const getFieldInputMode = <Form extends HoneyFormBaseForm>(
  fieldConfig: HoneyFormFieldConfig<Form, keyof Form>,
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
    formDefaultValuesRef,
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
  formDefaultValuesRef.current[fieldName] = config.defaultValue;

  const isFieldInteractive = checkIfFieldIsInteractive(config);
  const isFieldPassive = checkIfFieldIsPassive(config);
  const isFieldObject = checkIfFieldIsObject(config);

  const filteredValue =
    isFieldInteractive && config.filter
      ? config.filter(config.defaultValue, { formContext })
      : config.defaultValue;

  const formattedValue =
    isFieldInteractive && config.formatter
      ? config.formatter(filteredValue, { formContext })
      : filteredValue;

  const baseFieldProps: BaseFieldHTMLAttributes<any> = {
    type: FIELD_TYPE_MAP[config.type],
    inputMode: getFieldInputMode(config),
    name: fieldName.toString(),
    // ARIA
    'aria-required': config.required,
    'aria-invalid': false,
  };

  const interactiveFieldProps: HoneyFormInteractiveFieldProps<Form, FieldName> | undefined =
    isFieldInteractive
      ? {
          ...baseFieldProps,
          ref: formFieldRef,
          value: formattedValue,
          //
          onChange: e => {
            setFieldValue(fieldName, e.target.value, {
              isValidate: config.mode === 'change',
              isFormat: !config.formatOnBlur,
            });
          },
          ...((config.mode === 'blur' || config.formatOnBlur) && {
            onBlur: e => {
              if (!e.target.readOnly) {
                setFieldValue(fieldName, e.target.value);
              }
            },
          }),
          // Additional field properties from field configuration
          ...config.props,
        }
      : undefined;

  const passiveFieldProps: HoneyFormPassiveFieldProps | undefined = isFieldPassive
    ? {
        ...baseFieldProps,
        ref: formFieldRef,
        ...(config.type === 'checkbox' && { checked: config.defaultValue as boolean }),
        //
        onChange: e => {
          let newFieldValue: Form[FieldName];

          if (config.type === 'checkbox') {
            newFieldValue = e.target.checked as Form[FieldName];
            //
          } else if (config.type === 'file') {
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
        ...config.props,
      }
    : undefined;

  const objectFieldProps: HoneyFormObjectFieldProps<Form, FieldName> | undefined = isFieldObject
    ? {
        ...baseFieldProps,
        ref: formFieldRef,
        value: formattedValue,
        //
        onChange: newFieldValue => {
          setFieldValue(fieldName, newFieldValue, {
            isFormat: false,
          });
        },
        // Additional field properties from field configuration
        ...config.props,
      }
    : undefined;

  const fieldMeta: HoneyFormFieldMeta<Form, FieldName, FormContext> = {
    formFieldsRef,
    isValidationScheduled: false,
    childForms: undefined,
  };

  const newFormField: HoneyFormField<Form, FieldName, FormContext> = {
    config,
    errors: [],
    defaultValue: config.defaultValue,
    rawValue: filteredValue,
    cleanValue: filteredValue,
    value: formattedValue,
    props: interactiveFieldProps,
    passiveProps: passiveFieldProps,
    objectProps: objectFieldProps,
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
    resetValue: () => setFieldValue(fieldName, formDefaultValuesRef.current[fieldName]),
    //
    addError: error => addFormFieldError(fieldName, error),
    clearErrors: () => clearFieldErrors(fieldName),
    focus: () => {
      if (!formFieldRef.current) {
        throw new Error('The `formFieldRef` is not available');
      }

      formFieldRef.current.focus();
    },
    scheduleValidation: () => {
      fieldMeta.isValidationScheduled = true;
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

  return {
    ...formField,
    cleanValue: undefined,
    errors: [],
    props: isFieldInteractive
      ? {
          ...formField.props,
          'aria-invalid': false,
        }
      : undefined,
    passiveProps: isFieldPassive
      ? {
          ...formField.passiveProps,
          'aria-invalid': false,
        }
      : undefined,
    objectProps: isFieldObject
      ? {
          ...formField.objectProps,
          'aria-invalid': false,
        }
      : undefined,
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

  return {
    ...formField,
    errors: fieldErrors,
    // Set clean value as `undefined` if any error is present
    cleanValue: fieldErrors.length ? undefined : formField.cleanValue,
    props: isFieldInteractive
      ? {
          ...formField.props,
          'aria-invalid': isFieldErred,
        }
      : undefined,
    passiveProps: isFieldPassive
      ? {
          ...formField.passiveProps,
          'aria-invalid': isFieldErred,
        }
      : undefined,
    objectProps: isFieldObject
      ? {
          ...formField.objectProps,
          'aria-invalid': isFieldErred,
        }
      : undefined,
  };
};

/**
 * Get the next cleared field state by resetting the values to `undefined`.
 *
 * @param {HoneyFormField} formField - The form field to clear.
 *
 * @returns {HoneyFormField} - The next form field state after clearing.
 */
export const getNextClearedField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
): HoneyFormField<Form, FieldName, FormContext> => {
  const isFieldInteractive = checkIfFieldIsInteractive(formField.config);
  const isFieldObject = checkIfFieldIsObject(formField.config);

  const errorsFreeField = getNextErrorsFreeField(formField);

  return {
    ...errorsFreeField,
    value: undefined,
    rawValue: undefined,
    props: isFieldInteractive
      ? {
          ...errorsFreeField.props,
          value: undefined,
        }
      : undefined,
    objectProps: isFieldObject
      ? {
          ...errorsFreeField.objectProps,
          value: undefined,
        }
      : undefined,
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
  if (formField.config.type === 'nestedForms') {
    return null;
  }

  let validationResult: HoneyFormFieldValidationResult | Promise<HoneyFormFieldValidationResult>;

  if (checkIfFieldIsInteractive(formField.config)) {
    // Get the validator function associated with the field type
    const validator = INTERACTIVE_FIELD_TYPE_VALIDATORS_MAP[formField.config.type];

    validationResult = validator(fieldValue, {
      formContext,
      formFields,
      fieldConfig: formField.config,
    });
  } else if (checkIfFieldIsPassive(formField.config)) {
    const validator = PASSIVE_FIELD_TYPE_VALIDATORS_MAP[formField.config.type];

    validationResult = validator(fieldValue, {
      formContext,
      formFields,
      fieldConfig: formField.config,
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
      const validationResponse = formField.config.validator(sanitizedValue, {
        formContext,
        formFields,
        // @ts-expect-error
        fieldConfig: formField.config,
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
      const validationResponse = formField.config.validator(sanitizedValue, {
        formContext,
        formFields,
        // @ts-expect-error
        fieldConfig: formField.config,
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
  forEachFormField(nextFormFields, otherFieldName => {
    if (fieldName === otherFieldName) {
      return;
    }

    if (isSkipField(otherFieldName, { formContext, formFields: nextFormFields })) {
      nextFormFields[otherFieldName] = getNextErrorsFreeField(nextFormFields[otherFieldName]);
    }
  });
};

/**
 * Clears all fields in the form, resetting their values and removing errors.
 *
 * @template Form - The form type.
 * @template FormContext - The context of the form.
 *
 * @param {HoneyFormFields<Form, FormContext>} nextFormFields - The next form fields state.
 */
export const clearAllFields = <Form extends HoneyFormBaseForm, FormContext>(
  nextFormFields: HoneyFormFields<Form, FormContext>,
) => {
  forEachFormField(nextFormFields, fieldName => {
    nextFormFields[fieldName] = getNextClearedField(nextFormFields[fieldName]);
  });
};

/**
 * Clears fields that depend on the specified field, recursively clearing nested dependencies.
 *
 * @template Form - The form type.
 * @template FormContext - The context of the form.
 *
 * @param {HoneyFormFields<Form, FormContext>} nextFormFields - The next form fields state.
 * @param {keyof Form} fieldName - The name of the field triggering the clearing.
 * @param {keyof Form | null} initiatorFieldName - The name of the field that initiated the clearing (optional).
 */
const clearDependentFields = <
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

      nextFormFields[otherFieldName] = getNextClearedField(otherField);

      if (otherFieldName !== initiatorFieldName) {
        clearDependentFields(nextFormFields, otherFieldName, fieldName);
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
  forEachFormField(nextFormFields, otherFieldName => {
    // Skip validations for the field triggering the change
    if (otherFieldName === fieldName) {
      return;
    }

    const nextFormField = nextFormFields[otherFieldName];

    // Check if validation is scheduled for the field
    if (nextFormField.__meta__.isValidationScheduled) {
      // Skip validation if the field is marked to be skipped
      if (!isSkipField(otherFieldName, { formContext, formFields: nextFormFields })) {
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
  const formField = formFields[fieldName];

  const nextFormFields = { ...formFields };
  let nextFormField: HoneyFormField<Form, FieldName, FormContext> = formField;

  const isFieldInteractive = checkIfFieldIsInteractive(formField.config);
  const isFieldPassive = checkIfFieldIsPassive(formField.config);
  const isFieldObject = checkIfFieldIsObject(formField.config);

  // Apply filtering to the field value if a filter function is defined
  const filteredValue =
    isFieldInteractive && formField.config.filter
      ? formField.config.filter(fieldValue, { formContext })
      : fieldValue;

  // If validation is requested, clear dependent fields and execute the field validator
  if (isValidate) {
    clearDependentFields(nextFormFields, fieldName);

    nextFormField = executeFieldValidator(formContext, nextFormFields, fieldName, filteredValue);
  }

  // If validation is requested, clear dependent fields and execute the field validator
  const formattedValue =
    isFieldInteractive && isFormat && formField.config.formatter
      ? formField.config.formatter(filteredValue, { formContext })
      : filteredValue;

  nextFormField = {
    ...nextFormField,
    rawValue: filteredValue,
    value: formattedValue,
    props: isFieldInteractive
      ? {
          ...nextFormField.props,
          value: formattedValue,
        }
      : undefined,
    passiveProps: isFieldPassive
      ? {
          ...nextFormField.passiveProps,
          ...(formField.config.type === 'checkbox' && { checked: fieldValue as boolean }),
        }
      : undefined,
    objectProps: isFieldObject
      ? {
          ...nextFormField.objectProps,
          value: formattedValue,
        }
      : undefined,
  };

  nextFormFields[fieldName] = nextFormField;

  checkSkippableFields(formContext, nextFormFields, fieldName);
  triggerScheduledFieldsValidations(formContext, nextFormFields, fieldName);

  return nextFormFields;
};

import { createRef } from 'react';

import type {
  HoneyFormBaseForm,
  HoneyFormFieldConfig,
  HoneyFormFieldError,
  HoneyFormFields,
  HoneyFormFieldValidationResult,
  HoneyFormFieldType,
  HoneyFormFieldValueConvertor,
  HoneyFormFieldProps,
  HoneyFormSetFieldValueInternal,
  HoneyFormPushFieldValue,
  HoneyFormRemoveFieldValue,
  HoneyFormClearFieldErrors,
  HoneyFormField,
  HoneyFormFieldMeta,
  HoneyFormAddFieldError,
  HoneyFormDefaultsRef,
} from './types';
import { FIELD_TYPE_VALIDATORS_MAP, INTERNAL_FIELD_VALIDATORS } from './validators';
import { getFormValues, isSkipField } from './helpers';

const DEFAULT_FIELD_TYPE = 'string';

const DEFAULT_FIELD_VALUE_CONVERTORS_MAP: Partial<
  Record<HoneyFormFieldType, HoneyFormFieldValueConvertor<any>>
> = {
  number: value => (value ? Number(value) : undefined),
};

type CreateFieldOptions<Form extends HoneyFormBaseForm, FormContext> = {
  context: FormContext;
  formDefaultValuesRef: HoneyFormDefaultsRef<Form>;
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
    context,
    formDefaultValuesRef,
    setFieldValue,
    clearFieldErrors,
    pushFieldValue,
    removeFieldValue,
    addFormFieldError,
  }: CreateFieldOptions<Form, FormContext>,
): HoneyFormField<Form, FieldName, FormContext> => {
  const config: HoneyFormFieldConfig<Form, FieldName, FormContext> = {
    type: DEFAULT_FIELD_TYPE,
    mode: 'change',
    required: false,
    formatOnBlur: false,
    ...fieldConfig,
  };

  const formFieldRef = createRef<HTMLElement>();

  const fieldValue = config.value === undefined ? config.defaultValue : config.value;
  // Set initial field value as the default value
  formDefaultValuesRef.current[fieldName] = fieldValue;

  const filteredValue = config.filter ? config.filter(fieldValue, { context }) : fieldValue;
  const formattedValue = config.format ? config.format(filteredValue, { context }) : filteredValue;

  const fieldProps: HoneyFormFieldProps<Form, FieldName> = {
    ref: formFieldRef,
    value: formattedValue,
    //
    onFocus: e => {
      //
    },
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
    // ARIA
    'aria-required': config.required,
    'aria-invalid': false,
  };

  const fieldMeta: HoneyFormFieldMeta<Form, FieldName> = {
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
    props: fieldProps,
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
    scheduleValidation: () => {
      fieldMeta.isValidationScheduled = true;
    },
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

export const getNextFreeErrorsField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
): HoneyFormField<Form, FieldName, FormContext> => {
  return {
    ...formField,
    cleanValue: undefined,
    errors: [],
    props: {
      ...formField.props,
      'aria-invalid': false,
    },
  };
};

export const getNextErredField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
  fieldErrors: HoneyFormFieldError[],
): HoneyFormField<Form, FieldName, FormContext> => {
  return {
    ...formField,
    errors: fieldErrors,
    // Set clean value as `undefined` if any error is present
    cleanValue: fieldErrors.length ? undefined : formField.cleanValue,
    props: {
      ...formField.props,
      'aria-invalid': fieldErrors.length > 0,
    },
  };
};

export const getNextClearedField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  formField: HoneyFormField<Form, FieldName, FormContext>,
): HoneyFormField<Form, FieldName, FormContext> => {
  const freeErrorsField = getNextFreeErrorsField(formField);

  return {
    ...freeErrorsField,
    value: undefined,
    rawValue: undefined,
    props: {
      ...freeErrorsField.props,
      value: undefined,
    },
  };
};

const handleFieldValidationResult = <Form extends HoneyFormBaseForm, FieldName extends keyof Form>(
  fieldErrors: HoneyFormFieldError[],
  fieldConfig: HoneyFormFieldConfig<Form, FieldName>,
  validationResult: HoneyFormFieldValidationResult | null,
) => {
  if (validationResult) {
    if (Array.isArray(validationResult)) {
      fieldErrors.push(...validationResult);
      //
    } else if (typeof validationResult !== 'boolean') {
      fieldErrors.push({
        type: 'invalid',
        message: validationResult,
      });
    }
  } else if (validationResult === false) {
    fieldErrors.push({
      type: 'invalid',
      message: fieldConfig.errorMessages?.invalid ?? 'Invalid value',
    });
  }
};

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

  const freeErrorsField = getNextFreeErrorsField(formField);

  return {
    ...freeErrorsField,
    cleanValue,
  };
};

const executeFieldTypeValidator = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName],
>(
  context: FormContext,
  formFields: HoneyFormFields<Form, FormContext>,
  formField: HoneyFormField<Form, FieldName, FormContext>,
  fieldValue: FieldValue | undefined,
): HoneyFormFieldValidationResult | null => {
  const validator = FIELD_TYPE_VALIDATORS_MAP[formField.config.type ?? DEFAULT_FIELD_TYPE];

  const validationResponse = validator(fieldValue, {
    context,
    formFields,
    fieldConfig: formField.config,
  });

  if (!(validationResponse instanceof Promise)) {
    return validationResponse;
  }

  return null;
};

const executeInternalFieldValidators = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName],
>(
  fieldValue: FieldValue | undefined,
  fieldConfig: HoneyFormFieldConfig<Form, FieldName>,
  fieldErrors: HoneyFormFieldError[],
) => {
  INTERNAL_FIELD_VALIDATORS.forEach(validator => validator(fieldValue, fieldConfig, fieldErrors));
};

const handleFieldPromiseValidationResult = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
>(
  formField: HoneyFormField<Form, FieldName>,
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

export const executeFieldValidator = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
  FieldValue extends Form[FieldName],
>(
  context: FormContext,
  formFields: HoneyFormFields<Form, FormContext>,
  fieldName: FieldName,
  fieldValue: FieldValue | undefined,
) => {
  const fieldErrors: HoneyFormFieldError[] = [];
  const formField = formFields[fieldName];

  const cleanValue = sanitizeFieldValue(formField.config.type, fieldValue);

  let validationResult = executeFieldTypeValidator(context, formFields, formField, cleanValue);

  // do not run additional validators if default field type validator is failed
  if (validationResult === null || validationResult === true) {
    executeInternalFieldValidators(cleanValue, formField.config, fieldErrors);

    // Execute custom validator. Can be run only when the default validator returns true
    if (formField.config.validator) {
      const validationResponse = formField.config.validator(cleanValue, {
        context,
        formFields,
        fieldConfig: formField.config,
      });

      if (validationResponse instanceof Promise) {
        handleFieldPromiseValidationResult(formField, validationResponse);
      } else {
        validationResult = validationResponse;
      }
    }
  }

  return getNextValidatedField(fieldErrors, validationResult, formField, cleanValue);
};

export const executeFieldValidatorAsync = async <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  context: FormContext,
  formFields: HoneyFormFields<Form, FormContext>,
  fieldName: FieldName,
) => {
  const fieldErrors: HoneyFormFieldError[] = [];
  const formField = formFields[fieldName];

  const filteredValue = formField.config.filter
    ? formField.config.filter(formField.rawValue, { context })
    : formField.rawValue;

  const sanitizedValue = sanitizeFieldValue(formField.config.type, filteredValue);

  let validationResult = executeFieldTypeValidator(context, formFields, formField, sanitizedValue);

  // do not run additional validators if default field type validator is failed
  if (validationResult === null || validationResult === true) {
    executeInternalFieldValidators(sanitizedValue, formField.config, fieldErrors);

    // execute custom validator. Can be run only when default validator return true
    if (formField.config.validator) {
      const validationResponse = formField.config.validator(sanitizedValue, {
        context,
        formFields,
        fieldConfig: formField.config,
      });

      if (validationResponse instanceof Promise) {
        try {
          validationResult = await validationResponse;
        } catch (e) {
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

const checkSkippableFields = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  context: FormContext,
  nextFormFields: HoneyFormFields<Form, FormContext>,
  fieldName: FieldName,
) => {
  Object.keys(nextFormFields).forEach((otherFieldName: keyof Form) => {
    if (fieldName === otherFieldName) {
      return;
    }

    if (isSkipField(context, otherFieldName, nextFormFields)) {
      nextFormFields[otherFieldName] = getNextFreeErrorsField(nextFormFields[otherFieldName]);
    }
  });
};

export const clearAllFields = <Form extends HoneyFormBaseForm>(
  nextFormFields: HoneyFormFields<Form>,
) => {
  Object.keys(nextFormFields).forEach((fieldName: keyof Form) => {
    nextFormFields[fieldName] = getNextClearedField(nextFormFields[fieldName]);
  });
};

const clearDependentFields = <Form extends HoneyFormBaseForm, FieldName extends keyof Form>(
  nextFormFields: HoneyFormFields<Form>,
  fieldName: FieldName,
  initiatorFieldName: FieldName | null = null,
) => {
  initiatorFieldName = initiatorFieldName || fieldName;

  Object.keys(nextFormFields).forEach((otherFieldName: keyof Form) => {
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

const triggerScheduledFieldsValidations = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FormContext,
>(
  context: FormContext,
  nextFormFields: HoneyFormFields<Form, FormContext>,
  fieldName: FieldName,
) => {
  Object.keys(nextFormFields).forEach((otherFieldName: keyof Form) => {
    if (fieldName === otherFieldName) {
      return;
    }

    const nextFormField = nextFormFields[otherFieldName];

    if (nextFormField.__meta__.isValidationScheduled) {
      if (!isSkipField(context, otherFieldName, nextFormFields)) {
        const filteredValue = nextFormField.config.filter
          ? nextFormField.config.filter(nextFormField.rawValue, { context })
          : nextFormField.rawValue;

        nextFormFields[otherFieldName] = executeFieldValidator(
          context,
          nextFormFields,
          otherFieldName,
          filteredValue,
        );
      }

      nextFormFields[otherFieldName].__meta__.isValidationScheduled = false;
    }
  });
};

type NextFieldsStateOptions<Form extends HoneyFormBaseForm, FormContext> = {
  context: FormContext;
  formFields: HoneyFormFields<Form, FormContext>;
  isValidate: boolean;
  isFormat: boolean;
};

export const getNextFieldsState = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName],
  FormContext,
>(
  fieldName: FieldName,
  fieldValue: FieldValue | undefined,
  { context, formFields, isValidate, isFormat }: NextFieldsStateOptions<Form, FormContext>,
) => {
  const nextFormFields = { ...formFields };

  const formField = formFields[fieldName];
  let nextFormField: HoneyFormField<Form, FieldName, FormContext> = formField;

  const filteredValue = formField.config.filter
    ? formField.config.filter(fieldValue, { context })
    : fieldValue;

  if (isValidate) {
    clearDependentFields(nextFormFields, fieldName);

    nextFormField = executeFieldValidator(context, nextFormFields, fieldName, filteredValue);
  }

  const formattedValue =
    isFormat && formField.config.format
      ? formField.config.format(filteredValue, { context })
      : filteredValue;

  nextFormField = {
    ...nextFormField,
    rawValue: filteredValue,
    value: formattedValue,
    props: {
      ...nextFormField.props,
      value: formattedValue,
    },
  };

  nextFormFields[fieldName] = nextFormField;

  checkSkippableFields(context, nextFormFields, fieldName);
  triggerScheduledFieldsValidations(context, nextFormFields, fieldName);

  return nextFormFields;
};

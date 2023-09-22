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
} from './types';
import { FIELD_TYPE_VALIDATORS_MAP, INTERNAL_FIELD_VALIDATORS } from './validators';
import { getFormValues, isSkipField } from './helpers';

const DEFAULT_FIELD_TYPE = 'string';

const DEFAULT_FIELD_VALUE_CONVERTORS_MAP: Partial<
  Record<HoneyFormFieldType, HoneyFormFieldValueConvertor<any>>
> = {
  number: value => (value ? Number(value) : undefined),
};

export const createField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName],
>(
  fieldName: FieldName,
  fieldConfig: HoneyFormFieldConfig<Form, FieldName, FieldValue>,
  {
    setFieldValue,
    clearFieldErrors,
    pushFieldValue,
    removeFieldValue,
    addFormFieldError,
  }: {
    setFieldValue: HoneyFormSetFieldValueInternal<Form>;
    clearFieldErrors: HoneyFormClearFieldErrors<Form>;
    pushFieldValue: HoneyFormPushFieldValue<Form>;
    removeFieldValue: HoneyFormRemoveFieldValue<Form>;
    addFormFieldError: HoneyFormAddFieldError<Form>;
  },
): HoneyFormField<Form, FieldName, FieldValue> => {
  const config: HoneyFormFieldConfig<Form, FieldName, FieldValue> = {
    type: DEFAULT_FIELD_TYPE,
    mode: 'change',
    required: false,
    formatOnBlur: false,
    ...fieldConfig,
  };

  const formFieldRef = createRef<HTMLElement>();

  const fieldValue = config.value === undefined ? config.defaultValue : config.value;

  const filteredValue = config.filter ? config.filter(fieldValue) : fieldValue;
  const formattedValue = config.format ? config.format(filteredValue) : filteredValue;

  const fieldProps: HoneyFormFieldProps<Form, FieldName, FieldValue> = {
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
    ...(config.mode === 'blur' && {
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

  const newFormField: HoneyFormField<Form, FieldName, FieldValue> = {
    config,
    errors: [],
    defaultValue: config.defaultValue,
    rawValue: filteredValue,
    cleanValue: filteredValue,
    value: formattedValue,
    props: fieldProps,
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
>(
  formField: HoneyFormField<Form, FieldName>,
): HoneyFormField<Form, FieldName> => {
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

export const getNextClearedField = <Form extends HoneyFormBaseForm, FieldName extends keyof Form>(
  formField: HoneyFormField<Form, FieldName>,
): HoneyFormField<Form, FieldName> => {
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

const getNextValidatedField = <Form extends HoneyFormBaseForm, FieldName extends keyof Form>(
  fieldErrors: HoneyFormFieldError[],
  validationResult: HoneyFormFieldValidationResult | null,
  formField: HoneyFormField<Form, FieldName>,
  cleanValue: Form[FieldName] | undefined,
): HoneyFormField<Form, FieldName> => {
  handleFieldValidationResult(fieldErrors, formField.config, validationResult);

  return {
    ...formField,
    errors: fieldErrors,
    // Set clean value as `undefined` if any error is present
    cleanValue: fieldErrors.length ? undefined : cleanValue,
    props: {
      ...formField.props,
      'aria-invalid': fieldErrors.length > 0,
    },
  };
};

const executeFieldTypeValidator = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName],
>(
  formFields: HoneyFormFields<Form>,
  formField: HoneyFormField<Form, FieldName>,
  fieldValue: FieldValue | undefined,
): HoneyFormFieldValidationResult | null => {
  const validator = FIELD_TYPE_VALIDATORS_MAP[formField.config.type ?? DEFAULT_FIELD_TYPE];

  const validationResponse = validator(fieldValue, {
    fieldConfig: formField.config,
    formFields,
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
  FieldValue extends Form[FieldName],
>(
  formFields: HoneyFormFields<Form>,
  fieldName: FieldName,
  fieldValue: FieldValue | undefined,
) => {
  const fieldErrors: HoneyFormFieldError[] = [];
  const formField = formFields[fieldName];

  const cleanValue = sanitizeFieldValue(formField.config.type, fieldValue);

  let validationResult = executeFieldTypeValidator(formFields, formField, cleanValue);

  // do not run additional validators if default field type validator is failed
  if (validationResult === null || validationResult === true) {
    executeInternalFieldValidators(cleanValue, formField.config, fieldErrors);

    // Execute custom validator. Can be run only when the default validator returns true
    if (formField.config.validator) {
      const validationResponse = formField.config.validator(cleanValue, {
        fieldConfig: formField.config,
        formFields,
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
>(
  formFields: HoneyFormFields<Form>,
  fieldName: FieldName,
) => {
  const fieldErrors: HoneyFormFieldError[] = [];
  const formField = formFields[fieldName];

  const filteredValue = formField.config.filter
    ? formField.config.filter(formField.rawValue)
    : formField.rawValue;

  const sanitizedValue = sanitizeFieldValue(formField.config.type, filteredValue);

  let validationResult = executeFieldTypeValidator(formFields, formField, sanitizedValue);

  // do not run additional validators if default field type validator is failed
  if (validationResult === null || validationResult === true) {
    executeInternalFieldValidators(sanitizedValue, formField.config, fieldErrors);

    // execute custom validator. Can be run only when default validator return true
    if (formField.config.validator) {
      const validationResponse = formField.config.validator(sanitizedValue, {
        fieldConfig: formField.config,
        formFields,
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

export const checkSkippableFields = <Form extends HoneyFormBaseForm, FieldName extends keyof Form>(
  nextFormFields: HoneyFormFields<Form>,
  fieldName: FieldName,
) => {
  Object.keys(nextFormFields).forEach((otherFieldName: keyof Form) => {
    if (fieldName === otherFieldName) {
      return;
    }

    if (isSkipField(otherFieldName, nextFormFields)) {
      nextFormFields[otherFieldName] = getNextFreeErrorsField(nextFormFields[otherFieldName]);
    }
  });
};

export const triggerScheduledFieldsValidations = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
>(
  nextFormFields: HoneyFormFields<Form>,
  fieldName: FieldName,
) => {
  Object.keys(nextFormFields).forEach((otherFieldName: keyof Form) => {
    if (fieldName === otherFieldName) {
      return;
    }

    const nextFormField = nextFormFields[otherFieldName];

    if (nextFormField.__meta__.isValidationScheduled) {
      if (!isSkipField(otherFieldName, nextFormFields)) {
        const filteredValue = nextFormField.config.filter
          ? nextFormField.config.filter(nextFormField.rawValue)
          : nextFormField.rawValue;

        nextFormFields[otherFieldName] = executeFieldValidator(
          nextFormFields,
          otherFieldName,
          filteredValue,
        );
      }

      nextFormFields[otherFieldName].__meta__.isValidationScheduled = false;
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

export const clearDependentFields = <Form extends HoneyFormBaseForm, FieldName extends keyof Form>(
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

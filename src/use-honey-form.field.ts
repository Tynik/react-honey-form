import { createRef } from 'react';

import type {
  UseHoneyFormForm,
  UseHoneyFormFieldConfig,
  UseHoneyFormFieldError,
  UseHoneyFormFields,
  UseHoneyFormFieldValidationResult,
  UseHoneyFormFieldType,
  UseHoneyFormFieldValueConvertor,
  UseHoneyFormFieldProps,
  UseHoneyFormFlatField,
  UseHoneyFormSetFieldValueInternal,
  UseHoneyFormPushFieldValue,
  UseHoneyFormRemoveFieldValue,
  UseHoneyFormClearFieldErrors,
  UseHoneyFormArrayField,
  UseHoneyFormArrayFieldMeta,
  UseHoneyFormField,
  UseHoneyFormFlatFieldMeta,
  UseHoneyFormAddFieldError,
} from './use-honey-form.types';
import { FIELD_TYPE_VALIDATORS_MAP, INTERNAL_FIELD_VALIDATORS } from './use-honey-form.validators';
import { captureChildFormsFieldValues, isSkipField, noop } from './use-honey-form.helpers';

const DEFAULT_FIELD_VALUE_CONVERTORS_MAP: Partial<
  Record<UseHoneyFormFieldType, UseHoneyFormFieldValueConvertor>
> = {
  number: value => (value ? Number(value) : undefined),
};

export const createField = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName] = Form[FieldName]
>(
  fieldName: FieldName,
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
  {
    setFieldValue,
    clearFieldErrors,
    pushFieldValue,
    removeFieldValue,
    addFormFieldError,
  }: {
    setFieldValue: UseHoneyFormSetFieldValueInternal<Form>;
    clearFieldErrors: UseHoneyFormClearFieldErrors<Form>;
    pushFieldValue: UseHoneyFormPushFieldValue<Form>;
    removeFieldValue: UseHoneyFormRemoveFieldValue<Form>;
    addFormFieldError: UseHoneyFormAddFieldError<Form>;
  }
):
  | UseHoneyFormFlatField<Form, FieldName, FieldValue>
  | UseHoneyFormArrayField<Form, FieldName, FieldValue> => {
  const config: UseHoneyFormFieldConfig<Form, FieldName, FieldValue> = {
    type: 'string',
    mode: 'change',
    ...fieldConfig,
  };

  const formFieldRef = createRef<HTMLElement>();

  const fieldValue = config.value === undefined ? config.defaultValue : config.value;

  const fieldProps: UseHoneyFormFieldProps<Form, FieldName, FieldValue> = {
    ref: formFieldRef,
    value: fieldValue,
    //
    onFocus: e => {
      //
    },
    onChange: e => {
      // @ts-expect-error
      setFieldValue(fieldName, e.target.value, {
        isValidate: config.mode === 'change',
      });
    },
    ...(config.mode === 'blur' && {
      onBlur: e => {
        // @ts-expect-error
        setFieldValue(fieldName, e.target.value);
      },
    }),
    // aria attributes
    'aria-invalid': false,
  };

  let newFormField:
    | UseHoneyFormFlatField<Form, FieldName, FieldValue>
    | UseHoneyFormArrayField<Form, FieldName, FieldValue>;

  if (Array.isArray(fieldValue)) {
    const arrayFieldMeta: UseHoneyFormArrayFieldMeta<Form> = {
      isValidationScheduled: false,
      childForms: [],
    };

    newFormField = {
      value: fieldValue,
      nestedValues: fieldValue,
      cleanValue: fieldValue,
      defaultValue: config.defaultValue,
      config,
      errors: [],
      // functions
      setValue: (value, options) => setFieldValue(fieldName, value, options),
      pushValue: value => pushFieldValue(fieldName, value),
      removeValue: formIndex => removeFieldValue(fieldName, formIndex),
      scheduleValidation: () => {
        arrayFieldMeta.isValidationScheduled = true;
      },
      addError: error => addFormFieldError(fieldName, error),
      clearErrors: () => clearFieldErrors(fieldName),
      //
      __meta__: arrayFieldMeta,
    };

    captureChildFormsFieldValues(newFormField);
  } else {
    const flatFieldMeta: UseHoneyFormFlatFieldMeta = {
      isValidationScheduled: false,
    };

    newFormField = {
      value: fieldValue,
      cleanValue: fieldValue,
      defaultValue: config.defaultValue,
      props: fieldProps,
      config,
      errors: [],
      // functions
      setValue: (value, options) => setFieldValue(fieldName, value, options),
      scheduleValidation: () => {
        flatFieldMeta.isValidationScheduled = true;
      },
      addError: error => addFormFieldError(fieldName, error),
      clearErrors: () => clearFieldErrors(fieldName),
      focus: () => {
        formFieldRef.current.focus();
      },
      //
      __meta__: flatFieldMeta,
    };
  }

  return newFormField;
};

export const getNextClearedField = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
  formField: UseHoneyFormField<Form, FieldName>
): UseHoneyFormField<Form, FieldName> => {
  return {
    ...formField,
    value: Array.isArray(formField.value) ? [] : undefined,
    cleanValue: undefined,
    errors: [],
    ...('props' in formField && {
      props: {
        ...formField.props,
        value: undefined,
        'aria-invalid': false,
      },
    }),
  };
};

export const getNextSkippedField = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
  formField: UseHoneyFormField<Form, FieldName>
): UseHoneyFormField<Form, FieldName> => {
  return {
    ...formField,
    cleanValue: undefined,
    errors: [],
    ...('props' in formField && {
      props: {
        ...formField.props,
        'aria-invalid': false,
      },
    }),
  };
};

const getNextValidatedField = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
  formField: UseHoneyFormField<Form, FieldName>,
  fieldErrors: UseHoneyFormFieldError[],
  cleanValue: Form[FieldName]
): UseHoneyFormField<Form, FieldName> => {
  return {
    ...formField,
    errors: fieldErrors,
    // set clean value as `undefined` if any error is present
    cleanValue: fieldErrors.length ? undefined : cleanValue,
    ...('props' in formField && {
      props: {
        ...formField.props,
        'aria-invalid': Boolean(fieldErrors.length),
      },
    }),
  };
};

const executeFieldTypeValidators = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>(
  formFields: UseHoneyFormFields<Form>,
  formField: UseHoneyFormField<Form, FieldName>,
  fieldValue: FieldValue
): UseHoneyFormFieldValidationResult | null => {
  const validator = FIELD_TYPE_VALIDATORS_MAP[formField.config.type];

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
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>(
  fieldValue: FieldValue,
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName>,
  fieldErrors: UseHoneyFormFieldError[]
) => {
  INTERNAL_FIELD_VALIDATORS.forEach(validator => validator(fieldValue, fieldConfig, fieldErrors));
};

const handleFieldValidationResult = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
  fieldErrors: UseHoneyFormFieldError[],
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName>,
  validationResult: UseHoneyFormFieldValidationResult
) => {
  if (validationResult) {
    if (typeof validationResult === 'string') {
      fieldErrors.push({
        type: 'invalid',
        message: validationResult,
      });
      //
    } else if (typeof validationResult === 'object') {
      fieldErrors.push(...validationResult);
    }
    //
  } else if (validationResult === false) {
    fieldErrors.push({
      type: 'invalid',
      message: fieldConfig.errorMessages?.invalid ?? 'Invalid value',
    });
  }
};

const handleFieldPromiseValidationResult = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form
>(
  formField: UseHoneyFormField<Form, FieldName>,
  validationResponse: Promise<UseHoneyFormFieldValidationResult>
) => {
  validationResponse
    .then(result => {
      if (result) {
        if (typeof result === 'string') {
          formField.addError({
            type: 'invalid',
            message: result,
          });
        } else if (typeof result === 'object') {
          // TODO: each error triggers one re-render
          result.forEach(formField.addError);
        }
      } else if (result === false) {
        formField.addError({
          type: 'invalid',
          message: formField.config.errorMessages?.invalid ?? 'Invalid value',
        });
      }
    })
    .catch(noop);
};

/**
 * Sanitizes the value of a Honey form field based on its type.
 * If a convertor for the provided field type exists in the default map, it uses it to convert the value.
 * If a convertor does not exist, it returns the original value.
 *
 * @param {UseHoneyFormFieldType | undefined} fieldType The type of the form field.
 * @param {Value} value The value of the form field that needs to be cleaned.
 * @returns {Value} The cleaned or original value depending on whether a convertor was found.
 */
const sanitizeFieldValue = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>(
  fieldType: UseHoneyFormFieldType | undefined,
  rawFieldValue: FieldValue
) => {
  const valueConvertor = fieldType
    ? (DEFAULT_FIELD_VALUE_CONVERTORS_MAP[fieldType] as UseHoneyFormFieldValueConvertor<FieldValue>)
    : null;

  return valueConvertor ? valueConvertor(rawFieldValue) : rawFieldValue;
};

export const executeFieldValidator = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>(
  formFields: UseHoneyFormFields<Form>,
  fieldName: FieldName,
  rawFieldValue: FieldValue
) => {
  const fieldErrors: UseHoneyFormFieldError[] = [];
  const fieldConfig = formFields[fieldName].config;

  const cleanValue = sanitizeFieldValue(fieldConfig.type, rawFieldValue);

  let validationResult = executeFieldTypeValidators(formFields, formFields[fieldName], cleanValue);

  // do not run additional validators if default field type validator is failed
  if (validationResult === null || validationResult === true) {
    executeInternalFieldValidators(cleanValue, fieldConfig, fieldErrors);

    // execute custom validator. Can be run only when default validator return true
    if (fieldConfig.validator) {
      const validationResponse = fieldConfig.validator(cleanValue, {
        fieldConfig,
        formFields,
      });

      if (validationResponse instanceof Promise) {
        handleFieldPromiseValidationResult(formFields[fieldName], validationResponse);
      } else {
        validationResult = validationResponse;
      }
    }
  }

  handleFieldValidationResult(fieldErrors, fieldConfig, validationResult);

  return getNextValidatedField(formFields[fieldName], fieldErrors, cleanValue);
};

export const executeFieldValidatorAsync = async <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>(
  formFields: UseHoneyFormFields<Form>,
  fieldName: FieldName,
  fieldValue: FieldValue
) => {
  const fieldConfig = formFields[fieldName].config;
};

export const runFieldValidation = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
  formFields: UseHoneyFormFields<Form>,
  fieldName: FieldName
) => {
  const formField = formFields[fieldName];

  const fieldValue = formField.config.filter
    ? formField.config.filter(formField.value)
    : formField.value;

  return executeFieldValidator(formFields, fieldName, fieldValue);
};

export const triggerScheduledFieldsValidations = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form
>(
  nextFormFields: UseHoneyFormFields<Form>,
  fieldName: FieldName
) => {
  Object.keys(nextFormFields).forEach((otherFieldName: keyof Form) => {
    if (fieldName === otherFieldName) {
      return;
    }

    if (nextFormFields[otherFieldName].__meta__.isValidationScheduled) {
      if (!isSkipField(otherFieldName, nextFormFields)) {
        nextFormFields[otherFieldName] = executeFieldValidator(
          nextFormFields,
          otherFieldName,
          nextFormFields[otherFieldName].value
        );
      }

      nextFormFields[otherFieldName].__meta__.isValidationScheduled = false;
    }
  });
};

export const clearAllFields = <Form extends UseHoneyFormForm>(
  nextFormFields: UseHoneyFormFields<Form>
) => {
  Object.keys(nextFormFields).forEach((fieldName: keyof Form) => {
    nextFormFields[fieldName] = getNextClearedField(nextFormFields[fieldName]);
  });
};

export const clearDependentFields = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
  nextFormFields: UseHoneyFormFields<Form>,
  fieldName: FieldName,
  initiatorFieldName: FieldName = null
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

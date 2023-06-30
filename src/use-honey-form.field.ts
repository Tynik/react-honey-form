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
import {
  DEFAULT_VALIDATORS_MAP,
  maxLengthInternalFieldValidator,
  maxValueInternalFieldValidator,
  minLengthInternalFieldValidator,
  minMaxLengthInternalFieldValidator,
  minMaxValueInternalFieldValidator,
  minValueInternalFieldValidator,
  requiredInternalFieldValidator,
} from './use-honey-form.validators';
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

  const fieldRef = createRef<HTMLElement>();

  const fieldValue = config.value === undefined ? config.defaultValue : config.value;

  const fieldProps: UseHoneyFormFieldProps<Form, FieldName, FieldValue> = {
    ref: fieldRef,
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

  let newField:
    | UseHoneyFormFlatField<Form, FieldName, FieldValue>
    | UseHoneyFormArrayField<Form, FieldName, FieldValue>;

  if (Array.isArray(fieldValue)) {
    const arrayFieldMeta: UseHoneyFormArrayFieldMeta<Form> = {
      isValidationScheduled: false,
      childForms: [],
    };

    newField = {
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

    captureChildFormsFieldValues(newField);
  } else {
    const flatFieldMeta: UseHoneyFormFlatFieldMeta = {
      isValidationScheduled: false,
    };

    newField = {
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
        fieldRef.current.focus();
      },
      //
      __meta__: flatFieldMeta,
    };
  }

  return newField;
};

export const executeFieldValidator = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>(
  nextFormFields: UseHoneyFormFields<Form>,
  fieldName: FieldName,
  fieldValue: FieldValue
): UseHoneyFormFieldError[] => {
  const fieldConfig = nextFormFields[fieldName].config;

  let validationResult: UseHoneyFormFieldValidationResult | null = null;

  const fieldErrors: UseHoneyFormFieldError[] = [];

  if (fieldConfig.type) {
    const validator = DEFAULT_VALIDATORS_MAP[fieldConfig.type];

    const validationResponse = validator(fieldValue, {
      fieldConfig,
      formFields: nextFormFields,
    });

    if (!(validationResponse instanceof Promise)) {
      validationResult = validationResponse;
    }
  }

  // do not run additional validators if default field type validator is failed
  if (validationResult === null || validationResult === true) {
    [
      // all
      requiredInternalFieldValidator,
      // number
      minValueInternalFieldValidator,
      maxValueInternalFieldValidator,
      minMaxValueInternalFieldValidator,
      // string
      minLengthInternalFieldValidator,
      maxLengthInternalFieldValidator,
      minMaxLengthInternalFieldValidator,
    ].forEach(validator => validator(fieldValue, fieldConfig, fieldErrors));

    // execute custom validator. Can be run only when default validator return true or not run at all
    if (fieldConfig.validator) {
      const validationResponse = fieldConfig.validator(fieldValue, {
        fieldConfig,
        formFields: nextFormFields,
      });

      if (validationResponse instanceof Promise) {
        validationResponse
          .then(result => {
            if (result) {
              if (typeof result === 'string') {
                nextFormFields[fieldName].addError({
                  type: 'invalid',
                  message: result,
                });
              } else if (typeof result === 'object') {
                // TODO: each error triggers one re-render
                result.forEach(nextFormFields[fieldName].addError);
              }
            } else if (result === false) {
              nextFormFields[fieldName].addError({
                type: 'invalid',
                message: fieldConfig.errorMessages?.invalid ?? 'Invalid value',
              });
            }
          })
          .catch(noop);
      } else {
        validationResult = validationResponse;
      }
    }
  }

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

  return fieldErrors;
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
export const sanitizeFieldValue = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  Value extends Form[FieldName]
>(
  fieldType: UseHoneyFormFieldType | undefined,
  value: Value
): Value => {
  const valueConvertor = fieldType
    ? (DEFAULT_FIELD_VALUE_CONVERTORS_MAP[fieldType] as UseHoneyFormFieldValueConvertor<Value>)
    : null;

  return valueConvertor ? valueConvertor(value) : value;
};

export const runFieldValidation = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
  formFields: UseHoneyFormFields<Form>,
  fieldName: FieldName
): UseHoneyFormFields<Form> => {
  const nextFormFields = { ...formFields };

  const formField = nextFormFields[fieldName];

  let fieldValue = formField.value;
  if (formField.config.filter) {
    fieldValue = formField.config.filter(formField.value);
  }

  const cleanValue = sanitizeFieldValue(formField.config.type, fieldValue);
  const errors = executeFieldValidator(nextFormFields, fieldName, cleanValue);

  nextFormFields[fieldName] = {
    ...formField,
    errors,
    cleanValue: errors.length ? undefined : cleanValue,
    ...('props' in formField && {
      props: {
        ...formField.props,
        'aria-invalid': Boolean(errors.length),
      },
    }),
  };

  return nextFormFields;
};

export const triggerScheduledFieldsValidations = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
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
        const otherFormField = nextFormFields[otherFieldName];

        const otherFieldCleanValue = sanitizeFieldValue(
          otherFormField.config.type,
          otherFormField.value
        );

        const otherFieldErrors = executeFieldValidator(
          nextFormFields,
          otherFieldName,
          otherFieldCleanValue
        );

        nextFormFields[otherFieldName] = {
          ...otherFormField,
          errors: otherFieldErrors,
          // set clean value as undefined if any error is present
          cleanValue: otherFieldErrors.length ? undefined : otherFieldCleanValue,
          ...('props' in otherFormField && {
            props: {
              ...otherFormField.props,
              'aria-invalid': Boolean(otherFieldErrors.length),
            },
          }),
        };
      }

      nextFormFields[otherFieldName].__meta__.isValidationScheduled = false;
    }
  });
};

export const clearField = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
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

export const clearAllFields = <Form extends UseHoneyFormForm>(
  nextFormFields: UseHoneyFormFields<Form>
) => {
  Object.keys(nextFormFields).forEach((fieldName: keyof Form) => {
    nextFormFields[fieldName] = clearField(nextFormFields[fieldName]);
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

      nextFormFields[otherFieldName] = clearField(otherField);

      if (otherFieldName !== initiatorFieldName) {
        clearDependentFields(nextFormFields, otherFieldName, fieldName);
      }
    }
  });
};

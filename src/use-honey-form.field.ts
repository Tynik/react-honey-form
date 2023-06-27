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
  UseHoneyFormField,
  UseHoneyFormFieldMeta,
  UseHoneyFormSetFieldValue,
  UseHoneyFormPushFieldValue,
  UseHoneyFormRemoveFieldValue,
  UseHoneyFormClearFieldErrors,
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
import { captureChildFormsFieldValues, isSkipField } from './use-honey-form.helpers';

const DEFAULT_VALUES_CONVERTORS_MAP: Partial<
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
  { mode = 'change', ...config }: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
  {
    setFieldValue,
    clearFieldErrors,
    pushFieldValue,
    removeFieldValue,
  }: {
    setFieldValue: UseHoneyFormSetFieldValue<Form>;
    clearFieldErrors: UseHoneyFormClearFieldErrors<Form>;
    pushFieldValue: UseHoneyFormPushFieldValue<Form>;
    removeFieldValue: UseHoneyFormRemoveFieldValue<Form>;
  }
): UseHoneyFormField<Form, FieldName, FieldValue> => {
  const fieldRef = createRef<HTMLElement>();

  const fieldValue = config.value === undefined ? config.defaultValue : config.value;

  const props: UseHoneyFormFieldProps<Form, FieldName, FieldValue> = {
    ref: fieldRef,
    value: fieldValue,
    //
    onFocus: e => {
      //
    },
    onChange: e => {
      // @ts-expect-error
      setFieldValue(fieldName, e.target.value, {
        validate: mode === 'change',
      });
    },
    ...(mode === 'blur' && {
      onBlur: e => {
        // @ts-expect-error
        setFieldValue(fieldName, e.target.value);
      },
    }),
    // aria attributes
    'aria-invalid': false,
  };

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const __meta__: UseHoneyFormFieldMeta<Form> = {
    isValidationScheduled: false,
    childrenForms: undefined,
  };

  const nextFieldState: UseHoneyFormField<Form, FieldName, FieldValue> = {
    config,
    props,
    value: fieldValue,
    cleanValue: fieldValue,
    defaultValue: config.defaultValue,
    errors: [],
    // functions
    setValue: value => setFieldValue(fieldName, value),
    pushValue: value => pushFieldValue(fieldName, value),
    removeValue: formIndex => removeFieldValue(fieldName, formIndex),
    scheduleValidation: () => {
      __meta__.isValidationScheduled = true;
    },
    clearErrors: () => clearFieldErrors(fieldName),
    focus: () => {
      fieldRef.current.focus();
    },
    __meta__,
  };

  captureChildFormsFieldValues(nextFieldState);

  return nextFieldState;
};

export const validateField = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>(
  fieldValue: FieldValue,
  fieldConfig: UseHoneyFormFieldConfig<Form, FieldName, FieldValue>,
  formFields: UseHoneyFormFields<Form>
) => {
  let validationResult: UseHoneyFormFieldValidationResult | null = null;

  const fieldErrors: UseHoneyFormFieldError[] = [];

  if (fieldConfig.type) {
    validationResult = DEFAULT_VALIDATORS_MAP[fieldConfig.type](fieldValue, {
      fieldConfig,
      formFields,
    });
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
      validationResult = fieldConfig.validator(fieldValue, { fieldConfig, formFields });
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
) => {
  const valueConvertor = fieldType
    ? (DEFAULT_VALUES_CONVERTORS_MAP[fieldType] as UseHoneyFormFieldValueConvertor<Value>)
    : null;

  return valueConvertor ? valueConvertor(value) : value;
};

export const triggerScheduledFieldsValidations = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>(
  fieldName: FieldName,
  nextFormFields: UseHoneyFormFields<Form>
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

        const otherFieldErrors = validateField(
          otherFieldCleanValue,
          otherFormField.config,
          nextFormFields
        );

        nextFormFields[otherFieldName] = {
          ...otherFormField,
          errors: otherFieldErrors,
          // set clean value as undefined if any error is present
          cleanValue: otherFieldErrors.length ? undefined : otherFieldCleanValue,
          props: {
            ...otherFormField.props,
            'aria-invalid': Boolean(otherFieldErrors.length),
          },
        };
      }

      nextFormFields[otherFieldName].__meta__.isValidationScheduled = false;
    }
  });
};

export const clearField = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
  formField: UseHoneyFormField<Form, FieldName, Form[FieldName]>
) => {
  return {
    ...formField,
    value: undefined,
    cleanValue: undefined,
    errors: [],
    props: {
      ...formField.props,
      value: undefined,
      'aria-invalid': false,
    },
  };
};

export const clearAllFields = <Form extends UseHoneyFormForm>(
  formFields: UseHoneyFormFields<Form>
) => {
  Object.keys(formFields).forEach((fieldName: keyof Form) => {
    formFields[fieldName] = clearField(formFields[fieldName]);
  });
};

export const clearDependentFields = <Form extends UseHoneyFormForm, FieldName extends keyof Form>(
  formFields: UseHoneyFormFields<Form>,
  fieldName: FieldName,
  initiatorFieldName: FieldName = null
) => {
  initiatorFieldName = initiatorFieldName || fieldName;

  Object.keys(formFields).forEach((otherFieldName: keyof Form) => {
    if (otherFieldName === fieldName) {
      return;
    }

    const { dependsOn } = formFields[otherFieldName].config;

    const isDependent = Array.isArray(dependsOn)
      ? dependsOn.includes(fieldName)
      : fieldName === dependsOn;

    if (isDependent) {
      const otherField = formFields[otherFieldName];

      formFields[otherFieldName] = clearField(otherField);

      if (otherFieldName !== initiatorFieldName) {
        clearDependentFields(formFields, otherFieldName, fieldName);
      }
    }
  });
};

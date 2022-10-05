import type { ChangeEvent } from 'react';

type UseFormFieldName = string;

export type UseHoneyFormFieldType = 'string' | 'number';

export type UseHoneyFormFieldValidationResult =
  | boolean
  | {
      errors: UseHoneyFormFieldError[];
    };

export type UseHoneyFormFieldConfig<
  Form extends UseHoneyBaseFormFields,
  Value,
> = {
  value?: Value;
  type?: UseHoneyFormFieldType;
  required?: boolean;
  min?: number;
  max?: number;
  decimal?: boolean;
  negative?: boolean;
  maxFraction?: number;
  // clear that field value when dependent field is changed
  dependsOn?: keyof Form;
  validator?: UseHoneyFormFieldValidator<Form, Value>;
  filter?: (value: Value) => Value;
};

export type UseHoneyFormFieldValidator<
  Form extends UseHoneyBaseFormFields,
  Value,
> = (
  value: Value,
  options: UseHoneyFormFieldConfig<Form, Value>,
) => UseHoneyFormFieldValidationResult;

export type UseHoneyFormFieldInternalValidator = <
  Form extends UseHoneyBaseFormFields,
  Value extends Form[keyof Form],
>(
  value: Value,
  fieldConfig: UseHoneyFormFieldConfig<Form, Value>,
  errors: UseHoneyFormFieldError[],
) => void;

export type UseHoneyFormFieldError = {
  type: 'required' | 'invalidValue';
  message: string;
};

export type UseHoneyFormField<Form extends UseHoneyBaseFormFields, Value> = {
  readonly value: Value;
  readonly errors: UseHoneyFormFieldError[];
  // to destruct these props directly to a component
  readonly props: {
    value: Value;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  };
  readonly config: UseHoneyFormFieldConfig<Form, Value>;
  // functions
  readonly setValue: (value: Value) => void;
};

export type UseHoneyBaseFormFields = Record<UseFormFieldName, unknown>;

export type UseHoneyFormFields<Form extends UseHoneyBaseFormFields> = {
  [K in keyof Form]: UseHoneyFormField<Form, Form[K]>;
};

export type UseHoneyFormFieldsConfigs<Form extends UseHoneyBaseFormFields> = {
  [K in keyof Form]: UseHoneyFormFieldConfig<Form, Form[K]>;
};

export type UseHoneyFormOptions<Form extends UseHoneyBaseFormFields> = {
  fields: UseHoneyFormFieldsConfigs<Form>;
  onSubmit?: (data: Form) => Promise<void>;
  onChange?: (data: Form) => void;
};

export type UseHoneyFormErrors<Form extends UseHoneyBaseFormFields> =
  | { [K in keyof Form]: UseHoneyFormFieldError }
  | null;

export type UseHoneyFormSubmit = () => Promise<void>;

export type UseHoneyFormFieldSetValue<Form extends UseHoneyBaseFormFields> = <
  FieldName extends keyof Form,
  Value extends Form[FieldName],
>(
  fieldName: FieldName,
  value: Value,
  validate: boolean,
) => void;

export type UseHoneyFormAddFormField<Form extends UseHoneyBaseFormFields> = <
  FieldName extends keyof Form,
  Value extends Form[FieldName],
>(
  fieldName: FieldName,
  config: UseHoneyFormFieldConfig<Form, Value>,
) => void;

/**
 * Non-optional fields cannot be removed
 */
export type UseHoneyFormRemoveFormField<Form extends UseHoneyBaseFormFields> = <
  FieldName extends keyof Form,
>(
  fieldName: FieldName,
) => void;

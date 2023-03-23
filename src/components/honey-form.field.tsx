import React, { useEffect } from 'react';

import type { ReactNode } from 'react';
import type {
  UseHoneyFormField,
  UseHoneyFormFieldConfig,
  UseHoneyBaseFormFields,
} from '../use-honey-form.types';

import { useHoneyFormProvider } from './honey-form.provider';

type HoneyFormFieldProps<
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
> = UseHoneyFormFieldConfig<Form, FieldValue> & {
  name: FieldName;
  children: (field: UseHoneyFormField<Form, FieldValue>) => ReactNode;
};

export const HoneyFormField = <
  Form extends UseHoneyBaseFormFields,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>({
  children,
  name,
  ...props
}: HoneyFormFieldProps<Form, FieldName, FieldValue>) => {
  const { formFields, addFormField, removeFormField } = useHoneyFormProvider();

  useEffect(() => {
    addFormField(name, props);

    return () => {
      removeFormField(name);
    };
  }, []);

  const field = formFields[name];
  if (!field) {
    return null;
  }

  return <>{children(field)}</>;
};

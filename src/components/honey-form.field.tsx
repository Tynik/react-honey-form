import React, { useEffect } from 'react';

import type { ReactNode } from 'react';
import type {
  UseHoneyFormField,
  UseHoneyFormFieldConfig,
  UseHoneyFormForm,
} from '../use-honey-form.types';

import { useHoneyFormProvider } from './honey-form.provider';

type HoneyFormFieldProps<
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
> = UseHoneyFormFieldConfig<Form, FieldName, FieldValue> & {
  name: FieldName;
  children: (field: UseHoneyFormField<Form, FieldName, FieldValue>) => ReactNode;
};

export const HoneyFormField = <
  Form extends UseHoneyFormForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName]
>({
  children,
  name,
  ...props
}: HoneyFormFieldProps<Form, FieldName, FieldValue>) => {
  const { formFields, addFormField, removeFormField } = useHoneyFormProvider<Form>();

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

  // @ts-ignore
  return <>{children(field)}</>;
};

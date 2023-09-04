import React, { useEffect } from 'react';

import type { ReactNode } from 'react';
import type { HoneyFormField, HoneyFormFieldConfig, HoneyFormBaseForm } from '../types';

import { useHoneyFormProvider } from './honey-form.provider';

type HoneyFormDynamicFieldProps<
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName],
> = HoneyFormFieldConfig<Form, FieldName, FieldValue> & {
  name: FieldName;
  children: (field: HoneyFormField<Form, FieldName, FieldValue>) => ReactNode;
};

export const HoneyFormDynamicField = <
  Form extends HoneyFormBaseForm,
  FieldName extends keyof Form,
  FieldValue extends Form[FieldName],
>({
  children,
  name,
  ...props
}: HoneyFormDynamicFieldProps<Form, FieldName, FieldValue>) => {
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

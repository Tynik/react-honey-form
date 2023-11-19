import React, { useEffect } from 'react';

import type { ReactNode } from 'react';
import type {
  HoneyFormField,
  HoneyFormBaseForm,
  ChildHoneyFormBaseForm,
  ChildHoneyFormFieldConfig,
} from '../types';

import { useChildHoneyFormProvider } from './child-honey-form.provider';

type ChildHoneyFormDynamicFieldProps<
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FieldName extends keyof ChildForm,
  FormContext,
  FieldValue extends ChildForm[FieldName],
> = ChildHoneyFormFieldConfig<ParentForm, ChildForm, FieldName, FormContext, FieldValue> & {
  name: FieldName;
  children: (field: HoneyFormField<ChildForm, FieldName, FormContext, FieldValue>) => ReactNode;
};

export const ChildHoneyFormDynamicField = <
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FieldName extends keyof ChildForm,
  FormContext,
  FieldValue extends ChildForm[FieldName],
>({
  children,
  name,
  ...props
}: ChildHoneyFormDynamicFieldProps<ParentForm, ChildForm, FieldName, FormContext, FieldValue>) => {
  const { formFields, addFormField, removeFormField } = useChildHoneyFormProvider<
    ParentForm,
    ChildForm,
    FormContext
  >();

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

  // @ts-expect-error
  return <>{children(field)}</>;
};

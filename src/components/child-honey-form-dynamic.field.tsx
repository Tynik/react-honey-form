import React, { useEffect } from 'react';

import type { ReactNode } from 'react';
import type {
  HoneyFormField,
  HoneyFormBaseForm,
  ChildHoneyFormBaseForm,
  ChildHoneyFormFieldConfig,
  KeysWithArrayValues,
} from '../types';

import { useChildHoneyFormProvider } from './child-honey-form.provider';

type ChildHoneyFormDynamicFieldProps<
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FieldName extends keyof ChildForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext,
  FieldValue extends ChildForm[FieldName] = ChildForm[FieldName],
> = ChildHoneyFormFieldConfig<
  ParentForm,
  ChildForm,
  FieldName,
  ParentFieldName,
  FormContext,
  FieldValue
> & {
  name: FieldName;
  children: (field: HoneyFormField<ChildForm, FieldName, FormContext, FieldValue>) => ReactNode;
};

export const ChildHoneyFormDynamicField = <
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FieldName extends keyof ChildForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext,
  FieldValue extends ChildForm[FieldName],
>({
  children,
  name,
  ...props
}: ChildHoneyFormDynamicFieldProps<
  ParentForm,
  ChildForm,
  FieldName,
  ParentFieldName,
  FormContext,
  FieldValue
>) => {
  const { formFields, addFormField, removeFormField } = useChildHoneyFormProvider<
    ParentForm,
    ChildForm,
    ParentFieldName,
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

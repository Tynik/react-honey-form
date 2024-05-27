import React from 'react';

import type { HoneyFormBaseForm, ChildHoneyFormBaseForm, KeysWithArrayValues } from '../types';
import type { ChildHoneyFormProviderProps } from './child-honey-form.provider';
import type { ChildHoneyFormFormProps, ChildHoneyFormFormContent } from './child-honey-form.form';

import { ChildHoneyFormProvider } from './child-honey-form.provider';
import { genericMemo } from '../helpers';
import { ChildHoneyFormForm } from './child-honey-form.form';

type ChildHoneyFormProps<
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext = undefined,
> = ChildHoneyFormProviderProps<ParentForm, ChildForm, ParentFieldName, FormContext> & {
  children?: ChildHoneyFormFormContent<ParentForm, ChildForm, ParentFieldName, FormContext>;
  formProps?: ChildHoneyFormFormProps<ParentForm, ChildForm, ParentFieldName, FormContext>;
};

const ChildHoneyFormComponent = <
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  FormContext = undefined,
>({
  children,
  formProps,
  ...props
}: ChildHoneyFormProps<ParentForm, ChildForm, ParentFieldName, FormContext>) => {
  return (
    <ChildHoneyFormProvider {...props}>
      <ChildHoneyFormForm {...formProps}>{children}</ChildHoneyFormForm>
    </ChildHoneyFormProvider>
  );
};

export const ChildHoneyForm = genericMemo(ChildHoneyFormComponent);

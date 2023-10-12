import React from 'react';

import type { HoneyFormBaseForm, ChildHoneyFormBaseForm } from '../types';
import type { ChildHoneyFormProviderProps } from './child-honey-form.provider';
import type { ChildHoneyFormFormProps, ChildHoneyFormFormContent } from './child-honey-form.form';

import { ChildHoneyFormProvider } from './child-honey-form.provider';
import { genericMemo } from '../helpers';
import { ChildHoneyFormForm } from './child-honey-form.form';

type ChildHoneyFormProps<
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
> = ChildHoneyFormProviderProps<ParentForm, ChildForm, FormContext> & {
  children?: ChildHoneyFormFormContent<ParentForm, ChildForm, FormContext>;
  formProps?: ChildHoneyFormFormProps<ParentForm, ChildForm, FormContext>;
};

const ChildHoneyFormComponent = <
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
>({
  children,
  formProps,
  ...props
}: ChildHoneyFormProps<ParentForm, ChildForm, FormContext>) => {
  return (
    <ChildHoneyFormProvider {...props}>
      <ChildHoneyFormForm {...formProps}>{children}</ChildHoneyFormForm>
    </ChildHoneyFormProvider>
  );
};

export const ChildHoneyForm = genericMemo(ChildHoneyFormComponent);

import React from 'react';

import type { HTMLAttributes, ReactNode } from 'react';
import type {
  HoneyFormBaseForm,
  ChildHoneyFormBaseForm,
  HoneyFormApi,
  KeysWithArrayValues,
} from '../types';

import { useChildHoneyFormProvider } from './child-honey-form.provider';
import { useHoneyFormProvider } from './honey-form.provider';

export type ChildHoneyFormFormContent<
  // TODO: pass ParentForm to ChildHoneyFormApi
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
> =
  | ReactNode
  | ((
      childHoneyFormApi: HoneyFormApi<ChildForm, FormContext>,
      parentHoneyFormApi: HoneyFormApi<ParentForm, FormContext>,
    ) => ReactNode);

export type ChildHoneyFormFormProps<
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children?: ChildHoneyFormFormContent<ParentForm, ParentFieldName, ChildForm, FormContext>;
};

export const ChildHoneyFormForm = <
  ParentForm extends HoneyFormBaseForm,
  ParentFieldName extends KeysWithArrayValues<ParentForm>,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
>({
  children,
  ...props
}: ChildHoneyFormFormProps<ParentForm, ParentFieldName, ChildForm, FormContext>) => {
  const parentHoneyFormApi = useHoneyFormProvider<ParentForm, FormContext>();
  const childHoneyFormApi = useChildHoneyFormProvider<
    ParentForm,
    ParentFieldName,
    ChildForm,
    FormContext
  >();

  return (
    <div role="form" data-testid="child-honey-form" {...props}>
      {typeof children === 'function' ? children(childHoneyFormApi, parentHoneyFormApi) : children}
    </div>
  );
};

import React, { createContext, useContext } from 'react';

import type { PropsWithChildren } from 'react';
import type {
  HoneyFormBaseForm,
  ChildHoneyFormBaseForm,
  HoneyFormApi,
  ChildHoneyFormOptions,
} from '../types';

import { useChildHoneyForm } from '../use-child-honey-form';

type ChildHoneyFormContextValue<
  // TODO: pass ParentForm to ChildHoneyFormApi
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
> = HoneyFormApi<ChildForm, FormContext>;

const ChildHoneyFormContext = createContext<ChildHoneyFormContextValue<any, any, any> | undefined>(
  undefined,
);

export type ChildHoneyFormProviderProps<
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
> = ChildHoneyFormOptions<ParentForm, ChildForm, FormContext>;

export const ChildHoneyFormProvider = <
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
>({
  children,
  ...props
}: PropsWithChildren<ChildHoneyFormProviderProps<ParentForm, ChildForm, FormContext>>) => {
  const childHoneyFormApi = useChildHoneyForm(props);

  return (
    <ChildHoneyFormContext.Provider value={childHoneyFormApi}>
      {children}
    </ChildHoneyFormContext.Provider>
  );
};

export const useChildHoneyFormProvider = <
  ParentForm extends HoneyFormBaseForm,
  ChildForm extends ChildHoneyFormBaseForm,
  FormContext = undefined,
>() => {
  const childFormContext = useContext<
    ChildHoneyFormContextValue<ParentForm, ChildForm, FormContext> | undefined
  >(ChildHoneyFormContext);

  if (!childFormContext) {
    throw new Error(
      '[honey-form]: The `useChildHoneyFormProvider()` can be used only inside <ChildHoneyFormProvider/> component!',
    );
  }

  return childFormContext;
};

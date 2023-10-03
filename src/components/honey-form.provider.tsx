import React, { createContext, useContext } from 'react';

import type { PropsWithChildren } from 'react';
import type { HoneyFormBaseForm, HoneyFormApi, HoneyFormOptions } from '../types';

import { useHoneyForm } from '../use-honey-form';

type HoneyFormContextValue<Form extends HoneyFormBaseForm, FormContext = undefined> = HoneyFormApi<
  Form,
  FormContext
>;

const HoneyFormContext = createContext<HoneyFormContextValue<any> | undefined>(undefined);

export type HoneyFormProviderProps<
  Form extends HoneyFormBaseForm,
  FormContext = undefined,
> = HoneyFormOptions<Form, FormContext>;

export const HoneyFormProvider = <Form extends HoneyFormBaseForm, FormContext = undefined>({
  children,
  ...props
}: PropsWithChildren<HoneyFormProviderProps<Form, FormContext>>) => {
  const honeyFormApi = useHoneyForm(props);

  return <HoneyFormContext.Provider value={honeyFormApi}>{children}</HoneyFormContext.Provider>;
};

export const useHoneyFormProvider = <Form extends HoneyFormBaseForm, FormContext = undefined>() => {
  const formContext = useContext<HoneyFormContextValue<Form, FormContext> | undefined>(
    HoneyFormContext,
  );

  if (!formContext) {
    throw new Error(
      '[honey-form]: The `useHoneyFormProvider()` can be used only inside <HoneyForm/> or <HoneyFormProvider/> component!',
    );
  }

  return formContext;
};

import React, { createContext, useContext } from 'react';

import type { PropsWithChildren } from 'react';
import type { HoneyFormBaseForm, HoneyFormApi, HoneyFormOptions } from '../types';

import { useHoneyForm } from '../use-honey-form';

type HoneyFormContextValue<Form extends HoneyFormBaseForm> = HoneyFormApi<Form>;

const HoneyFormContext = createContext<HoneyFormContextValue<any> | undefined>(undefined);

export type HoneyFormProviderProps<Form extends HoneyFormBaseForm> = HoneyFormOptions<Form>;

export const HoneyFormProvider = <Form extends HoneyFormBaseForm>({
  children,
  ...props
}: PropsWithChildren<HoneyFormProviderProps<Form>>) => {
  const honeyFormApi = useHoneyForm(props);

  return <HoneyFormContext.Provider value={honeyFormApi}>{children}</HoneyFormContext.Provider>;
};

export const useHoneyFormProvider = <Form extends HoneyFormBaseForm>() => {
  const formContext = useContext<HoneyFormContextValue<Form> | undefined>(HoneyFormContext);

  if (!formContext) {
    throw new Error(
      '[use-honey-form]: useHoneyFormProvider() can be used only inside <HoneyFormProvider/>',
    );
  }

  return formContext;
};

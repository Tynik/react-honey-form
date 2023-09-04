import React, { createContext, useContext } from 'react';

import type { PropsWithChildren } from 'react';
import type { HoneyFormBaseForm, HoneyFormApi, HoneyFormOptions } from '../types';

import { useHoneyForm } from '../use-honey-form';

type HoneyFormContextValue<Form extends HoneyFormBaseForm, Response> = HoneyFormApi<Form, Response>;

const HoneyFormContext = createContext<HoneyFormContextValue<any, any> | undefined>(undefined);

export type HoneyFormProviderProps<
  Form extends HoneyFormBaseForm,
  Response = void,
> = HoneyFormOptions<Form, Response>;

export const HoneyFormProvider = <Form extends HoneyFormBaseForm, Response = void>({
  children,
  ...props
}: PropsWithChildren<HoneyFormProviderProps<Form, Response>>) => {
  const honeyFormApi = useHoneyForm(props);

  return <HoneyFormContext.Provider value={honeyFormApi}>{children}</HoneyFormContext.Provider>;
};

export const useHoneyFormProvider = <Form extends HoneyFormBaseForm, Response = void>() => {
  const formContext = useContext<HoneyFormContextValue<Form, Response> | undefined>(
    HoneyFormContext,
  );

  if (!formContext) {
    throw new Error(
      '[use-honey-form]: useHoneyFormProvider() can be used only inside <HoneyFormProvider/>',
    );
  }

  return formContext;
};

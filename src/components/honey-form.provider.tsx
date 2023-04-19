import React, { createContext, useContext } from 'react';

import type { PropsWithChildren } from 'react';
import type {
  UseHoneyBaseFormFields,
  UseHoneyFormApi,
  UseHoneyFormOptions,
} from '../use-honey-form.types';

import { useHoneyForm } from '../use-honey-form';

type HoneyFormContextValue<Form extends UseHoneyBaseFormFields, Response> = UseHoneyFormApi<
  Form,
  Response
>;

const HoneyFormContext = createContext<HoneyFormContextValue<any, any>>(undefined);

export type HoneyFormProviderProps<
  Form extends UseHoneyBaseFormFields,
  Response = void
> = UseHoneyFormOptions<Form, Response>;

export const HoneyFormProvider = <Form extends UseHoneyBaseFormFields, Response = void>({
  children,
  ...props
}: PropsWithChildren<HoneyFormProviderProps<Form, Response>>) => {
  const honeyFormApi = useHoneyForm(props);

  return <HoneyFormContext.Provider value={honeyFormApi}>{children}</HoneyFormContext.Provider>;
};

export const useHoneyFormProvider = () => {
  const formContext = useContext(HoneyFormContext);
  if (!formContext) {
    throw new Error('useHoneyFormProvider() can be used only inside <HoneyFormProvider/>');
  }

  return formContext;
};

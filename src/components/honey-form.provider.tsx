import React, { createContext, useContext } from 'react';

import type { PropsWithChildren } from 'react';
import type {
  UseHoneyFormForm,
  UseHoneyFormApi,
  UseHoneyFormOptions,
} from '../use-honey-form.types';

import { useHoneyForm } from '../use-honey-form';

type HoneyFormContextValue<Form extends UseHoneyFormForm, Response> = UseHoneyFormApi<
  Form,
  Response
>;

const HoneyFormContext = createContext<HoneyFormContextValue<any, any> | undefined>(undefined);

export type HoneyFormProviderProps<
  Form extends UseHoneyFormForm,
  Response = void,
> = UseHoneyFormOptions<Form, Response>;

export const HoneyFormProvider = <Form extends UseHoneyFormForm, Response = void>({
  children,
  ...props
}: PropsWithChildren<HoneyFormProviderProps<Form, Response>>) => {
  const honeyFormApi = useHoneyForm(props);

  return <HoneyFormContext.Provider value={honeyFormApi}>{children}</HoneyFormContext.Provider>;
};

export const useHoneyFormProvider = <Form extends UseHoneyFormForm, Response = void>() => {
  const formContext = useContext<HoneyFormContextValue<Form, Response>>(HoneyFormContext);
  if (!formContext) {
    throw new Error(
      '[use-honey-form]: useHoneyFormProvider() can be used only inside <HoneyFormProvider/>',
    );
  }

  return formContext;
};

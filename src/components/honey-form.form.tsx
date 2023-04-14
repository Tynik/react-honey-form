import React from 'react';

import type { FormEventHandler, FormHTMLAttributes, ReactNode } from 'react';
import type { UseHoneyBaseFormFields, UseHoneyFormApi } from '../use-honey-form.types';

import { useHoneyFormProvider } from './honey-form.provider';

export type FormContent<Form extends UseHoneyBaseFormFields, Response> =
  | ReactNode
  | ((honeyFormApi: UseHoneyFormApi<Form, Response>) => ReactNode);

export type HoneyFormFormProps<Form extends UseHoneyBaseFormFields, Response> = Omit<
  FormHTMLAttributes<unknown>,
  'onSubmit' | 'children'
> & {
  children?: FormContent<Form, Response>;
};

export const HoneyFormForm = <Form extends UseHoneyBaseFormFields, Response>({
  children,
  ...props
}: HoneyFormFormProps<Form, Response>) => {
  const honeyFormApi = useHoneyFormProvider();

  const onSubmit: FormEventHandler<any> = e => {
    e.preventDefault();

    honeyFormApi.submit().catch(() => {});
  };

  return (
    <form onSubmit={onSubmit} data-testid="form" noValidate {...props}>
      {typeof children === 'function' ? children(honeyFormApi as never) : children}
    </form>
  );
};

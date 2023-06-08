import React, { forwardRef } from 'react';

import type { Ref, FormEventHandler, FormHTMLAttributes, ReactNode } from 'react';
import type { UseHoneyForm, UseHoneyFormApi } from '../use-honey-form.types';

import { useHoneyFormProvider } from './honey-form.provider';

export type FormContent<Form extends UseHoneyForm, Response> =
  | ReactNode
  | ((honeyFormApi: UseHoneyFormApi<Form, Response>) => ReactNode);

export type HoneyFormFormProps<Form extends UseHoneyForm, Response> = Omit<
  FormHTMLAttributes<unknown>,
  'onSubmit' | 'children'
> & {
  children?: FormContent<Form, Response>;
};

const HoneyFormFormComponent = <Form extends UseHoneyForm, Response = void>(
  { children, ...props }: HoneyFormFormProps<Form, Response>,
  ref: Ref<HTMLFormElement>
) => {
  const honeyFormApi = useHoneyFormProvider();

  const onSubmit: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault();

    honeyFormApi.submit().catch(() => {});
  };

  return (
    <form ref={ref} onSubmit={onSubmit} data-testid="form" noValidate {...props}>
      {typeof children === 'function' ? children(honeyFormApi as never) : children}
    </form>
  );
};

export const HoneyFormForm = forwardRef(HoneyFormFormComponent) as <
  Form extends UseHoneyForm,
  Response = void
>(
  props: HoneyFormFormProps<Form, Response> & React.RefAttributes<HTMLFormElement>
) => React.ReactElement;

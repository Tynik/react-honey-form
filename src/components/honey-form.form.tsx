import React, { forwardRef } from 'react';

import type { Ref, FormEventHandler, FormHTMLAttributes, ReactNode } from 'react';
import type { UseHoneyFormForm, UseHoneyFormApi } from '../types';

import { useHoneyFormProvider } from './honey-form.provider';
import { errorMessage } from '../helpers';

export type UseHoneyFormFormContent<Form extends UseHoneyFormForm, Response> =
  | ReactNode
  | ((honeyFormApi: UseHoneyFormApi<Form, Response>) => ReactNode);

export type HoneyFormFormProps<Form extends UseHoneyFormForm, Response> = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'children'
> & {
  children?: UseHoneyFormFormContent<Form, Response>;
};

const HoneyFormComponent = <Form extends UseHoneyFormForm, Response = void>(
  { children, ...props }: HoneyFormFormProps<Form, Response>,
  ref: Ref<HTMLFormElement>,
) => {
  const honeyFormApi = useHoneyFormProvider();

  const onSubmit: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault();

    honeyFormApi.submitForm().catch(errorMessage);
  };

  return (
    <form ref={ref} onSubmit={onSubmit} data-testid="honey-form" noValidate {...props}>
      {/* @ts-expect-error */}
      {typeof children === 'function' ? children(honeyFormApi) : children}
    </form>
  );
};

export const HoneyFormForm = forwardRef(HoneyFormComponent) as <
  Form extends UseHoneyFormForm,
  Response = void,
>(
  props: HoneyFormFormProps<Form, Response> & React.RefAttributes<HTMLFormElement>,
) => React.ReactElement;

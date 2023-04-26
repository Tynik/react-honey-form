import React, { forwardRef, memo } from 'react';

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

export const HoneyFormForm = memo(
  forwardRef<HTMLFormElement, HoneyFormFormProps<any, any>>(({ children, ...props }, ref) => {
    const honeyFormApi = useHoneyFormProvider();

    const onSubmit: FormEventHandler<HTMLFormElement> = e => {
      e.preventDefault();

      honeyFormApi.submit().catch(() => {});
    };

    return (
      <form ref={ref} onSubmit={onSubmit} data-testid="form" noValidate {...props}>
        {typeof children === 'function' ? children(honeyFormApi) : children}
      </form>
    );
  })
);

import React, { forwardRef } from 'react';

import type { Ref, FormEventHandler, FormHTMLAttributes, ReactNode } from 'react';
import type { HoneyFormBaseForm, HoneyFormApi } from '../types';

import { useHoneyFormProvider } from './honey-form.provider';
import { errorMessage } from '../helpers';

export type UseHoneyFormFormContent<Form extends HoneyFormBaseForm> =
  | ReactNode
  | ((honeyFormApi: HoneyFormApi<Form>) => ReactNode);

export type HoneyFormFormProps<Form extends HoneyFormBaseForm> = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'onSubmit' | 'children'
> & {
  children?: UseHoneyFormFormContent<Form>;
};

const HoneyFormComponent = <Form extends HoneyFormBaseForm>(
  { children, ...props }: HoneyFormFormProps<Form>,
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

export const HoneyFormForm = forwardRef(HoneyFormComponent) as <Form extends HoneyFormBaseForm>(
  props: HoneyFormFormProps<Form> & React.RefAttributes<HTMLFormElement>,
) => React.ReactElement;

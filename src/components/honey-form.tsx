import React from 'react';

import type { UseHoneyBaseFormFields } from '../use-honey-form.types';
import type { HoneyFormProviderProps } from './honey-form.provider';
import type { HoneyFormFormProps, FormContent } from './honey-form.form';

import { HoneyFormProvider } from './honey-form.provider';
import { HoneyFormForm } from './honey-form.form';

type HoneyFormProps<Form extends UseHoneyBaseFormFields, Response = void> = HoneyFormProviderProps<
  Form,
  Response
> & {
  children?: FormContent<Form, Response>;
  formProps?: HoneyFormFormProps<Form, Response>;
};

export const HoneyForm = <Form extends UseHoneyBaseFormFields, Response = void>({
  children,
  formProps,
  ...props
}: HoneyFormProps<Form, Response>) => {
  return (
    <HoneyFormProvider {...props}>
      <HoneyFormForm {...formProps}>{children}</HoneyFormForm>
    </HoneyFormProvider>
  );
};

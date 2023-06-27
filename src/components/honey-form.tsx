import type { Ref } from 'react';
import React, { forwardRef } from 'react';

import type { UseHoneyFormForm } from '../use-honey-form.types';
import type { HoneyFormProviderProps } from './honey-form.provider';
import type { HoneyFormFormProps, UseHoneyFormFormContent } from './honey-form.form';

import { HoneyFormProvider } from './honey-form.provider';
import { HoneyFormForm } from './honey-form.form';
import { genericMemo } from '../use-honey-form.helpers';

type HoneyFormProps<Form extends UseHoneyFormForm, Response = void> = HoneyFormProviderProps<
  Form,
  Response
> & {
  children?: UseHoneyFormFormContent<Form, Response>;
  formProps?: HoneyFormFormProps<Form, Response>;
};

const HoneyFormComponent = <Form extends UseHoneyFormForm, Response = void>(
  { children, formProps, ...props }: HoneyFormProps<Form, Response>,
  ref: Ref<HTMLFormElement>
) => {
  return (
    <HoneyFormProvider {...props}>
      <HoneyFormForm ref={ref} {...formProps}>
        {children}
      </HoneyFormForm>
    </HoneyFormProvider>
  );
};

export const HoneyForm = genericMemo(
  forwardRef(HoneyFormComponent) as <Form extends UseHoneyFormForm, Response = void>(
    props: HoneyFormProps<Form, Response> & React.RefAttributes<HTMLFormElement>
  ) => React.ReactElement
);

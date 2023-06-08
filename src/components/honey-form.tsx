import type { Ref } from 'react';
import React, { forwardRef } from 'react';

import type { UseHoneyForm } from '../use-honey-form.types';
import type { HoneyFormProviderProps } from './honey-form.provider';
import type { HoneyFormFormProps, FormContent } from './honey-form.form';

import { HoneyFormProvider } from './honey-form.provider';
import { HoneyFormForm } from './honey-form.form';
import { genericMemo } from '../use-honey-form.helpers';

type HoneyFormProps<Form extends UseHoneyForm, Response = void> = HoneyFormProviderProps<
  Form,
  Response
> & {
  children?: FormContent<Form, Response>;
  formProps?: HoneyFormFormProps<Form, Response>;
};

const HoneyFormComponent = <Form extends UseHoneyForm, Response = void>(
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
  forwardRef(HoneyFormComponent) as <Form extends UseHoneyForm, Response = void>(
    props: HoneyFormProps<Form, Response> & React.RefAttributes<HTMLFormElement>
  ) => React.ReactElement
);

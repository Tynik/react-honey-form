import type { Ref } from 'react';
import React, { forwardRef } from 'react';

import type { HoneyFormBaseForm } from '../types';
import type { HoneyFormProviderProps } from './honey-form.provider';
import type { HoneyFormFormProps, HoneyFormFormContent } from './honey-form.form';

import { HoneyFormProvider } from './honey-form.provider';
import { HoneyFormForm } from './honey-form.form';
import { genericMemo } from '../helpers';

type HoneyFormProps<
  Form extends HoneyFormBaseForm,
  FormContext = undefined,
> = HoneyFormProviderProps<Form, FormContext> & {
  children?: HoneyFormFormContent<Form, FormContext>;
  formProps?: HoneyFormFormProps<Form, FormContext>;
};

const HoneyFormComponent = <Form extends HoneyFormBaseForm, FormContext = undefined>(
  { children, formProps, ...props }: HoneyFormProps<Form, FormContext>,
  ref: Ref<HTMLFormElement>,
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
  forwardRef(HoneyFormComponent) as <Form extends HoneyFormBaseForm, FormContext = undefined>(
    props: HoneyFormProps<Form, FormContext> & React.RefAttributes<HTMLFormElement>,
  ) => React.ReactElement,
);

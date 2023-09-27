import type { Ref } from 'react';
import React, { forwardRef } from 'react';

import type { HoneyFormBaseForm } from '../types';
import type { HoneyFormProviderProps } from './honey-form.provider';
import type { HoneyFormFormProps, UseHoneyFormFormContent } from './honey-form.form';

import { HoneyFormProvider } from './honey-form.provider';
import { HoneyFormForm } from './honey-form.form';
import { genericMemo } from '../helpers';

type HoneyFormProps<Form extends HoneyFormBaseForm> = HoneyFormProviderProps<Form> & {
  children?: UseHoneyFormFormContent<Form>;
  formProps?: HoneyFormFormProps<Form>;
};

const HoneyFormComponent = <Form extends HoneyFormBaseForm>(
  { children, formProps, ...props }: HoneyFormProps<Form>,
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
  forwardRef(HoneyFormComponent) as <Form extends HoneyFormBaseForm>(
    props: HoneyFormProps<Form> & React.RefAttributes<HTMLFormElement>,
  ) => React.ReactElement,
);

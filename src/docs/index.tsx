import React from 'react';
import * as ReactDOM from 'react-dom/client';
import { MDXProvider } from '@mdx-js/react';

import BaseForm from './pages/base-form.mdx';

const components = {
  BaseForm,
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <MDXProvider components={components}>
    <BaseForm />
  </MDXProvider>,
);

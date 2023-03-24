# React Honey Form


[![Latest version](https://img.shields.io/npm/v/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Publish status](https://github.com/Tynik/react-honey-form/actions/workflows/publish.yml/badge.svg)](https://github.com/Tynik/react-honey-form/actions/workflows/publish.yml)
[![Package size](https://img.shields.io/bundlephobia/minzip/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Downloads statistic](https://img.shields.io/npm/dm/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Commit activity](https://img.shields.io/github/commit-activity/m/tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Licence](https://img.shields.io/npm/l/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)

*That's a React library for creating and managing forms with ease. It provides a set of customizable and extensible components that make it easy to create forms that match your application's look and feel.*

## Intro

The `useHoneyForm` is a custom React hook that provides a form state management functionality with a set of useful features such as field validation, error handling, form submission and resetting and default values.

## Parameters

The `useHoneyForm` hook takes an options object as a single argument with the following properties:

1. `fields` - An object that defines the fields of the form. Each field is an object that defines its properties such as type, required, value, min, max, etc. See more in the `UseHoneyFormFieldConfig` type.
1. `defaults` - An optional object that defines the default values for the form fields.
1. `onSubmit` - A callback function that will be called when the form is submitted. The function receives the form data as a parameter.
1. `onChange` - An optional callback function that will be called when any field value is changed.
1. `onChangeDebounce` - An optional number that specifies the debounce time in milliseconds for the `onChange` callback.

## Return value

The `useHoneyForm` hook returns an object with the following properties:

1. `formFields` - An object that contains the state of the form fields. Each field has a value, cleanValue, errors, props, and config properties. The `value` property is the current value of the field, `cleanValue` is the parsed value of the field after applying any formatting or cleaning functions, `errors` is an array of error messages if the field is invalid, `props` is an object with the necessary props to bind to the corresponding input element in the form, and `config` is the original configuration object of the field.
1. `setFormValues` - Set form values. Support partial field values setting. The option `clearAll` can be used to clear other fields which were not mentioned.
1. `areDefaultsFetching` - By default is `false`. Becomes `true` when form defaults values being retrieved from Promise function. Returns to `false` when default values successfully/erred retrieved.
1. `areDefaultsFetchingErred` - By default is `false`. Becomes `true` when default values cannot be retrieved from Promise function.
1. `isDirty` - By default is `false`. Becomes `true` when any field value is changed. Returns to `false` when form successfully submitted.
1. `isSubmitting` - Becomes `true` when form is submitting.
1. `errors` - The object that includes all fields errors. By default, is `{}`. When field has any error the field appears in that object as a key and a value is array of field errors.
1. `addFormField` - Dynamically allows to add a new form field.
1. `removeFormField` - Remove a form field. You can remove only optional form fields.
1. `addError` - Add a new error related to specific field. All previous field errors stay present.
1. `resetErrors` - Reset all form field errors. Can be used to remove all custom added errors.
1. `submit` - Submit a form. Can accept async function that will be called with clean form data.
1. `reset` - Reset all form field values to initial state.

## Field Properties

1. `value` - The current field value. Contains formatted value when `format` function is used for the field.
1. `cleanValue` - The converted, but not formatted current field value. The value is used for submitting form data. Converting process is used when field type was set (e.g.: string to number).  
1. `errors` - The list of field errors. By default, is `[]`. Each error object has a type `required | invalid | server` and a message.
1. `setValue` - Set a field value.
1. `focus` - Focus a field.

## Examples

*Simple usage*

```typescript jsx
type ProfileForm = {
  name: string;
  age: number;
}

const Form = () => {
  const { formFields, submit } = useHoneyForm<ProfileForm>({
    fields: {
      name: {
        required: true
      },
      age: {
        type: 'number'
      },
    },
    onSubmit: (data) => {
      console.log(data);
    },
  });
  
  return <form noValidate>
    <input {...formFields.name.props}/>
    
    <input {...formFields.age.props}/>
    
    <button type="submit" onClick={submit}>Save</button>
  </form>;
}
```

## Conclusion

The `react-honey-form` is a powerful and customizable library for creating and managing forms in React. With its set of components and hooks, you can easily create forms that match your application's look and feel, and manage form submission and validation with ease.
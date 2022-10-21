# react-honey-form

[![Latest version](https://img.shields.io/npm/v/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Publish status](https://github.com/Tynik/react-honey-form/actions/workflows/publish.yml/badge.svg)](https://github.com/Tynik/react-honey-form/actions/workflows/publish.yml)
[![Package size](https://img.shields.io/bundlephobia/minzip/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Downloads statistic](https://img.shields.io/npm/dm/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Commit activity](https://img.shields.io/github/commit-activity/m/tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Licence](https://img.shields.io/npm/l/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)

## API

1. `formFields` - The object of all form fields, where a key is a field name and a value as the field properties.
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

## Examples

*Simple usage*

```typescript jsx
type ProfileForm = {
  name: string;
  age: number;
}

const Form = () => {
  const { formFields, submit } = useForm<ProfileForm>({
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
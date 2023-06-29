# React Honey Form

[![Latest version](https://img.shields.io/npm/v/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Publish status](https://github.com/Tynik/react-honey-form/actions/workflows/publish.yml/badge.svg)](https://github.com/Tynik/react-honey-form/actions/workflows/publish.yml)
[![Package size](https://img.shields.io/bundlephobia/minzip/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Downloads statistic](https://img.shields.io/npm/dm/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Commit activity](https://img.shields.io/github/commit-activity/m/tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)
[![Licence](https://img.shields.io/npm/l/@tynik/react-honey-form)](https://www.npmjs.com/package/@tynik/react-honey-form)

<p align="center">
  <img width="200" src="HoneyFormLogo.png" alt="Logo">
</p>

## Intro

HoneyForm is a React library designed to simplify the process of creating and managing forms. It offers a collection of customizable and extensible components that enable you to effortlessly create forms that seamlessly integrate with your application's visual style.

With HoneyForm, you can streamline your form development workflow and handle form state management with ease. The library provides an intuitive API and a range of features to support various form scenarios, including dynamic form fields, form validation, error handling, and form submission.

## Key Features

1. **Customizable and Extensible**: HoneyForm offers a set of components that can be easily customized to match your application's look and feel. You have full control over the styling and behavior of the form components.
2. **Effortless Form Creation**: With HoneyForm, you can quickly create forms by leveraging the provided components and intuitive configuration options. Define your form structure, set validation rules, and handle form submission with simplicity.
3. **Dynamic Form Fields**: HoneyForm supports dynamic form fields, allowing you to add or remove fields dynamically as per your application requirements. This feature is particularly useful when dealing with forms that involve variable sets of data.
4. **Form Validation**: Ensure data integrity and user input correctness with HoneyForm's built-in form validation capabilities. Define validation rules for each form field, and easily handle validation errors.
5. **Form Submission**: HoneyForm simplifies the process of submitting form data. Hook into the form submission event, handle the submission logic, and interact with the form data seamlessly.

## Parameters

The `useHoneyForm` hook takes an options object as a single argument with the following properties:

1. `fields` - An object that defines the fields of the form. Each field is an object that defines its properties such as type, required, value, min, max, etc. See more in the `UseHoneyFormFieldConfig` type.
2. `formIndex` - An optional parameter that represents the index of the child form within an array of forms. This parameter is used when working with nested forms.
3. `parentField` - An optional parameter that specifies the parent field for a child form. When working with nested forms, this parameter allows you to establish a parent-child relationship between forms. The `parentField` should be a reference to the parent form field where the child form's data will be stored. By linking a child form to a parent field, changes in the child form's fields can be synchronized with the corresponding parent field, enabling hierarchical data management.
4. `defaults` - An optional object that defines the default values for the form fields. It allows you to pre-populate the form fields with initial values. If the `defaults` argument is a regular object, it is expected to have keys corresponding to the field names and values representing the default values for those fields. If the `defaults` argument is a Promise function, it should resolve an object with the same structure, allowing for more dynamic default values based on some logic or external data.
5. `onSubmit` - A callback function that will be called when the form is submitted. The function receives the form data as a parameter.
6. `onChange` - An optional callback function that will be called when any field value is changed.
7. `onChangeDebounce` - An optional number that specifies the debounce time in milliseconds for the `onChange` callback.

## Field Configuration

1. `value` - The initial value of the form field.
2. `defaultValue` - The default value of the form field.
3. `type` - The type of the form field. Can be as `string`, `number` and `email`. Default is `string`.
4. `required` - A boolean value indicating whether the form field is required or not. If set to true, the field must have a non-empty value for the form to be considered valid. Default is `false`.
5. `min` - The minimum value allowed for numeric fields or minimum length of a string. Only applicable for fields of type `number` or `string`.
6. `max` - The maximum value allowed for numeric fields or maximum length of a string. Only applicable for fields of type `number` or `string`.
7. `decimal` - A boolean value indicating whether the numeric field can accept decimal values. Only applicable for fields of type `number`.
8. `negative` - A boolean value indicating whether the numeric field can accept negative values. Only applicable for fields of type `number`.
9. `maxFraction` - The maximum number of decimal places allowed for numeric fields. Only applicable for fields of type `number` and when decimal is set to true.
10. `dependsOn` - Specifies one or more fields that the current field depends on. When any of the dependent fields change, the current field's value will be cleared. This property can be a single field name (as a string) or an array of field names.
11. `errorMessages` - An object that specifies custom error messages for different validation errors. The keys of the object correspond to validation error types, and the values are the corresponding error messages. This allows you to customize the error messages displayed for specific validation errors.
12. `validator` - A custom validation function for the field. Should return either true (indicating the value is valid) or an error message (indicating the value is invalid).
13. `filter` - A function that can be used to remove or modify certain characters from the field value. The function takes the current value as input and should return the modified value.
14. `format` - A function that can be used to transform the field value into a different format. The function takes the current value as input and should return the transformed value.
15. `skip` - A function that determines whether the field should not be validated and skipped (not included) in the form submission. The function takes the complete form fields object as input and should return a boolean value indicating whether the field should be skipped.
16. `onChange`: A callback function that will be called whenever the field value changes. This can be used to perform additional actions or side effects when the field value changes.

## Return value

The `useHoneyForm` hook returns an object with the following properties:

1. `formFields` - An object that contains the state of the form fields. Each field has the following properties:
   - `value`: The current value of the field.
   - `nestedValues`: The nested values of the child forms within the array field. This property holds an object representing the state of the child forms.
   - `cleanValue`: The parsed value of the field after applying cleaning functions.
   - `errors`: An array of error messages if the field is invalid.
   - `props`: An object with the necessary props to bind to the corresponding input element in the form.
   - `config`: The original configuration object of the field.
   - `setValue`: A function to set the value of the field.
   - `pushValue`: A function to add a new value to an array field.
   - `removeValue`: A function to remove a value from an array field by its index.
   - `scheduleValidation`: A function that can be used to schedule the validation of another field inside the `validator` function of a field. It allows triggering the validation of a dependent field based on the current field's value.
   - `focus`: A function to focus the field.
2. `setFormValues` - A function that allows setting form values. It supports partial field value setting. The `clearAll` option can be used to clear other fields that were not mentioned.
3. `isFormDefaultsFetching` - A boolean value that indicates whether form default values are being retrieved from a Promise function. It is `false` by default and becomes `true` during the retrieval process. It returns to `false` when default values are successfully retrieved or an error occurs.
4. `isFormDefaultsFetchingErred` - A boolean value that indicates whether there was an error retrieving form default values. It is `false` by default and becomes `true` if the default values cannot be retrieved from the Promise function.
5. `isFormDirty` - A boolean value that indicates whether any field value in the form has changed. It is `false` by default and becomes `true` when any field value is changed. It returns to `false` when the form is successfully submitted.
6. `isFormSubmitting` - A boolean value that indicates whether the form is currently submitting.
7. `formErrors` - An object that includes all field errors. It is `{}` by default. When a field has any error, the field appears in this object as a key, and the value is an array of field errors.
8. `addFormField` - A function that dynamically allows adding a new form field.
9. `removeFormField` - A function to remove a form field. You can only remove optional form fields.
10. `addFormFieldError` - A function to add a new error related to a specific field. All previous field errors remain present.
11. `resetFormErrors` - A function to reset all form field errors. It can be used to remove all custom-added errors.
12. `validateForm` - A function to validate the form.
13. `submitForm` - A function to submit the form. It can accept an async function that will be called with the clean form data.
14. `resetForm` - A function to reset all form field values to their initial state.

## Examples

*Simple usage*

```typescript jsx
import React from 'react';
import { useHoneyForm } from 'react-honey-form';

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

*Nested forms*

```typescript jsx
import React from 'react';
import { HoneyForm, useHoneyForm, useHoneyFormProvider, getHoneyFormUniqueId } from 'react-honey-form';

type ItemFormValues = {
  id: string;
  name: string;
  price: number;
};

type ArrayFormValues = {
  items: ItemFormValues[];
};

const NestedForm = () => {
  const { formFields } = useHoneyForm<ArrayFormValues>({
    fields: {
      items: {
        value: [],
        validate: items => {
          if (!items.length) {
            return 'At least one item is required.';
          }
          return true;
        },
      },
    },
  });

  const addItem = () => {
    formFields.items.pushValue({
       id: getHoneyFormUniqueId(),
       name: '',
       price: 0
    });
  };

  const removeItem = (index: number) => {
    formFields.items.removeValue(index);
  };

  return (
    <form>
      <h2>Items</h2>

      {formFields.items.value.map((item, index) => (
        <div key={item.id}>
          <label>
            Name:
            <input {...formFields.items.value[index].name.props} />
          </label>

          <label>
            Price:
            <input {...formFields.items.value[index].price.props} />
          </label>

          <button type="button" onClick={() => removeItem(index)}>
            Remove
          </button>
        </div>
      ))}

      <button type="button" onClick={addItem}>
        Add Item
      </button>

      <button type="submit">Submit</button>
    </form>
  );
};

const App = () => {
  return (
    <HoneyForm onSubmit={console.log}>
      <NestedForm />
    </HoneyForm>
  );
};

export default App;
```

## Conclusion

The `react-honey-form` is a powerful and customizable library for creating and managing forms in React. With its comprehensive set of components and hooks, you can effortlessly create forms that seamlessly blend with your application's design and behavior. The library provides convenient features for handling form submission and validation, simplifying the development process. Whether you're building simple or complex forms, `react-honey-form` empowers you to create delightful user experiences with ease.
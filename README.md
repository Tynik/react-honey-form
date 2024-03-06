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
5. `values` - An optional object with form field values that can be provided to the form to synchronize its values. If provided, the form will stay in sync with these external values. The callback `onChange` will not be called when using this form field values synchronization.
6. `resetAfterSubmit` - An optional parameter that specifies whether the form should be reset to its initial state after a successful submission. The form will be reset only when the `onSubmit` callback completes without returning any errors.
7. `context` - An optional object that you can pass to the form for use in field validators or other custom logic. This context can contain additional data or functions that are needed for validation or other form-related operations.
8. `onSubmit` - A callback function that will be called when the form is submitted. The function receives the form data as a parameter.
9. `onChange` - An optional callback function that will be called when any field value is changed.
10. `onChangeDebounce` - An optional number that specifies the debounce time in milliseconds for the `onChange` callback. Default is `0`.

## Field Configuration

1. `defaultValue` - The default value of the form field.
2. `type` - The type of the form field. It can be one of the following values:
   - `string`: Represents a general string input field.
   - `numeric`: Represents a field that accepts only numeric values without decimal places.
   - `number`: Represents a field that accepts numeric values, including decimals and optional negative numbers.
   - `email`: Represents an email input field. 
   - `checkbox`: Represents a checkbox input field. 
   - `radio`: Represents a radio input field. The `value` property will not be destructured from field properties and must be set directly in the input field's `value` attribute.
   - `file`: Represents a file input field.
   - `object`: Represents an object field, where `onChange` can directly accept any object instead of `e.target.value`.
   - `nestedForms`: Represents the array type of field to work with nested forms.
   
   The default value for the type property is string. This property determines the validation rules and behavior for the corresponding form field.
3. `required` - A boolean value indicating whether the form field is required or not. If set to `true`, the field must have a non-empty value for the form to be considered valid. Default is `false`.
4. `min` - The minimum value allowed for numeric fields or minimum length of a string. Only applicable for fields of type `number` or `string`.
5. `max` - The maximum value allowed for numeric fields or maximum length of a string. Only applicable for fields of type `number` or `string`.
6. `decimal` - A boolean value indicating whether the numeric field can accept decimal values. Only applicable for fields of type `number`.
7. `negative` - A boolean value indicating whether the numeric field can accept negative values. Only applicable for fields of type `number`.
8. `maxFraction` - The maximum number of decimal places allowed for numeric fields. Only applicable for fields of type `number` and when decimal is set to true.
9. `dependsOn` - Specifies one or more fields that the current field depends on. When any of the dependent fields change, the current field's value will be set as `undefined`. This property can be a single field name (as a string), an array of field names, or a function that must return a boolean value indicating whether the field is dependent on the specified condition.
10. `errorMessages` - An object that specifies custom error messages for different validation errors. The keys of the object correspond to validation error types, and the values are the corresponding error messages. This allows you to customize the error messages displayed for specific validation errors.
11. `validator` - A custom validation function for the field. It should accept the field value as an argument and return either true (indicating the value is valid) or an error message (indicating the value is invalid). The validator function can also be asynchronous and return a Promise that resolves to the same response.
12. `filter` - A function that can be used to remove or modify certain characters from the field value. The function takes the current value as input and should return the modified value.
13. `formatter` - A function that can be used to transform the field value into a different format. The function takes the current value as input and should return the transformed value.
14. `formatOnBlur` - A boolean flag indicating whether the formatter function should be applied to the field's value when the focus is removed from the input (on blur). Default is `false`.
15. `submitFormattedValue` - A boolean flag indicating when formatted field value should be submitted instead of clean value. Default is `false`.
16. `props` - Additional properties for configuring the field's HTML input element.
17. `skip` - A function that determines whether the field should not be validated and skipped (not included) in the form submission. The function takes the complete form fields object as input and should return a boolean value indicating whether the field should be skipped.
18. `onChange`: A callback function that will be called whenever the field value changes. This can be used to perform additional actions or side effects when the field value changes.

## Return value

The `useHoneyForm` hook returns an object with the following properties:

1. `formFields` - An object that contains the state of the form fields. Each field has the following properties:
   - `defaultValue`: The default value initially set for the field.
   - `rawValue`: The unprocessed value, before any filtering or formatting.
   - `cleanValue`: The processed value after filtering and formatting. If there are errors, this may be `undefined`.
   - `value`: The final, formatted value ready to be displayed to the user.
   - `errors`: An array of error messages if the field is invalid.
   - `props`: An object with the necessary props for interactive elements (inputs where a user can type any text) to bind to the corresponding input element in the form.
   - `passiveProps`: Properties for non-interactive fields (e.g., checkbox, radio, file).
   - `objectProps`: Properties for object fields, enabling direct handling of object values. The `onChange` handler directly accepts any object instead of `e.target.value`.
   - `config`: The original configuration object of the field.
   - `getChildFormsValues`: A function to retrieve child forms' values if the field is a parent field.
   - `setValue`: A function to set the value of the field.
   - `pushValue`: A function to add a new value to a parent field that can have child forms.
   - `removeValue`: A function to remove a value from a parent field by its index.
   - `resetValue`: A function to reset a value to the initial.
   - `addError`: A function to add an error to the field's error array.
   - `clearErrors`: A function to clear all errors associated with this field.
   - `validate`: A function to validate this field.
   - `focus`: A function to focus on this field. Note: Can only be used when `props` are destructured within a component.
   - `__meta__`: Internal metadata used by the library.
2. `formValues` - Provides quick access to the current values of all form fields.
3. `formDefaultValues` - Provides quick access to the default values of all form fields.
4. `formErrors` - An object that includes all field errors. It is `{}` by default. When a field has any error, the field appears in this object as a key, and the value is an array of field errors.
5. `isFormErred` - A boolean value that becomes `true` when the form has any error. It remains `false` when the form is error-free.
6. `isFormDefaultsFetching` - A boolean value that indicates whether form default values are being retrieved from a Promise function. It is `false` by default and becomes `true` during the retrieval process. It returns to `false` when default values are successfully retrieved or an error occurs.
7. `isFormDefaultsFetchingErred` - A boolean value that indicates whether there was an error retrieving form default values. It is `false` by default and becomes `true` if the default values cannot be retrieved from the Promise function.
8. `isFormDirty` - A boolean value that indicates whether any field value in the form has changed. It is `false` by default and becomes `true` when any field value is changed. It returns to `false` when the form is successfully submitted.
9. `isFormValidating` - A boolean value that becomes `true` when the form is in the process of validation. It indicates that the validation of the form's fields is currently underway.
10. `isFormValid` - A boolean value that becomes `true` when the process of form validation has successfully finished, and no errors have been detected in any of the form's fields.
11. `isFormSubmitting` - A boolean value that indicates whether the form is currently submitting.
12. `isFormSubmitted` - A boolean value that becomes `true` when the form has been successfully submitted. It resets to `false` when any field value is changed.
13. `setFormValues` - A function that allows setting form values. It supports partial field value setting. The `clearAll` option can be used to clear other fields that were not mentioned.
14. `addFormField` - A function that dynamically allows adding a new form field.
15. `removeFormField` - A function to remove a form field. You can only remove optional form fields.
16. `addFormFieldError` - A function to add a new error related to a specific field. All previous field errors remain present.
17. `clearFormErrors` - A function to clear all form field errors.
18. `validateForm` - A function to validate the form.
19. `submitForm` - A function to submit the form. It can accept an async function that will be called with the clean form data.
20. `resetForm` - A function to reset all form field values to their initial state.

## Examples

*Hook based example*

```typescript jsx
import React from 'react';
import { useHoneyForm } from 'react-honey-form';

// Define the form fields structure
type ProfileForm = {
  name: string;
  age: number;
}

const Form = () => {
   // Use the useHoneyForm hook to manage form state
  const { formFields, submitForm } = useHoneyForm<ProfileForm>({
    fields: {
      name: {
        type: 'string',
        required: true
      },
      age: {
        type: 'number'
      },
    },
    onSubmit: (data) => {
       // Handle form submission
      console.log(data);
    },
  });
  
  return <form noValidate>
    <input {...formFields.name.props}/>
    
    <input {...formFields.age.props}/>
    
    <button type="button" onClick={submitForm}>Submit</button>
  </form>;
}
```

*Component based example*

```typescript jsx
import React from 'react';
import { HoneyForm } from 'react-honey-form';

// Define the form fields structure
type ProfileForm = {
   name: string;
   age: number;
}

const Form = () => {
   const handleSubmit = (data: ProfileForm) => {
      // Process form data
      console.log(data);
   }

   // Render the form using the HoneyForm component
   return (
      <HoneyForm
        fields={{
          name: {
             type: 'string',
             required: true,
          },
          age: {
             type: 'number',
          },
        }}
        onSubmit={handleSubmit} // Pass the submit handler
      >
        {/* Destructure the formFields and submitForm from the render prop function */}
        {({ formFields }) => (
          <>
             <input {...formFields.name.props} />
             <input {...formFields.age.props} />

             <button type="submit">Submit</button>
          </>
        )}
      </HoneyForm>
   );
};

```

## Conclusion

The `react-honey-form` is a powerful and customizable library for creating and managing forms in React. With its comprehensive set of components and hooks, you can effortlessly create forms that seamlessly blend with your application's design and behavior. The library provides convenient features for handling form submission and validation, simplifying the development process. Whether you're building simple or complex forms, `react-honey-form` empowers you to create delightful user experiences with ease.
## How to Use

# Importing Libraries and Files
To import the required libraries and files, you can use the index.js file

# Implementation
To implement the code, you can use the Example.jsx file

## FormBuilder Component

The `FormBuilder` component accepts the following props:

### Props

- `showFileFieldOnEdit` (`boolean`): Show file field when editing an item. Default is `false`.
- `showSelectOption` (`object`): Specify fields to show a "select" option. Keys are field names, values are booleans.
- `customDateField` (`object`): Specify custom date fields. Keys are field names, values are booleans.
- `presetValues` (`array`): Preset values for date fields. Example: `[7, 14, 30, 45, null]`.
- `hasDefaultValue` (`object`): Specify fields with default values. Keys are field names, values are booleans.
- `defaultUserField` (`string`): Field name for default user value. Used to set a default user.
- `defaultUserValue` (`string`): Default user value. Used in conjunction with `defaultUserField`.
- `subLevelArr` (`array`): Sub-levels for subject hierarchy. Used for hierarchical data.
- `contentData` (`object`): Content data for the form. Provides additional data for the form.
- `editorHeight` (`number`): Height of the editor component in pixels. Default is `250`.
- `allowResizeY` (`boolean`): Allow vertical resizing of the editor. Default is `false`.
- `callback` (`function`): Callback function after form submission. Receives form data as an argument.
- `adGroup` (`array`): Array of users from AD groups. Used to filter users based on AD group membership.

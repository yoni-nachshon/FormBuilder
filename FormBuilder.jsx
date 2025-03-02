import { AutoCompletePicker, PeoplePicker } from "./peoplePicker";
import { Editor } from "./Editor";


export const FormBuilder = ({ view, show, setShow, setState, form, props = {} }) => {

    const {
        showSelectOption = {},
        customDateField = {},
        adGroup = {},
        presetValues = [],
        fileUploadLabel = undefined,
        fieldDependencies = {}
    } = props;

    const showFileFieldOnEdit = form.type === 'new-item' ? true : (props.showFileFieldOnEdit || false);

    const { useState, useEffect } = React;
    const { Form, Modal } = ReactBootstrap

    const [formData, setFormData] = useState(form.data);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState('');
    const [requiredFields, setRequiredFields] = useState({});

    const [customTitleValue, setCustomTitleValue] = useState(form.data?.CustomTitle || '');

    const hasLinkFilename = view.some(field => field.name === 'LinkFilename');
    const [showTitle, setShowTitle] = useState((hasLinkFilename && form.type === 'new-item') ? 'none' : 'block');

    useEffect(() => {
        // Initialize boolean properties to false
        if (form.type === 'new-item') {
            let fields = view
                .filter(i => i.type === 'checkbox' || i.type === 'Boolean')
                .map(i => ({ [i.name]: false }))
                .reduce((acc, obj) => ({ ...acc, ...obj }), {});
            setFormData(fields)
            // Set default date to current date for date fields
            let dateFields = view
                .filter(i => i.type === 'DateTime' && i.defaultValue !== null)
                .map(i => ({ [i.name]: new Date().toISOString() }))
                .reduce((acc, obj) => ({ ...acc, ...obj }), {});
            setFormData(prevFormData => ({ ...prevFormData, ...dateFields }));
            // Initialize Choice fields with default values
            let choiceFields = view
                .filter(i => i.type === 'Choice' && i.defaultValue !== null)
                .map(i => ({ [i.name]: i.defaultValue }))
                .reduce((acc, obj) => ({ ...acc, ...obj }), {});
            setFormData(prevFormData => ({ ...prevFormData, ...choiceFields }));
            // Set default user value if provided
            if (props.defaultUserField && props.defaultUserValue) {
                setFormData(prevFormData => ({ ...prevFormData, [props.defaultUserField]: props.defaultUserValue }));
            }
        }
        // Auto-select single option for choice fields
        view.forEach(field => {
            if (field.type === 'Choice' && field.options.length === 1) {
                setFormData(prevFormData => ({ ...prevFormData, [field.name]: field.options[0] }));
            }
        });

    }, [])

    const handleInputChange = (event) => {
        const { name, value, type } = event.target;
        const newValue = type === 'date' ? (value ? new Date(value).toISOString() : "") : value;
        if (newValue) {
            setRequiredFields(prev => {
                const { [name]: removed, ...rest } = prev;
                return rest;
            });
        }
        if (name === 'URL') {
            setFormData({ ...formData, [name]: { Description: newValue, Url: newValue } });
        } else {
            setFormData({ ...formData, [name]: newValue });
        }
        if (name === 'CustomTitle') {
            setCustomTitleValue(newValue);
        }
        // בדיקה אם יש שדות שתלויים בשדה הנוכחי
        Object.keys(fieldDependencies).forEach(dependentField => {
            const dependency = fieldDependencies[dependentField];
            if (dependency.dependsOn === name && formData[dependency.dependsOn] !== dependency.dependsOnValue) {
                setRequiredFields(prev => {
                    const { [dependentField]: removed, ...rest } = prev;
                    return rest;
                });
            }
        });
        setIsDirty(true);
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            if (error) setError('');
            const file = e.target.files[0];
            if (e.target.name === 'LinkFilename') {
                let fileName = file.name.replace(/[\"*:<>?\/\\|']/g, "");
                const newFile = new File([file], fileName, { type: file.type });
                setFormData({
                    ...formData,
                    file: newFile,
                    Title: file.name,
                    CustomTitle: file.name
                });
                setCustomTitleValue(file.name);
                setShowTitle('block')
            } else {
                setFormData({ ...formData, file: file });
            }
            setIsDirty(true);
        }
    }

    const handleSwitchChange = (event) => {
        const { name, checked } = event.target;
        setFormData({ ...formData, [name]: checked });
        setIsDirty(true);
    };

    const handleMultiChoiceChange = (event) => {
        const { name, value, checked } = event.target;
        const currentValues = formData[name] || [];
        let newValues;
        if (checked) {
            // Add the checked value to the array
            newValues = [...currentValues, value];
        } else {
            // Remove the unchecked value from the array
            newValues = currentValues.filter(item => item !== value);
        }
        setFormData({ ...formData, [name]: newValues });
        setIsDirty(true);
    };

    const handleSelectChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
        setIsDirty(true);
    };

    function getLookupValue(values, field) {

        if (values === "") {
            return { [field.name]: null };
        }

        if (Array.isArray(values) && values.length === 0) {
            return { [field.name]: { results: values } };
        }

        let filterQuery;
        let isMultiple;
        const lookupField = field.lookupField || 'Title'; // Use lookupField or default to 'Title'

        // Check if 'values' is an object and use the 'lookupField' property
        if (values && typeof values === 'object' && !Array.isArray(values)) {
            if (values.hasOwnProperty(lookupField)) {
                values = values[lookupField];
            } else if (values.hasOwnProperty("Title")) {
                values = values["Title"];
            } else if (values.hasOwnProperty('results')) {
                values.results = values.results.map(i => i[lookupField]);
            } else {
                return { [field.name]: { results: [] } };
            }
        }

        // Check if 'values' is an array or a string with semicolons
        isMultiple = field.type === "UserMulti" || Array.isArray(values) || (typeof values === 'string' && values.includes(';'));

        let users;
        if (Array.isArray(values)) {
            users = values.map(value => {
                if (typeof value === 'object') {
                    return value[lookupField] || value.Title;
                } else {
                    return value;
                }
            });
        } else if (typeof values === 'string') {
            users = values.split(';');
        } else if (typeof values === 'object' && values !== null) {
            if (values.results) {
                users = values.results;
            } else if (values.Title) {
                users = [values];
            }
        } else {
            users = [];
        }

        // Replace single quotes with double single quotes to escape them
        const escapeValue = value => value?.includes("'") ? value.replace(/'/g, "''") : value;

        // Construct the filter query
        filterQuery = isMultiple
            ? users.map(value => `${lookupField} eq '${escapeValue(value)}'`).join(' or ')
            : `${lookupField} eq '${escapeValue(values)}'`;

        const fetchItems = () => {
            return $pnp.sp.web.lists.getById(field.lookupList).items.filter(filterQuery).get();
        };

        const handleItems = (items) => {
            if (isMultiple) {
                const ids = items.map(item => item.Id);
                return { [field.name]: { results: ids } };
            } else {
                if (items.length > 0) {
                    return { [field.name]: items[0].Id };
                } else {
                    throw new Error(`Value '${values}' not found in list '${field.lookupList}'`);
                }
            }
        };

        if (field.type === "User" || field.type === "UserMulti") {
            if (isMultiple) {
                // Map each value to a promise that resolves to the user ID
                const promises = users.map(value => {
                    return $pnp.sp.web.ensureUser(value).then(user => user.data.Id);
                });

                // Use Promise.all to wait for all promises to resolve
                return Promise.all(promises).then(ids => {
                    // Return the object with the user IDs
                    return { [field.name]: { results: ids } };
                }).catch(error => {
                    console.error(error);
                    return { [field.name]: { results: [] } };
                });
            } else {
                // Handle single user value
                return $pnp.sp.web.ensureUser(values).then(user => {
                    // Return the object with the single user ID
                    return { [field.name]: user.data.Id };
                }).catch(error => {
                    console.error(error);
                    return { [field.name]: null };
                });
            }
        } else {
            // Handle non-user lookup values
            return fetchItems().then(handleItems).catch(error => {
                // console.error(error);
                // If the error is due to a calculated field, fetch all items and filter locally
                return $pnp.sp.web.lists.getById(field.lookupList).items.get().then(items => {
                    const filteredItems = items.filter(item => {
                        if (isMultiple) {
                            return users.includes(item[lookupField]);
                        } else {
                            return item[lookupField] === values;
                        }
                    });

                    return handleItems(filteredItems);
                }).catch(innerError => {
                    console.error(innerError);
                    return { [field.name]: isMultiple ? { results: [] } : null };
                });
            });
        }
    }

    async function handleLookupFields(view, formData) {
        // Collect promises for each lookup field
        let lookupPromises = view
            .filter(field => (field.type.includes('Lookup') && formData.hasOwnProperty(field.name) || ['TaxonomyFieldTypeMulti', 'User', 'UserMulti'].includes(field.type)))
            .map(field => formData.hasOwnProperty(field.name) && getLookupValue(formData[field.name], field));
        // Wait for all promises to resolve
        return Promise.all(lookupPromises)
            .then(lookupResults => {
                // Combine the lookup results with the original formData
                let combinedData = { ...formData };
                // Iterate over the lookup results and merge them into combinedData
                lookupResults.forEach(lookupFieldResult => {
                    combinedData = { ...combinedData, ...lookupFieldResult };
                });
                return combinedData;
            })
            .catch(error => {
                console.error('Error processing lookup fields:', error);
                throw error; // Rethrow the error to handle it in the calling code if necessary
            });
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    function handleComputedField(view, formData) {
        let newFormData = { ...formData };
        view.forEach(field => {
            if (field.type === 'Computed' && field.srcField && newFormData[field.srcField] !== undefined) {
                newFormData[field.name] = newFormData[field.srcField];
            } else if (field.type === 'Calculated' && field.fieldRefs) {
                // Concatenate the values based on the fieldRefs
                let calculatedValue = field.fieldRefs.map(ref => {
                    const refValue = newFormData[ref] || '';
                    // Check if the value is a date and format it
                    return isNaN(Date.parse(refValue)) ? refValue : formatDate(refValue);
                }).join(' ');
                newFormData[field.name] = calculatedValue;
            }
        });
        return newFormData;
    }

    function addIdToLookupFields(obj, view) {
        view.forEach(field => {
            if (field.hasOwnProperty('lookupList')) {
                if (obj.hasOwnProperty(field.name)) {
                    if (obj[field.name] && obj[field.name].hasOwnProperty('results')) {
                        // אם המאפיין הוא אובייקט עם מפתח 'results'
                        obj[field.name + 'Id'] = { results: obj[field.name].results };
                    } else {
                        // אם המאפיין הוא ערך רגיל
                        obj[field.name + 'Id'] = obj[field.name];
                    }
                    delete obj[field.name];
                }
            }
        });
    }

    function removeHtmlTags(richText) {
        return richText ? richText.replace(/<\/?[^>]+(>|$)/g, '') : '';
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (view.some(field => field.name === 'LinkFilename')) {
            if (form.type === 'new-item' && !formData.file) {
                setError('יש להעלות קובץ');
                return;
            } else if (form.type === 'edit-item' && !formData.LinkFilename && showFileFieldOnEdit) {
                setError('יש להעלות קובץ');
                return;
            }
        }

        let newRequiredFields = {};
        view.forEach(field => {
            const dependency = fieldDependencies[field.name];
            const isDependentRequired = dependency && formData[dependency.dependsOn] === dependency.dependsOnValue;
            if ((field.required || isDependentRequired) && !formData[field.name]) {
                newRequiredFields[field.name] = `לא ניתן להשאיר שדה זה ריק.`;
            }
        });
        if (Object.keys(newRequiredFields).length > 0) {
            setRequiredFields(newRequiredFields);
            return;
        }

        let newFormData = await handleComputedField(view, formData);
        let data = await handleLookupFields(view, formData);
        let obj = { ...newFormData, ...data };
        addIdToLookupFields(obj, view);
        setIsDirty(false);
        console.log(obj);
        if (setState) {
            setState(obj)
        }
        if (props.callback) {
            props.callback(obj);
        }
        setTimeout(() => {
            setShow(!show);
        }, 200);
    };

    const rowWidth = ['Note', 'HTML'];

    const isFullWidth = (field) => {
        return rowWidth.includes(field.type) ||
            ['Title', 'CustomTitle'].includes(field.name) ||
            (field.type === "Computed" && ['LinkFilename', 'LinkFilenameNoMenu'].includes(field.name)) ||
            field.type === 'URL';
    };

    const removeFileExtension = (filename) => {
        if (filename && filename.includes('.')) {
            return filename.split('.').slice(0, -1).join('.');
        }
        return filename;
    };

    const addODataPrefixToView = (view, form) => {
        if (form.type === 'edit-item') {
            return view.map(field => {
                if (field.name.startsWith('_')) {
                    return { ...field, name: `OData_${field.name}` };
                }
                return field;
            });
        } else {
            return view;
        }
    };

    return (
        <Modal
            show={show}
            onHide={() => setShow(!show)}
            size="lg"
            animation={false}
            centered
            className="form-builder-modal"
        >
            <Modal.Header>
                <Modal.Title>{form.title}</Modal.Title>
                <CloseBtn show={show} setShow={setShow} />
            </Modal.Header>
            <Modal.Body>
                <form className="form-container">
                    {addODataPrefixToView(view, form).map((field) => (!field.isHiddenInContentType) && (field.type !== "Computed" || (field.type === "Computed" && ['LinkFilename', 'LinkFilenameNoMenu'].includes(field.name) && showFileFieldOnEdit)) && (
                        <div key={field.name}
                            style={{
                                display: (field.isHiddenInContentType || field.type === "Calculated") ? 'none' : 'inline-block',
                                width: isFullWidth(field) ? '100%' : 'fit-content',
                                margin: '10px 16px 10px 0',
                                paddingLeft: isFullWidth(field) ? '1rem' : ''
                            }}
                        >
                            {(['Number', 'Counter', 'URL'].includes(field.type) || (field.type === 'Text' && !['Title', 'CustomTitle'].includes(field.name)) || (field.type === 'Lookup' && !field.options)) && (
                                <div>
                                    <label className="setting-name">{field.label}</label>
                                    <input
                                        type="search"
                                        name={field.name}
                                        placeholder={field.placeholder}
                                        value={(field.type === 'URL' && formData[field.name]) ? formData[field.name].Url : formData[field.name] || ''}
                                        onChange={handleInputChange}
                                        className="form-control settings-url-input"
                                    />
                                    {requiredFields[field.name] && <div style={{ color: 'red', fontSize: '15px' }}>{requiredFields[field.name]}</div>}
                                </div>
                            )}
                            {(['LinkFilename', 'LinkFilenameNoMenu'].includes(field.name) &&
                                (form.type === "new-item" || (form.type === "edit-item" && showFileFieldOnEdit))) &&
                                <div>
                                    <label
                                        className="setting-name"
                                        style={{ width: '100%' }}
                                    >
                                        {fileUploadLabel ?? field.label}
                                    </label>
                                    <input
                                        type="file"
                                        name={field.name}
                                        onChange={handleFileChange}
                                    />
                                    {form.type === "edit-item" && formData[field.name] && (
                                        <div className="file-name">
                                            {formData[field.name]}
                                        </div>
                                    )}
                                    {error && <div style={{ color: 'red', fontSize: '15px' }}>{error}</div>}
                                </div>
                            }
                            {['Title', 'CustomTitle'].includes(field.name) && (
                                <div style={{ display: field.name === 'CustomTitle' ? showTitle : '' }}>
                                    <label className="setting-name">{field.label}</label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name={field.name}
                                        value={
                                            field.name === 'CustomTitle'
                                                ? removeHtmlTags(removeFileExtension(customTitleValue)) || ''
                                                : removeHtmlTags(formData[field.name]) || ''
                                        }
                                        onChange={handleInputChange}
                                    />
                                    {requiredFields[field.name] && (
                                        <div style={{ color: 'red', fontSize: '15px' }}>
                                            {requiredFields[field.name]}
                                        </div>
                                    )}
                                </div>
                            )}
                            {((field.type === 'Note' && field.name !== 'subjectHierercyArray') || field.type === 'HTML') && (
                                <>
                                    <label className="setting-name">{field.label}</label>
                                    {typeof Jodit !== 'undefined' ? (
                                        <Editor
                                            formData={formData}
                                            setFormData={setFormData}
                                            setIsDirty={setIsDirty}
                                            field={field}
                                            height={props.editorHeight || 250}
                                            allowResizeY={props.allowResizeY || false}
                                        />
                                    ) : (
                                        <>
                                            <Form.Control
                                                as="textarea"
                                                rows={field.name === 'Title' ? 2 : 3}
                                                name={field.name}
                                                value={removeHtmlTags(formData[field.name]) || ''}
                                                onChange={handleInputChange}
                                            />
                                            {requiredFields[field.name] && <div style={{ color: 'red', fontSize: '15px' }}>{requiredFields[field.name]}</div>}
                                        </>
                                    )}
                                </>
                            )}
                            {field.type === 'DateTime' && (
                                <DateInputWithPresets
                                    field={field}
                                    formData={formData}
                                    handleInputChange={handleInputChange}
                                    requiredFields={requiredFields}
                                    customDateField={customDateField[field.name]}
                                    presetValues={presetValues?.length > 0 ? presetValues : [7, 14, 30, 45, null]}
                                />
                            )}
                            {['TaxonomyFieldTypeMulti', 'User', 'UserMulti'].includes(field.type) && (
                                <PeoplePicker
                                    formData={formData}
                                    setFormData={setFormData}
                                    setIsDirty={setIsDirty}
                                    field={field}
                                    form={form}
                                    defaultUserValue={(props.defaultUserField && props.defaultUserField === field.name) ? props.defaultUserValue : null}
                                    hasDefaultValue={field.defaultValue !== null ? true : false}
                                    adGroup={adGroup[field.name]}
                                />
                            )}
                            {['checkbox', 'Boolean'].includes(field.type) && (
                                <SwitchButton
                                    name={field.name}
                                    checked={formData[field.name] || false}
                                    onChange={handleSwitchChange}
                                    label={field.label}
                                    error={requiredFields[field.name]}
                                />
                            )}
                            {field.type === 'MultiChoice' && (
                                <div>
                                    <label className="setting-name">{field.label}</label>
                                    <div>
                                        {field.options.map((option) => (
                                            <div key={option}>
                                                <input
                                                    type="checkbox"
                                                    name={field.name}
                                                    value={option}
                                                    checked={formData[field.name] ? formData[field.name].includes(option) : false}
                                                    onChange={handleMultiChoiceChange}
                                                    className="form-check-input"
                                                />
                                                <label className="setting-checkbox-name">{option}</label>
                                            </div>
                                        ))}
                                    </div>
                                    {requiredFields[field.name] && <div style={{ color: 'red', fontSize: '15px' }}>{requiredFields[field.name]}</div>}
                                </div>
                            )}
                            {field.type === 'Choice' && (
                                <div >
                                    <label className="setting-name">{field.label}</label>
                                    <select
                                        name={field.name}
                                        value={formData[field.name] || ""}
                                        onChange={handleSelectChange}
                                        className="form-select"
                                    >
                                        {showSelectOption[field.name] && <option value="">בחר/י</option>}
                                        {field.options.map((option, index) => (
                                            <option key={index} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    {requiredFields[field.name] && <div style={{ color: 'red', fontSize: '15px' }}>{requiredFields[field.name]}</div>}
                                </div>
                            )}
                            {(field.type === 'LookupMulti' || field.type === 'Lookup') && field.options && (
                                <AutoCompletePicker
                                    formData={formData}
                                    setFormData={setFormData}
                                    setIsDirty={setIsDirty}
                                    field={field}
                                    props={props}
                                />
                            )}
                        </div>
                    ))}
                </form>
            </Modal.Body>
            <Modal.Footer>
                <button
                    className="form-btn"
                    disabled={!isDirty}
                    onClick={handleSubmit}
                >
                    שמירה
                </button>
                <button
                    className="form-btn"
                    onClick={(e) => { e.preventDefault(); setShow(!show) }}
                    disabled={!isDirty}
                >
                    ביטול
                </button>
            </Modal.Footer>
        </Modal>
    );
}

const CloseBtn = ({ show, setShow }) => {
    return (
        <span onClick={() => setShow(!show)} className="close-btn">
            <i className="icofont-ui-close"></i>
        </span>
    )
}

const DateInputWithPresets = ({
    field,
    formData,
    handleInputChange,
    requiredFields,
    customDateField,
    presetValues,
}) => {

    const { useState } = React;
    const [selectedPreset, setSelectedPreset] = useState("");

    const titleMap = {
        7: "שבוע",
        14: "שבועיים",
        30: "חודש",
        60: "חודשיים",
        180: "חצי שנה",
        365: "שנה",
    };

    const generatePresetDates = (values) => {
        return values?.map((value) => {
            if (value === null) {
                return { label: "ללא", value: null };
            } else {
                const label = titleMap[value] || `${value} יום`;
                return { label, value };
            }
        });
    };

    const presetDates = generatePresetDates(presetValues);

    const handlePresetSelect = (preset) => {
        const newDate = new Date();
        if (preset.value === null) {
            handleInputChange({ target: { name: field.name, value: "" } });
        } else {
            newDate.setDate(newDate.getDate() + preset.value);
            handleInputChange({
                target: {
                    name: field.name,
                    value: newDate.toISOString().substring(0, 10),
                },
            });
        }
        setSelectedPreset("");
    };

    return (
        <div><label className="setting-name">{field.label}</label>
            <div style={{ display: 'flex' }}>
                <input
                    type="date"
                    name={field.name}
                    value={
                        formData[field.name] ? formData[field.name].substring(0, 10) : ""
                    }
                    onChange={handleInputChange}

                    className="form-control settings-input-date"
                    style={{ borderRadius: customDateField ? '0 .375rem .375rem 0' : '.375rem' }}
                />
                {customDateField && (
                    <select
                        className="custom-select"
                        value={selectedPreset}
                        onChange={(e) => {
                            const selectedValue = e.target.value;
                            const preset = presetDates.find(
                                (p) =>
                                    p.value === parseInt(selectedValue, 10) || p.value === null
                            );
                            setSelectedPreset(selectedValue);
                            handlePresetSelect(preset);
                        }}>
                        <option value="" disabled></option>
                        {presetDates?.map((preset, index) => (
                            <option key={index} value={preset.value}>
                                {preset.label}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            {requiredFields[field.name] && (
                <div style={{ color: "red", fontSize: "15px" }}>
                    {requiredFields[field.name]}
                </div>
            )}
        </div>
    );
};

const SwitchButton = ({ name, checked, onChange, label, error }) => {
    const { useState, useEffect } = React;
    const [isActive, setIsActive] = useState(checked);

    useEffect(() => {
        setIsActive(checked);
    }, [checked]);

    const handleClick = () => {
        setIsActive(!isActive);
        onChange({ target: { name, checked: !isActive } });
    };

    return (
        <div className="switch-container">
            <label className="setting-switch-name">{label}</label>
            <div
                className={`toggle-button ${isActive ? "active" : ""}`}
                onClick={handleClick}
            >
                <div className="toggle-circle">{isActive ? "כן" : "לא"}</div>
            </div>
            {error && <div style={{ color: "red", fontSize: "15px" }}>{error}</div>}
        </div>
    );
};



const NumberOfResults = ({ users }) => {
    let message = '';

    if (users.length > 0) {
        message = users.length === 1
            ? `מציג תוצאה ${users.length}`
            : `מציג ${users.length} תוצאות`;
    }

    return (
        <li className="results-message">
            {message}
        </li>
    );
};

export const PeoplePicker = ({ formData, setFormData, setIsDirty, field, form, defaultUserValue, hasDefaultValue, adGroup = [] }) => {

    const { useState, useEffect } = React;

    const [inputValue, setInputValue] = useState(getInitialInputValue(formData, field.name));
    const [users, setUsers] = useState([]);
    const [userSelected, setUserSelected] = useState(!!formData[field.name]);
    const initialSelectedUsers = getInitialSelectedUsers(formData, field.name, field.type);
    const [selectedUsers, setSelectedUsers] = useState(initialSelectedUsers);

    function getInitialInputValue(formData, fieldName) {
        const fieldValue = formData[fieldName];

        if (typeof fieldValue === "object" && fieldValue !== null) {
            if ("Title" in fieldValue) {
                return fieldValue.Title;
            } else if ("Label" in fieldValue) {
                return fieldValue.Label;
            }
        } else if (typeof fieldValue === "string") {
            return fieldValue;
        }

        return "";
    }

    function getInitialSelectedUsers(formData, fieldName, fieldType) {
        const fieldValue = formData[fieldName] || defaultUserValue;

        if (fieldType === 'UserMulti' || fieldType === 'TaxonomyFieldTypeMulti') {
            if (typeof fieldValue === 'string') {
                return fieldValue.split(';');
            }
            if (typeof fieldValue === 'object') {
                if (fieldValue && fieldValue.hasOwnProperty('results')) {
                    return fieldValue.results.map(i => i.Title);
                }

                if (Array.isArray(fieldValue)) {
                    return fieldValue.map(i => i.Title || i.Label);
                }
            }
        }
        return [];
    }

    useEffect(() => {
        if (form.type === 'new-item' && defaultUserValue) {
            setInputValue(defaultUserValue);
            setUserSelected(true);
            setFormData({ ...formData, [field.name]: defaultUserValue });
        }
    }, [defaultUserValue]);

    useEffect(() => {
        if (hasDefaultValue && field.type === 'User' && formData[field.name] === undefined) {
            setInputValue(_spPageContextInfo.userDisplayName)
            setUserSelected(true)
            setFormData({ ...formData, [field.name]: _spPageContextInfo.userDisplayName });
        }
    }, [formData, hasDefaultValue]);

    useEffect(() => {
        if (inputValue.length === 0) {
            setInputValue('')
            setUsers([])
            setUserSelected(false);
            if (field.type === 'User' || field.type === 'TaxonomyFieldTypeMulti') {
                setFormData({ ...formData, [field.name]: '' });
            }
        }
    }, [inputValue]);

    useEffect(() => {
        if (typeof inputValue === 'string' && inputValue !== '') {
            if (adGroup && adGroup.length > 0) {
                let filteredUsers;
                if (field.type === 'UserMulti') {
                    filteredUsers = adGroup.filter(r =>
                        (r.userFullName.startsWith(inputValue) || r.userFullName.includes(inputValue))
                        && !selectedUsers.includes(r.userFullName)
                    );
                } else {
                    filteredUsers = adGroup.filter(r =>
                        (r.userFullName.startsWith(inputValue) || r.userFullName.includes(inputValue))
                    );
                }
                setUsers(filteredUsers);
            } else {
                $pnp.sp.profiles.clientPeoplePickerSearchUser({
                    AllowEmailAddresses: true,
                    AllowMultipleEntities: false,
                    MaximumEntitySuggestions: 10,
                    QueryString: inputValue
                }).then(result => {
                    let res;
                    if (inputValue && field.type === 'UserMulti') {
                        res = result.filter(r =>
                            (r.DisplayText.startsWith(inputValue) || r.DisplayText.includes(inputValue))
                            && !selectedUsers.includes(r.DisplayText)
                        );
                    } else {
                        res = result.filter(r =>
                            (r.DisplayText.startsWith(inputValue) || r.DisplayText.includes(inputValue))
                        );
                    }
                    setUsers(res)
                })
            }
        }
    }, [selectedUsers, inputValue, adGroup]);

    const onUserSelectedSingle = (user) => {
        const displayName = user.DisplayText || user.userFullName;
        setInputValue(displayName);
        setFormData({ ...formData, [field.name]: displayName });
        setIsDirty(true);
        setUsers([]);
        setUserSelected(true);
    };

    const onUserSelectedMulti = (user) => {
        const displayName = user.DisplayText || user.userFullName;
        setInputValue('');
        const updatedSelectedUsers = [...selectedUsers, displayName];
        setSelectedUsers(updatedSelectedUsers);
        setFormData({ ...formData, [field.name]: updatedSelectedUsers.join(';') });
        setIsDirty(true);
        setUsers([]);
    };

    const onUserRemoved = (userToRemove) => {
        const updatedSelectedUsers = selectedUsers.filter(user => user !== userToRemove);
        setSelectedUsers(updatedSelectedUsers);
        if (field.type === 'UserMulti') {
            setFormData({ ...formData, [field.name]: updatedSelectedUsers });
        } else {
            // Join the array into a string when updating the form data
            setFormData({ ...formData, [field.name]: updatedSelectedUsers.join(';') });
        }
        setIsDirty(true);
    }

    const onChange = (e) => {
        setInputValue(e.target.value);
        setIsDirty(true);
    }

    return (
        <div className="people-picker">
            <label className="setting-name">{field.label}</label>

            <div
                style={{
                    height: selectedUsers?.length === 0 ? '66px' : `${35 + selectedUsers?.length * 35}px`,
                    position: 'relative',
                    // width: '202px',
                    border: (field.type === 'UserMulti' || field.type === 'TaxonomyFieldTypeMulti') ? '1px solid #8fb9cc' : '',
                    borderRadius: '5px'
                }}
            >
                <input
                    className="pp-input form-control"
                    onChange={onChange}
                    value={inputValue}
                    type="search"
                    placeholder="הקלד שם"
                    style={{
                        borderTop: (field.type === 'UserMulti' || field.type === 'TaxonomyFieldTypeMulti') ? 0 : '',
                        borderRight: (field.type === 'UserMulti' || field.type === 'TaxonomyFieldTypeMulti') ? 0 : '',
                        borderLeft: (field.type === 'UserMulti' || field.type === 'TaxonomyFieldTypeMulti') ? 0 : '',
                        borderRadius: (field.type === 'UserMulti' || field.type === 'TaxonomyFieldTypeMulti') ? '4px 4px 0px 0px' : ''
                    }}
                />
                {selectedUsers?.length > 0 &&
                    <div className="chip-container">
                        {(field.type === 'UserMulti' || field.type === 'TaxonomyFieldTypeMulti') && selectedUsers.map((user, index) => (
                            <div key={index} className="selected-user">
                                {user}{' '}
                                <span className="close-chip" onClick={() => onUserRemoved(user)}>
                                    ✖
                                </span>

                            </div>
                        ))}
                    </div>
                }
                {!userSelected && inputValue && users.length > 0 &&
                    <ul className="user-list">
                        {users.map((user, index) => (
                            <li
                                className="user-item"
                                key={index}
                                onClick={() => field.type === 'User' ? onUserSelectedSingle(user) : onUserSelectedMulti(user)}
                            >
                                <div className="user-display-name">
                                    {user.DisplayText || user.userFullName}
                                </div>
                                <div className="user-job-title">
                                    {user.EntityData?.Title || user.userName}
                                </div>
                            </li>
                        ))}
                        <NumberOfResults users={users} />
                    </ul>
                }
            </div>

        </div>
    )
}


export const AutoCompletePicker = ({ formData, setFormData, setIsDirty, field, props = {} }) => {
    const { useState, useEffect } = React;
    const [inputValue, setInputValue] = useState('');
    const [users, setUsers] = useState([]);

    const [selectedUsers, setSelectedUsers] = useState(
        Array.isArray(formData[field.name])
            ? formData[field.name]?.map(user => (typeof user === 'object' ? user[field.lookupField || "Title"] : user)) || []
            : formData[field.name]
                ? [typeof formData[field.name] === 'object' ? formData[field.name][field.lookupField || "Title"] : formData[field.name]]
                : []
    );

    const [showAddOption, setShowAddOption] = useState(false);
    const enableAddOption = props.enableAddOption || false;
    const placeholder = props.placeholder || "הקלד שם";

    const [selectedOption, setSelectedOption] = useState('');

    const onSelectChange = (e) => {
        const selectedValue = e.target.value;
        setSelectedOption(selectedValue);
        if (selectedValue) {
            onUserSelected(selectedValue);
        }
    };

    useEffect(() => {
        if (inputValue.length === 0) {
            setUsers([]);
            setShowAddOption(false);
        } else {
            const res = field.options
                .map(option => (typeof option === 'object' ? option.Title : option))
                .filter(option =>
                    (option.startsWith(inputValue) || option.includes(inputValue)) && !selectedUsers.includes(option)
                );
            setUsers(res);
            setShowAddOption(enableAddOption && res.length === 0);
        }
    }, [inputValue, field.options, enableAddOption, selectedUsers]);

    const onUserSelected = (user) => {
        setInputValue('');
        if (field.type === 'LookupMulti') {
            if (!selectedUsers.includes(user)) {
                const updatedSelectedUsers = [...selectedUsers, user];
                setSelectedUsers(updatedSelectedUsers);
                setFormData({ ...formData, [field.name]: updatedSelectedUsers });
                setIsDirty(true);
            }
        } else {
            const updatedSelectedUsers = [user];
            setSelectedUsers(updatedSelectedUsers);
            setFormData({ ...formData, [field.name]: user });
            setIsDirty(true);
        }
        setUsers([]);
    };

    const onUserRemoved = (userToRemove) => {
        if (field.type === 'LookupMulti') {
            const updatedSelectedUsers = selectedUsers.filter(user => user !== userToRemove);
            setSelectedUsers(updatedSelectedUsers);
            setFormData({ ...formData, [field.name]: updatedSelectedUsers });
        } else {
            setSelectedUsers([]);
            setFormData({ ...formData, [field.name]: null });
        }
        setIsDirty(true);
    };

    const onInputChange = (e) => {
        setInputValue(e.target.value);
        setIsDirty(true);
    };

    const addOption = () => {
        const newOption = inputValue;
        setInputValue('');
        if (!selectedUsers.includes(newOption)) {
            const updatedSelectedUsers = [...selectedUsers, newOption];
            setSelectedUsers(updatedSelectedUsers);
            setFormData({ ...formData, [field.name]: updatedSelectedUsers });
            setIsDirty(true);
            setUsers([]);
            field.options.push(newOption);

            if (props.addOptionToList) {
                props.addOptionToList(newOption);
            }
        }
    };

    return (
        <div className="people-picker"><label className="setting-name">{field.label}</label><div
            style={{
                height: selectedUsers.length === 0 ? '66px' : `${35 + selectedUsers.length * 35}px`,
                position: 'relative',
                width: '202px',
                border: '1px solid #8fb9cc',
                borderRadius: '5px'
            }}>
            <div style={{ display: 'flex' }}>
                <input
                    className="pp-input form-control"
                    onChange={onInputChange}
                    value={inputValue}
                    type="search"
                    placeholder={placeholder}
                    style={{
                        borderTop: 0,
                        borderRight: 0,
                        borderLeft: 0,
                        borderRadius: '4px 4px 0px 0px'
                    }}
                />
                <select
                    className="auto-complete-picker-select"
                    value={selectedOption}
                    onChange={onSelectChange}
                >
                    <option value="" disabled>בחר</option>
                    {field.options.map((option, index) => (
                        <option key={index} value={typeof option === 'object' ? option.Title : option}>
                            {typeof option === 'object' ? option.Title : option}
                        </option>
                    ))}
                </select>
            </div>
            {(selectedUsers.length > 0 || showAddOption) && <div className="chip-container">
                {selectedUsers.map((user, index) => (
                    <div key={index} className="selected-user">
                        {user}{' '}
                        <span className="close-chip" onClick={() => onUserRemoved(user)}>
                            ✖
                        </span></div>
                ))}
            </div>
            }
            {inputValue && users.length > 0 && <ul className="user-list">
                {users.map((user, index) => (
                    <li
                        className="user-item"
                        key={index}
                        onClick={() => onUserSelected(user)}
                    ><div className="user-display-name">
                            {user}
                        </div></li>
                ))}
                <NumberOfResults users={users} /></ul>
            }
            {showAddOption && (
                <AddOptionPopover
                    showAddOption={showAddOption}
                    inputValue={inputValue}
                    addOption={addOption}
                />
            )}
        </div></div>
    );
};


const AddOptionPopover = ({ showAddOption, inputValue, addOption }) => {
    const { useState, useEffect } = React;
    const { Popover, OverlayTrigger } = ReactBootstrap;
    const [showPopover, setShowPopover] = useState(false);

    useEffect(() => {
        if (showAddOption) {
            setShowPopover(true);
        } else {
            setShowPopover(false);
        }
    }, [showAddOption]);

    if (!showAddOption) return null;

    const handleTogglePopover = () => {
        setShowPopover(!showPopover);
    };

    const popoverContent = (
        <div><div>האם להוסיף "{inputValue}" לרשימה?</div><div
            className="d-flex justify-content-center"
            style={{ marginTop: "1.5rem" }}><button
                style={{
                    backgroundColor: "#3085d6",
                    color: "#fff",
                    marginRight: "10px",
                }}
                onClick={(e) => {
                    e.preventDefault();
                    addOption();
                    setShowPopover(false);
                }}>
                הוסף
            </button><button
                style={{ backgroundColor: "#607d8b", color: "#fff" }}
                onClick={(e) => {
                    e.preventDefault();
                    setShowPopover(false);
                }}>
                ביטול
            </button></div></div>
    );

    return (
        <OverlayTrigger
            trigger="click"
            placement="bottom"
            show={showPopover}
            onHide={handleTogglePopover}
            overlay={
                <Popover id="add-option-popover">
                    <Popover.Body>{popoverContent}</Popover.Body>
                </Popover>
            }
        ><div
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTogglePopover();
            }}></div></OverlayTrigger>
    );
};

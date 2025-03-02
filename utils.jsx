
export const CloseBtn = ({ show, setShow }) => {
    return (
        <span onClick={() => setShow(!show)} className="close-btn">
            &#x2715;
        </span>
    )
}

// How to display rich text
export function RichText({ content }) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
}

// Does rich text contain text
export function isText(richText) {
    const text = richText?.replace(/<\/?[^>]+(>|$)/g, ''); // Remove HTML tags
    const trimmedText = text?.trim();
    return trimmedText?.length > 1 ? true : false;
}

export const Loader = ({ style }) => {
    const { Spinner } = ReactBootstrap;
    const defaultStyle = {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: '5vh 0',
        color: '#00618b'
    };

    const appliedStyle = style || defaultStyle;

    return (
        <div style={appliedStyle}><Spinner animation="border" /></div>
    );
};

export function getData(list, select = "", expand = "", setData, orderBy = "") {
    let spList = $pnp.sp.web.lists;
    spList._options.headers = {
        Accept: "application/json;odata=nometadata",
    };

    let query = spList
        .getByTitle(list)
        .items.select(select)
        .expand(expand)
        .top(5000);

    if (orderBy) {
        let order = orderBy.split(",");
        query = query.orderBy(order[0], JSON.parse(order[1]));
    }

    query.get().then((items) => {
        console.log(`${list}:`, items);
        setData(items);
    });
}

export function addItem(list, item, state, setState) {
    $pnp.sp.web.lists.getByTitle(list).items.add(item)
        .then(res => {
            console.log(res)
            let newItem = {
                ...item,
                ID: res.data.ID,
                Id: res.data.Id
            }
            setState([...state, newItem])
        })
}

export function updateListItem(list, id, update, setState) {
    $pnp.sp.web.lists
        .getByTitle(list).items
        .getById(id)
        .update(update)
        .then(res => {
            console.log(res)
            let updateItem = {
                ...update,
                ID: id,
                Id: id
            }
            setState((prev) => prev.map(item => item.Id === id ? updateItem : item))
        })
}

export const getLookupValues = async (lookupListId, ids) => {
    try {
        // Build the filter query to get items with the specified IDs
        const filterQuery = ids.map(id => `Id eq ${id}`).join(' or ');
        // Query the lookup list for the items with the specified IDs
        const items = await $pnp.sp.web.lists.getById(lookupListId).items.filter(filterQuery).select('Id', 'Title').get();
        // Log or return the items
        console.log(items);
        return items;
    } catch (error) {
        console.error('Error retrieving lookup values:', error);
    }
};

// function findAllTitles(obj, titles = new Set()) {
//     // Check if the current object has a Title property and add it to the titles set.
//     if (obj.hasOwnProperty('Title')) {
//         titles.add(obj.Title);
//     }
//     // Iterate over the properties of the object.
//     for (let key in obj) {
//         if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
//             // If the property is an object or an array, recursively search for the Title property.
//             findAllTitles(obj[key], titles);
//         }
//     }
//     // Convert the set back to an array to return the unique titles.
//     return Array.from(titles);
// }

export function useGetProperties({ listName }) {
    const { useState, useEffect } = React;
    const [fields, setFields] = useState(null);
    useEffect(() => {
        $pnp.sp.web.lists.getByTitle(listName).defaultView.fields.get().then(data => {
            let displayFields = data.Items.filter(i => i !== 'Edit')
            $pnp.sp.web.lists.getByTitle(listName).fields.filter('Hidden eq false').get().then(data => {
                let fields = data.filter(value => displayFields.includes(value.InternalName))
                console.log(fields);
                fields = fields.map(i => {
                    const field = { label: i.Title, name: i.InternalName, type: i.TypeAsString };
                    if (i.hasOwnProperty('LookupList')) {
                        field.lookupList = i.LookupList.replace(/[{}]/g, "");
                    }
                    if (i.hasOwnProperty('Choices')) {
                        field.options = i.Choices;
                    }
                    if (field.type === 'Computed') {
                        // Parse the XML string
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(i.SchemaXml, "text/xml");
                        // Get the Field element
                        const fieldElement = xmlDoc.getElementsByTagName("Field")[0];
                        // Get the DisplayNameSrcField attribute value
                        const displayNameSrcField = fieldElement?.getAttribute("DisplayNameSrcField");
                        field.srcField = displayNameSrcField;
                    }
                    if (field.type === "LookupMulti") {
                        $pnp.sp.web.lists
                            .getByTitle(listName).items
                            .select(`${field.name}/Title`)
                            .expand(field.name)
                            .get()
                            .then(res => {
                                let options = findAllTitles(res);
                                console.log(options)
                                field.options = options;
                            })
                    }
                    return field;
                })
                fields = fields.sort((a, b) => displayFields.indexOf(a.internalName) - displayFields.indexOf(b.internalName))
                console.log(fields);
                setFields(fields);
            })
        })
    }, [listName])
    return [fields];
}

export async function getViewsFields(listName) {
    let viewsFields = {};
    try {
        let views = await $pnp.sp.web.lists.getByTitle(listName).views.get();
        for (let view of views) {
            let viewFields = await $pnp.sp.web.lists.getByTitle(listName).views.getByTitle(view.Title).fields.get();
            let items = viewFields.Items;
            $pnp.sp.web.lists.getByTitle(listName).fields.filter('Hidden eq false').get().then(data => {
                let fields = data.filter(value => items.includes(value.InternalName))
                fields = fields.map(i => {
                    let field = { label: i.Title, name: i.InternalName, type: i.TypeAsString };
                    if (i.hasOwnProperty('LookupList')) {
                        field.lookupList = i.LookupList.replace(/[{}]/g, "");
                    }
                    if (i.hasOwnProperty('Choices')) {
                        field.options = i.Choices;
                    }
                    if (field.type === 'Computed') {
                        // Parse the XML string
                        let parser = new DOMParser();
                        let xmlDoc = parser.parseFromString(i.SchemaXml, "text/xml");
                        // Get the Field element
                        let fieldElement = xmlDoc.getElementsByTagName("Field")[0];
                        // Get the DisplayNameSrcField attribute value
                        let displayNameSrcField = fieldElement?.getAttribute("DisplayNameSrcField");
                        field.srcField = displayNameSrcField;
                    }
                    if (field.type === "LookupMulti") {
                        $pnp.sp.web.lists
                            .getByTitle(listName).items
                            .select(`${field.name}/Title`)
                            .expand(field.name)
                            .get()
                            .then(res => {
                                let options = findAllTitles(res);
                                console.log(options)
                                field.options = options;
                            })
                    }
                    return field;
                })
                fields = fields.sort((a, b) => items.indexOf(a.internalName) - items.indexOf(b.internalName))
                viewsFields[view.Title] = fields;
            })
        }
        console.log(viewsFields);
        return viewsFields;
    } catch (error) {
        console.error(error);
    }
}

async function getContentTypeFields(contentTypeName) {
    try {
        const contentTypes = await $pnp.sp.web.contentTypes.filter(`Name eq '${contentTypeName}'`).get();
        if (contentTypes && contentTypes.length > 0) {
            const contentTypeId = contentTypes[0].Id.StringValue;
            const contentTypeFields = await $pnp.sp.web.contentTypes.getById(contentTypeId).fields.get();
            return contentTypeFields;
        } else {
            throw new Error(`Content type with name '${contentTypeName}' not found`);
        }
    } catch (error) {
        console.error("Error fetching content type fields: ", error);
        throw error;
    }
}

function findAllTitles(obj, lookupField, titles = new Set()) {
    if (Array.isArray(obj)) {
        obj.forEach(item => findAllTitles(item, lookupField, titles));
    } else if (typeof obj === 'object' && obj !== null) {
        if (obj.hasOwnProperty(lookupField)) {
            titles.add(obj[lookupField]);
        }
        for (let key in obj) {
            if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
                findAllTitles(obj[key], lookupField, titles);
            }
        }
    }
    return Array.from(titles);
}

export function useViewsFields({ listName, viewName = '', contentTypeName = '', hiddenContentTypeFields = [], baseUrl = '' }) {
    const { useState, useEffect } = React;
    const [viewsFields, setViewsFields] = useState({});
    useEffect(() => {
        async function fetchViewsFields() {
            let viewsFieldsResult = {};
            try {
                if(baseUrl){
                    $pnp.sp._baseUrl = baseUrl;
                }
                const views = await $pnp.sp.web.lists.getByTitle(listName).views.get();
                const viewsFieldsPromises = views.map(async (view) => {
                    if (viewName && view.Title !== viewName) {
                        return; 
                    }
                    const viewFields = await $pnp.sp.web.lists.getByTitle(listName).views.getByTitle(view.Title).fields.get();
                    const items = viewFields.Items;
                    const fields = await $pnp.sp.web.lists.getByTitle(listName).fields.filter('Hidden eq false').get();
                    const filteredFields = fields.filter(value => items.includes(value.InternalName));
                    const mappedFieldsPromises = filteredFields.map(async (field) => {
                        let fieldProps = {
                            label: field.Title,
                            name: field.InternalName,
                            type: field.TypeAsString,
                            required: field.Required,
                            defaultValue: field.DefaultValue
                        };
                        if (hiddenContentTypeFields.includes(field.InternalName)) {
                            fieldProps.isHiddenInContentType = true;
                        } else if (contentTypeName) {
                            const contentTypeFields = await getContentTypeFields(contentTypeName);
                            const contentTypeField = contentTypeFields.find(ctField => ctField.InternalName === field.InternalName);
                            fieldProps.isHiddenInContentType = contentTypeField ? contentTypeField.Hidden : false;
                        }

                        if (field.hasOwnProperty('LookupList')) {
                            fieldProps.lookupList = field.LookupList.replace(/[{}]/g, "");
                            fieldProps.lookupField = field.LookupField;
                        }
                        if (field.hasOwnProperty('Choices')) {
                            fieldProps.options = field.Choices;
                        }
                        if (fieldProps.type === 'Computed') {
                            let parser = new DOMParser();
                            let xmlDoc = parser.parseFromString(field.SchemaXml, "text/xml");
                            let fieldElement = xmlDoc.getElementsByTagName("Field")[0];
                            let displayNameSrcField = fieldElement?.getAttribute("DisplayNameSrcField");
                            fieldProps.srcField = displayNameSrcField;
                        }
                        if (fieldProps.type === "Lookup") {
                            const res = await $pnp.sp.web.lists
                                .getById(fieldProps.lookupList).items
                                .select(fieldProps.lookupField)
                                .get();
                            fieldProps.options = res.map(i => i[fieldProps.lookupField]);
                            return fieldProps;
                        }
                        if (fieldProps.type === "LookupMulti") {
                            try {
                                const res = await $pnp.sp.web.lists
                                    .getById(fieldProps.lookupList).items
                                    .select(fieldProps.lookupField)
                                    .get();
                                fieldProps.options = findAllTitles(res, fieldProps.lookupField);
                                return fieldProps;
                            } catch (err) {
                                console.log('there was a problem, the error is:', err);
                            }
                        }
                        if (fieldProps.type === "Calculated") {
                            let parser = new DOMParser();
                            let xmlDoc = parser.parseFromString(field.SchemaXml, "text/xml");
                            let formula = xmlDoc.getElementsByTagName("Formula")[0]?.textContent;
                            let fieldRefs = Array.from(xmlDoc.getElementsByTagName("FieldRef")).map(ref => ref.getAttribute("Name"));
                            fieldProps.formula = formula;
                            fieldProps.fieldRefs = fieldRefs;
                            return fieldProps;
                        } else {
                            return fieldProps;
                        }
                    });
                    const mappedFields = await Promise.all(mappedFieldsPromises);
                    mappedFields.sort((a, b) => items.indexOf(a.name) - items.indexOf(b.name));
                    viewsFieldsResult[view.Title] = mappedFields;
                });
                await Promise.all(viewsFieldsPromises);
                console.log(viewsFieldsResult);
                setViewsFields(viewsFieldsResult);
            } catch (e) {
                console.error(e);
            }
        }
        fetchViewsFields();
    }, [listName, viewName]);
    return [viewsFields];
}

export const useGetMembersGroup = ({ group }) => {
    const { useState, useEffect } = React;

    const [team, setTeam] = useState(null)

    useEffect(() => {
        $.ajax({
            url: `https://boi-jp-gw.ad.boi.gov.il:1751/boi/boi/gs/AD/GetGroupMembers?groupName=${group}`,
            type: "GET",
            xhrFields: {
                withCredentials: true
            },
            headers: {
                "Accept": "text/plain"
            },
            success: ((data) => {
                console.log(`${group}:`, data)
                setTeam(data)
            }),
            error: ((data, error) => {
                console.log(data)
            })
        })
    }, []);

    return [team];
}

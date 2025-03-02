const attachmentSvg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0NDggNTEyIj48cGF0aCBkPSJNMzY0LjIgODMuOGMtMjQuNC0yNC40LTY0LTI0LjQtODguNCAwbC0xODQgMTg0Yy00Mi4xIDQyLjEtNDIuMSAxMTAuMyAwIDE1Mi40czExMC4zIDQyLjEgMTUyLjQgMGwxNTItMTUyYzEwLjktMTAuOSAyOC43LTEwLjkgMzkuNiAwcy0xMC45IDI4LjcgMCAzOS42bC0xNTIgMTUyYy02NCA2NC0xNjcuNiA2NC0yMzEuNiAwcy02NC0xNjcuNiAwLTIzMS42bDE4NC0xODRjNDYuMy00Ni4zIDEyMS4zLTQ2LjMgMTY3LjYgMHM0Ni4zIDEyMS4zIDAgMTY3LjZsLTE3NiAxNzZjLTI4LjYgMjguNi03NSAyOC42LTEwMy42IDBzLTI4LjYtNzUgMC0xMDMuNmwxNDQtMTQ0YzEwLjktMTAuOSAyOC43LTEwLjkgMzkuNiAwcy0xMC45IDI4LjcgMCAzOS42bC0xNDQgMTQ0Yy02LjcgNi43LTYuNyAxNy43IDAgMjQuNHMxNy43IDYuNyAyNC40IDBsMTc2LTE3NmMyNC40LTI0LjQgMjQuNC02NCAwLTg4LjR6Ii8+PC9zdmc+'
const getFileIconUrl = (filename) => {
    if (!filename) return '';
    const extension = filename.split('.').pop().toLowerCase();
    const baseUrl = _spPageContextInfo.webAbsoluteUrl + '/_layouts/15/images/ic';
    if (extension == 'png' || extension == 'jpg' || extension == 'jpeg') { return `${baseUrl}${extension}.gif`; }
    return `${baseUrl}${extension}.png`;
};
const removeExtesion = (str) => {
    const lastDotIndex = str.lastIndexOf('.');
    return str.substring(0, lastDotIndex);
}

export const Editor = ({ formData, setFormData, setIsDirty, field, height = 250, allowResizeY = false }) => {
    const { useState, useEffect, useRef } = React;

    const editorRef = useRef(null);

    useEffect(() => {
        if (window.Jodit && editorRef.current) {
            const instance = new window.Jodit(editorRef.current, {
                events: {
                    change: function () {
                        setFormData(formData => ({ ...formData, [field.name]: instance.value }));
                        setIsDirty(true);
                        const links = instance.editor.querySelectorAll('a');
                        links.forEach(link => {
                            link.setAttribute('target', '_blank');
                            link.style.cursor = 'pointer';
                        });
                    },
                    click: function (event) {
                        const link = event.target.closest("a");
                        if (link) {
                            link.setAttribute('target', '_blank');
                            window.open(link.href, '_blank');
                        }
                    }
                },
                askBeforePasteHTML: false,
                hidePoweredByJodit: true,
                spellcheck: true,
                showTooltip: true,
                toolbarInline: false,
                showMessageErrors: false,
                height: height,
                minHeight: 150,
                allowResizeX: false,
                allowResizeY: allowResizeY,
                language: "he",
                uploader: {
                  enableDragAndDropFileToEditor: true,
                  insertImageAsBase64URI: false,
                  imagesExtensions: ["jpg", "png", "jpeg", "gif"],
                  extensions: ["doc", "docx", "xls", "xlsx", "pdf"],
                  url: "blank",
                  prepareData: async (formData) => {
                    const file = formData.get('files[0]');
                    if (file) {
                      const filePath = await uploadFileToSharePoint(file, 'PublishingImages');
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        if (["jpg", "png", "jpeg", "gif"].includes(file.name.split('.').pop().toLowerCase())) {
                          // Handle image files
                          const imageNode = instance.createInside.element('img');
                          imageNode.src = filePath
                          imageNode.style.width = '100%';
                          imageNode.style.height = '100%';
                          instance.selection.insertNode(imageNode);
                        } else {
                          // Handle other files
                          // const fileExtension = file.name.split('.').pop().toLowerCase();
                          const iconUrl = getFileIconUrl(file.name)   //iconMap[fileExtension]
                          const linkNode = instance.createInside.element('a');
                          linkNode.href = filePath;
                          linkNode.setAttribute('target', '_blank');
                          linkNode.style.cursor = "pointer";
                          linkNode.style.color = "blue";
        
                          // Create the image element
                          const img = instance.createInside.element('img');
                          img.src = iconUrl;
                          img.style.width = "16px";
                          img.style.height = "16px";
                          img.style.cursor = "pointer"
                          // Create the span element
                          const span = instance.createInside.element('span');
                          span.textContent = removeExtesion(file.name)
                          span.style.cursor = "pointer";
                          span.style.color = "blue";
                          span.style.paddingRight = "6px";
        
                          // Create the paragraph element
                          const paragraph = instance.createInside.element('p');
                          paragraph.style.color = "blue";
                          paragraph.style.textDecoration = "underline";
                          paragraph.style.cursor = "pointer";
                          paragraph.style.display = "flex"
                          paragraph.style.alignItems = "center"
        
                          // Append the image and span to the paragraph
                          paragraph.appendChild(img);
                          paragraph.appendChild(span);
        
                          // Append the paragraph to the link
                          linkNode.appendChild(paragraph);
        
                          // Insert the link node
                          instance.selection.insertNode(linkNode);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                    return false;
                  }
                },
                toolbar: true,
                textIcons: false,
                colorPickerDefaultTab: "text",
                removeButtons: [
                  'lineHeight',
                  'speechRecognize',
                  'spellcheck',
                  'left',
                  'redo',
                  'eraser'
                ],
                toolbarAdaptive: false,
                readonly: false,
                toolbarButtonSize: 'xsmall',
                buttons: [
                  "source",
                  {
                    name: 'customFileUpload',
                    iconURL: attachmentSvg, // Optional: Custom icon for the button
                    exec: async (editor) => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,.doc,.docx,.xls,.xlsx,.pdf';
                      input.onchange = async () => {
                        const file = input.files[0];
                        if (file) {
                          const filePath = await uploadFileToSharePoint(file, 'PublishingImages');
                          if (["jpg", "png", "jpeg", "gif"].includes(file.name.split('.').pop().toLowerCase())) {
                            // Handle image files
                            const imageNode = editor.createInside.element('img');
                            imageNode.style.width = '100%';
                            imageNode.style.height = '100%';
                            imageNode.src = filePath
                            editor.selection.insertNode(imageNode);
                          } else {
                            // Handle other files
                            // const fileExtension = file.name.split('.').pop().toLowerCase();
                            const iconUrl = getFileIconUrl(file.name) //iconMap[fileExtension]
                            const linkNode = instance.createInside.element('a');
                            linkNode.href = filePath;
                            linkNode.setAttribute('target', '_blank');
                            linkNode.style.cursor = "pointer";
                            linkNode.style.color = "blue";
        
                            // Create the image element
                            const img = instance.createInside.element('img');
                            img.src = iconUrl;
                            img.style.width = "16px";
                            img.style.height = "16px";
                            img.style.cursor = "pointer";
        
                            // Create the span element
                            const span = instance.createInside.element('span');
                            span.textContent = removeExtesion(file.name)
                            span.style.cursor = "pointer";
                            span.style.color = "blue";
                            span.style.paddingRight = "6px";
        
                            // Create the paragraph element
                            const paragraph = instance.createInside.element('p');
                            paragraph.style.color = "blue";
                            paragraph.style.textDecoration = "underline";
                            paragraph.style.cursor = "pointer";
                            paragraph.style.display = "flex"
                            paragraph.style.alignItems = "center"
        
                            // Append the image and span to the paragraph
                            paragraph.appendChild(img);
                            paragraph.appendChild(span);
        
                            // Append the paragraph to the link
                            linkNode.appendChild(paragraph);
        
                            // Insert the link node
                            console.log('linkNode', linkNode);
                            instance.selection.insertNode(linkNode);
                          }
                        }
                      };
                      input.click();
                    },
                    tooltip: 'Upload'
                  },
                  "|",
                  "bold",
                  "strikethrough",
                  "underline",
                  "italic",
                  "|",
                  "ul",
                  "ol",
                  "|",
                  "outdent",
                  "indent",
                  "|",
                  "font",
                  "fontsize",
                  "brush",
                  "paragraph",
                  "|",
                  'undo',
                  "fullsize",
                  "selectall",
                ],
            });

            // Set the content in the editor
            if (formData[field.name]) {
                instance.value = formData[field.name];
            }

            return () => {
                instance.destruct();
            };
        }
    }, []);

    // Function to upload files to SharePoint
  async function uploadFileToSharePoint(file, libraryName) {
    try {
      // Ensure the file is provided
      if (!file) {
        throw new Error("No file provided");
      }

      // Get the folder where the file will be uploaded
      const folder = $pnp.sp.web.getFolderByServerRelativeUrl(libraryName);

      // Extract the file name and extension
      const fileNameParts = file.name.split('.');
      const fileExtension = fileNameParts.pop();
      const baseFileName = fileNameParts.join('.');
      let newFileName = file.name;
      let counter = 1;

      // Function to check if a file with the given name exists
      async function fileExists(fileName) {
        try {
          await folder.files.getByName(fileName).get();
          return true;
        } catch (error) {
          if (error.status === 404) {
            return false;
          } else {
            throw error;
          }
        }
      }

      // Loop to find a unique file name
      while (await fileExists(newFileName)) {
        newFileName = `${baseFileName}_${counter}.${fileExtension}`;
        counter++;
      }

      // Upload the file with the unique name
      const fileAddResult = await folder.files.add(newFileName, file, true);

      // Get the URL of the uploaded file
      const fileUrl = fileAddResult.data.ServerRelativeUrl;

      // Return the full URL of the uploaded file
      const fullFileUrl = `${window.location.origin}${fileUrl}`;
      return fullFileUrl;
    } catch (error) {
      console.error("Error uploading file to SharePoint:", error);
      throw error;
    }
  }

    return (
        <textarea ref={editorRef} id={field.name} ></textarea>
    );
};



function loadResources(resources, isLibrary = true) {
  resources?.forEach((src) => {
      if (src.endsWith(".css") || src.endsWith(".scss")) {
          if (!document.querySelector(`link[href="${src}"]`)) {
              const link = document.createElement("link");
              link.rel = "stylesheet";
              link.href = src;
              document.head.appendChild(link);
          }
      } else {
          if (!document.querySelector(`script[src="${src}"]`)) {
              const script = document.createElement("script");
              if (!isLibrary) {
                  script.setAttribute("data-plugins", "transform-modules-umd");
                  script.type = "text/babel";
                  script.setAttribute("data-type", "module");
                  script.setAttribute("data-presets", "es2017,react,stage-3");
              }
              script.src = src;
              document.body.appendChild(script);
          }
      }
  });
}
// Using Libraries via CDN
const libraries = [
  'react.development.js'
  'react-dom.development.js'
  'babel.min.js'
  'pnp.js',
  'react-bootstrap.min.js',
  'react-bootstrap.min.css',
  'icofont.min.css',
  'jodit.fat.min.css',
  'jodit.fat.min.js'
];

const form_files = [
  "Editor.jsx",
  "form.css",
  "peoplePicker.jsx",
  "utils.jsx",
  "FormBuilder.jsx",
  "Example.jsx",
];

(function () {
  loadResources(libraries);
  loadResources(form_files, false);
})();

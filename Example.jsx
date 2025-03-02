import { useViewsFields } from "./utils";
import { FormBuilder } from "./FormBuilder";

const Example = () => {
  const { useState, useEffect } = React;

  const [show, setShow] = useState(false);
  const [form, setForm] = useState({});

  const [views] = useViewsFields({
    listName: "",
    viewName: "", // Optional
  });

  useEffect(() => {
    if (show === false) {
      setForm({
        ...form,
        type: "new-item",
        data: {},
        title: "פריט חדש",
      });
    }
  }, [show]);

  const handleEditItem = (item) => {
    setForm({
      ...form,
      type: "edit-item",
      data: item,
      title: "עריכת פריט",
    });
    setShow(true);
  };

  const props = {};

  return (
    show && (
      <FormBuilder
        view={views[viewName]}
        show={show}
        setShow={setShow}
        form={form}
        props={props}
      />
    )
  );
};

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(<Example />);

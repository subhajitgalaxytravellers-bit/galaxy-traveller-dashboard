import React, { useState, useEffect, useRef, forwardRef } from "react";

// Create a wrapper component for ReactQuill
const ReactQuillWrapper = forwardRef((props, ref) => {
  const containerRef = useRef(null);
  const [QuillComponent, setQuillComponent] = useState(null);

  useEffect(() => {
    // Dynamically import react-quill only on the client side
    if (typeof window !== "undefined") {
      import("react-quill").then((module) => {
        setQuillComponent(() => module.default);
      });
    }
  }, []);

  if (!QuillComponent) {
    return (
      <div ref={containerRef} className="quill-loading">
        Loading editor...
      </div>
    );
  }

  return <QuillComponent {...props} ref={ref} />;
});

ReactQuillWrapper.displayName = "ReactQuillWrapper";

export default ReactQuillWrapper;

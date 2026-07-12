import React from 'react';
import Editor from '@monaco-editor/react';

const SchemaEditor = ({ schema, onChange }) => {
  return (
    <Editor
      height="90vh"
      defaultLanguage="json"
      value={schema}
      onChange={onChange}
      options={{ minimap: { enabled: false } }}
    />
  );
};

export default SchemaEditor;

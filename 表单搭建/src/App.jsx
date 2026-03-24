import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';

import FormRenderer from './components/FormRenderer';
import SchemaEditor from './components/SchemaEditor';

import './App.css';

const initialSchema = {
  title: '一个包含联动逻辑的表单',
  type: 'object',
  properties: {
    isStudent: {
      type: 'boolean',
      title: '我是学生'
    }
  },
  dependencies: {
    isStudent: {
      oneOf: [
        {
          properties: {
            isStudent: {
              const: true
            },
            schoolName: {
              type: 'string',
              title: '学校名称'
            }
          },
          required: ['schoolName']
        }
      ]
    }
  }
};

const initialValidationCode = `
// formData: 当前表单数据
// errors: RJSF 的错误对象，你可以向其添加自定义错误
function customValidate(formData, errors) {
  if (formData.schoolName && formData.schoolName.length < 4) {
    errors.schoolName.addError('学校名称不能少于4个字符');
  }
  return errors;
}
`;

function App() {
  const [schema, setSchema] = useState(JSON.stringify(initialSchema, null, 2));
  const [parsedSchema, setParsedSchema] = useState(initialSchema);
  const [formData, setFormData] = useState({});
  const [validationCode, setValidationCode] = useState(initialValidationCode);

  const handleSchemaChange = useCallback((value) => {
    setSchema(value);
    try {
      const newSchema = JSON.parse(value);
      setParsedSchema(newSchema);
    } catch (error) {
      console.error('Invalid JSON Schema:', error);
    }
  }, []);

  const handleFormChange = ({ formData }) => {
    setFormData(formData);
  };

  return (
    <div className="app-container">
      <div className="editor-pane">
        <h2>JSON Schema 编辑器</h2>
        <SchemaEditor schema={schema} onChange={handleSchemaChange} />
        <h2 style={{ marginTop: '2rem' }}>自定义校验 (JS)</h2>
        <Editor
          height="30vh"
          defaultLanguage="javascript"
          value={validationCode}
          onChange={setValidationCode}
          options={{ minimap: { enabled: false } }}
        />
      </div>
      <div className="form-pane">
        <h2>表单预览</h2>
        <FormRenderer
          schema={parsedSchema}
          formData={formData}
          onFormChange={handleFormChange}
          customValidateCode={validationCode}
        />
        <div className="form-data">
          <h3>表单数据:</h3>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;

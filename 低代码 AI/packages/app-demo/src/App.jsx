import React, { useState, useCallback } from 'react';
import Editor from '@monaco-editor/react';

import FormRenderer from './components/FormRenderer';
import SchemaEditor from './components/SchemaEditor';
import { AIConfigPanel } from '@ai-config/sdk-react';

import './App.css';

const initialSchema = {
  title: '一个包含联动逻辑的表单',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      title: '姓名',
      minLength: 2
    },
    email: {
      type: 'string',
      title: '邮箱',
      format: 'email'
    },
    age: {
      type: 'integer',
      title: '年龄',
      minimum: 0,
      maximum: 120
    },
    gender: {
      type: 'string',
      title: '性别',
      enum: ['男', '女', '其他'],
      default: '男'
    },
    hobbies: {
      type: 'array',
      title: '兴趣爱好',
      items: {
        type: 'string',
        enum: ['阅读', '运动', '音乐', '旅游', '编程', '摄影']
      },
      uniqueItems: true
    },
    bio: {
      type: 'string',
      title: '个人简介',
      'ui:widget': 'textarea'
    },
    isStudent: {
      type: 'boolean',
      title: '我是学生'
    }
  },
  required: ['name', 'email'],
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
            },
            major: {
              type: 'string',
              title: '专业'
            },
            graduationDate: {
              type: 'string',
              title: '毕业时间',
              format: 'date'
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
  if (formData.age && formData.age < 18) {
    errors.age.addError('年龄必须大于等于18岁');
  }
  if (formData.bio && formData.bio.length > 100) {
    errors.bio.addError('个人简介不能超过100个字符');
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
      <div className="ai-chat-pane">
        <AIConfigPanel
          platformId="demo"
          getCurrentSchema={() => parsedSchema}
          onPatchApplied={(newSchema) => {
            const schemaStr = JSON.stringify(newSchema, null, 2);
            setSchema(schemaStr);
            setParsedSchema(newSchema);
          }}
        />
      </div>
    </div>
  );
}

export default App;

import React from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

const FormRenderer = ({ schema, uiSchema, formData, onFormChange, customValidateCode }) => {
  const log = (type) => console.log.bind(console, type);

  const customValidate = (formData, errors) => {
    try {
      // 注意：在生产环境中，应在沙箱中执行此代码
      const validateFunc = new Function('formData', 'errors', customValidateCode + '\nreturn customValidate(formData, errors);');
      return validateFunc(formData, errors);
    } catch (e) {
      console.error('Error executing custom validation code:', e);
      return errors;
    }
  };

  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      validator={validator}
      formData={formData}
      onChange={onFormChange}
      customValidate={customValidate}
      onError={log('errors')}
    />
  );
};

export default FormRenderer;

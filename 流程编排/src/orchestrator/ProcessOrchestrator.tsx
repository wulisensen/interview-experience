
import React, { useState } from 'react';
import { Steps, Button, Space, Card, Form } from 'antd';
import { OrchestrationConfig } from './types';
import { DynamicComponent } from './DynamicComponent';

interface ProcessOrchestratorProps {
  config: OrchestrationConfig;
  initialContext?: Record<string, any>;
}

export const ProcessOrchestrator: React.FC<ProcessOrchestratorProps> = ({ config, initialContext = {} }) => {
  const [current, setCurrent] = useState(0);
  const [form] = Form.useForm();
  const [context, setContext] = useState(initialContext);

  const next = async () => {
    try {
      const values = await form.validateFields();
      const nextContext = { ...context, ...values };
      setContext(nextContext);
      setCurrent(current + 1);
    } catch (e) {
      console.error('Validation failed:', e);
    }
  };

  const prev = () => {
    const values = form.getFieldsValue();
    setContext({ ...context, ...values });
    setCurrent(current - 1);
  };

  const onValuesChange = (_: any, allValues: any) => {
    setContext({ ...context, ...allValues });
  };

  const stepItems = config.steps.map((step) => ({
    key: step.id,
    title: step.title,
  }));

  const currentStep = config.steps[current];

  return (
    <Card title="活动创建流程编排" style={{ maxWidth: 1000, margin: '20px auto' }}>
      <Steps current={current} items={stepItems} style={{ marginBottom: 24 }} />
      
      <div className="step-content" style={{ minHeight: 400, padding: 20, background: '#f5f5f5', borderRadius: 8 }}>
        <Form 
          form={form} 
          layout="vertical" 
          initialValues={context}
          onValuesChange={onValuesChange}
        >
          {currentStep.components.map((comp, idx) => (
            <DynamicComponent key={idx} config={comp} context={context} />
          ))}
        </Form>
      </div>

      <Space style={{ marginTop: 24, justifyContent: 'flex-end', display: 'flex' }}>
        {current > 0 && <Button onClick={prev}>上一步</Button>}
        {current < config.steps.length - 1 && (
          <Button type="primary" onClick={next}>
            下一步
          </Button>
        )}
        {current === config.steps.length - 1 && (
          <Button type="primary" onClick={() => console.log('Final Context:', context)}>
            提交
          </Button>
        )}
      </Space>
    </Card>
  );
};

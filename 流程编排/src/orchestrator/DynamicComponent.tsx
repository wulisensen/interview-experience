
import React, { useMemo } from 'react';
import * as Antd from 'antd';
import { ComponentConfig } from './types';

const Typography = Antd.Typography;

const ComponentMap: Record<string, any> = {
  Input: Antd.Input,
  Select: Antd.Select,
  DatePicker: Antd.DatePicker,
  Button: Antd.Button,
  Form: Antd.Form,
  FormItem: Antd.Form.Item,
  Card: Antd.Card,
  Space: Antd.Space,
  Col: Antd.Col,
  Row: Antd.Row,
  Title: Typography.Title,
};

interface DynamicComponentProps {
  config: ComponentConfig;
  context: Record<string, any>;
  [key: string]: any; // To allow value/onChange from Form.Item
}

export const DynamicComponent: React.FC<DynamicComponentProps> = ({ config, context, ...restProps }) => {
  const { type, props = {}, dynamicProps, children } = config;
  
  const Component = ComponentMap[type] || (() => <div>Unknown component: {type}</div>);

  const finalProps = useMemo(() => {
    if (!dynamicProps) return props;
    try {
      // 执行 JS 代码计算 props
      // 传入 context 作为参数
      const compute = new Function('context', `
        try {
          const fn = ${dynamicProps};
          return fn(context);
        } catch (e) {
          console.error('Dynamic props computation error:', e);
          return {};
        }
      `);
      const computedProps = compute(context);
      return { ...props, ...computedProps };
    } catch (e) {
      console.error('Error computing dynamic props:', e);
      return props;
    }
  }, [props, dynamicProps, context]);

  return (
    <Component {...finalProps} {...restProps}>
      {children?.map((child, idx) => (
        <DynamicComponent key={idx} config={child} context={context} />
      ))}
    </Component>
  );
};

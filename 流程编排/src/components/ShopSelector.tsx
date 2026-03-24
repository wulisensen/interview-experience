
import React from 'react';
import { Select } from 'antd';

const shops = [
  { label: '杭州总店', value: 'HZ001' },
  { label: '上海分店', value: 'SH002' },
  { label: '北京分店', value: 'BJ003' },
];

interface ShopSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export const ShopSelector: React.FC<ShopSelectorProps> = ({ value, onChange }) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      options={shops}
      placeholder="请选择店铺"
      style={{ width: '100%' }}
    />
  );
};

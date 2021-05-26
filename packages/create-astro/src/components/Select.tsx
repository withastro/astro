import SelectInput from 'ink-select-input';
import React, { FC } from 'react';
import { Text, Box } from 'ink';
// @ts-expect-error
const { default: Select } = SelectInput;

interface Props {
  isSelected?: boolean;
  label: string;
  description?: string;
}
const Indicator: FC<Props> = ({ isSelected }) => (isSelected ? <Text color="#3894FF">[ </Text> : <Text>{'  '}</Text>);
const Item: FC<Props> = ({ isSelected = false, label, description }) => (
  <Box display="flex">
    <Text color={isSelected ? '#3894FF' : 'white'} dimColor={!isSelected}>
      {label}
    </Text>
    {isSelected && description && typeof description === 'string' && <Text> {description}</Text>}
    {isSelected && description && typeof description !== 'string' && <Box marginLeft={1}>{description}</Box>}
  </Box>
);

interface SelectProps {
  items: { value: string | number | boolean; label: string; description?: any }[];
  onSelect(value: string | number | boolean): void;
}
const CustomSelect: FC<SelectProps> = ({ items, onSelect }) => {
  const handleSelect = ({ value }) => onSelect(value);
  return <Select indicatorComponent={Indicator} itemComponent={Item} items={items} onSelect={handleSelect} />;
};

export default CustomSelect;

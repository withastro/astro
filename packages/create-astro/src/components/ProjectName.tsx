import React, { FC } from 'react';
import { Box, Text } from 'ink';
import Spacer from './Spacer';
import TextInput from 'ink-text-input';
// @ts-expect-error
const { default: Input } = TextInput;

const ProjectName: FC<{ onSubmit: (value: string) => void }> = ({ onSubmit }) => {
  const [value, setValue] = React.useState('');
  const handleSubmit = (v: string) => onSubmit(v);

  return (
    <>
      <Box display="flex">
        <Text color="#17C083">{'[query]'}</Text>
        <Text> What is your project name?</Text>
      </Box>
      <Box display="flex">
        <Spacer />
        <Input value={value} onChange={setValue} onSubmit={handleSubmit} placeholder="my-project" />
      </Box>
    </>
  );
};

export default ProjectName;

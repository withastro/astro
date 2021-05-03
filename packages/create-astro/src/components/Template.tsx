import React, { FC } from 'react';
import { Box, Text } from 'ink';
import Spacer from './Spacer';
import Select from './Select';

const Template: FC<{ context: any; onSubmit: (value: string) => void }> = ({ context: { templates }, onSubmit }) => {
  const items = templates.map(({ title: label, ...rest }) => ({ ...rest, label }));

  return (
    <>
      <Box display="flex">
        <Text color="#17C083">{'[query]'}</Text>
        <Text> Which template should be used?</Text>
      </Box>
      <Box display="flex">
        <Spacer width={6} />
        <Select items={items} onSelect={onSubmit} />
      </Box>
    </>
  );
};

export default Template;

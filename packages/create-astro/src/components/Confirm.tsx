import React, { FC } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spacer from './Spacer';
import Select from './Select';

const Confirm: FC<{ message?: any; context: any; onSubmit: (value: boolean) => void }> = ({ message, context: { projectName }, onSubmit }) => {
  const { exit } = useApp();
  const handleSubmit = (v: boolean) => {
    if (!v) return exit();
    onSubmit(v);
  };

  return (
    <>
      <Box display="flex">
        {!message ? (
          <>
            <Text color="#FFBE2D">{'[uh-oh]'}</Text>
            <Text>
              {' '}
              It appears <Text color="#17C083">./{projectName}</Text> is not empty. Overwrite?
            </Text>
          </>
        ) : (
          message
        )}
      </Box>
      <Box display="flex">
        <Spacer width={6} />
        <Select
          items={[
            {
              value: false,
              label: 'no',
            },
            {
              value: true,
              label: 'yes',
              description: <Text color="#FF1639">overwrite</Text>,
            },
          ]}
          onSelect={handleSubmit}
        />
      </Box>
    </>
  );
};

export default Confirm;

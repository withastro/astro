import React, { FC, useEffect } from 'react';
import { Box, Text } from 'ink';
import { cancelProcessListeners } from '../utils';

const Finalize: FC<{ context: any }> = ({ context: { use, projectName } }) => {
  useEffect(() => {
    cancelProcessListeners();
    process.exit(0);
  }, []);

  return (
    <>
      <Box display="flex">
        <Text color="#17C083">{'[ yes ]'}</Text>
        <Text>
          {' '}
          Project initialized at <Text color="#3894FF">./{projectName}</Text>
        </Text>
      </Box>
      <Box display="flex" marginY={1}>
        <Text dimColor>{'[ tip ]'}</Text>
        <Box display="flex" marginLeft={1} flexDirection="column">
          <Text>Get started by running</Text>
          <Text color="#3894FF">cd ./{projectName}</Text>
          <Text color="#3894FF">{use} start</Text>
        </Box>
      </Box>
    </>
  );
};

export default Finalize;

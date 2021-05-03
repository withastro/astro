import React, { FC } from 'react';
import { Box, Text } from 'ink';
import Spacer from './Spacer';
import Spinner from './Spinner';

const Install: FC<{ context: any }> = ({ context: { use } }) => {
  return <>
      <Box display="flex">
        <Spinner/> 
        <Text> Initiating launch sequence...</Text>
      </Box>
      <Box>
        <Spacer />
        <Text color="white" dimColor>(aka running <Text color="#17C083">{use === 'npm' ? 'npm install' : 'yarn'}</Text>)</Text>
      </Box>
    </>;
};

export default Install;

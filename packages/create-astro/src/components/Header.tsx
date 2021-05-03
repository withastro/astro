import React from 'react';
import { Box, Text } from 'ink';

const getMessage = ({ projectName, template }) => {
  switch (true) {
    case !projectName:
      return <Text dimColor>Gathering mission details</Text>;
    case !template:
      return <Text dimColor>Optimizing navigational system</Text>;
    default:
      return (
        <Text color="black" backgroundColor="white">
          {' '}
          {projectName}{' '}
        </Text>
      );
  }
};

const Header: React.FC<{ context: any }> = ({ context }) => (
  <Box width={48} display="flex" marginY={1}>
    <Text backgroundColor="#882DE7" color="white">
      {' astro '}
    </Text>
    <Box marginLeft={1}>{getMessage(context)}</Box>
  </Box>
);
export default Header;

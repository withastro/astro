import React, { FC } from 'react';
import { Box, Text } from 'ink';
import { isDone } from '../utils';

const Exit: FC<{ didError?: boolean }> = ({ didError }) => isDone ? null : <Box marginTop={1} display="flex">
    <Text color={didError ? "#FF1639" : "#FFBE2D"}>[abort]</Text>
    <Text> astro cancelled</Text>
</Box>
export default Exit;

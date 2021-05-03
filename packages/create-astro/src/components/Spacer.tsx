import React, { FC } from 'react';
import { Box } from 'ink';

const Spacer: FC<{ width?: number }> = ({ width = 8 }) => <Box width={width} />;
export default Spacer;

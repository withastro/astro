import React from 'react';
import { Text } from 'ink';
import { isWin } from '../utils';

export default ({ children }) => (isWin() ? null : <Text>{children}</Text>);

import React, { FC } from 'react';
import { Text } from 'ink';
import pkg from '../../package.json';

const Version: FC = () => <Text color="#17C083">v{pkg.version}</Text>;
export default Version;

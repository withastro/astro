import React, { FC } from 'react';
import { Box, Text } from 'ink';
import decamelize from 'decamelize';
import { ARGS, ARG } from '../config';

const Type: FC<{ type: any; enum?: string[] }> = ({ type, enum: e }) => {
  if (type === Boolean) {
    return (
      <>
        <Text color="#3894FF">true</Text>
        <Text dimColor>|</Text>
        <Text color="#3894FF">false</Text>
      </>
    );
  }
  if (e?.length > 0) {
    return (
      <>
        {e.map((item, i, { length: len }) => {
          if (i !== len - 1) {
            return (
              <Box key={item}>
                <Text color="#17C083">{item}</Text>
                <Text dimColor>|</Text>
              </Box>
            );
          }

          return (
            <Text color="#17C083" key={item}>
              {item}
            </Text>
          );
        })}
      </>
    );
  }

  return <Text color="#3894FF">string</Text>;
};

const Command: FC<{ name: string; info: ARG }> = ({ name, info: { alias, description, type, enum: e } }) => {
  return (
    <Box display="flex" alignItems="flex-start">
      <Box width={24} display="flex" flexGrow={0}>
        <Text color="whiteBright">--{name}</Text>
        {alias && <Text dimColor> -{alias}</Text>}
      </Box>
      <Box width={24}>
        <Type type={type} enum={e} />
      </Box>
      <Box>
        <Text>{description}</Text>
      </Box>
    </Box>
  );
};

const Help: FC<{ context: any }> = ({ context: { templates } }) => {
  return (
    <>
      <Box width={48} display="flex" marginY={1}>
        <Text backgroundColor="#882DE7" color="white">
          {' astro '}
        </Text>
        <Box marginLeft={1}>
          <Text color="black" backgroundColor="white">
            {' '}
            help{' '}
          </Text>
        </Box>
      </Box>
      <Box marginBottom={1} marginLeft={2} display="flex" flexDirection="column">
        {Object.entries(ARGS).map(([name, info]) => (
          <Command key={name} name={decamelize(name, { separator: '-' })} info={name === 'template' ? { ...info, enum: templates.map(({ value }) => value) } : info} />
        ))}
      </Box>
    </>
  );
};
export default Help;

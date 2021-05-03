import React, { FC, useEffect, useState } from 'react';
import { Box, Text } from 'ink';

const Spinner: FC<{ type?: keyof typeof spinners }> = ({ type = 'countdown' }) => {
  const { interval, frames } = spinners[type];
  const [i, setI] = useState(0);
  useEffect(() => {
    const _ = setInterval(() => {
      setI(v => (v < frames.length - 1) ? v + 1 : 0)
    }, interval)

    return () => clearInterval(_);
  }, [])

  return frames[i]
}

const spinners = {
  countdown: {
    interval: 80,
    frames: [
      <Box display="flex">
        <Text backgroundColor="#882DE7">{'       '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#882DE7">{'       '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#882DE7">{'       '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#882DE7">{'       '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#882DE7">{'       '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#882DE7">{'      '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#882DE7">{'     '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#882DE7">{'    '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#882DE7">{'   '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#882DE7">{'  '}</Text>
      </Box>,
       <Box display="flex">
        <Text backgroundColor="#17C083">{' '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#882DE7">{' '}</Text>
      </Box>,
       <Box display="flex">
        <Text backgroundColor="#17C083">{'  '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
      </Box>,
       <Box display="flex">
        <Text backgroundColor="#17C083">{'   '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#17C083">{'    '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#17C083">{'     '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#17C083">{'      '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#17C083">{'       '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#17C083">{'       '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#17C083">{'       '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#17C083">{'       '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#17C083">{'       '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#17C083">{'       '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#17C083">{'      '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#17C083">{'     '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#17C083">{'    '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#17C083">{'   '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#17C083">{'  '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#882DE7">{' '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
        <Text backgroundColor="#17C083">{' '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#882DE7">{'  '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
        <Text backgroundColor="#23B1AF">{' '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#882DE7">{'   '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
        <Text backgroundColor="#2CA5D2">{' '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#882DE7">{'    '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
        <Text backgroundColor="#3894FF">{' '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#882DE7">{'     '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
        <Text backgroundColor="#5076F9">{' '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#882DE7">{'      '}</Text>
        <Text backgroundColor="#6858F1">{' '}</Text>
      </Box>,
      <Box display="flex">
        <Text backgroundColor="#882DE7">{'       '}</Text>
      </Box>,
    ]
  }
}

export default Spinner;

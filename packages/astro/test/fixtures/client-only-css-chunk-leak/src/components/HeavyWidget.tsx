import StyledPanel from './StyledPanel';
import { formatLabel } from './formatLabel';

export default function HeavyWidget() {
  return <StyledPanel>{formatLabel('Widget')}</StyledPanel>;
}

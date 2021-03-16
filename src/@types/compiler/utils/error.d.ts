export default function error(
  message: string,
  props: {
    name: string;
    code: string;
    source: string;
    filename: string;
    start: number;
    end?: number;
  }
): never;

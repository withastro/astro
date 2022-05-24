import { h } from 'preact';

const TextBlock = ({
  title,
  children,
  noPadding = false,
}) => {
  return (
    <div
      className={`${
        noPadding ? "" : "md:px-2 lg:px-4"
      } flex-1 prose prose-headings:font-grotesk`}
    >
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
};

export default TextBlock;

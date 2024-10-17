let count = 1;

export default function RenderCount() {
  return (
    <>
      <div id="render-count">{count++}</div>
    </>
  );
}

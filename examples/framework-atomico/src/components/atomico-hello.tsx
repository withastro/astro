import { Props, c, css } from "atomico";

function atomicoHello({ message }: Props<typeof atomicoHello>) {
  return (
    <host shadowDom>
      <div class="layer">{message}</div>
      <div class="box">
        <slot></slot>
      </div>
    </host>
  );
}

atomicoHello.props = {
  message: {
    type: String,
    value: "Hello.",
  },
};

atomicoHello.styles = css`
  :host,
  .layer {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .layer {
    position: absolute;
    top: 0px;
    left: 0px;
    font-size: 20vw;
    font-weight: bold;
    overflow: hidden;
    color: white;
    text-shadow: 0px 2vw 4vw var(--hello-shadow-1, magenta),
      0px 2vw 1vw var(--hello-shadow-2, tomato);
    opacity: 0.15;
    align-items: flex-end;
  }
  .box {
    position: relative;
  }
`;

export const AtomicoHello = c(atomicoHello);

customElements.define("atomico-hello", AtomicoHello);

// @ts-nocheck
class Pixel {
  static get inputProperties() {
    return ['--border-radius', '--border-color', '--pixel-size', '--variant'];
  }
  paint(ctx, size, styleMap) {
    ctx.fillStyle = "black";
    const variant = styleMap.get("--variant").toString().trim();
    const corner = styleMap.get("--border-radius").toString();
    const px = styleMap.get("--pixel-size").toString();
    const w = size.width;
    const h = size.height;

    switch (variant) {
      case 'primary': {
        ctx.fillRect(corner, 0, w - corner * 2, h);

        for (let i = 0; i < Math.round(corner / px); i++) {
          let v = px * i;
          let x = v;
          let y = corner - v;
          ctx.fillRect(x, y, px, h - corner * 2 + (v * 2));
        }
        for (let i = 0; i < Math.round(corner / px); i++) {
          let v = px * i;
          let x = w - (px * (i + 1));
          let y = corner - v;
          ctx.fillRect(x, y, px, h - corner * 2 + (v * 2));
        }
        return;
      }
      case 'outline': {
        // top + right + bottom + left border
        ctx.fillRect(corner, 0, w - corner * 2, px);
        ctx.fillRect(w - px, corner, px, h - (corner * 2));
        ctx.fillRect(corner, h - px, w - corner * 2, px);
        ctx.fillRect(0, corner, px, h - (corner * 2));

        for (let i = 0; i < Math.round(corner / px) + 1; i++) {
          let v = px * i;
          let x = v;
          let y = corner - v;
          ctx.fillRect(x, y, px, px * 2);
          ctx.fillRect(x, h - y - (px * 2), px, px * 2);
        }
        for (let i = 0; i < Math.round(corner / px) + 1; i++) {
          let v = px * i;
          let x = w - (px * (i + 1));
          let y = corner - v;
          ctx.fillRect(x, y, px, px * 2);
          ctx.fillRect(x, h - y - (px * 2), px, px * 2);
        }
        return;
      }
    }
  }
}

registerPaint("pixel", Pixel);

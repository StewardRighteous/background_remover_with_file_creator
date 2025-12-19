type FillColor = "black" | "red";

export async function fillImageWithColor(
  imageUrl: string,
  color: FillColor = "black"
): Promise<string> {
  const img = new Image();
  img.src = imageUrl;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = color; // "black" or "red"
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalCompositeOperation = "source-over";

  return canvas.toDataURL("image/png");
}

export async function addBottomRedRectangleMm(
  imageUrl: string,
  mm = 7,
  dpi = 300
): Promise<string> {
  const img = new Image();
  img.src = imageUrl;
  await img.decode();

  // Convert mm → pixels
  const heightPx = Math.round((mm / 25.4) * dpi);

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;

  const ctx = canvas.getContext("2d")!;

  // Draw original image
  ctx.drawImage(img, 0, 0);

  // Draw red rectangle at bottom
  ctx.fillStyle = "red";
  ctx.fillRect(0, canvas.height - heightPx, canvas.width, heightPx);

  return canvas.toDataURL("image/png");
}

export async function fillOuterSilhouetteRed(
  imageUrl: string,
  color: "red" | "#ff0000" = "red"
): Promise<string> {
  const img = new Image();
  img.src = imageUrl;
  await img.decode();

  const w = img.width;
  const h = img.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = color;

  // Column-wise fill between first & last opaque pixel
  for (let x = 0; x < w; x++) {
    let top = -1;
    let bottom = -1;

    for (let y = 0; y < h; y++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 0) {
        if (top === -1) top = y;
        bottom = y;
      }
    }

    if (top !== -1 && bottom !== -1) {
      ctx.fillRect(x, top, 1, bottom - top + 1);
    }
  }

  return canvas.toDataURL("image/png");
}

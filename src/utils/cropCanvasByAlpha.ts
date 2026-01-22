/**
 * Crops a canvas by removing transparent areas based on alpha threshold
 *
 * @param sourceCanvas - Canvas containing the image
 * @param alphaThreshold - Alpha value (0–255). Pixels below this are ignored
 * @returns Cropped canvas
 */
export function cropCanvasByAlpha(
  sourceCanvas: HTMLCanvasElement,
  alphaThreshold: number = 150,
): HTMLCanvasElement {
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true })!;
  const { width, height } = sourceCanvas;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let top = height;
  let left = width;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];

      if (alpha >= alphaThreshold) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  // No visible pixels
  if (left > right || top > bottom) {
    return sourceCanvas;
  }

  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;

  const croppedCtx = croppedCanvas.getContext("2d", {
    willReadFrequently: true,
  })!;
  croppedCtx.drawImage(
    sourceCanvas,
    left,
    top,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  );

  return croppedCanvas;
}

function loadImage(src: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    if (src instanceof File) {
      img.src = URL.createObjectURL(src);
    } else {
      img.src = src;
    }

    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

/**
 * Resize image to 3in or 7in height,
 * keep only pixels with alpha >= 180,
 * crop to visible area,
 * return PNG base64
 */
export default async function resizeAndCropByAlpha(
  imageSrc: string | File,
  heightInInches: 3 | 7,
  ALPHA_THRESHOLD = 150,
  dpi: number = 96
): Promise<string> {
  const img = await loadImage(imageSrc);

  // 1️⃣ Resize target
  const targetHeightPx = heightInInches * dpi;
  const aspectRatio = img.width / img.height;
  const targetWidthPx = Math.round(targetHeightPx * aspectRatio);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;

  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 2️⃣ Draw resized image
  ctx.drawImage(img, 0, 0, targetWidthPx, targetHeightPx);

  // 3️⃣ Read pixels
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let top = canvas.height;
  let left = canvas.width;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;

      if (data[i + 3] >= ALPHA_THRESHOLD) {
        // keep pixel
        data[i + 3] = 255;

        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      } else {
        // remove pixel
        data[i + 3] = 0;
      }
    }
  }

  // Edge case: nothing visible
  if (right < left || bottom < top) {
    throw new Error("No visible pixels after alpha thresholding");
  }

  // 5️⃣ Apply cleaned alpha
  ctx.putImageData(imageData, 0, 0);

  // 6️⃣ Crop to visible area
  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;

  const croppedCtx = croppedCanvas.getContext("2d")!;
  croppedCtx.drawImage(
    canvas,
    left,
    top,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  // 7️⃣ Export PNG
  return croppedCanvas.toDataURL("image/png", 1);
}

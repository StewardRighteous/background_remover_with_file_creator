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
 * Resize an image to a given height in inches while preserving aspect ratio
 * Returns a base64 data URL string
 *
 * @param imageSrc - URL / base64 / File
 * @param heightInInches - 3 or 7
 * @param dpi - print DPI (default CSS Standard 96)
 * @returns Promise<string>
 */
export default async function resizeImageToInchHeight(
  imageSrc: string | File,
  heightInInches: 3 | 7,
  dpi: number = 96
): Promise<string> {
  const img = await loadImage(imageSrc);

  const targetHeightPx = heightInInches * dpi;
  const aspectRatio = img.width / img.height;
  const targetWidthPx = Math.round(targetHeightPx * aspectRatio);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;

  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(img, 0, 0, targetWidthPx, targetHeightPx);

  // ✅ Return base64 string
  return canvas.toDataURL("image/png", 1);
}

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


export default async function resizeImageByHeight(
  imageSrc: string | File,
  heightInInches: 3 | 7,
  dpi: number = 96,
): Promise<string> {
  const img = await loadImage(imageSrc);

  const targetHeightPx = heightInInches * dpi;
  const aspectRatio = img.width / img.height;
  const targetWidthPx = Math.round(targetHeightPx * aspectRatio);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidthPx;
  canvas.height = targetHeightPx;

  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(img, 0, 0, targetWidthPx, targetHeightPx);

  return canvas.toDataURL("image/png", 1);
}

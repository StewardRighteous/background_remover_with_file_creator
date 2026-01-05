export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function getCroppedImg(
  imageSrc: string,
  pixelCrop: PixelCrop
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const image = new Image();

  return new Promise((resolve, reject) => {
    image.onload = () => {
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("No canvas context");

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) return reject("Canvas empty");
        resolve(blob);
      }, "image/png");
    };

    image.onerror = () => reject("Image load failed");
    image.src = imageSrc;
  });
}

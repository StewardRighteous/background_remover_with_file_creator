type FillColor = "black" | "red";

export default async function fillImageWithColor(
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

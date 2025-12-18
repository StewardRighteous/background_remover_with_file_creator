export default async function addMmBorder(
  imageUrl: string,
  mm = 7,
  dpi = 300,
  color = "black"
): Promise<string> {
  const img = new Image();
  img.src = imageUrl;
  await img.decode();

  // Convert mm → pixels
  const borderPx = Math.round((mm / 25.4) * dpi);

  // Expanded canvas
  const canvas = document.createElement("canvas");
  canvas.width = img.width + borderPx * 2;
  canvas.height = img.height + borderPx * 2;

  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw image in center
  ctx.drawImage(img, borderPx, borderPx);

  // Extract alpha mask
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Create halo border
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = color;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4 + 3;
      if (data[i] > 0) {
        ctx.beginPath();
        ctx.arc(x, y, borderPx / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();

  return canvas.toDataURL("image/png");
}

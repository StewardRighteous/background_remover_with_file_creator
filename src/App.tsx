import { useState } from "react";
import { pipeline } from "@huggingface/transformers";
import Files from "./Files";
import { cropTransparentImage } from "./utils/cropTransparentImage";

type ModelType = "briaai/RMBG-1.4" | "Xenova/modnet";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [model, setModel] = useState<ModelType>("briaai/RMBG-1.4");
  const [loading, setLoading] = useState(false);

  async function removeBackground() {
    if (!file) return;

    setLoading(true);
    try {
      const segmenter = await pipeline("image-segmentation", model, {
        dtype: "q8",
      });

      const imageUrl = URL.createObjectURL(file);
      const results = await segmenter(imageUrl);
      const mask = results[0].mask;

      const img = new Image();
      img.src = imageUrl;
      await img.decode();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < mask.data.length; i++) {
        data[i * 4 + 3] = mask.data[i];
      }

      ctx.putImageData(imageData, 0, 0);

      const transparentPNG = canvas.toDataURL("image/png");
      const croppedPNG = await cropTransparentImage(transparentPNG);

      setOutputImage(croppedPNG);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="container">
        <h2>AI Background Remover</h2>
        <select
          name="model"
          id="model"
          value={model}
          onChange={(e) =>
            setModel(
              e.target.value === "briaai/RMBG-1.4"
                ? "briaai/RMBG-1.4"
                : "Xenova/modnet"
            )
          }
        >
          <option value="briaai/RMBG-1.4">Model 1</option>
          <option value="Xenova/modnet">Model 2</option>
        </select>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={removeBackground} disabled={!file || loading}>
          {loading ? "Processing..." : "Remove Background"}
        </button>
        <hr />
        <div className="images">
          {file && (
            <div className="image-container">
              <p>Original:</p>
              <img src={URL.createObjectURL(file)} alt="Original" />
            </div>
          )}
          {outputImage && (
            <div className="image-container">
              <p>Result:</p>
              <img src={outputImage} alt="Background Removed" />
            </div>
          )}
        </div>
      </div>
      {outputImage && <Files image={outputImage} />}
    </>
  );
}

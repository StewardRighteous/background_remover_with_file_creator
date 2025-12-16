import { useState } from "react";
import { pipeline } from "@huggingface/transformers";

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
      const segmenter = await pipeline("background-removal", model, {
        dtype: "q8",
      });
      const imageUrl = URL.createObjectURL(file);
      const output = await segmenter(imageUrl);
      const blob = await output[0].toBlob();
      setOutputImage(URL.createObjectURL(blob));
    } catch (error) {
      console.error("Error removing background:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
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
  );
}

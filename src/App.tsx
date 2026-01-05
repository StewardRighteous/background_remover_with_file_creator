import { useEffect, useRef, useState } from "react";
import { pipeline } from "@huggingface/transformers";
import Files from "./Files";
import { cropTransparentImage } from "./utils/cropTransparentImage";
import Cropper from "react-easy-crop";
import { type PixelCrop, getCroppedImg } from "./utils/getCroppedImg";

type ModelType = "briaai/RMBG-1.4" | "Xenova/modnet";

export default function App() {
  const [file, setFile] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [model, setModel] = useState<ModelType>("briaai/RMBG-1.4");
  const [loading, setLoading] = useState(false);
  const originalImage = useRef<HTMLImageElement | null>(null);
  const [loadingInstructions, setLoadingInstructions] = useState<
    | "Loading Model"
    | "Removing Background"
    | "Converting Image"
    | "Showing Output"
  >("Loading Model");

  const [isCropImage, setIsCropImage] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(
    null
  );
  const [aspectRatio, setAspectRatio] = useState(1);

  useEffect(() => {
    return () => {
      if (file && file.startsWith("blob:")) {
        URL.revokeObjectURL(file);
      }
    };
  }, [file]);

  const onCropComplete = (_: PixelCrop, croppedPixels: PixelCrop) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleCrop = async () => {
    if (!file || !croppedAreaPixels) return;

    const croppedBlob = await getCroppedImg(file, croppedAreaPixels);
    const croppedUrl = URL.createObjectURL(croppedBlob);

    setFile(croppedUrl);
    setIsCropImage(false);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  async function removeBackground() {
    if (!file) return;
    setOutputImage(null);
    setLoading(true);
    try {
      setLoadingInstructions("Loading Model");
      const segmenter = await pipeline("image-segmentation", model, {
        dtype: "q8",
      });

      setLoadingInstructions("Removing Background");
      const imageUrl = file;
      const results = await segmenter(imageUrl);
      const mask = results[0].mask;

      const img = new Image();
      img.src = imageUrl;
      await img.decode();

      setLoadingInstructions("Converting Image");
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

      setLoadingInstructions("Showing Output");
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
        <h2>Background Remover</h2>
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
          onChange={(e) => {
            const selectedFile = e.target.files?.item(0);
            if (!selectedFile) return;

            const objectUrl = URL.createObjectURL(selectedFile);
            setFile(objectUrl);
          }}
        />

        <button onClick={removeBackground} disabled={!file || loading}>
          {loading ? loadingInstructions : "Remove Background"}
        </button>
        {loading && (
          <ul>
            <li>This will take time and data !</li>
            <li>If the browser asks to exit page select "wait"!</li>
            <li>The lower the image size the faster the website will be !</li>
            <li>
              If you are not satisfied with the output, select and try "model 2"
            </li>
          </ul>
        )}
        <hr />
        <div className="images">
          {isCropImage && file && (
            <div
              style={{ position: "relative", height: "800px", width: "800px" }}
            >
              <Cropper
                image={file}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="rect"
              />
            </div>
          )}

          {isCropImage && file && (
            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <select
                name="aspect-ratio"
                id="aspect-ratio"
                onChange={(e) => setAspectRatio(Number(e.target.value))}
              >
                <option value={1}>Square</option>
                <option value={16 / 9}>Landscape</option>
                <option value={9 / 16}>Potrait</option>
                <option value={4 / 3}> Landscape (4:3)</option>
                <option value={3 / 4}>Potrait(3:4)</option>
              </select>
              <label htmlFor="zoom">Zoom</label>
              <input
                id="zoom"
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <button onClick={handleCrop}>Apply Crop</button>
              <button onClick={() => setIsCropImage(false)}>Cancel</button>
            </div>
          )}
          {file && !isCropImage && (
            <div className="image-container">
              <p>Original:</p>
              <button onClick={() => setIsCropImage(true)}>Crop Image</button>
              <img src={file} alt="Original" ref={originalImage} />
            </div>
          )}
          {outputImage && (
            <div className="image-container">
              <p>Result:</p>
              {loading ? (
                <p>{loadingInstructions}</p>
              ) : (
                <img src={outputImage} alt="Background Removed" />
              )}
            </div>
          )}
        </div>
      </div>
      {outputImage && originalImage.current && <Files image={outputImage} />}
    </>
  );
}

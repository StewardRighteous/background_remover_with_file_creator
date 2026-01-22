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
    null,
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
      <div className="m-4 grid gap-4">
        {/* Main Head */}
        <div className="flex justify-center items-center gap-4">
          <label htmlFor="model"> Choose Model:</label>
          <select
            className="border"
            name="model"
            id="model"
            value={model}
            onChange={(e) =>
              setModel(
                e.target.value === "briaai/RMBG-1.4"
                  ? "briaai/RMBG-1.4"
                  : "Xenova/modnet",
              )
            }
          >
            <option value="briaai/RMBG-1.4">Model 1</option>
            <option value="Xenova/modnet">Model 2</option>
          </select>
          <label
            htmlFor="choose-file"
            className="border w-40 text-center p-1 bg-blue-500 text-white"
          >
            Select File
          </label>
          <input
            id="choose-file"
            className="hidden"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const selectedFile = e.target.files?.item(0);
              if (!selectedFile) return;
              const objectUrl = URL.createObjectURL(selectedFile);
              setFile(objectUrl);
            }}
          />
          <button
            onClick={removeBackground}
            disabled={!file || loading}
            className="w-40 p-1 border border-red-500 text-red-500"
          >
            {loading ? loadingInstructions : "Remove Background"}
          </button>
          {loading && (
            <ul>
              <li>This will take time and data !</li>
              <li>If the browser asks to exit page select "wait"!</li>
              <li>The lower the image size the faster the website will be !</li>
              <li>
                If you are not satisfied with the output, select and try "model
                2"
              </li>
            </ul>
          )}
        </div>

        <div>
          {/* Crop Area  */}
          <div className="flex justify-center gap-6">
            {isCropImage && file && (
              <div className="size-200 relative">
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
              <div className="grid grid-cols-2 w-50 h-20 gap-2.5">
                <label htmlFor="aspect-ratio">Aspect Ratio</label>
                <select
                  className="border"
                  id="aspect-ratio"
                  onChange={(e) => setAspectRatio(Number(e.target.value))}
                >
                  <option value={1}>1:1</option>
                  <option value={4 / 5}>4:5</option>
                  <option value={3 / 4}>3:4</option>
                  <option value={9 / 16}>9:16</option>
                  <option value={2 / 3}>2:3</option>
                  <option value={5 / 8}>5:8</option>
                  <option value={3 / 2}>3:2</option>
                  <option value={4 / 3}>4:3</option>
                  <option value={5 / 4}>5:4</option>
                  <option value={7 / 5}>7:5</option>
                  <option value={16 / 9}>16:9</option>
                  <option value={18 / 9}>18:9</option>
                  <option value={21 / 9}>21:9</option>
                  <option value={19.5 / 9}>19.5:9</option>
                  <option value={2}>2:1</option>
                  <option value={3}>3:1</option>
                  <option value={4}>4:1</option>
                  <option value={5}>5:1</option>
                  <option value={1 / Math.SQRT2}>A-Series (√2:1)</option>
                  <option value={8.5 / 11}>Letter (8.5:11)</option>
                  <option value={11 / 8.5}>Letter (Landscape)</option>
                  <option value={5 / 3}>5:3</option>
                  <option value={14 / 9}>14:9</option>
                  <option value={15 / 9}>15:9</option>
                </select>
                <label htmlFor="zoom">Zoom ({zoom})</label>
                <input
                  id="zoom"
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
                <button
                  onClick={handleCrop}
                  className="bg-blue-500 text-white p-1 rounded"
                >
                  Apply Crop
                </button>
                <button
                  onClick={() => setIsCropImage(false)}
                  className="border rounded text-red-500"
                >
                  Cancel
                </button>
              </div>
            )}
            {/* Original Image */}
            {file && !isCropImage && (
              <div className="size-111 flex flex-col gap-1 items-center">
                <p className="font-bold">Original</p>
                <button
                  onClick={() => setIsCropImage(true)}
                  className="border w-40"
                >
                  Crop Image
                </button>
                <img
                  src={file}
                  alt="Original"
                  ref={originalImage}
                  className="size-100 object-contain"
                />
              </div>
            )}
            {/* Background Removed Image */}
            {outputImage && !isCropImage && (
              <div className="size-111 flex flex-col gap-1 items-center">
                <p className="font-bold">Result</p>
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  <img
                    src={outputImage}
                    alt="Background Removed"
                    className="size-100 object-contain"
                  />
                )}
              </div>
            )}
          </div>
        </div>
        <div>
          {!isCropImage && outputImage && originalImage.current && (
            <Files image={outputImage} />
          )}
        </div>
      </div>
    </>
  );
}

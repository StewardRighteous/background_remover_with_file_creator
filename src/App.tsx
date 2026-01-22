import { useEffect, useRef, useState } from "react";
import { pipeline } from "@huggingface/transformers";
import Files from "./Files";
import Cropper from "react-easy-crop";
import { type PixelCrop, getCroppedImg } from "./utils/getCroppedImg";
import { cropCanvasByAlpha } from "./utils/cropCanvasByAlpha";

type ModelType = "briaai/RMBG-1.4" | "Xenova/modnet";

export default function App() {
  const [file, setFile] = useState<string | null>(null);
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [model, setModel] = useState<ModelType>("briaai/RMBG-1.4");
  const [loading, setLoading] = useState(false);
  const originalImage = useRef<HTMLImageElement | null>(null);
  const [alphaThreshold, setAlphaThreshold] = useState(1);
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
  const [aspectWidth, setAspectWidth] = useState(9);
  const [aspectHeight, setAspectHeight] = useState(16);

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
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
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
      const transparentPNG = cropCanvasByAlpha(canvas, alphaThreshold);
      const croppedPNG = transparentPNG.toDataURL("image/png");

      setOutputImage(croppedPNG);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="m-4 grid gap-4 justify-items-center">
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
        <div className="flex flex-col gap-1">
          <label htmlFor="threshold ">Threshold ({alphaThreshold})</label>
          <input
            className="w-40"
            type="range"
            name="threshold"
            id="threshold"
            min={0}
            max={255}
            onChange={(e) => setAlphaThreshold(Number(e.target.value))}
            value={alphaThreshold}
          />
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
                  aspect={aspectWidth / aspectHeight}
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
                <div className="flex">
                  <input
                    className="border w-20 p-1"
                    type="number"
                    name="a-w"
                    id="a-w"
                    value={aspectWidth}
                    onChange={(e) => {
                      if (e.target.value !== null) {
                        setAspectWidth(Number(e.target.value));
                      }
                    }}
                  />
                  <input
                    className="border w-20 p-1"
                    type="number"
                    name="a-h"
                    id="a-h"
                    value={aspectHeight}
                    onChange={(e) => {
                      if (e.target.value !== null) {
                        setAspectHeight(Number(e.target.value));
                      }
                    }}
                  />
                </div>
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
                  <>
                    <p>
                      Crop the Image so it has less white spaces inside the
                      border
                    </p>
                    <div className="size-100 flex justify-center">
                      <img
                        src={outputImage}
                        alt="Background Removed"
                        className="border object-contain max-h-full max-w-full"
                      />
                    </div>
                  </>
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

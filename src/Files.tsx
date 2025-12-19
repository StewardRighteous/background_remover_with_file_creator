import { useState } from "react";
import addMmBorder from "./utils/addMmBorder";
import {
  fillImageWithColor,
  addBottomRedRectangleMm,
  fillOuterSilhouetteRed,
} from "./utils/silhouettefill";

type FilesProp = { image: string; height: number; width: number };

export default function Files(prop: FilesProp) {
  const [mainImage, setMainImage] = useState(prop.image);
  const [printingImage, setPrintingImage] = useState<string | null>(null);
  const [cuttingImage, setCuttingImage] = useState<string | null>(null);
  const [blueBoxHeight, setBlueBoxHeight] = useState(
    `calc(${prop.height}px + 14mm + 1pt)`
  );
  const [blueBoxWidth, setBlueBoxWidth] = useState(
    `calc(${prop.width}px + 14mm + 1pt)`
  );
  const [fileLoading, setFileLoading] = useState(false);

  async function changeBoxHeight() {
    const image = document.createElement("img");
    if (cuttingImage !== null) {
      image.src = cuttingImage;
      setBlueBoxHeight(`calc(${image.naturalHeight}px + 161px + 1pt)`);
      setBlueBoxWidth(`calc(${image.naturalWidth}px + 1pt + 16px)`);
    }
  }

  async function getImage() {
    setFileLoading(true);
    const add7mmBorder = await addMmBorder(mainImage);
    const add14mmBorder = await addMmBorder(add7mmBorder);
    const fill7mmBorderImage = await fillImageWithColor(add7mmBorder);
    const fill14mmBorderImage = await fillImageWithColor(add14mmBorder, "red");
    const addBottomRectangle =
      await addBottomRedRectangleMm(fill14mmBorderImage);
    const traceAndFillImage = await fillOuterSilhouetteRed(addBottomRectangle);
    setPrintingImage(fill7mmBorderImage);
    setCuttingImage(traceAndFillImage);
    await changeBoxHeight();
    setFileLoading(false);
  }

  return (
    <>
      <div className="options">
        <label htmlFor="image-change">
          Change Image (You can upload your file here, if you are not
          satisfied):
        </label>
        <input
          type="file"
          id="image-change"
          onChange={(e) => {
            if (e.target.files !== null) {
              setMainImage(URL.createObjectURL(e.target.files[0]));
            }
          }}
        />
        <button onClick={getImage} disabled={fileLoading}>
          {fileLoading ? "Loading..." : "Create Printing & Cutting Files"}
        </button>
        <button onClick={() => setMainImage(prop.image)}>
          Use Result Image
        </button>
        {fileLoading && (
          <p style={{ color: "red" }}>
            If blue box is small! Click "Create files" again
          </p>
        )}
      </div>

      <div className="files">
        <div
          className="background-removed"
          style={{
            width: blueBoxWidth,
            height: blueBoxHeight,
          }}
        >
          <img src={mainImage} alt="" />
        </div>
        <div
          className="printing-file"
          style={{
            width: blueBoxWidth,
            height: blueBoxHeight,
          }}
        >
          {printingImage && <img src={printingImage} alt="" />}
        </div>
        <div
          className="cutting-file"
          style={{
            width: blueBoxWidth,
            height: blueBoxHeight,
          }}
        >
          {cuttingImage && <img src={cuttingImage} alt="" />}
          <div
            className="bottom"
            style={{ width: `calc(${blueBoxWidth} - 1rem)` }}
          ></div>
        </div>
      </div>
    </>
  );
}

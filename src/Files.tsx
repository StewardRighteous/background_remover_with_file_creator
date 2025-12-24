import { useState, useRef } from "react";
import addMmBorder from "./utils/addMmBorder";
import {
  fillImageWithColor,
  addBottomRedRectangleMm,
  fillOuterSilhouetteRed,
} from "./utils/silhouettefill";
import resizeImageToInchHeight from "./utils/resizeImage";

type FilesProp = { image: string };

export default function Files(prop: FilesProp) {
  const [imageSize, setImageSize] = useState<3 | 7>(3);
  const [mainImage, setMainImage] = useState(prop.image);

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [printingImage, setPrintingImage] = useState<string | null>(null);
  const [cuttingImage, setCuttingImage] = useState<string | null>(null);

  const [fileLoading, setFileLoading] = useState(false);
  const [fileLoadingInstructions, setFileLoadingInstructions] = useState<
    | "Creating Main File"
    | "Creating Printing File"
    | "Creating Cutting File"
    | "Loading..."
  >("Loading...");

  const cuttingFileResultImage = useRef<HTMLImageElement | null>(null);
  const [cuttingFileResultWidth, setCuttingFileResultWidth] = useState(0);

  async function getImage() {
    setFileLoading(true);

    setFileLoadingInstructions("Creating Main File");
    const backgroundImage = await resizeImageToInchHeight(mainImage, imageSize);

    setFileLoadingInstructions("Creating Printing File");
    const printingImage = await fillImageWithColor(
      await addMmBorder(backgroundImage)
    );

    setFileLoadingInstructions("Creating Cutting File");
    const cuttingImage = await fillOuterSilhouetteRed(
      await addBottomRedRectangleMm(
        await fillImageWithColor(await addMmBorder(backgroundImage, 14), "red")
      )
    );

    setFileLoadingInstructions("Loading...");

    setBackgroundImage(backgroundImage);
    setPrintingImage(printingImage);
    setCuttingImage(cuttingImage);
    setFileLoading(false);
  }

  return (
    <>
      <div className="options">
        <label htmlFor="image-change">
          Change Image (You can upload your file here, if you are not satisfied
          with the background removal):
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
      </div>
      <div className="options">
        <label htmlFor="bottom-inch">Image Size:</label>
        <select
          name="bottom-inch"
          id="bottom-inch"
          onChange={(e) => {
            setImageSize(Number(e.target.value) == 3 ? 3 : 7);
            setBackgroundImage(null);
            setPrintingImage(null);
            setCuttingImage(null);
          }}
        >
          <option value={3}>3 Inch</option>
          <option value={7}>7 Inch</option>
        </select>
        <button onClick={getImage} disabled={fileLoading}>
          {fileLoading
            ? fileLoadingInstructions
            : "Create Printing & Cutting Files"}
        </button>
        <button onClick={() => setMainImage(prop.image)}>
          Use Result Image
        </button>
      </div>

      <div className="files">
        <div
          className="background-removed"
          style={{
            height: imageSize == 3 ? "7in" : "12in",
            width:
              cuttingFileResultImage !== null
                ? `calc(${cuttingFileResultWidth}px + 1pt + 7rem)`
                : imageSize == 3
                  ? "5in"
                  : "9in",
          }}
        >
          <div
            className="center-box"
            style={{
              height: `calc(${imageSize}in + 14mm)`,
              width: `calc(${imageSize}in + 14mm)`,
            }}
          >
            {backgroundImage && <img src={backgroundImage} alt="" />}
          </div>
        </div>
        <div
          className="printing-file"
          style={{
            height: imageSize == 3 ? "7in" : "12in",
            width:
              cuttingFileResultImage !== null
                ? `calc(${cuttingFileResultWidth}px + 1pt + 7rem)`
                : imageSize == 3
                  ? "5in"
                  : "9in",
          }}
        >
          <div
            className="center-box"
            style={{
              height: `calc(${imageSize}in + 14mm)`,
              width: `calc(${imageSize}in + 14mm)`,
            }}
          >
            {printingImage && <img src={printingImage} alt="" />}
          </div>
        </div>
        <div
          className="cutting-file"
          style={{
            height: imageSize == 3 ? "7in" : "12in",
            width:
              cuttingFileResultImage !== null
                ? `calc(${cuttingFileResultWidth}px + 1pt + 7rem)`
                : imageSize == 3
                  ? "5in"
                  : "9in",
          }}
        >
          <div
            className="center-box"
            style={{
              height: `calc(${imageSize}in + 14mm)`,
              width: `calc(${imageSize}in + 14mm)`,
            }}
          >
            {cuttingImage && (
              <img
                src={cuttingImage}
                alt=""
                ref={cuttingFileResultImage}
                onLoad={() => {
                  if (cuttingFileResultImage.current) {
                    setCuttingFileResultWidth(
                      cuttingFileResultImage.current.getBoundingClientRect()
                        .width
                    );
                  }
                }}
              />
            )}
          </div>
          {cuttingImage && (
            <div
              className="bottom"
              style={{
                height: `${imageSize == 3 ? 1 : 2.5}in`,
                width: `calc(${cuttingFileResultWidth}px + 5rem)`,
              }}
            ></div>
          )}
        </div>
      </div>
    </>
  );
}

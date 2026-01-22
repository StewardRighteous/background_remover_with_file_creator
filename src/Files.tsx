import { useState, useRef } from "react";
import addMmBorder from "./utils/addMmBorder";
import {
  fillImageWithColor,
  addBottomRedRectangleMm,
  fillOuterSilhouetteRed,
} from "./utils/silhouettefill";
import resizeImageToInchHeight from "./utils/resizeImage";
import { useReactToPrint } from "react-to-print";
// @ts-expect-error - ImageTracerJS does not have types
import ImageTracer from "imagetracerjs/imagetracer_v1.2.6.js";

type FilesProp = { image: string };

export default function Files(prop: FilesProp) {
  const [imageSize, setImageSize] = useState<3 | 7>(3);
  const [mainImage, setMainImage] = useState(prop.image);


  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [printingImageSVG, setPrintingImageSVG] = useState<string | null>(null);
  const [cuttingImageSVG, setCuttingImageSVG] = useState<string | null>(null);

  const [fileLoading, setFileLoading] = useState(false);
  const [fileLoadingInstructions, setFileLoadingInstructions] = useState<
    | "Creating Main File"
    | "Creating Printing File"
    | "Creating Cutting File"
    | "Adjusting Box Size"
    | "Loading..."
  >("Loading...");

  const [cuttingFileResultWidth, setCuttingFileResultWidth] = useState(0);

  const backgroundImageFile = useRef<HTMLDivElement | null>(null);
  const printingImageFile = useRef<HTMLDivElement | null>(null);
  const cuttingImageFile = useRef<HTMLDivElement | null>(null);
  const height = imageSize == 3 ? 5 : 11;
  const width = Math.ceil(cuttingFileResultWidth / 96) + 1;

  const printMainFile = useReactToPrint({
    contentRef: backgroundImageFile,
    documentTitle: "MainFile.pdf",
    pageStyle: `
      @page{
        size:  ${width}in ${height}in ;
      }
    `,
  });
  const printPrintFile = useReactToPrint({
    contentRef: printingImageFile,
    documentTitle: "PrintFile.pdf",
    pageStyle: `
      @page{
        size:  ${width}in ${height}in ;
      }
    `,
  });
  const printCuttingFile = useReactToPrint({
    contentRef: cuttingImageFile,
    documentTitle: "CuttingFile.pdf",
    pageStyle: `
      @page{
        size:  ${width}in ${height}in ;
      }
    `,
  });

  async function createFiles() {
    setFileLoading(true);

    setFileLoadingInstructions("Creating Main File");
    const backgroundImage = await resizeImageToInchHeight(mainImage, imageSize);

    setFileLoadingInstructions("Creating Printing File");
    const printingImage = await fillImageWithColor(
      await addMmBorder(backgroundImage),
    );

    setFileLoadingInstructions("Creating Cutting File");
    const cuttingImage = await fillOuterSilhouetteRed(
      await addBottomRedRectangleMm(
        await fillImageWithColor(await addMmBorder(backgroundImage, 14), "red"),
      ),
    );

    setFileLoadingInstructions("Adjusting Box Size");
    const imgForBoxWidth = new Image();
    imgForBoxWidth.src = cuttingImage;
    await imgForBoxWidth.decode();
    const boxWidth = imgForBoxWidth.width;
    setCuttingFileResultWidth(boxWidth);

    setFileLoadingInstructions("Loading...");
    setBackgroundImage(backgroundImage);
    ImageTracer.imageToSVG(printingImage, (svg: string) =>
      setPrintingImageSVG(svg),
    );
    ImageTracer.imageToSVG(cuttingImage, (svg: string) =>
      setCuttingImageSVG(svg),
    );
    setFileLoading(false);
  }

  return (
    <div className="grid justify-items-center">
      {/* Options Adjustment before creating files */}
      <div className="flex m-2 items-center justify-center gap-2">
        <div className="flex gap-1">
          <label htmlFor="bottom-inch">Size:</label>
          <select
            className="border"
            id="bottom-inch"
            onChange={(e) => {
              setImageSize(Number(e.target.value) == 3 ? 3 : 7);
              setBackgroundImage(null);
              setPrintingImageSVG(null);
              setCuttingImageSVG(null);
            }}
          >
            <option value={3}>3 Inch</option>
            <option value={7}>7 Inch</option>
          </select>
        </div>
        <button
          onClick={createFiles}
          disabled={fileLoading}
          className="border bg-blue-500 p-2 rounded text-white"
        >
          Create Printing & Cutting Files
        </button>
        <button onClick={() => setMainImage(prop.image)} className="border p-2">
          Use Result Image
        </button>
        <div className="flex">
          <label
            htmlFor="image-change"
            className="border rounded p-2 text-red-500"
          >
            Change Image
          </label>
          <input
            className="hidden"
            type="file"
            id="image-change"
            onChange={(e) => {
              if (e.target.files !== null) {
                setMainImage(URL.createObjectURL(e.target.files[0]));
              }
            }}
          />
        </div>
       
      </div>

      {/* Print files Buttons */}
      {!fileLoading && (
        <div className="flex m-2 items-center justify-center gap-2">
          {backgroundImage && (
            <button
              className="border p-2 rounded bg-indigo-600 text-white"
              onClick={printMainFile}
            >
              Print Main File
            </button>
          )}
          {printingImageSVG && (
            <button
              className="border p-2 rounded  text-indigo-600"
              onClick={printPrintFile}
            >
              Print Printing File
            </button>
          )}
          {cuttingImageSVG && (
            <button
              className="border p-2 rounded text-indigo-600"
              onClick={printCuttingFile}
            >
              Print Cutting File
            </button>
          )}
        </div>
      )}

      {fileLoading && (
        <p className="text-red-500">Loading: {fileLoadingInstructions}...</p>
      )}

      {/* Print Files */}
      {!fileLoading && (
        <div className="flex justify-center gap-3">
          {/* Main File */}
          <div
            className={`${imageSize == 3 ? "h-120" : "h-264"} border-[1pt] border-blue-700 flex justify-center p-1`}
            ref={backgroundImageFile}
            style={{
              width:
                cuttingFileResultWidth !== null
                  ? `${Math.ceil(cuttingFileResultWidth / 96) + 1}in`
                  : imageSize == 3
                    ? "5in"
                    : "9in",
            }}
          >
            <img
              src={mainImage}
              alt=""
              className={`${imageSize == 3 ? "size-72" : "size-168"} object-contain`}
            />
          </div>
          {/* Printing File */}
          <div
            className={`${imageSize == 3 ? "h-120" : "h-264"} border-[1pt] border-blue-700 flex justify-center p-1`}
            ref={printingImageFile}
            style={{
              width:
                cuttingFileResultWidth !== null
                  ? `${Math.ceil(cuttingFileResultWidth / 96) + 1}in`
                  : imageSize == 3
                    ? "5in"
                    : "9in",
            }}
          >
            {printingImageSVG && (
              <div
                dangerouslySetInnerHTML={{ __html: printingImageSVG }}
                className={`${imageSize == 3 ? "size-[calc(3in+7mm)] " : "size-[calc(7in+7mm)]"} object-contain flex justify-center`}
              ></div>
            )}
          </div>
          {/* Cutting File */}
          <div
            className={`${imageSize == 3 ? "h-120" : "h-264"} border-[1pt] border-blue-700 flex flex-col items-center p-1`}
            ref={cuttingImageFile}
            style={{
              width:
                cuttingFileResultWidth !== null
                  ? `${Math.ceil(cuttingFileResultWidth / 96) + 1}in`
                  : imageSize == 3
                    ? "5in"
                    : "9in",
            }}
          >
            {cuttingImageSVG && (
              <div
                className={`${imageSize == 3 ? "size-[calc(3in+14mm)] " : "size-[calc(7in+14mm)]"} object-contain flex justify-center p-1`}
                dangerouslySetInnerHTML={{ __html: cuttingImageSVG }}
              ></div>
            )}

            {cuttingImageSVG && (
              <div
                className={` ${imageSize == 3 ? "h-24" : "h-60"} rounded-[80px] m-4`}
                style={{
                  width: `calc(${cuttingFileResultWidth}px + 5rem)`,
                  backgroundColor: "red",
                }}
              ></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

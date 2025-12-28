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
      await addMmBorder(backgroundImage)
    );

    setFileLoadingInstructions("Creating Cutting File");
    const cuttingImage = await fillOuterSilhouetteRed(
      await addBottomRedRectangleMm(
        await fillImageWithColor(await addMmBorder(backgroundImage, 14), "red")
      )
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
      setPrintingImageSVG(svg)
    );
    ImageTracer.imageToSVG(cuttingImage, (svg: string) =>
      setCuttingImageSVG(svg)
    );
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
            setPrintingImageSVG(null);
            setCuttingImageSVG(null);
          }}
        >
          <option value={3}>3 Inch</option>
          <option value={7}>7 Inch</option>
        </select>
        <button onClick={createFiles} disabled={fileLoading}>
          {fileLoading
            ? fileLoadingInstructions
            : "Create Printing & Cutting Files"}
        </button>
        <button onClick={() => setMainImage(prop.image)}>
          Use Result Image
        </button>
      </div>
      <div className="options">
        {backgroundImage && (
          <button onClick={printMainFile}>Print Main File</button>
        )}
        {printingImageSVG && (
          <button onClick={printPrintFile}>Print Printing File</button>
        )}
        {cuttingImageSVG && (
          <button onClick={printCuttingFile}>Print Cutting File</button>
        )}
      </div>

      <div className="files">
        <div
          className="background-removed"
          ref={backgroundImageFile}
          style={{
            height: imageSize == 3 ? "5in" : "11in",
            width:
              cuttingFileResultWidth !== null
                ? `${Math.ceil(cuttingFileResultWidth / 96) + 1}in`
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
          ref={printingImageFile}
          style={{
            height: imageSize == 3 ? "5in" : "11in",
            width:
              cuttingFileResultWidth !== null
                ? `${Math.ceil(cuttingFileResultWidth / 96) + 1}in`
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
            {printingImageSVG && (
              <div dangerouslySetInnerHTML={{ __html: printingImageSVG }}></div>
            )}
          </div>
        </div>
        <div
          className="cutting-file"
          ref={cuttingImageFile}
          style={{
            height: imageSize == 3 ? "5in" : "11in",
            width:
              cuttingFileResultWidth !== null
                ? `${Math.ceil(cuttingFileResultWidth / 96) + 1}in`
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
            {cuttingImageSVG && (
              <div dangerouslySetInnerHTML={{ __html: cuttingImageSVG }}></div>
            )}
          </div>
          {cuttingImageSVG && (
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

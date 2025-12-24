import { useRef, useState } from "react";
import addMmBorder from "./utils/addMmBorder";
import {
  fillImageWithColor,
  addBottomRedRectangleMm,
  fillOuterSilhouetteRed,
} from "./utils/silhouettefill";
import { printDivAsPdfWithBorder } from "./utils/pdfGenerator";

type FilesProp = { image: string };

export default function Files(prop: FilesProp) {
  const [imageSize, setImageSize] = useState<3 | 7>(3);
  const [mainImage, setMainImage] = useState(prop.image);

  const [printingImage, setPrintingImage] = useState<string | null>(null);
  const [cuttingImage, setCuttingImage] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  const backgroundFile = useRef<HTMLDivElement>(null);
  const printingFile = useRef<HTMLDivElement>(null);
  const cuttingFile = useRef<HTMLDivElement>(null);

  async function getImage() {
    setFileLoading(true);

    const printingImage = await fillImageWithColor(
      await addMmBorder(mainImage)
    );
    const cuttingImage = await fillOuterSilhouetteRed(
      await addBottomRedRectangleMm(
        await fillImageWithColor(await addMmBorder(mainImage, 14), "red")
      )
    );

    setPrintingImage(printingImage);
    setCuttingImage(cuttingImage);
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
        <label htmlFor="bottom-inch">Image Size:</label>
        <select
          name="bottom-inch"
          id="bottom-inch"
          onChange={(e) => setImageSize(Number(e.target.value) == 3 ? 3 : 7)}
        >
          <option value={3}>3 Inch</option>
          <option value={7}>7 Inch</option>
        </select>
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
        {printingImage && cuttingImage && (
          <button
            onClick={() => {
              if (
                backgroundFile.current &&
                printingFile.current &&
                cuttingFile.current
              ) {
                printDivAsPdfWithBorder(
                  backgroundFile.current,
                  "background.pdf"
                );
                printDivAsPdfWithBorder(
                  printingFile.current,
                  "printing_file.pdf"
                );
                printDivAsPdfWithBorder(
                  cuttingFile.current,
                  "cutting_file.pdf"
                );
              }
            }}
          >
            Download Files
          </button>
        )}
      </div>

      <div className="files">
        <div className="background-removed" ref={backgroundFile}>
          <div className="center-box">
            <img src={mainImage} alt="" />
          </div>
        </div>
        <div className="printing-file" ref={printingFile}>
          {printingImage && (
            <div className="center-box">
              <img src={printingImage} alt="" />
            </div>
          )}
        </div>
        <div className="cutting-file" ref={cuttingFile}>
          {cuttingImage && (
            <div className="center-box">
              <img src={cuttingImage} alt="" />
            </div>
          )}
          <div
            className="bottom"
            style={{
              height: `${imageSize == 3 ? 1 : 2.5}in`,
            }}
          ></div>
        </div>
      </div>
    </>
  );
}

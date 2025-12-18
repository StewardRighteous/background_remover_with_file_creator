import { useState } from "react";
import addMmBorder from "./utils/addMmBorder";
import fillImageWithColor from "./utils/silhouettefill";

type FilesProp = { image: string };

export default function Files(prop: FilesProp) {
  const [printingImage, setPrintingImage] = useState<string | null>(null);
  const [cuttingImage, setCuttingImage] = useState<string | null>(null);

  async function getImage() {
    const add7mmBorder = await addMmBorder(prop.image);
    const add14mmBorder = await addMmBorder(add7mmBorder);
    const fill7mmBorderImage = await fillImageWithColor(add7mmBorder);
    const fill14mmBorderImage = await fillImageWithColor(add14mmBorder, "red");
    setPrintingImage(fill7mmBorderImage);
    setCuttingImage(fill14mmBorderImage);
  }

  return (
    <>
      <button onClick={getImage}>Create files</button>
      <div className="files">
        <div className="background-removed">
          <img src={prop.image} alt="" />
        </div>
        <div className="printing-file">
          {printingImage && <img src={printingImage} alt="" />}
        </div>
        <div className="cutting-file">
          {cuttingImage && <img src={cuttingImage} alt="" />}
          <div className="bottom"></div>
        </div>
      </div>
    </>
  );
}

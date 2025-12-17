import { useState } from "react";
import { addInchBorder } from "./utils/addInchBorder";

type FilesProp = { image: string };

export default function Files(prop: FilesProp) {
  const [borderImage, setBorderImage] = useState<string | null>(null);

  async function getImage() {
    const image = await addInchBorder(prop.image, 0.2);
    setBorderImage(image);
  }

  return (
    <>
      <button onClick={getImage}>show Border</button>
      <div className="files">
        <div className="background-removed">
          <img src={prop.image} alt="" />
        </div>
        <div className="printing-file">
          {borderImage && <img src={borderImage} alt="" />}
        </div>
        <div className="cutting-file">
          <img src={prop.image} alt="" />
          <div className="bottom"></div>
        </div>
      </div>
    </>
  );
}

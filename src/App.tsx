import { useState } from "react";
import createImage from "./BackgroundRemover";

export default function App() {

    const [image, setImage] = useState("");

    async function handleImage() {
        if (image == null) {
            return;
        }
        createImage(image);
    }

    return <>
        <label htmlFor="image">Enter Image:</label>
        <input type="file" id="image" onChange={(e) => {
            if (e.target.files !== null) {
                const imageFile = URL.createObjectURL(e.target.files[0]);
                setImage(imageFile)
            }
        }} />
        <button onClick={handleImage} >Download</button>
    </>
}
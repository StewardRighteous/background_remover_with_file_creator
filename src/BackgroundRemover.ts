import { pipeline } from "@huggingface/transformers";

export default async function createImage(imageUrl: string) {
    const segmenter = await pipeline('background-removal', 'Xenova/modnet');
    const output = await segmenter(imageUrl);
    return output[0].save('mask.png');
}
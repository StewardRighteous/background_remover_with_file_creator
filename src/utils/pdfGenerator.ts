import html2pdf from "html2pdf.js";

function pxToMm(px: number) {
  return (px * 25.4) / 96;
}

export async function printDivAsPdfWithBorder(
  element: HTMLElement,
  fileName = "output.pdf"
) {
  if (!element) throw new Error("Element not found");

  // Clone the element so UI is untouched
  const clone = element.cloneNode(true) as HTMLElement;

  // Wrapper that provides the border
  const wrapper = document.createElement("div");
  wrapper.style.display = "inline-block";
  wrapper.style.boxSizing = "border-box";
  wrapper.style.border = "1pt solid blue";
  wrapper.style.margin = "0";
  wrapper.style.padding = "0";
  wrapper.style.background = "transparent";

  wrapper.appendChild(clone);
  console.log(wrapper);

  // Measure wrapper size (including border)
  document.body.appendChild(wrapper);
  const rect = wrapper.getBoundingClientRect();
  document.body.removeChild(wrapper);

  const widthMm = pxToMm(rect.width);
  const heightMm = pxToMm(rect.height);

  await html2pdf()
    .from(wrapper)
    .set({
      margin: 0,
      filename: fileName,
      image: {
        type: "png",
        quality: 1,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      },
      jsPDF: {
        unit: "mm",
        format: [widthMm, heightMm],
        orientation: widthMm > heightMm ? "landscape" : "portrait",
      },
    })
    .save();
}

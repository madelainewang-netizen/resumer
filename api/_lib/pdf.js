import pdfjs from "pdfjs-dist/legacy/build/pdf.js";

const { getDocument } = pdfjs;

export async function extractPDFLayout(fileData) {
  const base64 = String(fileData).split(",", 2)[1];
  const bytes = new Uint8Array(Buffer.from(base64, "base64"));
  const document = await getDocument({ data: bytes, disableWorker: true }).promise;
  if (document.numPages > 5) {
    const error = new Error("目前最多支持 5 页 PDF");
    error.status = 400;
    throw error;
  }

  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = groupIntoLines(
      content.items
        .filter((item) => item.str?.trim())
        .map((item) => ({
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          size: Math.abs(item.transform[3]) || item.height || 10,
        })),
    );
    pages.push({
      page: pageNumber,
      width: Math.round(page.view[2]),
      height: Math.round(page.view[3]),
      lines,
    });
  }
  return pages;
}

function groupIntoLines(items) {
  const rows = [];
  for (const item of items.sort((a, b) => b.y - a.y || a.x - b.x)) {
    let row = rows.find((candidate) => Math.abs(candidate.y - item.y) <= 2.2);
    if (!row) {
      row = { y: item.y, items: [] };
      rows.push(row);
    }
    row.items.push(item);
  }
  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) => {
      const ordered = row.items.sort((a, b) => a.x - b.x);
      return {
        y: Math.round(row.y),
        fontSize: Number(
          (ordered.reduce((sum, item) => sum + item.size, 0) / ordered.length).toFixed(1),
        ),
        text: joinItems(ordered),
      };
    });
}

function joinItems(items) {
  let text = "";
  let previous = null;
  for (const item of items) {
    const gap = previous ? item.x - (previous.x + estimateWidth(previous)) : 0;
    const separator = previous && gap > Math.max(3, item.size * 0.3) ? "  " : "";
    text += `${separator}${item.text}`;
    previous = item;
  }
  return text.trim();
}

function estimateWidth(item) {
  return item.text.length * item.size * 0.55;
}

import { fitResumePdf } from "./fitResumePdf";

/** 生成简历 PDF Blob（含自动排满一页与孤行处理）。预览和下载共用这一个入口。 */
export async function generateResumePdf(profile, compactLevel) {
  const { blob } = await fitResumePdf(profile, compactLevel);
  return blob;
}

export function resumeFileName(profile) {
  const name = profile?.basics?.name?.trim() || "简历";
  const role = profile?.basics?.targetRole?.trim();
  return `${[name, role].filter(Boolean).join("-")}.pdf`.replace(/[\\/:*?"<>|]/g, "_");
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Safari 需要在点击后保留一会儿 URL，立即 revoke 会导致下载失败
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

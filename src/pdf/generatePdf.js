import { createElement } from "react";

/** 生成简历 PDF Blob。预览和下载共用这一个入口，保证"所见即所得"。 */
export async function generateResumePdf(profile, compactLevel) {
  const [{ pdf }, { default: ResumeDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./ResumeDocument"),
  ]);
  return pdf(createElement(ResumeDocument, { profile, compactLevel })).toBlob();
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

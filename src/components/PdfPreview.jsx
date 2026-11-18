import { useEffect, useRef, useState } from "react";
import { generateResumePdf } from "../pdf/generatePdf";

let pdfjsPromise;
function loadPdfjs() {
  pdfjsPromise ??= Promise.all([
    import("pdfjs-dist/build/pdf"),
    import("pdfjs-dist/build/pdf.worker.min.js?url"),
  ]).then(([pdfjs, worker]) => {
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    return pdfjs;
  });
  return pdfjsPromise;
}

/**
 * 真实 PDF 预览：渲染的就是即将下载的那份文件，页数也来自真实 PDF。
 * onReady 回传 { blob, pages }，下载时可以直接复用，不必重新生成。
 */
export default function PdfPreview({ profile, compactLevel, onReady, debounceMs = 450 }) {
  const containerRef = useRef(null);
  const [state, setState] = useState({ status: "loading", pages: 0, error: "" });

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, status: "loading" }));
    const timer = setTimeout(async () => {
      try {
        const [blob, pdfjs] = await Promise.all([
          generateResumePdf(profile, compactLevel),
          loadPdfjs(),
        ]);
        if (cancelled) return;
        const data = new Uint8Array(await blob.arrayBuffer());
        const doc = await pdfjs.getDocument({ data }).promise;
        const container = containerRef.current;
        if (cancelled || !container) return;

        const width = container.clientWidth || 480;
        const ratio = window.devicePixelRatio || 1;
        const canvases = [];
        for (let index = 1; index <= doc.numPages; index += 1) {
          const page = await doc.getPage(index);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * ratio });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.className = "block bg-white shadow-[0_3px_18px_rgba(0,0,0,0.08)]";
          await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
          canvases.push(canvas);
        }
        if (cancelled) return;
        container.replaceChildren(...canvases);
        setState({ status: "ready", pages: doc.numPages, error: "" });
        onReady?.({ blob, pages: doc.numPages });
      } catch (error) {
        if (!cancelled) setState({ status: "error", pages: 0, error: error.message });
      }
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // onReady 由父组件提供，不作为重新渲染的触发条件
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, compactLevel, debounceMs]);

  return (
    <div className="relative">
      <div ref={containerRef} className="space-y-3" style={{ minHeight: 200 }} />
      {state.status === "loading" ? (
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] text-neutral-500 shadow-sm">
            正在生成 PDF 预览…
          </span>
        </div>
      ) : null}
      {state.status === "error" ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          PDF 预览生成失败：{state.error}
        </p>
      ) : null}
    </div>
  );
}

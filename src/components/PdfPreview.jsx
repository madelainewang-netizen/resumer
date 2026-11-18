import { useEffect, useRef, useState } from "react";
import { fitResumePdf } from "../pdf/fitResumePdf";

/**
 * 真实 PDF 预览：渲染的就是即将下载的那份文件（已做自动排版与孤行处理），
 * onReady 回传 { blob, pages, level, orphans, remainingLines }，下载时直接复用。
 */
export default function PdfPreview({ profile, compactLevel, onReady, debounceMs = 450 }) {
  const containerRef = useRef(null);
  const [state, setState] = useState({ status: "loading", error: "" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", error: "" });
    const timer = setTimeout(async () => {
      try {
        const result = await fitResumePdf(profile, compactLevel);
        const container = containerRef.current;
        if (cancelled || !container) return;

        const width = container.clientWidth || 480;
        const ratio = window.devicePixelRatio || 1;
        const canvases = [];
        for (let index = 1; index <= result.doc.numPages; index += 1) {
          const page = await result.doc.getPage(index);
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
        setState({ status: "ready", error: "" });
        onReady?.(result);
      } catch (error) {
        if (!cancelled) setState({ status: "error", error: error.message });
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
            正在排版 PDF…
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

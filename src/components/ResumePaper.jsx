import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import { buildResumeModel } from "../resume/resumeModel";
import { A4, getResumeLayout, RESUME_COLORS } from "../utils/resumeLayout";

/**
 * 网页预览：在 595×842 的画布上按 1pt = 1px 排版（字体、字号、留白与 PDF 完全相同），
 * 再整体缩放到容器宽度。这样预览看到的换行和页数与导出的 PDF 基本一致。
 */
const ResumePaper = forwardRef(function ResumePaper(
  { profile, compactLevel = 0, className = "", onOverflowChange },
  ref,
) {
  const layout = getResumeLayout(compactLevel);
  const model = buildResumeModel(profile);
  const { header } = model;
  const frameRef = useRef(null);
  const pageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(A4.height);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / A4.width || 1);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page) return undefined;
    const measure = () => setContentHeight(Math.max(page.scrollHeight, A4.height));
    measure();
    // 字体加载完成后重新测量，避免用回退字体的高度判断分页
    document.fonts?.ready?.then(measure);
    return undefined;
  });

  const pages = Math.max(1, Math.ceil((contentHeight - 1) / A4.height));
  const overflowing = pages > 1;
  useLayoutEffect(() => {
    onOverflowChange?.(overflowing, pages);
  }, [overflowing, pages, onOverflowChange]);

  const bulletIndent = layout.bodySize * 0.95;

  return (
    <div ref={ref} className={className}>
      <div
        ref={frameRef}
        className="relative w-full overflow-hidden bg-white shadow-[0_3px_18px_rgba(0,0,0,0.08)]"
        style={{ height: contentHeight * scale }}
      >
        <div
          ref={pageRef}
          className="resume-paper absolute left-0 top-0 origin-top-left"
          style={{
            width: A4.width,
            minHeight: A4.height,
            transform: `scale(${scale})`,
            paddingTop: layout.paddingTop,
            paddingBottom: layout.paddingBottom,
            paddingLeft: layout.paddingHorizontal,
            paddingRight: layout.paddingHorizontal,
            fontSize: layout.bodySize,
            lineHeight: layout.lineHeight,
            color: RESUME_COLORS.text,
          }}
        >
          <header
            className="relative"
            style={
              header.photo
                ? { paddingRight: layout.photoReserve, minHeight: layout.headerMinHeight }
                : undefined
            }
          >
            <h1 style={{ fontSize: layout.nameSize, fontWeight: 700, lineHeight: 1.15 }}>
              {header.name}
            </h1>
            {header.role ? (
              <p style={{ fontSize: layout.roleSize, color: RESUME_COLORS.muted, marginTop: 3 }}>
                {header.role}
              </p>
            ) : null}
            {header.contacts.length ? (
              <p style={{ fontSize: layout.contactSize, color: RESUME_COLORS.muted, marginTop: 4 }}>
                {header.contacts.join("   |   ")}
              </p>
            ) : null}
            {header.photo ? (
              <img
                className="absolute right-0 top-0 object-cover"
                style={{ width: layout.photoWidth, height: layout.photoHeight, borderRadius: 2 }}
                src={header.photo}
                alt=""
              />
            ) : null}
          </header>

          {model.sections.map((section) => (
            <section key={section.key} style={{ marginTop: layout.sectionGap }}>
              <h2
                style={{
                  fontSize: layout.sectionTitleSize,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  borderBottom: `0.8px solid ${RESUME_COLORS.rule}`,
                  paddingBottom: 2,
                  marginBottom: layout.sectionTitleGap,
                }}
              >
                {section.title}
              </h2>
              {section.kind === "paragraph" ? (
                <p>{section.text}</p>
              ) : (
                section.entries.map((entry, index) => (
                  <div key={entry.id || index} style={{ marginTop: index ? layout.entryGap : 0 }}>
                    <div className="flex items-start justify-between">
                      <p className="min-w-0 flex-1" style={{ paddingRight: 10 }}>
                        {entry.title ? <strong style={{ fontWeight: 700 }}>{entry.title}</strong> : null}
                        {entry.title && entry.subtitle ? "   " : null}
                        {entry.subtitle}
                      </p>
                      {entry.meta ? (
                        <span
                          className="shrink-0 text-right"
                          style={{ color: RESUME_COLORS.muted, maxWidth: 190 }}
                        >
                          {entry.meta}
                        </span>
                      ) : null}
                    </div>
                    {entry.secondary ? (
                      <p style={{ color: RESUME_COLORS.muted, marginTop: 1 }}>{entry.secondary}</p>
                    ) : null}
                    {entry.bullets.map((bullet) => (
                      <div key={bullet.id} className="flex" style={{ marginTop: layout.bulletGap }}>
                        <span className="shrink-0" style={{ width: bulletIndent }}>•</span>
                        <p className="min-w-0 flex-1">
                          {bullet.lead ? <strong style={{ fontWeight: 700 }}>{bullet.lead}</strong> : null}
                          {bullet.text}
                        </p>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </section>
          ))}
        </div>
        {Array.from({ length: pages - 1 }, (_, index) => (
          <div
            key={index}
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-amber-500"
            style={{ top: A4.height * (index + 1) * scale }}
          >
            <span className="absolute right-1 top-0.5 rounded bg-amber-50 px-1.5 text-[10px] text-amber-700">
              第 {index + 1} 页结束
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default ResumePaper;

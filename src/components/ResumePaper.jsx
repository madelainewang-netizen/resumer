import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import { buildResumeModel } from "../resume/resumeModel";
import {
  A4,
  AUTO_LEVEL,
  getResumeLayout,
  LAYOUT_COUNT,
  normalizeCompactLevel,
  RESUME_COLORS,
  STANDARD_LEVEL,
} from "../utils/resumeLayout";

const C = RESUME_COLORS;

/**
 * 网页预览：在 595×842 的画布上按 1pt = 1px 排版（字体、字号、留白与 PDF 相同），
 * 再整体缩放到容器宽度。选择"自动"时，会在隐藏画布里量出每一档的高度，
 * 挑出能放进一页的最宽松档位，规则与 PDF 导出一致。
 */
const ResumePaper = forwardRef(function ResumePaper(
  { profile, compactLevel = AUTO_LEVEL, className = "", onOverflowChange },
  ref,
) {
  const requested = normalizeCompactLevel(compactLevel);
  const model = buildResumeModel(profile);
  const frameRef = useRef(null);
  const pageRef = useRef(null);
  const probeRefs = useRef([]);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(A4.height);
  const [autoLevel, setAutoLevel] = useState(STANDARD_LEVEL);
  const level = requested === AUTO_LEVEL ? autoLevel : requested;

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
    const measure = () => {
      if (requested === AUTO_LEVEL) {
        const heights = probeRefs.current.map((node) => node?.scrollHeight ?? Infinity);
        const fitting = heights.findIndex((height) => height <= A4.height + 0.5);
        setAutoLevel(fitting === -1 ? STANDARD_LEVEL : fitting);
      }
      const page = pageRef.current;
      if (page) setContentHeight(Math.max(page.scrollHeight, A4.height));
    };
    measure();
    // 字体加载完成后重新测量，避免用回退字体的高度判断分页
    document.fonts?.ready?.then(measure);
  });

  const pages = Math.max(1, Math.ceil((contentHeight - 1) / A4.height));
  const overflowing = pages > 1;
  useLayoutEffect(() => {
    onOverflowChange?.(overflowing, pages);
  }, [overflowing, pages, onOverflowChange]);

  return (
    <div ref={ref} className={className}>
      <div
        ref={frameRef}
        className="relative w-full overflow-hidden bg-white shadow-[0_3px_18px_rgba(0,0,0,0.08)]"
        style={{ height: contentHeight * scale }}
      >
        <PaperPage
          ref={pageRef}
          model={model}
          layout={getResumeLayout(level)}
          style={{ transform: `scale(${scale})` }}
        />
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
      {requested === AUTO_LEVEL ? (
        <div aria-hidden="true" style={{ position: "absolute", visibility: "hidden", height: 0, overflow: "hidden" }}>
          {Array.from({ length: LAYOUT_COUNT }, (_, index) => (
            <PaperPage
              key={index}
              ref={(node) => {
                probeRefs.current[index] = node;
              }}
              model={model}
              layout={getResumeLayout(index)}
              probe
            />
          ))}
        </div>
      ) : null}
    </div>
  );
});

const PaperPage = forwardRef(function PaperPage({ model, layout, style, probe = false }, ref) {
  const { header } = model;
  const photoReserve = header.photo ? layout.photoWidth + 14 : 0;
  const labelWidth = layout.labelSize * 4.2;

  return (
    <div
      ref={ref}
      className={`resume-paper ${probe ? "" : "absolute left-0 top-0 origin-top-left"}`}
      style={{
        width: A4.width,
        minHeight: probe ? undefined : A4.height,
        paddingTop: layout.paddingTop,
        paddingBottom: layout.paddingBottom,
        paddingLeft: layout.paddingHorizontal,
        paddingRight: layout.paddingHorizontal,
        fontSize: layout.bodySize,
        lineHeight: layout.lineHeight,
        color: C.text,
        position: probe ? "relative" : "absolute",
        ...style,
      }}
    >
      <header
        className="relative"
        style={{ paddingRight: photoReserve, minHeight: header.photo ? layout.photoHeight : undefined }}
      >
        <div className="flex items-end">
          <h1 style={{ fontSize: layout.nameSize, fontWeight: 700, lineHeight: 1.2 }}>{header.name}</h1>
          {header.role ? (
            <span
              style={{
                fontSize: layout.subNameSize,
                color: C.subName,
                lineHeight: 1.2,
                marginLeft: 8,
                marginBottom: 1.5,
              }}
            >
              {header.role}
            </span>
          ) : null}
        </div>
        {header.contacts.length ? (
          <div className="flex flex-wrap" style={{ marginTop: layout.headerGap }}>
            {header.contacts.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="flex"
                style={{ width: "50%", marginBottom: layout.contactGap }}
              >
                <span className="shrink-0" style={{ width: labelWidth, fontSize: layout.labelSize, color: C.label }}>
                  {item.label}
                </span>
                <span className="min-w-0 flex-1" style={{ paddingRight: 6 }}>
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noreferrer" style={{ color: C.text }}>
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        {header.photo ? (
          <img
            className="absolute right-0 top-0 object-cover"
            style={{ width: layout.photoWidth, height: layout.photoHeight }}
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
              lineHeight: 1.35,
              borderBottom: `0.75px solid ${C.rule}`,
              paddingBottom: 1,
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
                {entry.title || entry.subtitle || entry.meta ? (
                  <div className="flex items-start justify-between">
                    <p className="min-w-0 flex-1" style={{ paddingRight: 10 }}>
                      {entry.title ? <strong style={{ fontWeight: 700 }}>{entry.title}</strong> : null}
                      {entry.title && entry.subtitle ? entry.separator || " | " : null}
                      {entry.subtitle}
                    </p>
                    {entry.meta ? (
                      <span className="shrink-0 text-right" style={{ maxWidth: 200 }}>
                        {entry.meta}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {entry.secondary ? <p>{entry.secondary}</p> : null}
                {entry.bullets.map((bullet) => (
                  <div key={bullet.id} className="flex" style={{ marginTop: layout.bulletGap }}>
                    <span className="shrink-0" style={{ width: layout.bulletIndent, paddingLeft: layout.bulletDotOffset }}>
                      •
                    </span>
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

      {model.footer && !probe ? (
        <p
          className="absolute inset-x-0 text-center"
          style={{ bottom: 14, fontSize: layout.footerSize, lineHeight: 1, color: C.footer }}
        >
          {model.footer}
        </p>
      ) : null}
    </div>
  );
});

export default ResumePaper;

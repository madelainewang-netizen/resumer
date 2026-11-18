import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { buildResumeModel } from "../resume/resumeModel";
import { A4, getResumeLayout, RESUME_COLORS } from "../utils/resumeLayout";
import { hyphenateResumeWord } from "./textWrapping";

export const PDF_FONT_FAMILY = "Noto Sans SC";
export const PDF_FONT_FILES = {
  regular: "/fonts/NotoSansSC-Regular.ttf",
  bold: "/fonts/NotoSansSC-Bold.ttf",
};

// 必须使用静态字重文件：react-pdf 不支持可变字体，
// 之前的 VF 文件默认实例是 Thin(100)，导致整份 PDF 发灰发细、粗体全部失效。
// 两个字重的 PostScript 名必须不同，否则 react-pdf 会把它们当成同一个字体。
Font.register({
  family: PDF_FONT_FAMILY,
  fonts: [
    { src: PDF_FONT_FILES.regular, fontWeight: 400 },
    { src: PDF_FONT_FILES.bold, fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback(hyphenateResumeWord);

const C = RESUME_COLORS;

const base = StyleSheet.create({
  page: { fontFamily: PDF_FONT_FAMILY, fontWeight: 400, color: C.text },
  nameRow: { flexDirection: "row", alignItems: "flex-end" },
  name: { fontWeight: 700, lineHeight: 1.2 },
  subName: { color: C.subName, lineHeight: 1.2 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { flexDirection: "row", width: "50%" },
  label: { color: C.label },
  link: { color: C.text, textDecoration: "none" },
  photo: { position: "absolute", right: 0, top: 0, objectFit: "cover" },
  sectionTitle: { fontWeight: 700, borderBottomWidth: 0.75, borderBottomColor: C.rule, paddingBottom: 1 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  entryTitleWrap: { flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingRight: 10 },
  bold: { fontWeight: 700 },
  meta: { flexShrink: 0, textAlign: "right", maxWidth: 200 },
  bulletRow: { flexDirection: "row" },
  bulletText: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
  footer: { position: "absolute", left: 0, right: 0, textAlign: "center", color: C.footer },
});

/**
 * @param spacing 段落 key → 字距微调（pt），用于消除孤行，见 fitResumePdf
 */
export default function ResumeDocument({ profile, compactLevel = 2, spacing = {} }) {
  const layout = getResumeLayout(compactLevel);
  const model = buildResumeModel(profile);
  const { header } = model;
  const squeeze = (key) => (spacing[key] ? { letterSpacing: spacing[key] } : null);
  const photoReserve = header.photo ? layout.photoWidth + 14 : 0;
  const labelWidth = layout.labelSize * 4.2;

  return (
    <Document
      title={`${header.name} - 简历`}
      author={header.name}
      language={model.language === "zh" ? "zh-CN" : "en"}
    >
      <Page
        size="A4"
        style={[
          base.page,
          {
            paddingTop: layout.paddingTop,
            paddingBottom: layout.paddingBottom,
            paddingHorizontal: layout.paddingHorizontal,
            fontSize: layout.bodySize,
            lineHeight: layout.lineHeight,
          },
        ]}
      >
        <View style={{ paddingRight: photoReserve, minHeight: header.photo ? layout.photoHeight : 0 }}>
          <View style={base.nameRow}>
            <Text style={[base.name, { fontSize: layout.nameSize }]}>{header.name}</Text>
            {header.role ? (
              <Text style={[base.subName, { fontSize: layout.subNameSize, marginLeft: 8, marginBottom: 1.5 }]}>
                {header.role}
              </Text>
            ) : null}
          </View>
          {header.contacts.length ? (
            <View style={[base.grid, { marginTop: layout.headerGap }]}>
              {header.contacts.map((item, index) => (
                <View key={`${item.label}-${index}`} style={[base.cell, { marginBottom: layout.contactGap }]}>
                  <Text style={[base.label, { width: labelWidth, fontSize: layout.labelSize }]}>{item.label}</Text>
                  <Text style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingRight: 6 }}>
                    {item.href ? (
                      <Link src={item.href} style={base.link}>
                        {item.value}
                      </Link>
                    ) : (
                      item.value
                    )}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {header.photo ? (
            <Image
              src={header.photo}
              style={[base.photo, { width: layout.photoWidth, height: layout.photoHeight }]}
            />
          ) : null}
        </View>

        {model.sections.map((section) => (
          <View key={section.key} style={{ marginTop: layout.sectionGap }}>
            <Text
              style={[
                base.sectionTitle,
                { fontSize: layout.sectionTitleSize, marginBottom: layout.sectionTitleGap, lineHeight: 1.35 },
              ]}
              minPresenceAhead={layout.bodySize * 3}
            >
              {section.title}
            </Text>
            {section.kind === "paragraph" ? (
              <Text style={squeeze(section.key)}>{section.text}</Text>
            ) : (
              section.entries.map((entry, index) => (
                <View key={entry.id || index} style={{ marginTop: index ? layout.entryGap : 0 }}>
                  {entry.title || entry.subtitle || entry.meta ? (
                  <View style={base.entryHeader} wrap={false} minPresenceAhead={layout.bodySize * 2}>
                    <View style={base.entryTitleWrap}>
                      <Text style={squeeze(`${entry.id}:head`)}>
                        {entry.title ? <Text style={base.bold}>{entry.title}</Text> : null}
                        {entry.title && entry.subtitle ? entry.separator || " | " : null}
                        {entry.subtitle || null}
                      </Text>
                    </View>
                    {entry.meta ? <Text style={base.meta}>{entry.meta}</Text> : null}
                  </View>
                  ) : null}
                  {entry.secondary ? (
                    <Text style={squeeze(`${entry.id}:secondary`)}>{entry.secondary}</Text>
                  ) : null}
                  {entry.bullets.map((bullet) => (
                    <View
                      key={bullet.id}
                      style={[base.bulletRow, { marginTop: layout.bulletGap }]}
                      wrap={false}
                    >
                      <Text style={{ width: layout.bulletIndent, paddingLeft: layout.bulletDotOffset }}>•</Text>
                      <Text style={[base.bulletText, squeeze(bullet.id)]}>
                        {bullet.lead ? <Text style={base.bold}>{bullet.lead}</Text> : null}
                        {bullet.text}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        ))}

        {model.footer ? (
          <Text fixed style={[base.footer, { bottom: 14, fontSize: layout.footerSize, lineHeight: 1 }]}>
            {model.footer}
          </Text>
        ) : null}
      </Page>
    </Document>
  );
}

export const PDF_PAGE_SIZE = A4;

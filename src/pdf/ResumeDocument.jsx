import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
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
Font.register({
  family: PDF_FONT_FAMILY,
  fonts: [
    { src: PDF_FONT_FILES.regular, fontWeight: 400 },
    { src: PDF_FONT_FILES.bold, fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback(hyphenateResumeWord);

const { text, muted, rule } = RESUME_COLORS;

const base = StyleSheet.create({
  page: { fontFamily: PDF_FONT_FAMILY, fontWeight: 400, color: text },
  name: { fontWeight: 700, lineHeight: 1.15 },
  role: { color: muted, marginTop: 3 },
  contacts: { flexDirection: "row", flexWrap: "wrap", color: muted, marginTop: 4 },
  photo: { position: "absolute", right: 0, top: 0, objectFit: "cover", borderRadius: 2 },
  sectionTitle: {
    fontWeight: 700,
    borderBottomWidth: 0.8,
    borderBottomColor: rule,
    paddingBottom: 2,
    letterSpacing: 0.5,
  },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  entryTitleWrap: { flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingRight: 10 },
  entryTitle: { fontWeight: 700 },
  entrySubtitle: { fontWeight: 400 },
  meta: { color: muted, flexShrink: 0, textAlign: "right", maxWidth: 190 },
  secondary: { color: muted, marginTop: 1 },
  bulletRow: { flexDirection: "row" },
  bulletText: { flexGrow: 1, flexShrink: 1, flexBasis: 0 },
  lead: { fontWeight: 700 },
});

export default function ResumeDocument({ profile, compactLevel = 0 }) {
  const layout = getResumeLayout(compactLevel);
  const model = buildResumeModel(profile);
  const { header } = model;
  const bulletIndent = layout.bodySize * 0.95;

  return (
    <Document title={`${header.name} - 简历`} author={header.name} language={model.language === "zh" ? "zh-CN" : "en"}>
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
        <View
          style={
            header.photo
              ? { paddingRight: layout.photoReserve, minHeight: layout.headerMinHeight }
              : null
          }
        >
          <Text style={[base.name, { fontSize: layout.nameSize }]}>{header.name}</Text>
          {header.role ? (
            <Text style={[base.role, { fontSize: layout.roleSize }]}>{header.role}</Text>
          ) : null}
          {header.contacts.length ? (
            <Text style={[base.contacts, { fontSize: layout.contactSize }]}>
              {header.contacts.join("   |   ")}
            </Text>
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
                { fontSize: layout.sectionTitleSize, marginBottom: layout.sectionTitleGap },
              ]}
              minPresenceAhead={layout.bodySize * 3}
            >
              {section.title}
            </Text>
            {section.kind === "paragraph" ? (
              <Text>{section.text}</Text>
            ) : (
              section.entries.map((entry, index) => (
                <View key={entry.id || index} style={{ marginTop: index ? layout.entryGap : 0 }}>
                  <View style={base.entryHeader} wrap={false} minPresenceAhead={layout.bodySize * 2}>
                    <View style={base.entryTitleWrap}>
                      <Text>
                        {entry.title ? <Text style={base.entryTitle}>{entry.title}</Text> : null}
                        {entry.title && entry.subtitle ? "   " : null}
                        {entry.subtitle ? <Text style={base.entrySubtitle}>{entry.subtitle}</Text> : null}
                      </Text>
                    </View>
                    {entry.meta ? <Text style={base.meta}>{entry.meta}</Text> : null}
                  </View>
                  {entry.secondary ? <Text style={base.secondary}>{entry.secondary}</Text> : null}
                  {entry.bullets.map((bullet) => (
                    <View
                      key={bullet.id}
                      style={[base.bulletRow, { marginTop: layout.bulletGap }]}
                      wrap={false}
                    >
                      <Text style={{ width: bulletIndent }}>•</Text>
                      <Text style={base.bulletText}>
                        {bullet.lead ? <Text style={base.lead}>{bullet.lead}</Text> : null}
                        {bullet.text}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
}

export const PDF_PAGE_SIZE = A4;

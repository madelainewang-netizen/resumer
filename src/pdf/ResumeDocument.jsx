import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { splitBulletSummary } from "../utils/bulletSummary";
import { hasVisibleEntryContent } from "../utils/resumeVisibility";
import { getResumeLayout } from "../utils/resumeLayout";

Font.registerHyphenationCallback((word) => [word]);
Font.register({
  family: "Noto Sans SC",
  fonts: [
    { src: "/fonts/NotoSansSC-VF.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSansSC-VF.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 26,
    paddingHorizontal: 32,
    fontFamily: "Noto Sans SC",
    fontSize: 8.6,
    lineHeight: 1.4,
    color: "#202020",
  },
  header: {
    position: "relative",
    paddingBottom: 2,
  },
  name: { fontSize: 19, fontWeight: 700, lineHeight: 1.1 },
  role: { marginTop: 3, fontSize: 9.5, fontWeight: 700, color: "#444444" },
  contact: { marginTop: 3, color: "#666666" },
  photo: {
    position: "absolute",
    right: 0,
    top: 0,
    objectFit: "cover",
  },
  section: { marginTop: 5 },
  sectionTitle: {
    borderBottomWidth: 0.6,
    borderBottomColor: "#d4d4d4",
    paddingBottom: 2,
    marginBottom: 3,
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  entry: { marginBottom: 4 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  entryTitle: { fontWeight: 700, flexGrow: 1 },
  meta: { color: "#666666" },
  secondary: { marginTop: 1, color: "#555555" },
  bulletRow: { flexDirection: "row", marginTop: 2, paddingLeft: 4 },
  bullet: { width: 8 },
  bulletText: { flex: 1, color: "#404040" },
});

export default function ResumeDocument({ profile, compactLevel = 0 }) {
  const layout = getResumeLayout(compactLevel);
  const density = {
    page: {
      paddingTop: layout.paddingTop,
      paddingBottom: layout.paddingBottom,
      paddingHorizontal: layout.paddingHorizontal,
      fontSize: layout.bodySize,
      lineHeight: layout.lineHeight,
    },
    section: { marginTop: layout.sectionGap },
    sectionTitle:
      compactLevel === 3
        ? { paddingBottom: 0.5, marginBottom: 1.5, fontSize: 7.2 }
        : null,
    entry: { marginBottom: layout.entryGap },
    bulletRow:
      compactLevel === 3
        ? { marginTop: 1, paddingLeft: 2 }
        : null,
    header:
      compactLevel === 3
        ? { paddingBottom: 0 }
        : null,
    name:
      compactLevel === 3
        ? { fontSize: 16, lineHeight: 1.05 }
        : null,
    role:
      compactLevel === 3
        ? { marginTop: 1.5, fontSize: 8.3 }
        : null,
    contact:
      compactLevel === 3
        ? { marginTop: 1.5, fontSize: 7.6 }
        : null,
    photo: {
      width: layout.photoWidth * 0.81,
      height: layout.photoHeight * 0.81,
    },
    headerWithPhoto: {
      paddingRight: layout.photoReserve * 0.72,
      minHeight: layout.headerMinHeight * 0.84,
    },
  };
  const order = profile.sectionOrder?.length
    ? profile.sectionOrder
    : ["education", "experience", "projects", "customSections", "skills"];
  const renderSection = (sectionKey) => {
    if (sectionKey === "education" && profile.education.length) {
      const education = profile.education.filter((item) =>
        [item.school, item.degree, item.field, item.startDate, item.endDate, item.details]
          .some((value) => String(value || "").trim()),
      );
      if (!education.length) return null;
      return (
        <PDFSection key="education" title="Education" density={density}>
          {education.map((item) => (
            <PDFEntry
              key={item.id}
              title={[
                [item.degree, item.field].filter(Boolean).join(" · "),
                item.school,
              ].filter(Boolean).join("  |  ")}
              meta={[item.startDate, item.endDate].filter(Boolean).join(" - ")}
              secondary={item.details}
              bullets={[]}
              density={density}
            />
          ))}
        </PDFSection>
      );
    }
    if (sectionKey === "experience" && profile.experience.length) {
      return (
        <PDFSection
          key="experience"
          title="Experience"
          density={density}
        >
          {profile.experience.map((item) => (
            <PDFEntry
              key={item.id}
              title={`${item.role}  |  ${item.company}`}
              meta={[
                item.location,
                [item.startDate, item.endDate].filter(Boolean).join(" - "),
              ].filter(Boolean).join("  ·  ")}
              bullets={item.bullets}
              density={density}
            />
          ))}
        </PDFSection>
      );
    }
    if (sectionKey === "projects" && profile.projects.length) {
      return (
        <PDFSection key="projects" title="Projects" density={density}>
          {profile.projects.map((item) => (
            <PDFEntry
              key={item.id}
              title={`${item.name}  |  ${[item.role, item.stack].filter(Boolean).join(" · ")}`}
              meta={[item.startDate, item.endDate].filter(Boolean).join(" - ")}
              bullets={item.bullets}
              density={density}
            />
          ))}
        </PDFSection>
      );
    }
    const visibleSkills = profile.skills.filter((item) => item.trim());
    if (sectionKey === "skills" && visibleSkills.length) {
      return (
        <PDFSection key="skills" title="Skills" density={density}>
          <Text>{visibleSkills.join("  ·  ")}</Text>
        </PDFSection>
      );
    }
    const allCustomSections = profile.customSections || [];
    const sections =
      sectionKey === "customSections"
        ? allCustomSections
        : allCustomSections.filter((section) => section.id === sectionKey);
    return sections.map((section) => {
      const items = section.items.filter((item) =>
        hasVisibleEntryContent({
          title: item.title,
          organization: item.subtitle,
          meta: item.date,
          location: item.location,
          bullets: item.bullets,
        }),
      );
      if (!items.length) return null;
      return (
      <PDFSection key={section.id} title={section.title} density={density}>
        {items.map((item) => (
          <PDFEntry
            key={item.id}
            title={[item.title, item.subtitle].filter(Boolean).join("  |  ")}
            meta={[item.location, item.date].filter(Boolean).join("  ·  ")}
            bullets={item.bullets}
            density={density}
          />
        ))}
      </PDFSection>
      );
    });
  };

  return (
    <Document title={`${profile.basics.name || "Resumer"} - 简历`}>
      <Page size="A4" style={[styles.page, density.page]} wrap={false}>
        <View
          style={[
            styles.header,
            density.header,
            profile.basics.photo ? density.headerWithPhoto : null,
          ]}
        >
          <Text style={[styles.name, density.name]}>{profile.basics.name || "你的姓名"}</Text>
          <Text style={[styles.role, density.role]}>{profile.basics.targetRole || "目标岗位"}</Text>
          <Text style={[styles.contact, density.contact]}>
            {[
              profile.basics.email,
              profile.basics.phone,
              profile.basics.extraContact,
              profile.basics.links,
            ]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
          {profile.basics.photo ? (
            <Image src={profile.basics.photo} style={[styles.photo, density.photo]} />
          ) : null}
        </View>

        {profile.basics.summary ? (
          <PDFSection title="Professional Summary" density={density}>
            <Text>{profile.basics.summary}</Text>
          </PDFSection>
        ) : null}

        {order.map(renderSection)}
      </Page>
    </Document>
  );
}

function PDFSection({ title, children, density }) {
  return (
    <View style={[styles.section, density?.section]}>
      {title ? (
        <Text style={[styles.sectionTitle, density?.sectionTitle]}>{title}</Text>
      ) : null}
      {children}
    </View>
  );
}

function PDFEntry({ title, meta, secondary, bullets, density }) {
  if (
    !hasVisibleEntryContent({
      title,
      meta,
      secondary,
      bullets,
    })
  ) {
    return null;
  }
  return (
    <View style={[styles.entry, density?.entry]}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryTitle}>{title}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      {secondary ? <Text style={styles.secondary}>{secondary}</Text> : null}
      {bullets
        .filter((bullet) => bullet.text)
        .map((bullet) => {
          const { summary, body } = splitBulletSummary(bullet.text);
          return (
            <View key={bullet.id} style={[styles.bulletRow, density?.bulletRow]}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                {summary ? <Text style={{ fontWeight: 700 }}>{summary}</Text> : null}
                {summary ? body : bullet.text}
              </Text>
            </View>
          );
        })}
    </View>
  );
}

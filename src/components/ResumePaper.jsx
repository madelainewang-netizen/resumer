import { forwardRef } from "react";
import { splitBulletSummary } from "../utils/bulletSummary";
import { hasVisibleEntryContent } from "../utils/resumeVisibility";
import { getResumeLayout } from "../utils/resumeLayout";

const ResumePaper = forwardRef(function ResumePaper(
  { profile, compactLevel = 0, className = "" },
  ref,
) {
  const layout = getResumeLayout(compactLevel);
  const {
    scale,
    bodySize,
    lineHeight,
    paddingTop,
    paddingBottom,
    paddingHorizontal,
    sectionGap,
    entryGap,
    photoWidth,
    photoHeight,
    photoReserve,
    headerMinHeight,
  } = layout;
  const flowCV = profile.source?.template === "flowcv";
  const sectionOrder = profile.sectionOrder?.length
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
        <ResumeSection key="education" title="教育经历" compact={compactLevel === 3}>
          <div style={{ display: "grid", gap: entryGap * 0.8 }}>
            {education.map((item) => (
              <div key={item.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-semibold">
                    {[item.degree, item.field].filter(Boolean).join("，")}
                    {item.school ? (
                      <span className="ml-2 font-normal text-neutral-700">{item.school}</span>
                    ) : null}
                  </p>
                  <span className="shrink-0 text-neutral-500">
                    {[item.startDate, item.endDate].filter(Boolean).join(" – ")}
                  </span>
                </div>
                {item.details ? <p className="mt-1 text-neutral-600">{item.details}</p> : null}
              </div>
            ))}
          </div>
        </ResumeSection>
      );
    }

    if (sectionKey === "experience" && profile.experience.length) {
      return (
        <ResumeSection
          key="experience"
          title={flowCV ? "实习经历" : "工作经历"}
          compact={compactLevel === 3}
        >
          <div style={{ display: "grid", gap: entryGap }}>
            {profile.experience.map((item) => (
              <ResumeEntry
                key={item.id}
                title={item.role}
                organization={item.company}
                meta={[item.startDate, item.endDate].filter(Boolean).join(" – ")}
                location={item.location}
                bullets={item.bullets}
              />
            ))}
          </div>
        </ResumeSection>
      );
    }

    if (sectionKey === "projects" && profile.projects.length) {
      return (
        <ResumeSection key="projects" title="项目经历" compact={compactLevel === 3}>
          <div style={{ display: "grid", gap: entryGap }}>
            {profile.projects.map((item) => (
              <ResumeEntry
                key={item.id}
                title={item.name}
                organization={[item.role, item.stack].filter(Boolean).join(" · ")}
                meta={[item.startDate, item.endDate].filter(Boolean).join(" – ")}
                bullets={item.bullets}
              />
            ))}
          </div>
        </ResumeSection>
      );
    }

    const visibleSkills = profile.skills.filter((item) => item.trim());
    if (sectionKey === "skills" && visibleSkills.length) {
      return (
        <ResumeSection
          key="skills"
          title={flowCV ? "其他" : "专业技能"}
          compact={compactLevel === 3}
        >
          <p className="text-neutral-700">{visibleSkills.join(" · ")}</p>
        </ResumeSection>
      );
    }

    const allCustomSections = profile.customSections || [];
    const customSections =
      sectionKey === "customSections"
        ? allCustomSections
        : allCustomSections.filter((section) => section.id === sectionKey);
    const visibleSections = customSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          hasVisibleEntryContent({
            title: item.title,
            organization: item.subtitle,
            meta: item.date,
            location: item.location,
            bullets: item.bullets,
          }),
        ),
      }))
      .filter((section) => section.items.length);
    if (visibleSections.length) {
      return visibleSections.map((section) => (
        <ResumeSection
          key={section.id}
          title={section.title}
          compact={compactLevel === 3}
        >
          <div style={{ display: "grid", gap: entryGap * 0.9 }}>
            {section.items.map((item) => (
              <ResumeEntry
                key={item.id}
                title={item.title}
                organization={item.subtitle}
                meta={item.date}
                location={item.location}
                bullets={item.bullets}
              />
            ))}
          </div>
        </ResumeSection>
      ));
    }
    return null;
  };

  return (
    <div
      ref={ref}
      className={`relative aspect-[210/297] w-full overflow-visible bg-white text-[#202020] shadow-[0_3px_18px_rgba(0,0,0,0.08)] ${className}`}
      style={{
        paddingTop,
        paddingBottom,
        paddingLeft: paddingHorizontal,
        paddingRight: paddingHorizontal,
        fontSize: bodySize,
        lineHeight,
      }}
    >
      <header
        className="relative pb-1"
        style={
          profile.basics.photo
            ? { paddingRight: photoReserve, minHeight: headerMinHeight }
            : undefined
        }
      >
        <h1 className="font-semibold tracking-[-0.04em]" style={{ fontSize: 24 * scale, lineHeight: 1.1 }}>
          {profile.basics.name || "你的姓名"}
        </h1>
        {!flowCV || profile.basics.targetRole ? (
          <p className="mt-1 font-medium text-neutral-700" style={{ fontSize: 11 * scale }}>
            {profile.basics.targetRole || "目标岗位"}
          </p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-neutral-500">
          {[
            profile.basics.email,
            profile.basics.phone,
            profile.basics.extraContact,
            profile.basics.links,
          ].filter(Boolean).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        {profile.basics.photo ? (
          <img
            className="absolute right-0 top-0 rounded-sm object-cover"
            style={{ width: photoWidth, height: photoHeight }}
            src={profile.basics.photo}
            alt=""
          />
        ) : null}
      </header>

      <div className={compactLevel === 3 ? "pt-0.5" : "pt-1"} style={{ display: "grid", gap: sectionGap }}>
        {profile.basics.summary ? (
          <ResumeSection title="职业摘要" compact={compactLevel === 3}>
            <p className="text-neutral-700">{profile.basics.summary}</p>
          </ResumeSection>
        ) : null}

        {sectionOrder.map(renderSection)}
      </div>
    </div>
  );
});

function ResumeSection({ title, children, compact = false }) {
  return (
    <section>
      {title ? (
        <h2
          className={`border-b border-neutral-200 text-[0.92em] font-bold uppercase tracking-[0.12em] ${
            compact ? "mb-0.5 pb-0" : "mb-1 pb-0.5"
          }`}
        >
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}

function ResumeEntry({ title, organization, meta, location, bullets }) {
  if (!hasVisibleEntryContent({ title, organization, meta, location, bullets })) {
    return null;
  }
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-semibold">
          {title}
          {organization ? (
            <span className="ml-2 font-normal text-neutral-600">{organization}</span>
          ) : null}
        </p>
        <span className="shrink-0 text-neutral-500">
          {[location, meta].filter(Boolean).join(" · ")}
        </span>
      </div>
      <ul className="mt-1 space-y-1 pl-3.5">
        {bullets
          .filter((bullet) => bullet.text)
          .map((bullet) => {
            const { summary, body } = splitBulletSummary(bullet.text);
            return (
              <li key={bullet.id} className="list-disc pl-0.5 text-neutral-700">
                {summary ? (
                  <span className="font-semibold text-neutral-900">{summary}</span>
                ) : null}
                {summary ? body : bullet.text}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export default ResumePaper;

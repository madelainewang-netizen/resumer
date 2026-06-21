import { useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  ChevronUp,
  CircleUserRound,
  FileUp,
  FolderKanban,
  GraduationCap,
  ImagePlus,
  PenLine,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { createId, sampleProfile } from "../data/defaults";
import { prepareProfilePhoto } from "../utils/image";
import ResumeImport from "./ResumeImport";
import { EmptyState, NextAction, ProgressBar, SectionHeader } from "./ui";

function TextField({ label, value, onChange, placeholder, className = "" }) {
  return (
    <label className={className}>
      <span className="field-label">{label}</span>
      <input
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function BulletEditor({ bullets, onChange }) {
  const update = (id, text) =>
    onChange(bullets.map((bullet) => (bullet.id === id ? { ...bullet, text } : bullet)));
  const remove = (id) => onChange(bullets.filter((bullet) => bullet.id !== id));

  return (
    <div>
      <span className="field-label">经历描述</span>
      <div className="space-y-2">
        {bullets.map((bullet) => (
          <div key={bullet.id} className="flex items-start gap-2">
            <span className="mt-[13px] h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
            <textarea
              className="field min-h-[72px] resize-y leading-5"
              value={bullet.text}
              onChange={(event) => update(bullet.id, event.target.value)}
              placeholder="写下你的职责、行动和真实结果"
            />
            <button
              className="mt-1 rounded-md p-2 text-neutral-300 hover:bg-red-50 hover:text-red-600"
              onClick={() => remove(bullet.id)}
              aria-label="删除经历描述"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        className="ghost-button mt-2"
        onClick={() => onChange([...bullets, { id: createId("bullet"), text: "" }])}
      >
        <Plus size={13} />
        添加一条描述
      </button>
    </div>
  );
}

function ItemCard({ title, subtitle, children, onDelete, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex min-h-14 items-center gap-3 px-4">
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => setOpen(!open)}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-800">{title}</p>
            <p className="mt-0.5 truncate text-[11px] text-neutral-400">{subtitle}</p>
          </div>
          {open ? (
            <ChevronUp size={15} className="text-neutral-400" />
          ) : (
            <ChevronDown size={15} className="text-neutral-400" />
          )}
        </button>
        <button
          className="rounded-md p-2 text-neutral-300 hover:bg-red-50 hover:text-red-600"
          onClick={onDelete}
          aria-label="删除条目"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {open ? <div className="border-t border-neutral-100 p-4">{children}</div> : null}
    </div>
  );
}

export default function ProfileForm({
  profile,
  setProfile,
  onProfileReplaced,
  onNext,
  notify,
  demoMode = false,
}) {
  const [entryMode, setEntryMode] = useState(profile.source?.mode || "manual");

  const updateBasics = (key, value) =>
    setProfile((current) => ({
      ...current,
      basics: { ...current.basics, [key]: value },
    }));

  const updateList = (key, id, patch) =>
    setProfile((current) => ({
      ...current,
      [key]: current[key].map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));

  const removeItem = (key, id) =>
    setProfile((current) => ({
      ...current,
      [key]: current[key].filter((item) => item.id !== id),
    }));

  const addExperience = () =>
    setProfile((current) => ({
      ...current,
      experience: [
        ...current.experience,
        {
          id: createId("exp"),
          company: "",
          role: "",
          startDate: "",
          endDate: "",
          location: "",
          bullets: [{ id: createId("bullet"), text: "" }],
        },
      ],
    }));

  const addProject = () =>
    setProfile((current) => ({
      ...current,
      projects: [
        ...current.projects,
        {
          id: createId("project"),
          name: "",
          role: "",
          stack: "",
          startDate: "",
          endDate: "",
          bullets: [{ id: createId("bullet"), text: "" }],
        },
      ],
    }));

  const addEducation = () =>
    setProfile((current) => ({
      ...current,
      education: [
        ...current.education,
        {
          id: createId("edu"),
          school: "",
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
          details: "",
        },
      ],
    }));

  const filledBasics = Object.values(profile.basics).filter(Boolean).length;
  const completeness = Math.min(
    100,
    Math.round(
      (filledBasics / Object.keys(profile.basics).length) * 40 +
        Math.min(profile.experience.length, 2) * 18 +
        Math.min(profile.projects.length, 1) * 10 +
        Math.min(profile.education.length, 1) * 8 +
        Math.min(profile.skills.length / 5, 1) * 6,
    ),
  );

  return (
    <div className={`mx-auto px-8 py-9 ${!demoMode && entryMode === "upload" ? "max-w-[1240px]" : "max-w-[950px]"}`}>
      <SectionHeader
        eyebrow="Step 01"
        title="建立你的简历档案"
        description="先记录真实经历和成果。AI 只会帮助你重新组织表达，不会替你编造经验。"
        action={
          <button
            className="secondary-button"
            onClick={() => {
              setProfile(structuredClone(sampleProfile));
              onProfileReplaced();
              notify("已载入示例资料", "你可以直接体验完整流程，也可以随时覆盖内容。");
            }}
          >
            <Sparkles size={14} />
            载入示例
          </button>
        }
      />

      {demoMode ? (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
          当前为脱敏示例数据。你可以自由编辑体验，刷新页面后会重置。
        </div>
      ) : (
        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-2">
          <button
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
              entryMode === "upload" ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"
            }`}
            onClick={() => setEntryMode("upload")}
          >
            <FileUp size={17} />
            <div>
              <p className="text-xs font-semibold">上传已有简历</p>
              <p className={`mt-1 text-[10px] ${entryMode === "upload" ? "text-neutral-300" : "text-neutral-400"}`}>
                解析 PDF，保留内容顺序与模板特征
              </p>
            </div>
          </button>
          <button
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-left transition ${
              entryMode === "manual" ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"
            }`}
            onClick={() => {
              setEntryMode("manual");
              setProfile((current) => ({
                ...current,
                source: { ...current.source, mode: "manual" },
                sectionOrder: current.source?.mode === "upload"
                  ? current.sectionOrder
                  : ["education", "experience", "projects", "customSections", "skills"],
              }));
            }}
          >
            <PenLine size={17} />
            <div>
              <p className="text-xs font-semibold">手动填写资料</p>
              <p className={`mt-1 text-[10px] ${entryMode === "manual" ? "text-neutral-300" : "text-neutral-400"}`}>
                从空白档案开始，教育经历默认置顶
              </p>
            </div>
          </button>
        </div>
      )}

      {!demoMode && entryMode === "upload" ? (
        <ResumeImport
          notify={notify}
          onImported={(imported) => {
            setProfile((current) => ({
              ...imported,
              basics: {
                ...imported.basics,
                photo: current.basics.photo || "",
              },
              source: {
                mode: "upload",
                fileName: imported.source?.fileName || "",
                template: imported.source?.template || "flowcv",
              },
            }));
            onProfileReplaced();
            setEntryMode("manual");
            notify("已导入为可编辑档案", "照片请在基本信息中单独上传。");
          }}
        />
      ) : (
        <>
      <div className="mb-5 rounded-xl border border-neutral-200 bg-white p-4">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-800">资料完整度</span>
            <span className="text-xs font-semibold text-neutral-500">{completeness}%</span>
          </div>
          <span className="text-[11px] text-neutral-400">内容越具体，定制建议越可靠</span>
        </div>
        <ProgressBar value={completeness} />
      </div>

      <section className="panel mb-4 p-5">
        <div className="mb-5 flex items-start justify-between gap-5">
          <div className="flex items-center gap-2">
            <CircleUserRound size={17} />
            <div>
              <h2 className="text-sm font-semibold">基本信息</h2>
              <p className="mt-1 text-[10px] text-neutral-400">照片仅保存在当前浏览器和导出的 PDF 中</p>
            </div>
          </div>
          <PhotoUploader
            photo={profile.basics.photo}
            onChange={(value) => updateBasics("photo", value)}
            notify={notify}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="姓名"
            value={profile.basics.name}
            onChange={(value) => updateBasics("name", value)}
            placeholder="你的姓名"
          />
          <TextField
            label="目标岗位"
            value={profile.basics.targetRole}
            onChange={(value) => updateBasics("targetRole", value)}
            placeholder="例如：产品经理"
          />
          <TextField
            label="邮箱"
            value={profile.basics.email}
            onChange={(value) => updateBasics("email", value)}
            placeholder="name@example.com"
          />
          <TextField
            label="电话"
            value={profile.basics.phone}
            onChange={(value) => updateBasics("phone", value)}
            placeholder="+86 138 0000 0000"
          />
          <TextField
            label="所在城市"
            value={profile.basics.location}
            onChange={(value) => updateBasics("location", value)}
            placeholder="上海"
          />
          <TextField
            label="个人链接"
            value={profile.basics.links}
            onChange={(value) => updateBasics("links", value)}
            placeholder="LinkedIn / GitHub / 作品集"
          />
          <TextField
            label="其他联系方式"
            value={profile.basics.extraContact}
            onChange={(value) => updateBasics("extraContact", value)}
            placeholder="微信 / 个人主页 / 其他"
            className="col-span-2"
          />
          <label className="col-span-2">
            <span className="field-label">职业摘要</span>
            <textarea
              className="field min-h-[92px] resize-y leading-6"
              value={profile.basics.summary}
              onChange={(event) => updateBasics("summary", event.target.value)}
              placeholder="用 2–3 句话概括经验方向、核心能力与目标"
            />
          </label>
        </div>
      </section>

      <EducationEditor
        profile={profile}
        updateList={updateList}
        removeItem={removeItem}
        addEducation={addEducation}
      />

      <SectionListHeader
        icon={BriefcaseBusiness}
        title="工作经历"
        description="优先写清你做了什么、如何做以及真实结果"
        onAdd={addExperience}
      />
      <div className="mb-5 space-y-3">
        {profile.experience.length ? (
          profile.experience.map((item) => (
            <ItemCard
              key={item.id}
              title={item.role || "未命名岗位"}
              subtitle={[item.company, item.startDate, item.endDate].filter(Boolean).join(" · ") || "补充公司与时间"}
              onDelete={() => removeItem("experience", item.id)}
            >
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="公司"
                  value={item.company}
                  onChange={(value) => updateList("experience", item.id, { company: value })}
                  placeholder="公司名称"
                />
                <TextField
                  label="岗位"
                  value={item.role}
                  onChange={(value) => updateList("experience", item.id, { role: value })}
                  placeholder="你的岗位"
                />
                <TextField
                  label="开始时间"
                  value={item.startDate}
                  onChange={(value) => updateList("experience", item.id, { startDate: value })}
                  placeholder="2023.06"
                />
                <TextField
                  label="结束时间"
                  value={item.endDate}
                  onChange={(value) => updateList("experience", item.id, { endDate: value })}
                  placeholder="至今"
                />
                <TextField
                  label="地点"
                  value={item.location}
                  onChange={(value) => updateList("experience", item.id, { location: value })}
                  placeholder="上海"
                  className="col-span-2"
                />
                <div className="col-span-2">
                  <BulletEditor
                    bullets={item.bullets}
                    onChange={(bullets) => updateList("experience", item.id, { bullets })}
                  />
                </div>
              </div>
            </ItemCard>
          ))
        ) : (
          <EmptyState
            icon={BriefcaseBusiness}
            title="还没有工作经历"
            description="实习、全职和自由职业经历都可以添加。"
            action={
              <button className="secondary-button" onClick={addExperience}>
                <Plus size={14} /> 添加工作经历
              </button>
            }
          />
        )}
      </div>

      <SectionListHeader
        icon={FolderKanban}
        title="项目经历"
        description="展示能证明目标岗位能力的代表项目"
        onAdd={addProject}
      />
      <div className="mb-5 space-y-3">
        {profile.projects.length ? (
          profile.projects.map((item) => (
            <ItemCard
              key={item.id}
              title={item.name || "未命名项目"}
              subtitle={[item.role, item.stack].filter(Boolean).join(" · ") || "补充角色与技术栈"}
              onDelete={() => removeItem("projects", item.id)}
            >
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="项目名称"
                  value={item.name}
                  onChange={(value) => updateList("projects", item.id, { name: value })}
                  placeholder="项目名称"
                />
                <TextField
                  label="你的角色"
                  value={item.role}
                  onChange={(value) => updateList("projects", item.id, { role: value })}
                  placeholder="项目负责人"
                />
                <TextField
                  label="技术栈 / 工具"
                  value={item.stack}
                  onChange={(value) => updateList("projects", item.id, { stack: value })}
                  placeholder="Figma、SQL、React"
                  className="col-span-2"
                />
                <TextField
                  label="开始时间"
                  value={item.startDate}
                  onChange={(value) => updateList("projects", item.id, { startDate: value })}
                  placeholder="2023.03"
                />
                <TextField
                  label="结束时间"
                  value={item.endDate}
                  onChange={(value) => updateList("projects", item.id, { endDate: value })}
                  placeholder="2023.08"
                />
                <div className="col-span-2">
                  <BulletEditor
                    bullets={item.bullets}
                    onChange={(bullets) => updateList("projects", item.id, { bullets })}
                  />
                </div>
              </div>
            </ItemCard>
          ))
        ) : (
          <EmptyState
            icon={FolderKanban}
            title="还没有项目经历"
            description="课程项目、个人项目和公司内部项目都可以成为能力证据。"
            action={
              <button className="secondary-button" onClick={addProject}>
                <Plus size={14} /> 添加项目
              </button>
            }
          />
        )}
      </div>

      <CustomSectionsEditor profile={profile} setProfile={setProfile} />

      <section className="panel p-5">
        <h2 className="mb-2 text-sm font-semibold">技能标签</h2>
        <p className="mb-4 text-xs text-neutral-400">使用逗号分隔，保留你真正掌握的技能。</p>
        <input
          className="field"
          value={profile.skills.join("，")}
          onChange={(event) =>
            setProfile((current) => ({
              ...current,
              skills: event.target.value
                .split(/[,，]/)
                .map((skill) => skill.trim())
                .filter(Boolean),
            }))
          }
          placeholder="用户研究，SQL，Figma，项目管理"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] text-neutral-600"
            >
              {skill}
            </span>
          ))}
        </div>
      </section>

      <NextAction
        label="继续分析 JD"
        hint="资料会自动保存在当前浏览器中"
        onClick={onNext}
        disabled={!profile.basics.name || !profile.experience.length}
      />
        </>
      )}
    </div>
  );
}

function PhotoUploader({ photo, onChange, notify }) {
  const handleFile = async (file) => {
    try {
      onChange(await prepareProfilePhoto(file));
      notify("照片已添加", "已自动裁切并压缩为证件照比例。");
    } catch (error) {
      notify("照片上传失败", error.message, "error");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="h-20 w-16 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
        {photo ? (
          <img className="h-full w-full object-cover" src={photo} alt="简历照片预览" />
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-300">
            <CircleUserRound size={22} />
          </div>
        )}
      </div>
      <div>
        <label className="secondary-button cursor-pointer">
          <ImagePlus size={14} />
          {photo ? "更换照片" : "上传照片"}
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
        {photo ? (
          <button className="ghost-button mt-1 block text-red-600" onClick={() => onChange("")}>
            删除照片
          </button>
        ) : (
          <p className="mt-1.5 text-[9px] text-neutral-400">JPG / PNG · 自动裁切 3:4</p>
        )}
      </div>
    </div>
  );
}

function EducationEditor({ profile, updateList, removeItem, addEducation }) {
  return (
    <>
      <SectionListHeader
        icon={GraduationCap}
        title="教育经历"
        description="手动填写时默认显示在简历正文最前面"
        onAdd={addEducation}
      />
      <div className="mb-5 space-y-3">
        {profile.education.length ? profile.education.map((item) => (
          <ItemCard
            key={item.id}
            title={item.school || "未命名学校"}
            subtitle={[item.degree, item.field].filter(Boolean).join(" · ") || "补充学历与专业"}
            onDelete={() => removeItem("education", item.id)}
          >
            <div className="grid grid-cols-2 gap-4">
              <TextField label="学校" value={item.school} onChange={(value) => updateList("education", item.id, { school: value })} placeholder="学校名称" />
              <TextField label="学历" value={item.degree} onChange={(value) => updateList("education", item.id, { degree: value })} placeholder="学士" />
              <TextField label="专业" value={item.field} onChange={(value) => updateList("education", item.id, { field: value })} placeholder="专业名称" />
              <TextField label="补充信息" value={item.details} onChange={(value) => updateList("education", item.id, { details: value })} placeholder="GPA、奖项或相关课程" />
              <TextField label="开始时间" value={item.startDate} onChange={(value) => updateList("education", item.id, { startDate: value })} placeholder="2017.09" />
              <TextField label="结束时间" value={item.endDate} onChange={(value) => updateList("education", item.id, { endDate: value })} placeholder="2021.06" />
            </div>
          </ItemCard>
        )) : (
          <EmptyState
            icon={GraduationCap}
            title="还没有教育经历"
            description="添加学校、专业、课程、荣誉和时间信息。"
            action={<button className="secondary-button" onClick={addEducation}><Plus size={14} /> 添加教育经历</button>}
          />
        )}
      </div>
    </>
  );
}

function CustomSectionsEditor({ profile, setProfile }) {
  if (!profile.customSections?.length) return null;
  const updateSection = (sectionId, patch) =>
    setProfile((current) => ({
      ...current,
      customSections: current.customSections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    }));

  return (
    <div className="mt-6">
      <p className="mb-3 text-xs font-semibold text-neutral-500">从原简历保留的其他内容</p>
      <div className="space-y-3">
        {profile.customSections.map((section) => (
          <ItemCard
            key={section.id}
            title={section.title}
            subtitle={`${section.items.length} 条内容 · 保留原始顺序`}
            onDelete={() =>
              setProfile((current) => ({
                ...current,
                customSections: current.customSections.filter((item) => item.id !== section.id),
              }))
            }
          >
            <TextField
              label="区块标题"
              value={section.title}
              onChange={(title) => updateSection(section.id, { title })}
              placeholder="内容创作实践"
            />
            <div className="mt-4 space-y-3">
              {section.items.map((item) => (
                <div key={item.id} className="rounded-lg bg-neutral-50 p-3">
                  <TextField
                    label="条目标题"
                    value={item.title}
                    onChange={(title) =>
                      updateSection(section.id, {
                        items: section.items.map((entry) =>
                          entry.id === item.id ? { ...entry, title } : entry,
                        ),
                      })
                    }
                    placeholder="条目标题"
                  />
                  <div className="mt-3">
                    <BulletEditor
                      bullets={item.bullets}
                      onChange={(bullets) =>
                        updateSection(section.id, {
                          items: section.items.map((entry) =>
                            entry.id === item.id ? { ...entry, bullets } : entry,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </ItemCard>
        ))}
      </div>
    </div>
  );
}

function SectionListHeader({ icon: Icon, title, description, onAdd }) {
  return (
    <div className="mb-3 mt-6 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <Icon size={17} />
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
          <p className="mt-0.5 text-[11px] text-neutral-400">{description}</p>
        </div>
      </div>
      <button className="secondary-button" onClick={onAdd}>
        <Plus size={14} />
        添加
      </button>
    </div>
  );
}

import { BriefcaseBusiness, FolderKanban, GraduationCap, PenLine } from "lucide-react";
import ResumePaper from "./ResumePaper";
import { SectionHeader } from "./ui";

export default function ProfileOverview({ profile, onEdit }) {
  return (
    <div className="mx-auto max-w-[1120px] px-8 py-9">
      <SectionHeader
        title="简历档案"
        description="这是所有岗位定制版本的事实来源。更新这里的内容不会自动覆盖已保存的历史版本。"
        action={
          <button className="primary-button" onClick={onEdit}>
            <PenLine size={14} />
            编辑档案
          </button>
        }
      />
      <div className="grid grid-cols-[1fr_400px] gap-5">
        <div className="space-y-4">
          <div className="panel p-5">
            <p className="text-lg font-semibold">{profile.basics.name || "未命名简历"}</p>
            <p className="mt-1 text-sm text-neutral-500">
              {profile.basics.targetRole || "未设置目标岗位"}
            </p>
            <p className="mt-4 text-xs leading-6 text-neutral-500">
              {profile.basics.summary || "尚未填写职业摘要。"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <CountCard icon={BriefcaseBusiness} label="工作经历" count={profile.experience.length} />
            <CountCard icon={FolderKanban} label="项目经历" count={profile.projects.length} />
            <CountCard icon={GraduationCap} label="教育经历" count={profile.education.length} />
          </div>
          <div className="panel p-5">
            <h2 className="text-sm font-semibold">技能</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} className="rounded-full border border-neutral-200 px-2.5 py-1 text-[11px]">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
        <ResumePaper profile={profile} compactLevel={2} />
      </div>
    </div>
  );
}

function CountCard({ icon: Icon, label, count }) {
  return (
    <div className="panel p-4">
      <Icon size={15} className="text-neutral-400" />
      <p className="mt-4 text-xl font-semibold">{count}</p>
      <p className="mt-1 text-[10px] text-neutral-400">{label}</p>
    </div>
  );
}

import { Clock3, FileText, RotateCcw } from "lucide-react";
import { EmptyState, SectionHeader } from "./ui";

export default function VersionsView({ versions, onRestore }) {
  return (
    <div className="mx-auto max-w-[960px] px-8 py-9">
      <SectionHeader
        title="历史版本"
        description="每个版本都保存当时的 JD、分析结果和完整简历快照。最多保留最近 20 个版本。"
      />
      {versions.length ? (
        <div className="panel overflow-hidden">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className={`flex items-center gap-4 px-5 py-4 ${
                index ? "border-t border-neutral-100" : ""
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                <FileText size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {version.position || "未命名岗位"}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-neutral-400">
                  <Clock3 size={11} />
                  {new Date(version.createdAt).toLocaleString("zh-CN")}
                </div>
              </div>
              <button className="secondary-button" onClick={() => onRestore(version)}>
                <RotateCcw size={13} />
                恢复版本
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="还没有历史版本"
          description="完成一次简历优化后，在导出页面保存版本。"
        />
      )}
    </div>
  );
}

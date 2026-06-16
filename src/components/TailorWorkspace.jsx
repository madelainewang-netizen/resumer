import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Scissors,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  WandSparkles,
} from "lucide-react";
import { condenseResume, tailorResume } from "../services/resumerApi";
import {
  applyCondenseRecommendation,
  indexCondenseRecommendations,
  removeSummary,
  removeResumeItem,
  removeSkill,
  removeCustomItem,
  removeCustomSection,
  recommendationKey,
  restoreRemovedBullet,
  restoreResumeItem,
  restoreSkill,
  restoreCustomItem,
  restoreCustomSection,
  restoreSummary,
} from "../utils/condenseResume";
import { profileSignature } from "../utils/profileSignature";
import { updateTailoredBullet } from "../utils/tailorProfile";
import ResumePaper from "./ResumePaper";
import { LoadingButton, SectionHeader, StatusPill } from "./ui";

export default function TailorWorkspace({
  profile,
  analysis,
  tailoredProfile,
  setTailoredProfile,
  tailoredSourceSignature,
  setTailoredSourceSignature,
  workspaceState,
  setWorkspaceState,
  onNext,
  loading,
  setLoading,
  progress,
  setProgress,
  notify,
}) {
  const accepted = workspaceState.accepted || {};
  const condensePlan = workspaceState.condensePlan || null;
  const condenseApplied = workspaceState.condenseApplied || {};
  const removedBullets = workspaceState.removedBullets || {};
  const removedItems = workspaceState.removedItems || {};
  const removedSummary = workspaceState.removedSummary || "";
  const removedSkills = workspaceState.removedSkills || {};
  const removedCustomItems = workspaceState.removedCustomItems || {};
  const removedCustomSections = workspaceState.removedCustomSections || {};
  const compactLevel = workspaceState.compactLevel || 0;
  const [condenseLoading, setCondenseLoading] = useState(false);
  const [condenseProgress, setCondenseProgress] = useState("");
  const setWorkspaceSlice = (key, fallback, value) =>
    setWorkspaceState((current) => ({
      ...current,
      [key]:
        typeof value === "function"
          ? value(current?.[key] ?? fallback)
          : value,
    }));
  const setAccepted = (value) => setWorkspaceSlice("accepted", {}, value);
  const setCondensePlan = (value) => setWorkspaceSlice("condensePlan", null, value);
  const setCondenseApplied = (value) =>
    setWorkspaceSlice("condenseApplied", {}, value);
  const setRemovedBullets = (value) =>
    setWorkspaceSlice("removedBullets", {}, value);
  const setRemovedItems = (value) => setWorkspaceSlice("removedItems", {}, value);
  const setRemovedSummary = (value) =>
    setWorkspaceSlice("removedSummary", "", value);
  const setRemovedSkills = (value) =>
    setWorkspaceSlice("removedSkills", {}, value);
  const setRemovedCustomItems = (value) =>
    setWorkspaceSlice("removedCustomItems", {}, value);
  const setRemovedCustomSections = (value) =>
    setWorkspaceSlice("removedCustomSections", {}, value);
  const setCompactLevel = (value) =>
    setWorkspaceSlice("compactLevel", 0, value);
  const currentProfileSignature = profileSignature(profile);
  const isTailoredCurrent =
    Boolean(tailoredProfile) &&
    tailoredSourceSignature === currentProfileSignature;
  const displayProfile = isTailoredCurrent ? tailoredProfile : profile;

  const generate = async () => {
    if (!analysis) {
      notify("请先分析 JD", "AI 需要岗位分析结果才能定制简历。", "error");
      return;
    }
    setLoading(true);
    setProgress("正在比对岗位要求与简历证据");
    try {
      const result = await tailorResume(profile, analysis, setProgress);
      setTailoredProfile(result);
      setTailoredSourceSignature(currentProfileSignature);
      setWorkspaceState({ compactLevel });
      notify("定制建议已生成", "请逐条确认内容，尤其是数字、职责和技能。");
    } catch (error) {
      notify("生成失败", error.message, "error");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const allBullets = useMemo(
    () => [
      ...(isTailoredCurrent ? tailoredProfile?.experience || [] : []).flatMap(
        (item) => item.bullets,
      ),
      ...(isTailoredCurrent ? tailoredProfile?.projects || [] : []).flatMap(
        (item) => item.bullets,
      ),
      ...(isTailoredCurrent ? tailoredProfile?.customSections || [] : []).flatMap(
        (section) => section.items.flatMap((item) => item.bullets),
      ),
    ],
    [isTailoredCurrent, tailoredProfile],
  );
  const changedBullets = allBullets.filter(
    (bullet) => bullet.originalText && bullet.originalText !== bullet.text,
  );
  const acceptedCount = changedBullets.filter((bullet) => accepted[bullet.id]).length;
  const condenseIndex = useMemo(
    () => indexCondenseRecommendations(condensePlan?.recommendations),
    [condensePlan],
  );

  const runCondenseAnalysis = async () => {
    setCondenseLoading(true);
    setCondenseProgress("正在检查重复和低相关内容");
    try {
      const result = await condenseResume(displayProfile, analysis, setCondenseProgress);
      setCondensePlan(result);
      setCondenseApplied({});
      setRemovedBullets({});
      setRemovedItems({});
      setRemovedSummary("");
      setRemovedSkills({});
      setRemovedCustomItems({});
      setRemovedCustomSections({});
      notify("精简建议已生成", "内容不会自动删除，请逐条确认后再采用。");
    } catch (error) {
      notify("精简分析失败", error.message, "error");
    } finally {
      setCondenseLoading(false);
      setCondenseProgress("");
    }
  };

  const updateBullet = (section, itemId, bulletId, patch, sectionId) => {
    setTailoredProfile((current) =>
      updateTailoredBullet(current, {
        section,
        sectionId,
        itemId,
        bulletId,
        patch,
      }),
    );
  };

  const acceptBullet = (bulletId) =>
    setAccepted((current) => ({ ...current, [bulletId]: true }));

  const acceptAll = () =>
    setAccepted(
      Object.fromEntries(changedBullets.map((bullet) => [bullet.id, true])),
    );

  const applyCondense = (recommendation) => {
    const key = recommendationKey(recommendation);
    if (recommendation.action === "remove") {
      const item = tailoredProfile[recommendation.section].find(
        (entry) => entry.id === recommendation.itemId,
      );
      const index = item?.bullets.findIndex(
        (bullet) => bullet.id === recommendation.bulletId,
      );
      const bullet = index >= 0 ? item.bullets[index] : null;
      if (bullet) {
        setRemovedBullets((current) => ({
          ...current,
          [key]: {
            section: recommendation.section,
            itemId: recommendation.itemId,
            bullet,
            index,
            recommendation,
          },
        }));
      }
    }
    setTailoredProfile((current) =>
      applyCondenseRecommendation(current, recommendation),
    );
    setCondenseApplied((current) => ({
      ...current,
      [key]: recommendation.action === "remove" ? "removed" : "condensed",
    }));
  };

  const keepCondenseOriginal = (recommendation) =>
    setCondenseApplied((current) => ({
      ...current,
      [recommendationKey(recommendation)]: "kept",
    }));

  const undoRemove = (key) => {
    const removed = removedBullets[key];
    if (!removed) return;
    setTailoredProfile((current) => restoreRemovedBullet(current, removed));
    setRemovedBullets((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
    setCondenseApplied((current) => ({ ...current, [key]: "kept" }));
  };

  const removeItem = (section, itemId) => {
    const result = removeResumeItem(tailoredProfile, section, itemId);
    if (!result.removed) return;
    const key = `${section}:${itemId}`;
    setTailoredProfile(result.profile);
    setRemovedItems((current) => ({ ...current, [key]: result.removed }));
  };

  const undoRemoveItem = (key) => {
    const removed = removedItems[key];
    if (!removed) return;
    setTailoredProfile((current) => restoreResumeItem(current, removed));
    setRemovedItems((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const deleteSummary = () => {
    const result = removeSummary(tailoredProfile);
    if (!result.summary) return;
    setTailoredProfile(result.profile);
    setRemovedSummary(result.summary);
  };

  const undoDeleteSummary = () => {
    setTailoredProfile((current) => restoreSummary(current, removedSummary));
    setRemovedSummary("");
  };

  const deleteSkill = (index) => {
    const result = removeSkill(tailoredProfile, index);
    if (!result.removed) return;
    const key = `skill:${result.removed.index}:${result.removed.value}`;
    setTailoredProfile(result.profile);
    setRemovedSkills((current) => ({ ...current, [key]: result.removed }));
  };

  const undoDeleteSkill = (key) => {
    setTailoredProfile((current) => restoreSkill(current, removedSkills[key]));
    setRemovedSkills((current) => omitKey(current, key));
  };

  const deleteCustomItem = (sectionId, itemId) => {
    const result = removeCustomItem(tailoredProfile, sectionId, itemId);
    if (!result.removed) return;
    const key = `custom-item:${sectionId}:${itemId}`;
    setTailoredProfile(result.profile);
    setRemovedCustomItems((current) => ({ ...current, [key]: result.removed }));
  };

  const undoDeleteCustomItem = (key) => {
    setTailoredProfile((current) =>
      restoreCustomItem(current, removedCustomItems[key]),
    );
    setRemovedCustomItems((current) => omitKey(current, key));
  };

  const deleteCustomSection = (sectionId) => {
    const result = removeCustomSection(tailoredProfile, sectionId);
    if (!result.removed) return;
    const key = `custom-section:${sectionId}`;
    setTailoredProfile(result.profile);
    setRemovedCustomSections((current) => ({
      ...current,
      [key]: result.removed,
    }));
  };

  const undoDeleteCustomSection = (key) => {
    setTailoredProfile((current) =>
      restoreCustomSection(current, removedCustomSections[key]),
    );
    setRemovedCustomSections((current) => omitKey(current, key));
  };

  return (
    <div className="px-7 py-8">
      <div className="mx-auto max-w-[1400px]">
        <SectionHeader
          eyebrow="Step 03"
          title="逐条确认优化建议"
          description="AI 建议不会自动覆盖原文。请确认每一项仍然准确，并补充真实的规模、方法和结果。"
          action={
            isTailoredCurrent ? (
              <button className="secondary-button" onClick={generate} disabled={loading}>
                <RotateCcw size={14} />
                重新生成
              </button>
            ) : null
          }
        />

        {!isTailoredCurrent && !loading ? (
          <div className="panel flex min-h-[560px] flex-col items-center justify-center px-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white">
              <WandSparkles size={20} />
            </div>
            <h2 className="mt-5 text-lg font-semibold tracking-[-0.02em]">
              准备生成定制建议
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-neutral-500">
              Resumer 会根据“{analysis?.position || "目标岗位"}”重新组织经历表达，
              但不会创建你未提供的数字、技能或职责。
            </p>
            <div className="mt-6 grid w-full max-w-xl grid-cols-3 gap-3">
              {[
                ["关键词对齐", "自然融入岗位语言"],
                ["证据优先", "保留真实经历边界"],
                ["逐条确认", "每项修改都可恢复"],
              ].map(([title, description]) => (
                <div key={title} className="rounded-xl border border-neutral-200 p-4">
                  <p className="text-xs font-semibold">{title}</p>
                  <p className="mt-1 text-[11px] text-neutral-400">{description}</p>
                </div>
              ))}
            </div>
            <LoadingButton loading={loading} onClick={generate}>
              <Sparkles size={14} />
              生成优化建议
            </LoadingButton>
          </div>
        ) : loading ? (
          <TailorLoading progress={progress} />
        ) : (
          <div className="grid grid-cols-[minmax(560px,1.05fr)_minmax(430px,0.8fr)] items-stretch gap-5">
            <section className="panel flex min-w-0 flex-col overflow-hidden">
              <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-5">
                <div>
                  <h2 className="text-sm font-semibold">优化建议</h2>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    {condenseLoading
                      ? condenseProgress || "正在分析精简空间"
                      : `已确认 ${acceptedCount} / ${changedBullets.length} 条修改`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="secondary-button"
                    onClick={runCondenseAnalysis}
                    disabled={condenseLoading}
                  >
                    {condenseLoading ? (
                      <Sparkles size={14} className="animate-pulse" />
                    ) : (
                      <Scissors size={14} />
                    )}
                    {condensePlan ? "重新分析精简" : "分析精简空间"}
                  </button>
                  <button className="secondary-button" onClick={acceptAll}>
                    <Check size={14} />
                    全部确认
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                    <ShieldCheck size={14} />
                    真实性确认
                  </div>
                  <p className="mt-1.5 text-[11px] leading-5 text-amber-700">
                    请重点检查数字、工具、职责范围和结果。只有你提供过的信息才应保留。
                  </p>
                </div>

                {condensePlan ? (
                  <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <Scissors size={14} />
                      精简建议
                    </div>
                    <p className="mt-1.5 text-[11px] leading-5 text-neutral-500">
                      {condensePlan.summary}
                    </p>
                  </div>
                ) : null}

                {condensePlan && (displayProfile.basics.summary || removedSummary) ? (
                  <SummaryControl
                    summary={displayProfile.basics.summary}
                    removedSummary={removedSummary}
                    onDelete={deleteSummary}
                    onUndo={undoDeleteSummary}
                  />
                ) : null}

                {condensePlan ? (
                  <CompactItemSection
                    title="教育经历"
                    section="education"
                    items={displayProfile.education}
                    removedItems={removedItems}
                    getTitle={(item) =>
                      [item.degree, item.field].filter(Boolean).join(" · ") ||
                      item.school ||
                      "教育经历"
                    }
                    getSubtitle={(item) => item.school}
                    onRemove={removeItem}
                    onUndo={undoRemoveItem}
                  />
                ) : null}

                <EditableSection
                  title="工作经历"
                  section="experience"
                  items={displayProfile.experience}
                  accepted={accepted}
                  condenseIndex={condenseIndex}
                  condenseApplied={condenseApplied}
                  removedBullets={removedBullets}
                  removedItems={removedItems}
                  allowItemRemoval={Boolean(condensePlan)}
                  onAccept={acceptBullet}
                  onUpdate={updateBullet}
                  onApplyCondense={applyCondense}
                  onKeepOriginal={keepCondenseOriginal}
                  onUndoRemove={undoRemove}
                  onRemoveItem={removeItem}
                  onUndoRemoveItem={undoRemoveItem}
                />
                <EditableSection
                  title="项目经历"
                  section="projects"
                  items={displayProfile.projects}
                  accepted={accepted}
                  condenseIndex={condenseIndex}
                  condenseApplied={condenseApplied}
                  removedBullets={removedBullets}
                  removedItems={removedItems}
                  allowItemRemoval={Boolean(condensePlan)}
                  onAccept={acceptBullet}
                  onUpdate={updateBullet}
                  onApplyCondense={applyCondense}
                  onKeepOriginal={keepCondenseOriginal}
                  onUndoRemove={undoRemove}
                  onRemoveItem={removeItem}
                  onUndoRemoveItem={undoRemoveItem}
                />

                <CustomSectionsControl
                  sections={displayProfile.customSections}
                  accepted={accepted}
                  removedItems={removedCustomItems}
                  removedSections={removedCustomSections}
                  allowRemoval={Boolean(condensePlan)}
                  onAccept={acceptBullet}
                  onUpdate={updateBullet}
                  onRemoveItem={deleteCustomItem}
                  onUndoItem={undoDeleteCustomItem}
                  onRemoveSection={deleteCustomSection}
                  onUndoSection={undoDeleteCustomSection}
                />

                {condensePlan &&
                (displayProfile.skills.length ||
                  Object.keys(removedSkills).length) ? (
                  <SkillsControl
                    skills={displayProfile.skills}
                    removedSkills={removedSkills}
                    onRemove={deleteSkill}
                    onUndo={undoDeleteSkill}
                  />
                ) : null}
              </div>
            </section>

            <aside className="sticky top-[78px] self-start">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold">A4 实时预览</h2>
                  <p className="mt-0.5 text-[10px] text-neutral-400">内容修改会立即同步</p>
                </div>
                <select
                  className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] outline-none"
                  value={compactLevel}
                  onChange={(event) => setCompactLevel(Number(event.target.value))}
                >
                  <option value={0}>舒展</option>
                  <option value={1}>紧凑</option>
                  <option value={2}>更紧凑</option>
                  <option value={3}>最小可读</option>
                </select>
              </div>
              <ResumePaper profile={displayProfile} compactLevel={compactLevel} />
              <button className="primary-button mt-4 w-full" onClick={onNext}>
                进入最终检查
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function omitKey(object, key) {
  const next = { ...object };
  delete next[key];
  return next;
}

function SummaryControl({ summary, removedSummary, onDelete, onUndo }) {
  if (removedSummary) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
              已删除职业摘要
            </p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-neutral-400 line-through">
              {removedSummary}
            </p>
          </div>
          <button className="secondary-button shrink-0" onClick={onUndo}>
            <Undo2 size={12} />
            撤销恢复
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-neutral-200">
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            职业摘要
          </p>
          <p className="mt-2 text-xs leading-5 text-neutral-600">{summary}</p>
        </div>
        <button
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[10px] font-semibold text-neutral-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={onDelete}
        >
          <Trash2 size={12} />
          删除摘要
        </button>
      </div>
    </div>
  );
}

function CompactItemSection({
  title,
  section,
  items,
  removedItems,
  getTitle,
  getSubtitle,
  onRemove,
  onUndo,
}) {
  const removedForSection = Object.entries(removedItems).filter(
    ([, removed]) => removed.section === section,
  );
  if (!items.length && !removedForSection.length) return null;
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{getTitle(item)}</p>
              {getSubtitle(item) ? (
                <p className="mt-0.5 truncate text-[10px] text-neutral-400">
                  {getSubtitle(item)}
                </p>
              ) : null}
            </div>
            <DeleteButton label="删除此条" onClick={() => onRemove(section, item.id)} />
          </div>
        ))}
        {removedForSection.map(([key, removed]) => (
          <RemovedItemCard key={key} removed={removed} onUndo={() => onUndo(key)} />
        ))}
      </div>
    </div>
  );
}

function SkillsControl({ skills, removedSkills, onRemove, onUndo }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
        技能
      </h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={`${skill}:${index}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px]"
          >
            {skill}
            <button
              className="text-neutral-400 hover:text-red-600"
              onClick={() => onRemove(index)}
              aria-label={`删除技能 ${skill}`}
            >
              <Trash2 size={11} />
            </button>
          </span>
        ))}
        {Object.entries(removedSkills).map(([key, removed]) => (
          <button
            key={key}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-[11px] text-neutral-400 line-through"
            onClick={() => onUndo(key)}
          >
            {removed.value}
            <Undo2 size={11} />
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomSectionsControl({
  sections,
  accepted,
  removedItems,
  removedSections,
  allowRemoval,
  onAccept,
  onUpdate,
  onRemoveItem,
  onUndoItem,
  onRemoveSection,
  onUndoSection,
}) {
  if (
    !sections.length &&
    !Object.keys(removedItems).length &&
    !Object.keys(removedSections).length
  ) {
    return null;
  }
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
        其他内容
      </h3>
      <div className="space-y-3">
        {sections.map((section) => {
          const removedForSection = Object.entries(removedItems).filter(
            ([, removed]) => removed.sectionId === section.id,
          );
          return (
            <div key={section.id} className="rounded-xl border border-neutral-200">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                <p className="text-xs font-semibold">{section.title || "其他内容"}</p>
                {allowRemoval ? (
                  <DeleteButton
                    label="删除区块"
                    onClick={() => onRemoveSection(section.id)}
                  />
                ) : null}
              </div>
              <div className="space-y-2 p-3">
                {section.items.map((item) => (
                  <EditableItem
                    key={item.id}
                    item={item}
                    section="customSections"
                    sectionId={section.id}
                    displayTitle={item.title || item.subtitle || "内容条目"}
                    displaySubtitle={[item.subtitle, item.date, item.location]
                      .filter(Boolean)
                      .join(" · ")}
                    accepted={accepted}
                    condenseIndex={{}}
                    condenseApplied={{}}
                    removedBullets={{}}
                    allowItemRemoval={allowRemoval}
                    onAccept={onAccept}
                    onUpdate={onUpdate}
                    onApplyCondense={() => {}}
                    onKeepOriginal={() => {}}
                    onUndoRemove={() => {}}
                    onRemoveItem={() => onRemoveItem(section.id, item.id)}
                  />
                ))}
                {removedForSection.map(([key, removed]) => (
                  <button
                    key={key}
                    className="flex w-full items-center justify-between rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-left"
                    onClick={() => onUndoItem(key)}
                  >
                    <span className="text-[11px] text-neutral-400 line-through">
                      {removed.item.title || removed.item.subtitle || "已删除条目"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-neutral-500">
                      <Undo2 size={11} /> 撤销
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {Object.entries(removedSections).map(([key, removed]) => (
          <button
            key={key}
            className="flex w-full items-center justify-between rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 text-left"
            onClick={() => onUndoSection(key)}
          >
            <span className="text-xs font-semibold text-neutral-400 line-through">
              {removed.section.title || "已删除区块"}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-neutral-500">
              <Undo2 size={11} /> 撤销恢复
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DeleteButton({ label, onClick }) {
  return (
    <button
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[10px] font-semibold text-neutral-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
      onClick={onClick}
    >
      <Trash2 size={12} />
      {label}
    </button>
  );
}

function EditableSection({
  title,
  section,
  items,
  accepted,
  condenseIndex,
  condenseApplied,
  removedBullets,
  removedItems,
  allowItemRemoval,
  onAccept,
  onUpdate,
  onApplyCondense,
  onKeepOriginal,
  onUndoRemove,
  onRemoveItem,
  onUndoRemoveItem,
}) {
  const removedForSection = Object.entries(removedItems).filter(
    ([, removed]) => removed.section === section,
  );
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <EditableItem
            key={item.id}
            item={item}
            section={section}
            displayTitle={section === "projects" ? item.name : item.role}
            displaySubtitle={item.company || item.stack || "经历内容"}
            accepted={accepted}
            condenseIndex={condenseIndex}
            condenseApplied={condenseApplied}
            removedBullets={removedBullets}
            allowItemRemoval={allowItemRemoval}
            onAccept={onAccept}
            onUpdate={onUpdate}
            onApplyCondense={onApplyCondense}
            onKeepOriginal={onKeepOriginal}
            onUndoRemove={onUndoRemove}
            onRemoveItem={() => onRemoveItem(section, item.id)}
          />
        ))}
        {removedForSection.map(([key, removed]) => (
          <RemovedItemCard
            key={key}
            removed={removed}
            onUndo={() => onUndoRemoveItem(key)}
          />
        ))}
      </div>
    </div>
  );
}

function EditableItem({
  item,
  section,
  sectionId,
  displayTitle,
  displaySubtitle,
  accepted,
  condenseIndex,
  condenseApplied,
  removedBullets,
  allowItemRemoval,
  onAccept,
  onUpdate,
  onApplyCondense,
  onKeepOriginal,
  onUndoRemove,
  onRemoveItem,
}) {
  const [open, setOpen] = useState(true);
  const removedForItem = Object.entries(removedBullets).filter(
    ([, removed]) => removed.section === section && removed.itemId === item.id,
  );
  return (
    <div className="rounded-xl border border-neutral-200">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
          onClick={() => setOpen(!open)}
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">
              {displayTitle}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-neutral-400">
              {displaySubtitle}
            </p>
          </div>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {allowItemRemoval ? (
          <button
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[10px] font-semibold text-neutral-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={onRemoveItem}
          >
            <Trash2 size={12} />
            删除整段
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="space-y-3 border-t border-neutral-100 p-4">
          {item.bullets.map((bullet) => {
            const recommendation =
              condenseIndex[recommendationKey({
                section,
                itemId: item.id,
                bulletId: bullet.id,
              })];
            const recommendationApplied =
              recommendation && condenseApplied[recommendationKey(recommendation)];
            return (
            <div key={bullet.id} className="rounded-lg bg-neutral-50 p-3">
              {recommendation ? (
                <CondenseRecommendation
                  recommendation={recommendation}
                  decision={recommendationApplied}
                  onApply={() => onApplyCondense(recommendation)}
                  onKeep={() => onKeepOriginal(recommendation)}
                />
              ) : null}
              {bullet.originalText ? (
                <div className="mb-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                    原文
                  </p>
                  <p className="text-[11px] leading-5 text-neutral-400 line-through decoration-neutral-300">
                    {bullet.originalText}
                  </p>
                </div>
              ) : null}
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                优化建议
              </p>
              <textarea
                className="field min-h-[86px] resize-y bg-white text-xs leading-5"
                value={bullet.text}
                onChange={(event) =>
                  onUpdate(
                    section,
                    item.id,
                    bullet.id,
                    { text: event.target.value },
                    sectionId,
                  )
                }
              />
              <div className="mt-2 flex items-center justify-between">
                <button
                  className="ghost-button"
                  onClick={() =>
                    onUpdate(
                      section,
                      item.id,
                      bullet.id,
                      { text: bullet.originalText || bullet.text },
                      sectionId,
                    )
                  }
                >
                  <RotateCcw size={12} />
                  恢复原文
                </button>
                {accepted[bullet.id] ? (
                  <StatusPill tone="success">
                    <Check size={10} /> 已确认
                  </StatusPill>
                ) : (
                  <button className="secondary-button" onClick={() => onAccept(bullet.id)}>
                    <Check size={13} />
                    确认采用
                  </button>
                )}
              </div>
            </div>
          )})}
          {removedForItem.map(([key, removed]) => (
            <div
              key={key}
              className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                    已删除
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-neutral-400 line-through">
                    {removed.bullet.text}
                  </p>
                </div>
                <button className="secondary-button shrink-0" onClick={() => onUndoRemove(key)}>
                  <Undo2 size={12} />
                  撤销删除
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RemovedItemCard({ removed, onUndo }) {
  const item = removed.item;
  const title = {
    education:
      [item.degree, item.field].filter(Boolean).join(" · ") ||
      item.school ||
      "教育经历",
    projects: item.name || "项目经历",
    experience: item.role || item.company || "工作经历",
  }[removed.section];
  const subtitle = {
    education: item.school,
    projects: item.stack || item.role,
    experience: item.company,
  }[removed.section];
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
            已删除整段
          </p>
          <p className="mt-1 truncate text-xs font-semibold text-neutral-500 line-through">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[10px] text-neutral-400">{subtitle}</p>
          ) : null}
        </div>
        <button className="secondary-button shrink-0" onClick={onUndo}>
          <Undo2 size={12} />
          撤销恢复
        </button>
      </div>
    </div>
  );
}

function CondenseRecommendation({ recommendation, decision, onApply, onKeep }) {
  const config = {
    keep: {
      label: "建议保留",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    },
    condense: {
      label: "建议压缩",
      className: "border-blue-200 bg-blue-50 text-blue-800",
    },
    remove: {
      label: "可考虑删除",
      className: "border-amber-200 bg-amber-50 text-amber-800",
    },
  }[recommendation.action];

  return (
    <div className={`mb-3 rounded-lg border p-3 ${config.className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em]">
            {config.label}
          </p>
          <p className="mt-1 text-[11px] leading-5">{recommendation.reason}</p>
        </div>
        {decision ? (
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold">
            <Check size={11} />
            {decision === "kept" ? "已保留" : "已处理"}
          </span>
        ) : null}
      </div>

      {!decision && recommendation.action === "condense" ? (
        <div className="mt-3 rounded-md bg-white/80 p-2.5">
          <p className="text-[10px] font-semibold text-neutral-500">压缩后</p>
          <p className="mt-1 text-[11px] leading-5 text-neutral-700">
            {recommendation.suggestedText}
          </p>
          <div className="mt-2 flex justify-end gap-2">
            <button className="ghost-button" onClick={onKeep}>保留当前内容</button>
            <button className="secondary-button" onClick={onApply}>
              <Scissors size={12} />
              采用压缩
            </button>
          </div>
        </div>
      ) : null}

      {recommendation.action === "remove" ? (
        <div className="mt-2 flex justify-end gap-2">
          {decision !== "kept" ? (
            <button className="ghost-button" onClick={onKeep}>仍然保留</button>
          ) : null}
          <button
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
            onClick={onApply}
          >
            <Trash2 size={12} />
            删除此条
          </button>
        </div>
      ) : null}

      {!decision && recommendation.action === "keep" ? (
        <div className="mt-2 flex justify-end">
          <button className="secondary-button" onClick={onKeep}>
            <Check size={12} />
            确认保留
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TailorLoading({ progress }) {
  return (
    <div className="panel min-h-[560px] p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles size={16} className="animate-pulse" />
          {progress || "正在生成优化建议"}
        </div>
        <p className="mt-2 text-xs text-neutral-400">正在保持事实边界并调整表达方式...</p>
        <div className="mt-8 space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-xl border border-neutral-100 p-5">
              <div className="skeleton h-3 w-32 rounded" />
              <div className="skeleton mt-5 h-2.5 w-full rounded" />
              <div className="skeleton mt-2 h-2.5 w-5/6 rounded" />
              <div className="skeleton mt-4 h-16 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

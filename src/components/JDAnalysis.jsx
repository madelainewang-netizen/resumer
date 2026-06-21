import { useState } from "react";
import {
  Check,
  Circle,
  ClipboardPaste,
  Lightbulb,
  MessageSquarePlus,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";
import { sampleJD } from "../data/defaults";
import { useResumerServices } from "../services/ResumerServicesContext";
import { addEvidenceToProfile } from "../utils/evidence";
import { evaluateRequirementEvidence } from "../utils/matchScore";
import EvidenceCoach from "./EvidenceCoach";
import { LoadingButton, SectionHeader, StatusPill } from "./ui";

export default function JDAnalysis({
  jdText,
  setJDText,
  analysis,
  setAnalysis,
  profile,
  setProfile,
  onProfileChanged,
  onNext,
  loading,
  setLoading,
  progress,
  setProgress,
  notify,
}) {
  const { analyzeJD } = useResumerServices();
  const [coachTarget, setCoachTarget] = useState(null);

  const runAnalysis = async () => {
    if (jdText.trim().length < 80) {
      notify("JD 内容太短", "请粘贴较完整的岗位职责和任职要求。", "error");
      return;
    }
    setLoading(true);
    setProgress("正在识别岗位结构");
    try {
      const result = await analyzeJD(jdText, setProgress);
      setAnalysis(result);
      notify("JD 分析完成", "已提取必备要求、技能关键词和候选人画像。");
    } catch (error) {
      notify("分析失败", error.message, "error");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <div className="px-8 py-9">
      <div className="mx-auto max-w-[1240px]">
        <SectionHeader
          eyebrow="Step 02"
          title="理解目标岗位"
          description="粘贴完整 JD。Resumer 会拆解岗位要求，并区分简历中已有证据和仍需补充的能力。"
          action={
            <button
              className="secondary-button"
              onClick={() => {
                setJDText(sampleJD);
                notify("已载入示例 JD");
              }}
            >
              <ClipboardPaste size={14} />
              载入示例
            </button>
          }
        />

        <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-5">
          <section className="panel flex min-h-[650px] flex-col p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">职位描述</h2>
                <p className="mt-1 text-[11px] text-neutral-400">
                  {jdText.length.toLocaleString()} 个字符
                </p>
              </div>
              {analysis ? <StatusPill tone="success"><Check size={11} /> 已分析</StatusPill> : null}
            </div>
            <textarea
              className="field flex-1 resize-none bg-neutral-50/50 p-4 text-[13px] leading-6"
              value={jdText}
              onChange={(event) => setJDText(event.target.value)}
              placeholder="在这里粘贴完整的职位描述，包括岗位职责、任职要求和加分项..."
            />
            <div className="mt-4">
              <LoadingButton loading={loading} onClick={runAnalysis} disabled={!jdText.trim()}>
                <Sparkles size={14} />
                {loading ? progress || "正在分析" : analysis ? "重新分析 JD" : "开始分析 JD"}
              </LoadingButton>
              <p className="mt-2 text-[10px] text-neutral-400">
                JD 内容会发送给 AI 服务进行结构化分析。
              </p>
            </div>
          </section>

          <section className="panel min-h-[650px] p-5">
            {loading ? (
              <AnalysisSkeleton progress={progress} />
            ) : analysis ? (
              <div>
                <div className="flex items-start justify-between border-b border-neutral-100 pb-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      识别岗位
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">
                      {analysis.position}
                    </h2>
                    <p className="mt-1 text-xs text-neutral-400">{analysis.seniority}岗位</p>
                  </div>
                  <StatusPill tone="dark">分析完成</StatusPill>
                </div>

                <div className="py-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Target size={15} />
                    <h3 className="text-xs font-semibold">核心要求与简历证据</h3>
                  </div>
                  <div className="space-y-2">
                    {analysis.coreRequirements.map((item, index) => {
                      const status = evaluateRequirementEvidence(
                        profile,
                        item.requirement,
                        analysis,
                      );
                      return (
                        <div key={item.requirement} className="rounded-xl border border-neutral-200 p-3.5">
                          <div className="flex items-start gap-3">
                            <EvidenceIcon status={status} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold text-neutral-800">
                                  {index + 1}. {item.requirement}
                                </p>
                                <EvidenceLabel status={status} />
                              </div>
                              <p className="mt-1.5 text-[11px] leading-5 text-neutral-400">
                                {item.evidenceHint}
                              </p>
                              {status !== "strong" ? (
                                <button
                                  className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 hover:text-neutral-950"
                                  onClick={() => setCoachTarget(item)}
                                >
                                  <MessageSquarePlus size={13} />
                                  {status === "partial" ? "补充证据" : "开始挖掘经历"}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 py-5">
                  <KeywordGroup title="硬技能" items={analysis.hardSkills} />
                  <KeywordGroup title="软技能" items={analysis.softSkills} subtle />
                </div>

                <div className="rounded-xl bg-neutral-50 p-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={14} />
                    <p className="text-xs font-semibold">理想候选人画像</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-neutral-600">{analysis.talentProfile}</p>
                </div>

                <button className="primary-button mt-5 w-full" onClick={onNext}>
                  使用此分析优化简历
                </button>
              </div>
            ) : (
              <div className="flex h-full min-h-[610px] flex-col items-center justify-center text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
                  <Sparkles size={17} className="text-neutral-500" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">等待分析</h3>
                <p className="mt-2 max-w-[280px] text-xs leading-5 text-neutral-400">
                  分析结果会在这里显示，包括必备能力、关键词和你的证据覆盖情况。
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
      <EvidenceCoach
        open={Boolean(coachTarget)}
        onClose={() => setCoachTarget(null)}
        requirement={coachTarget?.requirement || ""}
        evidenceHint={coachTarget?.evidenceHint || ""}
        analysis={analysis}
        profile={profile}
        onAddEvidence={(draft) => {
          setProfile((current) => addEvidenceToProfile(current, draft));
          onProfileChanged();
        }}
        notify={notify}
      />
    </div>
  );
}

function EvidenceIcon({ status }) {
  if (status === "strong") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check size={11} />
      </span>
    );
  }
  if (status === "partial") {
    return (
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <TriangleAlert size={11} />
      </span>
    );
  }
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
      <Circle size={9} />
    </span>
  );
}

function EvidenceLabel({ status }) {
  const labels = {
    strong: ["已有证据", "text-emerald-700"],
    partial: ["证据较弱", "text-amber-700"],
    missing: ["暂无证据", "text-neutral-400"],
  };
  return <span className={`shrink-0 text-[10px] font-semibold ${labels[status][1]}`}>{labels[status][0]}</span>;
}

function KeywordGroup({ title, items, subtle }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold text-neutral-500">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={`rounded-md border px-2 py-1 text-[10px] ${
              subtle
                ? "border-neutral-200 bg-white text-neutral-500"
                : "border-neutral-300 bg-neutral-50 font-medium text-neutral-700"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function AnalysisSkeleton({ progress }) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-xs font-medium text-neutral-600">
        <Sparkles size={14} className="animate-pulse" />
        {progress || "正在分析岗位"}
      </div>
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton mt-3 h-8 w-52 rounded" />
      <div className="my-6 h-px bg-neutral-100" />
      {[1, 2, 3].map((item) => (
        <div key={item} className="mb-3 rounded-xl border border-neutral-100 p-4">
          <div className="skeleton h-3 w-3/4 rounded" />
          <div className="skeleton mt-3 h-2.5 w-full rounded" />
          <div className="skeleton mt-2 h-2.5 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}

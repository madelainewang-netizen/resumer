import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Lightbulb,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useResumerServices } from "../services/ResumerServicesContext";

const destinationLabels = {
  experience: "工作 / 实习经历",
  project: "项目经历",
  custom: "其他经历",
};

export default function EvidenceCoach({
  open,
  onClose,
  requirement,
  evidenceHint,
  analysis,
  profile,
  onAddEvidence,
  notify,
}) {
  const { createEvidenceDraft, getEvidenceQuestions } = useResumerServices();
  const [stage, setStage] = useState("questions");
  const [questionSet, setQuestionSet] = useState(null);
  const [answers, setAnswers] = useState({});
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !requirement) return undefined;
    let active = true;
    setStage("questions");
    setQuestionSet(null);
    setAnswers({});
    setDraft(null);
    setError("");
    setLoading(true);
    setProgress("正在准备针对性问题");

    getEvidenceQuestions(
      { requirement, evidenceHint, analysis, profile },
      (message) => active && setProgress(message),
    )
      .then((result) => {
        if (active) setQuestionSet(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setProgress("");
        }
      });

    return () => {
      active = false;
    };
  }, [open, requirement, evidenceHint, analysis, profile, getEvidenceQuestions]);

  const requiredComplete = useMemo(
    () =>
      questionSet?.questions
        ?.filter((item) => item.required)
        .every((item) => answers[item.id]?.trim()) ?? false,
    [answers, questionSet],
  );

  if (!open) return null;

  const generateDraft = async () => {
    if (!requiredComplete) {
      setError("请先回答标记为必填的问题。没有相关经历也可以直接保留这个能力缺口。");
      return;
    }
    setLoading(true);
    setError("");
    setProgress("正在整理真实经历");
    try {
      const result = await createEvidenceDraft(
        {
          requirement,
          evidenceHint,
          analysis,
          profile,
          questions: questionSet.questions,
          answers,
        },
        setProgress,
      );
      setDraft(normalizeDraft(result));
      setStage("draft");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const confirmDraft = () => {
    const cleanedBullets = draft.bullets.map((item) => item.trim()).filter(Boolean);
    if (!draft.title.trim() && !draft.role.trim()) {
      setError("请至少填写经历名称或你的角色。");
      return;
    }
    if (!cleanedBullets.length) {
      setError("请保留至少一条能够证明这项能力的事实描述。");
      return;
    }
    onAddEvidence({ ...draft, bullets: cleanedBullets });
    notify("经历已加入基础资料", "你可以继续在基础资料中编辑，匹配状态也已重新计算。");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        className="absolute inset-0 cursor-default bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="关闭经历挖掘"
      />
      <aside className="absolute right-0 top-0 flex h-full w-[520px] flex-col border-l border-neutral-200 bg-white shadow-[-18px_0_50px_rgba(0,0,0,0.08)]">
        <header className="border-b border-neutral-200 px-6 py-5">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                <Sparkles size={13} />
                经历挖掘
              </div>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
                {requirement}
              </h2>
              <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                {evidenceHint || "通过具体场景、行动和结果，找到这项能力的真实证据。"}
              </p>
            </div>
            <button
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
              onClick={onClose}
              aria-label="关闭"
            >
              <X size={17} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 flex items-center gap-2">
            <Step active label="1 回忆经历" />
            <div className="h-px flex-1 bg-neutral-200" />
            <Step active={stage === "draft"} label="2 核对草稿" />
          </div>

          {loading && !questionSet ? (
            <LoadingState progress={progress} />
          ) : stage === "questions" ? (
            <QuestionsStage
              questionSet={questionSet}
              answers={answers}
              setAnswers={setAnswers}
            />
          ) : (
            <DraftStage draft={draft} setDraft={setDraft} />
          )}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <footer className="border-t border-neutral-200 bg-white px-6 py-4">
          {stage === "questions" ? (
            <div className="flex items-center justify-between gap-3">
              <button className="ghost-button" onClick={onClose}>
                我确实没有相关经历
              </button>
              <button
                className="primary-button"
                onClick={generateDraft}
                disabled={loading || !questionSet}
              >
                {loading ? <LoaderCircle size={15} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? progress || "正在生成" : "生成经历草稿"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button className="secondary-button" onClick={() => setStage("questions")}>
                <ArrowLeft size={14} />
                修改回答
              </button>
              <button className="primary-button" onClick={confirmDraft}>
                <Check size={14} />
                确认并加入简历
              </button>
            </div>
          )}
        </footer>
      </aside>
    </div>
  );
}

function QuestionsStage({ questionSet, answers, setAnswers }) {
  if (!questionSet) return null;
  return (
    <div>
      <div className="rounded-xl bg-neutral-50 p-4">
        <p className="text-xs leading-5 text-neutral-700">{questionSet.intro}</p>
        {questionSet.transferableExamples?.length ? (
          <div className="mt-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-neutral-500">
              <Lightbulb size={13} />
              也可以从这些场景回忆
            </div>
            <div className="flex flex-wrap gap-1.5">
              {questionSet.transferableExamples.map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] text-neutral-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 space-y-5">
        {questionSet.questions.map((item, index) => (
          <label key={item.id} className="block">
            <span className="field-label">
              {index + 1}. {item.question}
              {item.required ? <span className="ml-1 text-red-500">*</span> : null}
            </span>
            <textarea
              className="field min-h-[92px] resize-y text-xs leading-5"
              value={answers[item.id] || ""}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [item.id]: event.target.value,
                }))
              }
              placeholder={item.hint || "只填写你真实做过、能够核对的信息"}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function DraftStage({ draft, setDraft }) {
  if (!draft) return null;
  const update = (patch) => setDraft((current) => ({ ...current, ...patch }));
  return (
    <div>
      <div className="mb-5 flex gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <ShieldCheck size={17} className="mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold">加入前请核对事实</p>
          <p className="mt-1 text-[11px] leading-5 text-neutral-500">
            AI 只负责整理表达。日期、角色、成果和数字仍以你的确认版本为准。
          </p>
        </div>
      </div>

      <label className="block">
        <span className="field-label">放入简历的哪个部分</span>
        <select
          className="field"
          value={draft.suggestedType}
          onChange={(event) => update({ suggestedType: event.target.value })}
        >
          {Object.entries(destinationLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <DraftField label="经历 / 项目名称" value={draft.title} onChange={(title) => update({ title })} />
        <DraftField label="你的角色" value={draft.role} onChange={(role) => update({ role })} />
        <DraftField label="组织 / 公司" value={draft.organization} onChange={(organization) => update({ organization })} />
        <DraftField label="地点" value={draft.location} onChange={(location) => update({ location })} />
        <DraftField label="开始时间" value={draft.startDate} onChange={(startDate) => update({ startDate })} />
        <DraftField label="结束时间" value={draft.endDate} onChange={(endDate) => update({ endDate })} />
      </div>

      <label className="mt-4 block">
        <span className="field-label">相关技能（用逗号分隔）</span>
        <input
          className="field"
          value={draft.skills.join("、")}
          onChange={(event) =>
            update({
              skills: event.target.value
                .split(/[，,、]/)
                .map((item) => item.trim())
                .filter(Boolean),
            })
          }
        />
      </label>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="field-label mb-0">事实描述</span>
          <button
            className="ghost-button"
            onClick={() => update({ bullets: [...draft.bullets, ""] })}
          >
            <Plus size={13} />
            添加一条
          </button>
        </div>
        <div className="space-y-2">
          {draft.bullets.map((bullet, index) => (
            <div key={index} className="flex items-start gap-2">
              <textarea
                className="field min-h-[76px] resize-y text-xs leading-5"
                value={bullet}
                onChange={(event) =>
                  update({
                    bullets: draft.bullets.map((item, itemIndex) =>
                      itemIndex === index ? event.target.value : item,
                    ),
                  })
                }
              />
              <button
                className="mt-1 rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                onClick={() =>
                  update({
                    bullets: draft.bullets.filter((_, itemIndex) => itemIndex !== index),
                  })
                }
                aria-label="删除描述"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {draft.verificationChecklist.length ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[11px] font-semibold text-amber-800">仍需你核对</p>
          <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-amber-800">
            {draft.verificationChecklist.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function DraftField({ label, value, onChange }) {
  return (
    <label>
      <span className="field-label">{label}</span>
      <input className="field" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Step({ active, label }) {
  return (
    <span className={`text-[10px] font-semibold ${active ? "text-neutral-900" : "text-neutral-400"}`}>
      {label}
    </span>
  );
}

function LoadingState({ progress }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
      <LoaderCircle size={22} className="animate-spin text-neutral-500" />
      <p className="mt-4 text-sm font-semibold">{progress || "正在准备问题"}</p>
      <p className="mt-2 max-w-[280px] text-xs leading-5 text-neutral-400">
        AI 正在结合岗位要求和你已有的简历寻找可迁移能力线索。
      </p>
    </div>
  );
}

function normalizeDraft(result) {
  const validType = Object.hasOwn(destinationLabels, result.suggestedType)
    ? result.suggestedType
    : "project";
  return {
    suggestedType: validType,
    title: result.title || "",
    organization: result.organization || "",
    role: result.role || "",
    startDate: result.startDate || "",
    endDate: result.endDate || "",
    location: result.location || "",
    skills: Array.isArray(result.skills) ? result.skills : [],
    bullets: Array.isArray(result.bullets) && result.bullets.length
      ? result.bullets
      : [""],
    verificationChecklist: Array.isArray(result.verificationChecklist)
      ? result.verificationChecklist
      : [],
  };
}

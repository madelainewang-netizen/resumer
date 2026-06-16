import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  FileCheck2,
  Gauge,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { explainMatch } from "../services/resumerApi";
import { calculateMatchScore } from "../utils/matchScore";
import ResumePaper from "./ResumePaper";
import { SectionHeader, StatusPill } from "./ui";

export default function ReviewExport({
  profile,
  analysis,
  matchExplanation,
  setMatchExplanation,
  onSaveVersion,
  notify,
}) {
  const paperRef = useRef(null);
  const [compactLevel, setCompactLevel] = useState(2);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewProgress, setReviewProgress] = useState("");
  const score = useMemo(() => calculateMatchScore(profile, analysis), [profile, analysis]);
  const likelyOverflow = isOverflowing && compactLevel === 3;

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const paper = paperRef.current;
      if (!paper) return;
      const overflows = paper.scrollHeight > paper.clientHeight + 2;
      if (overflows && compactLevel < 3) {
        setCompactLevel((level) => Math.min(3, level + 1));
        setIsOverflowing(false);
      } else {
        setIsOverflowing(overflows);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [profile, compactLevel]);
  const warnings = [
    ...score.missingKeywords.slice(0, 3).map((keyword) => `缺少“${keyword}”相关证据`),
    ...(profile.basics.summary.length > 150 ? ["职业摘要较长，建议压缩到 2–3 行"] : []),
    ...(likelyOverflow ? ["内容可能超过一页，请优先精简低相关经历"] : []),
  ];

  const exportPDF = async () => {
    if (likelyOverflow) {
      notify("暂时无法导出", "内容超过单页安全容量，请先精简后再试。", "error");
      return;
    }
    setExporting(true);
    try {
      const [{ pdf }, { default: ResumeDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../pdf/ResumeDocument"),
      ]);
      const blob = await pdf(
        <ResumeDocument profile={profile} compactLevel={compactLevel} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${profile.basics.name || "Resumer"}-${profile.basics.targetRole || "Resume"}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      notify("PDF 已生成", "已按单页 A4 模板下载到本地。");
    } catch (error) {
      notify("PDF 生成失败", error.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const runRecruiterReview = async () => {
    setReviewing(true);
    setReviewProgress("正在从招聘视角检查简历");
    try {
      const result = await explainMatch(profile, analysis, score, setReviewProgress);
      setMatchExplanation(result);
      notify("招聘视角审阅完成", "已生成优势、证据缺口和精进建议。");
    } catch (error) {
      notify("审阅失败", error.message, "error");
    } finally {
      setReviewing(false);
      setReviewProgress("");
    }
  };

  return (
    <div className="px-7 py-8">
      <div className="mx-auto max-w-[1380px]">
        <SectionHeader
          eyebrow="Step 04"
          title="最终检查与导出"
          description="匹配度反映简历文本与 JD 的覆盖程度，不代表录用概率。导出前请再次确认所有信息真实准确。"
        />

        <div className="grid grid-cols-[minmax(520px,0.9fr)_minmax(430px,0.75fr)] gap-5">
          <div>
            <div className="mb-5 grid grid-cols-4 gap-3">
              <MetricCard
                icon={Gauge}
                label="文本匹配"
                value={score.overallScore}
                suffix="/100"
                tone={score.overallScore >= 70 ? "good" : "warn"}
              />
              <MetricCard
                icon={FileCheck2}
                label="ATS 可读性"
                value="良好"
                tone="good"
              />
              <MetricCard
                icon={ShieldCheck}
                label="真实性"
                value="待确认"
                tone="warn"
              />
              <MetricCard
                icon={Save}
                label="页面长度"
                value={likelyOverflow ? "超页" : "1 / 1"}
                tone={likelyOverflow ? "danger" : "good"}
              />
            </div>

            <section className="panel mb-5 p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">匹配度构成</h2>
                  <p className="mt-1 text-[11px] text-neutral-400">固定规则计算，可重复且可解释</p>
                </div>
                <StatusPill tone={score.overallScore >= 70 ? "success" : "warning"}>
                  {score.overallScore >= 70 ? "基础匹配良好" : "仍有明显缺口"}
                </StatusPill>
              </div>
              <div className="space-y-4">
                <ScoreRow label="硬技能覆盖" value={score.hardSkillScore} weight="45%" />
                <ScoreRow label="核心要求证据" value={score.requirementScore} weight="35%" />
                <ScoreRow label="经历相关性" value={score.relevanceScore} weight="20%" />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-neutral-100 pt-5">
                <KeywordList title="已覆盖关键词" items={score.matchedKeywords} matched />
                <KeywordList title="待补充关键词" items={score.missingKeywords} />
              </div>
            </section>

            <section className="panel p-5">
              <div className="mb-4 flex items-center gap-2">
                {warnings.length ? (
                  <AlertTriangle size={16} className="text-amber-600" />
                ) : (
                  <Check size={16} className="text-emerald-600" />
                )}
                <h2 className="text-sm font-semibold">
                  {warnings.length ? `${warnings.length} 项建议检查` : "所有基础检查已通过"}
                </h2>
              </div>
              {warnings.length ? (
                <div className="space-y-2">
                  {warnings.map((warning, index) => (
                    <div
                      key={warning}
                      className="flex items-start gap-3 rounded-lg border border-neutral-200 p-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[10px] font-semibold text-amber-700">
                        {index + 1}
                      </span>
                      <p className="text-xs leading-5 text-neutral-600">{warning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-neutral-500">
                  内容结构、页面长度和关键词覆盖均达到当前导出标准。
                </p>
              )}
            </section>

            <section className="panel mt-5 p-5">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} />
                    <h2 className="text-sm font-semibold">招聘视角审阅</h2>
                  </div>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    AI 只解释规则评分，不修改分数
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={runRecruiterReview}
                  disabled={reviewing}
                >
                  <Sparkles size={13} className={reviewing ? "animate-pulse" : ""} />
                  {reviewing ? reviewProgress || "正在审阅" : matchExplanation ? "重新审阅" : "生成建议"}
                </button>
              </div>
              {matchExplanation ? (
                <div className="mt-5 grid grid-cols-2 gap-5 border-t border-neutral-100 pt-5">
                  <ReviewList
                    title="当前优势"
                    items={matchExplanation.strengths}
                    tone="success"
                  />
                  <ReviewList
                    title="精进建议"
                    items={matchExplanation.suggestions}
                    tone="warning"
                  />
                </div>
              ) : (
                <p className="mt-5 rounded-lg bg-neutral-50 p-4 text-xs leading-5 text-neutral-500">
                  生成后会从招聘经理的快速扫读视角，指出当前最有说服力的证据和下一步优化方向。
                </p>
              )}
            </section>
          </div>

          <aside className="sticky top-[78px] self-start">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold">最终 A4 预览</h2>
                <p className="mt-0.5 text-[10px] text-neutral-400">
                  {likelyOverflow ? "检测到超页风险" : "单页安全容量内"}
                </p>
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
            <ResumePaper ref={paperRef} profile={profile} compactLevel={compactLevel} />
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <button
                className="primary-button"
                onClick={exportPDF}
                disabled={exporting || likelyOverflow}
              >
                {exporting ? <Sparkles size={14} className="animate-pulse" /> : <Download size={14} />}
                {exporting ? "正在生成 PDF" : "下载 PDF"}
              </button>
              <button className="secondary-button" onClick={onSaveVersion}>
                <Save size={14} />
                保存版本
              </button>
            </div>
            {likelyOverflow ? (
              <p className="mt-2 text-center text-[10px] text-red-600">
                已达到最低可读配置，请精简内容后导出
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

function ReviewList({ title, items, tone }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold text-neutral-600">{title}</p>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2">
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                tone === "success" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <p className="text-[11px] leading-5 text-neutral-500">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, suffix, tone }) {
  const color = {
    good: "text-emerald-700",
    warn: "text-amber-700",
    danger: "text-red-700",
  }[tone];
  return (
    <div className="panel p-4">
      <Icon size={15} className="text-neutral-400" />
      <p className={`mt-4 text-lg font-semibold tracking-[-0.03em] ${color}`}>
        {value}
        {suffix ? <span className="ml-0.5 text-[10px] font-normal text-neutral-400">{suffix}</span> : null}
      </p>
      <p className="mt-1 text-[10px] text-neutral-400">{label}</p>
    </div>
  );
}

function ScoreRow({ label, value, weight }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px]">
        <span className="font-medium text-neutral-600">{label}</span>
        <span className="text-neutral-400">
          权重 {weight} · <strong className="text-neutral-700">{value}</strong>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-neutral-900" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function KeywordList({ title, items, matched }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold text-neutral-500">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.length ? (
          items.map((item) => (
            <span
              key={item}
              className={`rounded-md border px-2 py-1 text-[10px] ${
                matched
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-neutral-400">暂无</span>
        )}
      </div>
    </div>
  );
}

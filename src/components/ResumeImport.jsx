import { useEffect, useRef, useState } from "react";
import {
  Check,
  FileText,
  LoaderCircle,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useResumerServices } from "../services/ResumerServicesContext";

export default function ResumeImport({ onImported, notify }) {
  const { importResumePDF } = useResumerServices();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [parsed, setParsed] = useState(null);
  const [aiConfigured, setAIConfigured] = useState(null);

  useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then((status) => setAIConfigured(Boolean(status.aiConfigured)))
      .catch(() => setAIConfigured(false));
  }, []);

  const chooseFile = (selected) => {
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      notify("文件格式不支持", "目前仅支持 PDF 简历。", "error");
      return;
    }
    if (selected.size > 3 * 1024 * 1024) {
      notify("PDF 文件过大", "请上传 3MB 以内的简历 PDF。", "error");
      return;
    }
    if (previewURL) URL.revokeObjectURL(previewURL);
    setFile(selected);
    setPreviewURL(URL.createObjectURL(selected));
    setParsed(null);
  };

  const parseFile = async () => {
    setLoading(true);
    setProgress("正在读取文字与版面结构");
    try {
      const data = await fileToDataURL(file);
      const result = await importResumePDF(
        { fileName: file.name, fileData: data },
        setProgress,
      );
      setParsed(result);
      notify("简历解析完成", "请确认识别结果后再写入档案。");
    } catch (error) {
      notify("简历解析失败", error.message, "error");
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  const reset = () => {
    if (previewURL) URL.revokeObjectURL(previewURL);
    setFile(null);
    setPreviewURL("");
    setParsed(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  if (!file) {
    return (
      <div
        className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/60 px-8 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          chooseFile(event.dataTransfer.files?.[0]);
        }}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
          <Upload size={19} />
        </div>
        <h2 className="mt-5 text-base font-semibold">上传已有简历</h2>
        <p className="mt-2 max-w-md text-xs leading-5 text-neutral-500">
          Resumer 会识别文字、区块顺序和版面特征，再转换为可编辑档案。原 PDF 不会被修改。
        </p>
        <button className="primary-button mt-5" onClick={() => inputRef.current?.click()}>
          选择 PDF 文件
        </button>
        <input
          ref={inputRef}
          className="hidden"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        <p className="mt-3 text-[10px] text-neutral-400">最大 3MB · 支持文本型和扫描型 PDF</p>
        {aiConfigured === false ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-700">
            解析服务尚未配置：请在 .env.local 添加 DEEPSEEK_API_KEY 后重启
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid min-h-[610px] grid-cols-[0.92fr_1.08fr] gap-5">
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
        <iframe className="h-full min-h-[610px] w-full" src={previewURL} title="原始简历预览" />
      </div>
      <div className="panel flex flex-col p-5">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{file.name}</p>
              <p className="mt-0.5 text-[10px] text-neutral-400">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
          <button className="ghost-button" onClick={reset}>
            <X size={13} /> 更换
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <LoaderCircle size={22} className="animate-spin" />
            <p className="mt-4 text-sm font-semibold">{progress}</p>
            <p className="mt-2 text-xs text-neutral-400">正在保留原始区块顺序并识别内容...</p>
          </div>
        ) : parsed ? (
          <div className="flex flex-1 flex-col pt-5">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <Check size={14} /> 已识别 {parsed.sectionOrder.length} 个内容区块
              </div>
              <p className="mt-1.5 text-[11px] leading-5 text-emerald-700">
                姓名、联系方式、教育和经历已转换为可编辑字段。
              </p>
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-semibold text-neutral-500">原始区块顺序</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {parsed.sectionOrder.map((section, index) => (
                  <span
                    key={`${section}-${index}`}
                    className="rounded-full border border-neutral-200 px-2.5 py-1 text-[10px]"
                  >
                    {index + 1}. {sectionLabel(section, parsed)}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-5 rounded-xl bg-neutral-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <ShieldCheck size={14} /> 导入前请确认
              </div>
              <p className="mt-2 text-[11px] leading-5 text-neutral-500">
                自动解析可能出现日期归属或换行误差。导入后仍可逐项修改，照片需要单独上传。
              </p>
            </div>
            <button
              className="primary-button mt-auto w-full"
              onClick={() => onImported(parsed)}
            >
              确认并导入档案
            </button>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm font-semibold">准备解析这份简历</p>
            <p className="mt-2 max-w-sm text-xs leading-5 text-neutral-400">
              PDF 文字会先在本地提取，再发送给 DeepSeek 转换为结构化字段。照片不会发送给模型。
            </p>
            <button
              className="primary-button mt-5"
              onClick={parseFile}
              disabled={aiConfigured === false}
            >
              开始解析
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function sectionLabel(section, profile) {
  const labels = {
    education: "教育经历",
    experience: "工作 / 实习经历",
    projects: "项目经历",
    skills: "技能",
    customSections: "其他内容",
  };
  if (labels[section]) return labels[section];
  return profile.customSections.find((item) => item.id === section)?.title || section;
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("PDF 读取失败"));
    reader.readAsDataURL(file);
  });
}

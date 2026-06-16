import { Check, ChevronRight, LoaderCircle, X } from "lucide-react";

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-6">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-neutral-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/60 px-8 text-center">
      {Icon ? <Icon size={20} className="mb-3 text-neutral-400" /> : null}
      <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-neutral-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function StatusPill({ tone = "neutral", children }) {
  const tones = {
    neutral: "border-neutral-200 bg-neutral-50 text-neutral-600",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
    dark: "border-neutral-900 bg-neutral-900 text-white",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
      <div
        className="h-full rounded-full bg-neutral-900 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function LoadingButton({ loading, children, ...props }) {
  return (
    <button className="primary-button" disabled={loading || props.disabled} {...props}>
      {loading ? <LoaderCircle size={15} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-[0_16px_50px_rgba(0,0,0,0.12)]">
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          toast.type === "error" ? "bg-red-100 text-red-700" : "bg-neutral-900 text-white"
        }`}
      >
        {toast.type === "error" ? <X size={12} /> : <Check size={12} />}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-900">{toast.title}</p>
        {toast.message ? (
          <p className="mt-1 text-xs leading-5 text-neutral-500">{toast.message}</p>
        ) : null}
      </div>
      <button
        className="ml-2 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800"
        onClick={onClose}
        aria-label="关闭提示"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function NextAction({ label, hint, onClick, disabled }) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-neutral-200 pt-5">
      <p className="text-xs text-neutral-500">{hint}</p>
      <button className="primary-button" onClick={onClick} disabled={disabled}>
        {label}
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

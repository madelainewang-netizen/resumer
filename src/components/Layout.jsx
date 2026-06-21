import {
  Archive,
  ChevronDown,
  FileText,
  History,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";
import { steps } from "../data/defaults";

const navItems = [
  { id: "workspace", label: "定制工作台", icon: LayoutDashboard },
  { id: "profile", label: "简历档案", icon: FileText },
  { id: "versions", label: "历史版本", icon: History },
];

export default function Layout({
  activeStep,
  onStepChange,
  activeNav,
  onNavChange,
  profile,
  saveState,
  score,
  embedMode = false,
  demoMode = false,
  children,
}) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  return (
    <div
      className={`app-shell min-h-screen bg-[#f7f7f5] ${
        embedMode ? "embedded-workspace" : ""
      }`}
    >
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-[#e4e4e0] bg-[#f7f7f5] px-3 py-4 ${
          embedMode ? "w-[176px]" : "w-[224px]"
        }`}
      >
        <div className="flex h-10 items-center gap-2 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white">
            <Sparkles size={14} strokeWidth={2} />
          </div>
          <span className="text-[15px] font-semibold tracking-[-0.02em]">Resumer</span>
        </div>

        {!embedMode ? (
          <nav className="mt-7 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onNavChange(id)}
                className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] transition ${
                  activeNav === id
                    ? "bg-[#e9e9e6] font-semibold text-neutral-900"
                    : "text-neutral-600 hover:bg-[#ededeb] hover:text-neutral-900"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        ) : null}

        <div className={`${embedMode ? "mt-8" : "mt-7"} px-2.5`}>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            当前定制
          </p>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <button
                key={step.id}
                className="group flex w-full items-start gap-2.5 text-left"
                onClick={() => onStepChange(step.id)}
              >
                <span
                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[9px] font-semibold ${
                    activeStep === step.id
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : index < activeIndex
                        ? "border-neutral-500 bg-white text-neutral-700"
                        : "border-neutral-300 text-neutral-400"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`text-xs leading-[19px] ${
                    activeStep === step.id
                      ? "font-semibold text-neutral-900"
                      : "text-neutral-500 group-hover:text-neutral-800"
                  }`}
                >
                  {step.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {embedMode ? (
          <div className="mt-auto px-2">
            {demoMode ? (
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                演示模式
              </p>
            ) : null}
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-xs font-semibold text-neutral-700 transition hover:border-neutral-300 hover:text-neutral-900"
            >
              使用自己的简历
            </a>
          </div>
        ) : (
          <div className="mt-auto">
            <button className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] text-neutral-500 hover:bg-[#ededeb] hover:text-neutral-900">
              <Settings size={15} />
              设置
            </button>
            <button className="mt-2 flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2 text-left">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold">
                {profile.basics.name?.slice(0, 1) || "R"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-neutral-800">
                  {profile.basics.name || "未命名简历"}
                </p>
                <p className="truncate text-[10px] text-neutral-400">
                  {profile.basics.targetRole || "添加目标岗位"}
                </p>
              </div>
              <ChevronDown size={13} className="text-neutral-400" />
            </button>
          </div>
        )}
      </aside>

      <div className={`${embedMode ? "ml-[176px]" : "ml-[224px]"} min-h-screen`}>
        <header className="sticky top-0 z-10 flex h-[62px] items-center justify-between border-b border-[#e4e4e0] bg-white/90 px-7 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span>定制工作台</span>
            <span className="text-neutral-300">/</span>
            <span className="font-medium text-neutral-900">
              {profile.basics.targetRole || "新的职位"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Archive size={13} />
              {saveState}
            </div>
            {score > 0 ? (
              <div className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-700">
                文本匹配度 {score}
              </div>
            ) : null}
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

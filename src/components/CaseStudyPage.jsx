import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Expand,
  ExternalLink,
  Minimize2,
  RotateCcw,
  Trash2,
} from "lucide-react";
import "../case-study.css";

const GITHUB_URL = "https://github.com/madelainewang-netizen/resumer";

const audienceCards = [
  {
    label: "背景",
    title: "一份基础简历，多个目标岗位",
    text: "实习、课程项目和校园经历比较零散，正在一段时间内集中投递。",
  },
  {
    label: "任务",
    title: "为每个 JD 重新组织证据",
    text: "理解岗位真正看重什么，再从有限经历中找出最相关的行动与结果。",
  },
  {
    label: "阻碍",
    title: "会改关键词，不会做内容判断",
    text: "不知道招聘方需要什么证据，也不擅长把过程写成具体、可信的表达。",
  },
  {
    label: "顾虑",
    title: "AI 会不会写得不像自己",
    text: "担心润色变成夸大或捏造，也担心为了匹配分数牺牲真实性。",
  },
];

const researchItems = [
  {
    type: "通用 AI 对话",
    strength: "灵活，几乎什么都能问",
    limit: "依赖用户自己设计 Prompt，输出结构和深度不稳定。",
  },
  {
    type: "模板型简历工具",
    strength: "排版成熟，上手直接",
    limit: "擅长装下内容，却很少帮助用户判断不同 JD 应该写什么。",
  },
  {
    type: "ATS 匹配工具",
    strength: "快速显示关键词覆盖",
    limit: "容易让人追逐分数，却没有回答证据是否真实、是否足够。",
  },
];

const evidenceSteps = [
  { label: "岗位要求", note: "拆出能力与任务" },
  { label: "经历缺口", note: "标记尚未被证明的要求" },
  { label: "AI 追问", note: "围绕行动、对象与结果提问" },
  { label: "真实证据", note: "用户补回亲自做过的事" },
  { label: "定制表达", note: "按 JD 重组，不改写事实" },
];

const decisions = [
  {
    index: "01",
    title: "证据先于改写",
    text: "简历的问题常常不是句子不够漂亮，而是关键经历还没有被想起来。AI 先追问，再动笔。",
  },
  {
    index: "02",
    title: "真实性先于匹配分",
    text: "没有证据就暴露缺口，不自动补齐。匹配分只表示文本覆盖程度，不代表面试或录用概率。",
  },
  {
    index: "03",
    title: "把最后决定留给用户",
    text: "每条建议都可以采用、删除、恢复或反悔。AI 提供候选表达，但不会直接覆盖原始内容。",
  },
];

const iterations = [
  ["输入", "手动填写", "PDF 结构化导入"],
  ["方法", "直接改写", "经历缺口与证据教练"],
  ["控制", "一次性优化", "逐条采用、删除与恢复"],
  ["版面", "内容能放进去", "A4 密度、照片和布局调优"],
  ["上线", "本地可运行", "Vercel 与 PDF worker 生产排查"],
];

const metrics = [
  "首次完成一份定制简历所需时间",
  "AI 建议采用率与恢复率",
  "用户补充有效经历证据的比例",
  "导出完成率",
  "样本足够后再观察面试邀请率变化",
];

function SectionIntro({ eyebrow, title, children }) {
  return (
    <header className="case-section-intro">
      <p className="case-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children ? <div className="case-section-lede">{children}</div> : null}
    </header>
  );
}

function CaseNav() {
  return (
    <header className="case-nav">
      <div className="case-container case-nav-inner">
        <a className="case-wordmark" href="#top" aria-label="Resumer 案例页顶部">
          RESUMER <span>/ CASE STUDY</span>
        </a>
        <nav aria-label="案例页导航">
          <a href="#origin">项目起点</a>
          <a href="#evidence">产品闭环</a>
          <a href="#demo">产品体验</a>
        </nav>
      </div>
    </header>
  );
}

function WorkflowMiniature() {
  return (
    <div className="workflow-miniature" aria-label="从基础简历到定制表达的产品流程缩影">
      <div className="workflow-toolbar">
        <span />
        <span />
        <span />
        <p>一次定制任务 · AI 产品助理</p>
      </div>
      <div className="workflow-stage">
        <article className="mini-resume-card">
          <div className="mini-card-label">BASE RESUME</div>
          <div className="mini-profile-row">
            <span className="mini-avatar">陈</span>
            <div>
              <strong>陈雨桐</strong>
              <small>传播学 · 2026 届</small>
            </div>
          </div>
          <p>参与 AI 写作功能内测和案例收集，记录用户使用障碍。</p>
        </article>

        <ArrowDown className="workflow-arrow" size={18} aria-hidden="true" />

        <div className="mini-gap-row">
          <article>
            <div className="mini-card-label">JD GAP</div>
            <strong>用户研究与需求整理</strong>
            <p>有相关经历，但缺少方法和交付物。</p>
          </article>
          <article className="mini-question-card">
            <div className="mini-card-label">AI QUESTION</div>
            <p>你整理了多少条反馈？最后形成了什么交付物？</p>
          </article>
        </div>

        <ArrowDown className="workflow-arrow" size={18} aria-hidden="true" />

        <article className="mini-evidence-card">
          <div className="mini-evidence-head">
            <span className="mini-card-label">TAILORED EVIDENCE</span>
            <span className="mini-verified"><Check size={11} /> 已确认事实</span>
          </div>
          <p>
            整理 <strong>60+ 条用户反馈</strong>，按场景归纳为 5 类问题清单，支持产品团队确定内测优化优先级。
          </p>
        </article>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="case-hero case-container" id="top">
      <div className="case-hero-copy">
        <p className="case-eyebrow">CASE STUDY · RESUMER</p>
        <h1>一个文科生的 AI 产品实验</h1>
        <p className="case-hero-hook">
          为了找一份 AI 产品工作，我先做了一个帮自己找工作的 AI 产品。
        </p>
        <p className="case-hero-summary">
          我独立完成了问题定义、产品设计、AI 工作流，以及从开发到部署的完整落地。它不是一份概念稿，而是我拿自己的真实简历跑通过的产品实验。
        </p>
        <div className="case-actions" aria-label="案例页主要操作">
          <a className="case-button case-button-primary" href="#demo">体验产品</a>
          <a className="case-button" href="#origin">阅读案例</a>
          <a className="case-text-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
            查看 GitHub <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
      </div>
      <WorkflowMiniature />
    </section>
  );
}

function Origin() {
  return (
    <section className="case-section case-origin" id="origin">
      <div className="case-container case-reading-grid">
        <SectionIntro
          eyebrow="01 / ORIGIN"
          title="它最初不是一个创业点子，只是我想让改简历这件事简单一点。"
        />
        <div className="case-prose">
          <p>
            准备转向 AI 产品岗位时，我每看到一个新 JD，都要重新解释岗位要求、挑选相关经历、改写句子，再把所有内容压回一页。真正耗时的并不是打字，而是一遍遍做内容判断。
          </p>
          <p>
            我开始追问：AI 能不能先理解这个岗位在找什么，再帮助我找回真实做过的事？如果证据还不够，它能不能先问对问题，而不是立刻把一句普通经历润色得更像“标准答案”？
          </p>
          <blockquote>
            问题从“怎么把简历写漂亮”，变成了“怎么为一个岗位找到可信的职业证据”。
          </blockquote>
        </div>
      </div>
    </section>
  );
}

function Audience() {
  return (
    <section className="case-section" id="audience">
      <div className="case-container">
        <SectionIntro eyebrow="02 / FIRST USER HYPOTHESIS" title="从自己的困扰，先提出一版用户假设。">
          <p>
            第一阶段聚焦正在集中投递的在校生和应届毕业生。这是基于个人经验与案头研究形成的第一版假设，
            <strong>不是已经验证的用户研究结论</strong>，后续仍需要真实访谈和可用性测试。
          </p>
        </SectionIntro>
        <div className="audience-grid">
          {audienceCards.map((item) => (
            <article className="case-card audience-card" key={item.label}>
              <p className="case-card-label">{item.label}</p>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Research() {
  return (
    <section className="case-section case-canvas-section" id="research">
      <div className="case-container">
        <SectionIntro eyebrow="03 / DESK RESEARCH" title="工具很多，但工作流仍然断在中间。">
          <p>
            我比较的不是谁的功能更多，而是三类替代方案如何完成同一项任务。这里不虚构市场规模，也不声称已经提升面试率。
          </p>
        </SectionIntro>
        <div className="research-list" role="list">
          {researchItems.map((item) => (
            <article className="research-row" role="listitem" key={item.type}>
              <h3>{item.type}</h3>
              <p><span>能解决</span>{item.strength}</p>
              <p><span>仍缺少</span>{item.limit}</p>
            </article>
          ))}
        </div>
        <div className="opportunity-note">
          <p className="case-card-label">PRODUCT OPPORTUNITY</p>
          <p>
            机会不是再做一个润色框，而是把 <strong>JD 理解、经历选择、证据补充、内容改写、一页精简</strong> 接成连续工作流。
          </p>
        </div>
      </div>
    </section>
  );
}

function EvidenceChain() {
  return (
    <section className="case-section evidence-section" id="evidence">
      <div className="case-container">
        <SectionIntro eyebrow="04 / SIGNATURE WORKFLOW" title="职业证据链：先找回事实，再生成表达。">
          <p>蓝色只出现在这条证据流上，因为它代表 AI 与用户共同确认的信息如何向前传递。</p>
        </SectionIntro>
        <ol className="evidence-chain">
          {evidenceSteps.map((step, index) => (
            <li key={step.label} style={{ "--evidence-index": index }}>
              <div className="evidence-node"><span>{index + 1}</span></div>
              <div className="evidence-copy">
                <h3>{step.label}</h3>
                <p>{step.note}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="evidence-control-note">
          <span>AI 负责结构化、比较和追问</span>
          <span>用户负责确认事实与最终表达</span>
        </div>
      </div>
    </section>
  );
}

function Decisions() {
  return (
    <section className="case-section" id="decisions">
      <div className="case-container">
        <SectionIntro eyebrow="05 / PRODUCT DECISIONS" title="三个取舍，定义了它不是什么。" />
        <div className="decision-grid">
          {decisions.map((decision) => (
            <article className="decision-card" key={decision.index}>
              <span>{decision.index}</span>
              <h3>{decision.title}</h3>
              <p>{decision.text}</p>
            </article>
          ))}
        </div>
        <div className="control-strip" aria-label="用户可控操作">
          <span><Check size={14} /> 采用</span>
          <span><Trash2 size={14} /> 删除</span>
          <span><RotateCcw size={14} /> 恢复与反悔</span>
        </div>
      </div>
    </section>
  );
}

function ProductDemo() {
  const [expanded, setExpanded] = useState(false);
  const [failed, setFailed] = useState(false);
  const frameRef = useRef(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const handleError = () => setFailed(true);
    frame.addEventListener("error", handleError);
    return () => frame.removeEventListener("error", handleError);
  }, []);

  return (
    <section className="case-section case-demo-section" id="demo">
      <div className="case-container">
        <div className="demo-heading-row">
          <SectionIntro eyebrow="06 / RUNNABLE PRODUCT" title="不是原型图，直接走一遍产品。">
            <p>内置的是一名虚构、脱敏的应届生案例。演示不会调用付费 AI，也不会读写你的本地简历。</p>
          </SectionIntro>
          <div className="demo-actions">
            <button
              className="case-button"
              type="button"
              aria-expanded={expanded}
              aria-controls="resumer-demo-frame"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? <Minimize2 size={15} /> : <Expand size={15} />}
              {expanded ? "收起体验" : "展开体验"}
            </button>
            <a className="case-text-link" href="/?demo=1" target="_blank" rel="noreferrer">
              新窗口打开 <ExternalLink size={14} />
            </a>
          </div>
        </div>
        <div
          className={`product-demo-frame${expanded ? " is-expanded" : ""}`}
          data-testid="product-demo-frame"
          id="resumer-demo-frame"
        >
          <div className="browser-chrome" aria-hidden="true">
            <span /><span /><span />
            <p>resumer / demo workspace</p>
          </div>
          {failed ? (
            <div className="demo-fallback" role="status">
              <p className="case-card-label">EMBED UNAVAILABLE</p>
              <h3>演示工作台没有在当前页面加载。</h3>
              <p>你仍然可以在独立窗口中体验同一份脱敏案例。</p>
              <a className="case-button case-button-primary" href="/?demo=1">打开完整产品</a>
            </div>
          ) : (
            <iframe
              ref={frameRef}
              title="Resumer 应届生演示工作台"
              src="/?demo=1&embed=1"
              loading="lazy"
            />
          )}
        </div>
      </div>
    </section>
  );
}

function IterationTimeline() {
  return (
    <section className="case-section" id="iterations">
      <div className="case-container case-reading-grid">
        <SectionIntro eyebrow="07 / ITERATION LOG" title="每一次迭代，都在缩短想法与可用产品之间的距离。">
          <p>它先解决最痛的内容决策，再逐步补齐导入、控制、版面和生产环境。</p>
        </SectionIntro>
        <ol className="iteration-list">
          {iterations.map(([label, before, after], index) => (
            <li key={label}>
              <span className="iteration-index">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p className="case-card-label">{label}</p>
                <p><s>{before}</s><span aria-hidden="true">→</span><strong>{after}</strong></p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function RoleAndStack() {
  const productWork = ["问题定义与 MVP 范围", "信息架构与交互设计", "Prompt 与结构化输出", "端到端测试与迭代"];
  const stack = ["React", "Tailwind", "DeepSeek", "PDF", "localStorage", "Vercel"];

  return (
    <section className="case-section case-canvas-section" id="role">
      <div className="case-container role-grid">
        <SectionIntro eyebrow="08 / ROLE & STACK" title="既做产品判断，也把它真正跑起来。">
          <p>技术栈不是装饰，而是为了验证产品假设、理解边界，并在生产环境出问题时能够定位原因。</p>
        </SectionIntro>
        <article className="role-card">
          <p className="case-card-label">PRODUCT RESPONSIBILITIES</p>
          <ul>{productWork.map((item) => <li key={item}>{item}</li>)}</ul>
        </article>
        <article className="role-card">
          <p className="case-card-label">TECHNICAL UNDERSTANDING</p>
          <div className="stack-list">{stack.map((item) => <span key={item}>{item}</span>)}</div>
          <p>覆盖 PDF 解析与生成、本地状态隔离、AI 接口、Vercel Functions，以及部署调试。</p>
        </article>
      </div>
    </section>
  );
}

function Reflection() {
  return (
    <section className="case-section case-reflection" id="reflection">
      <div className="case-container">
        <SectionIntro eyebrow="09 / REFLECTION" title="现在有一个能跑的 MVP，但还没有一个被验证的结论。">
          <p>
            当前成果是完成可运行 MVP，并用我自己的真实简历完成端到端测试。下一步会邀请在校生和应届毕业生测试，验证工作流是否真的减少重复判断，同时守住真实性。
          </p>
        </SectionIntro>
        <div className="reflection-grid">
          <div>
            <p className="case-card-label">NEXT TESTS</p>
            <h3>先观察行为，再谈结果。</h3>
          </div>
          <ul>
            {metrics.map((metric) => <li key={metric}><span />{metric}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

function CaseFooter() {
  return (
    <footer className="case-footer">
      <div className="case-container case-footer-inner">
        <div>
          <p className="case-eyebrow">RESUMER · AI PRODUCT CASE STUDY</p>
          <p>把一次真实求职困扰，做成一个可以验证的产品。</p>
        </div>
        <nav aria-label="页尾链接">
          <a href="/">打开产品 <ArrowUpRight size={14} /></a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14} /></a>
        </nav>
      </div>
    </footer>
  );
}

export default function CaseStudyPage() {
  return (
    <div className="case-study-page">
      <CaseNav />
      <main>
        <Hero />
        <Origin />
        <Audience />
        <Research />
        <EvidenceChain />
        <Decisions />
        <ProductDemo />
        <IterationTimeline />
        <RoleAndStack />
        <Reflection />
      </main>
      <CaseFooter />
    </div>
  );
}

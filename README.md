# Resumer

Resumer 是一个面向中文求职场景的简历定制工作台。用户维护一份真实的结构化简历档案，粘贴目标 JD 后获得岗位拆解、逐条表达建议、可解释的文本匹配评分，并导出单页 A4 PDF。

## 功能

- 结构化维护基本信息、工作经历、项目、教育和技能
- 支持上传已有 PDF 简历，解析为可编辑字段并保留原始区块顺序
- 支持独立上传 JPG/PNG 证件照，自动裁切压缩且不发送给 AI
- localStorage 自动保存与历史版本快照
- 可切换的大模型服务（DeepSeek / 通义千问 / Kimi / 智谱等 OpenAI 兼容接口）
- AI 只返回改写文字，公司、日期等事实字段不经过模型；格式错误自动重试一次
- 改写中出现原文没有的数字时自动标记“需核实”
- 原文/建议对照、逐条确认和一键恢复
- 固定规则计算硬技能、核心要求证据和经历相关性
- `@react-pdf/renderer` 生成支持中文的 A4 PDF，最终检查页直接预览真实 PDF，所见即所得
- 网页实时预览与 PDF 共用同一套内容模型、字体和版式参数

## 技术栈

- React 19 + Vite
- Tailwind CSS 4
- OpenAI 兼容的 Chat Completions API（默认 DeepSeek）
- Vercel Functions
- Zod
- `@react-pdf/renderer`
- Vitest

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

`npm run dev` 会同时启动 Vite 前端和本地 `/api/*` 路由。JD 分析与简历优化在未配置 key 时仍可使用演示结果；PDF 简历导入必须配置真实 API key。

在 `.env.local` 中配置：

```bash
AI_PROVIDER=deepseek   # 或 qwen / moonshot / zhipu
AI_API_KEY=your_key_here
# AI_MODEL=deepseek-chat  # 可选，覆盖默认模型
```

旧的 `DEEPSEEK_API_KEY` / `DEEPSEEK_MODEL` 仍然有效。

API key 只在服务端读取，不会进入浏览器构建产物。

## 产品案例页

- 工作台：http://localhost:5173/
- AI 产品案例：http://localhost:5173/case-study
- 脱敏演示工作台：http://localhost:5173/?demo=1&embed=1
- 脱敏演示状态使用内置的虚构数据，不会读取或写入本地简历，也不会调用 AI API。

## 验证

```bash
npm test
npm run build
```

## 数据与隐私

- 简历档案、当前定制会话和历史版本默认保存在当前浏览器。
- 上传的证件照会压缩为本地 Data URL，仅用于页面预览与 PDF 导出。
- PDF 简历导入时，文字与版面顺序先在服务端本地提取，再发送给配置的大模型转换为结构化字段。
- 执行 JD 分析和简历优化时，相应文本会发送给配置的大模型 API。
- AI 不应创建用户未提供的数字、职责、技能或成果；用户仍需逐条确认建议。
- “文本匹配度”只表示简历内容与 JD 的覆盖程度，不代表面试或录用概率。

## 界面截图

在产品视觉验收后可在此处补充：

- 基础资料工作台
- JD 分析与证据覆盖
- 原文/建议对照编辑
- 最终检查与 A4 PDF 预览

## 字体许可

PDF 使用 [Noto Sans SC](https://github.com/notofonts/noto-cjk)，字体遵循 SIL Open Font License。

`public/fonts/` 中是从 Noto Sans SC 可变字体导出的 Regular / Bold 静态字重（保留常用汉字、拉丁字符与标点）。react-pdf 不支持可变字体，必须使用静态字重，否则整份 PDF 会以 Thin 字重输出、粗体失效。重新生成：`python3 scripts/build-fonts.py <NotoSansSC-VF.ttf>`。

## 改写规则（Skill）

AI 改写时加载的规则在 `api/_lib/skills/`：

- `resumeSop.js`：简历修改 SOP——简历书面体、STAR 结构、动词与归因、删减与自查。
- `jdTailoring.js`：岗位定制改写——选岗位能力 → 给每条经历找直接或可迁移的对口能力 → 改正文与小标题。

方法论部分参考并转述了以下开源项目（未照搬原文）：

- [StoneLL1/resume-builder](https://github.com/StoneLL1/resume-builder)（MIT）中的《Resume Writing Guide for LLMs》
- [youngbeauty/GodSU](https://github.com/youngbeauty/GodSU) 中的 resume-crafting

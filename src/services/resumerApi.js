import { sampleAnalysis } from "../data/defaults";

async function streamRequest(endpoint, payload, onProgress) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : {};
    const fallback =
      response.status === 404
        ? "本地 API 未启动，请重新运行 npm run dev"
        : `请求失败 (${response.status})`;
    throw new Error(body.error || fallback);
  }

  if (!response.body) return response.json();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const line = event
        .split("\n")
        .find((part) => part.startsWith("data: "));
      if (!line) continue;
      const data = JSON.parse(line.slice(6));
      if (data.type === "progress") onProgress?.(data.message);
      if (data.type === "result") result = data.data;
      if (data.type === "error") throw new Error(data.message);
    }
  }

  if (!result) throw new Error("AI 返回内容不完整，请重试");
  return result;
}

export async function analyzeJD(jdText, onProgress) {
  try {
    return await streamRequest("/api/analyze-jd", { jdText }, onProgress);
  } catch (error) {
    if (import.meta.env.DEV && /404|fetch|network/i.test(error.message)) {
      onProgress?.("正在使用本地演示分析");
      await new Promise((resolve) => setTimeout(resolve, 650));
      return structuredClone(sampleAnalysis);
    }
    throw error;
  }
}

function demoTailor(profile, analysis) {
  const keywords = analysis.hardSkills.slice(0, 4);
  const clone = structuredClone(profile);
  const improve = (text, index) => {
    if (!text) return text;
    const keyword = keywords[index % keywords.length];
    return `${keyword || "核心成果"}：${text.replace(/[。；;]$/, "")}，明确关键动作与交付结果。`;
  };
  clone.experience = clone.experience.map((item) => ({
    ...item,
    bullets: item.bullets.map((bullet, index) => ({
      ...bullet,
      originalText: bullet.text,
      text: improve(bullet.text, index),
      verificationRequired: false,
    })),
  }));
  clone.projects = clone.projects.map((item) => ({
    ...item,
    bullets: item.bullets.map((bullet, index) => ({
      ...bullet,
      originalText: bullet.text,
      text: improve(bullet.text, index + 1),
      verificationRequired: false,
    })),
  }));
  clone.customSections = clone.customSections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      bullets: item.bullets.map((bullet, index) => ({
        ...bullet,
        originalText: bullet.text,
        text: improve(bullet.text, index + 2),
        verificationRequired: false,
      })),
    })),
  }));
  return clone;
}

export async function tailorResume(profile, analysis, onProgress) {
  try {
    const result = await streamRequest(
      "/api/tailor-resume",
      { profile: withoutPhoto(profile), analysis },
      onProgress,
    );
    return {
      ...result,
      basics: { ...result.basics, photo: profile.basics.photo || "" },
    };
  } catch (error) {
    if (import.meta.env.DEV && /404|fetch|network/i.test(error.message)) {
      onProgress?.("正在使用本地演示改写");
      await new Promise((resolve) => setTimeout(resolve, 800));
      return demoTailor(profile, analysis);
    }
    throw error;
  }
}

function demoCondense(profile) {
  const recommendations = ["experience", "projects"].flatMap((section) =>
    profile[section].flatMap((item) =>
      item.bullets.map((bullet) => {
        const text = bullet.text || "";
        const action = text.length > 68 ? "condense" : "keep";
        return {
          section,
          itemId: item.id,
          bulletId: bullet.id,
          action,
          reason:
            action === "condense"
              ? "这条内容较长，可以保留核心行动并压缩背景描述。"
              : "这条内容能够提供与目标岗位相关的独特证据。",
          suggestedText:
            action === "condense" ? `${text.slice(0, 64).replace(/[，,、；;]$/, "")}。` : text,
        };
      }),
    ),
  );
  return {
    summary: "已按岗位相关度和信息密度检查经历，建议优先压缩较长描述。",
    recommendations,
  };
}

export async function condenseResume(profile, analysis, onProgress) {
  try {
    return await streamRequest(
      "/api/condense-resume",
      { profile: withoutPhoto(profile), analysis },
      onProgress,
    );
  } catch (error) {
    if (import.meta.env.DEV && /404|fetch|network/i.test(error.message)) {
      onProgress?.("正在使用本地精简分析");
      await new Promise((resolve) => setTimeout(resolve, 600));
      return demoCondense(profile);
    }
    throw error;
  }
}

export async function explainMatch(profile, analysis, score, onProgress) {
  try {
    return await streamRequest(
      "/api/explain-match",
      { profile: withoutPhoto(profile), analysis, score },
      onProgress,
    );
  } catch (error) {
    if (import.meta.env.DEV && /404|fetch|network/i.test(error.message)) {
      onProgress?.("正在使用本地招聘视角审阅");
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        strengths: [
          "具备用户研究与数据分析的组合证据，和岗位核心工作方式较一致",
          "经历中包含跨团队交付场景，能够支撑产品推进能力",
          "B2B SaaS 方向和目标岗位具备直接相关性",
        ],
        suggestions: [
          "补充项目管理相关的具体方法，例如排期、风险管理或协作机制",
          "为产品规划经历明确负责范围和关键决策",
          "将低相关运营描述进一步压缩，为核心产品经历留出空间",
        ],
        evidenceGaps: score.missingKeywords.map(
          (keyword) => `“${keyword}”目前只有关键词缺口，尚无可验证经历`,
        ),
      };
    }
    throw error;
  }
}

export async function importResumePDF(payload, onProgress) {
  return streamRequest("/api/import-resume", payload, onProgress);
}

export async function getEvidenceQuestions(payload, onProgress) {
  return streamRequest(
    "/api/evidence-coach",
    { ...payload, action: "questions", profile: withoutPhoto(payload.profile) },
    onProgress,
  );
}

export async function createEvidenceDraft(payload, onProgress) {
  return streamRequest(
    "/api/evidence-coach",
    { ...payload, action: "draft", profile: withoutPhoto(payload.profile) },
    onProgress,
  );
}

function withoutPhoto(profile) {
  return {
    ...profile,
    basics: { ...profile.basics, photo: "" },
  };
}

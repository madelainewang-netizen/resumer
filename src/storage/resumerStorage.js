import { emptyProfile } from "../data/defaults";
import { profileSchema } from "../schemas";
import { mergeDuplicateEntries } from "../utils/evidence";
import { profileSignature } from "../utils/profileSignature";

const PROFILE_KEY = "resumer.profile.v1";
const SESSION_KEY = "resumer.session.v1";
const VERSIONS_KEY = "resumer.versions.v1";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeProfile(stored, { mergeDuplicates = true } = {}) {
  const candidate = {
    ...structuredClone(emptyProfile),
    ...(stored || {}),
    source: { ...emptyProfile.source, ...(stored?.source || {}) },
    basics: { ...emptyProfile.basics, ...(stored?.basics || {}) },
    sectionOrder: stored?.sectionOrder?.length
      ? stored.sectionOrder
      : emptyProfile.sectionOrder,
    customSections: stored?.customSections || [],
  };
  const parsed = profileSchema.safeParse(candidate);
  if (!parsed.success) return structuredClone(emptyProfile);
  // 修复旧版本"补充经历"另起一段造成的重复经历
  return mergeDuplicateEntries ? mergeDuplicateEntries(parsed.data) : parsed.data;
}

export function loadProfile() {
  return normalizeProfile(readJSON(PROFILE_KEY, emptyProfile));
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadSession() {
  const session = readJSON(SESSION_KEY, {
    jdText: "",
    analysis: null,
    tailoredProfile: null,
    tailoredSourceSignature: "",
    tailorWorkspaceState: {},
    matchExplanation: null,
    activeStep: "profile",
    updatedAt: null,
  });
  // 合并重复经历会改变档案签名；如果定制结果原本对应的是合并前的档案，同步更新签名，避免被当成过期
  const rawProfile = readJSON(PROFILE_KEY, emptyProfile);
  const before = profileSignature(normalizeProfile(rawProfile, { mergeDuplicates: false }));
  const after = profileSignature(normalizeProfile(rawProfile));
  return {
    ...session,
    tailoredSourceSignature:
      session.tailoredSourceSignature === before ? after : session.tailoredSourceSignature,
    tailoredProfile: session.tailoredProfile
      ? normalizeProfile(session.tailoredProfile)
      : null,
  };
}

export function saveSession(session) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ ...session, updatedAt: new Date().toISOString() }),
  );
}

export function loadVersions() {
  return readJSON(VERSIONS_KEY, []);
}

export function saveVersion(version) {
  const versions = loadVersions();
  const next = [version, ...versions].slice(0, 20);
  localStorage.setItem(VERSIONS_KEY, JSON.stringify(next));
  return next;
}

export function clearAllData() {
  localStorage.removeItem(PROFILE_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(VERSIONS_KEY);
}

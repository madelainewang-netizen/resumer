const CJK_PATTERN = /[\u3400-\u9fff\uf900-\ufaff]/;
const BREAK_AFTER_PATTERN = /[\u3400-\u9fff\uf900-\ufaff，。；：、,;:.@/_-]/;
const CLOSING_PUNCTUATION_PATTERN = /[，。；：、,;:.!?]/;
const DEFAULT_MAX_LINE_UNITS = 58;
const FORCE_MAX_LINE_UNITS = 66;

export function hyphenateResumeWord(word) {
  return [word];
}

export function wrapResumeText(value, { maxUnits = DEFAULT_MAX_LINE_UNITS } = {}) {
  const chars = Array.from(String(value || ""));
  let lineUnits = 0;
  let output = "";

  chars.forEach((char, index) => {
    output += char;

    if (char === "\n") {
      lineUnits = 0;
      return;
    }

    lineUnits += getCharUnits(char);

    const nextChar = chars[index + 1];
    if (!nextChar) return;

    const canBreakHere =
      BREAK_AFTER_PATTERN.test(char) &&
      !CLOSING_PUNCTUATION_PATTERN.test(nextChar);
    const shouldWrap =
      (lineUnits >= maxUnits && canBreakHere) ||
      lineUnits >= FORCE_MAX_LINE_UNITS;

    if (shouldWrap) {
      output += "\n";
      lineUnits = 0;
    }
  });

  return output;
}

function getCharUnits(char) {
  if (CJK_PATTERN.test(char)) return 1;
  if (/\s/.test(char)) return 0.35;
  return 0.55;
}

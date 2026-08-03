const CJK_PATTERN = /[\u3400-\u9fff\uf900-\ufaff]/;

export function hyphenateResumeWord(word) {
  if (!CJK_PATTERN.test(word)) return [word];

  const parts = [];
  let latinRun = "";

  for (const char of Array.from(word)) {
    if (CJK_PATTERN.test(char)) {
      if (latinRun) {
        parts.push(latinRun);
        latinRun = "";
      }
      parts.push(char);
    } else {
      latinRun += char;
    }
  }

  if (latinRun) parts.push(latinRun);
  return parts;
}

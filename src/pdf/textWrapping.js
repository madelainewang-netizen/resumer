/**
 * react-pdf 只会在空格处换行，整句中文会被当成一个"超长单词"，
 * 结果要么溢出页边距，要么被强行加连字符。
 *
 * 这里通过 hyphenation callback 把中文拆成可断开的片段，让 react-pdf 按真实宽度自然换行，
 * 同时遵守基础的中文排版规则：
 * - 句末标点（，。、；：！？）」等）不出现在行首
 * - 开括号（（「“等）不出现在行尾
 * - 英文单词、数字和百分比（如 18%、2024.06、GPT-4）保持完整
 *
 * 片段之间插入空字符串是 react-pdf 的约定写法：在空字符串处断行时不会插入可见的连字符。
 */

const CJK = /[⺀-⿟぀-ヿ㐀-䶿一-鿿豈-﫿ｦ-ﾟ]/;
// 不能出现在行首的字符（避头）
const NO_LINE_START = /[，。、；：！？）」』】〉》〕”’%‰…—·,.;:!?)\]}%]/;
// 不能出现在行尾的字符（避尾）
const NO_LINE_END = /[（「『【〈《〔“‘(\[{]/;
// 超长的英文串（网址、邮箱）允许在这些字符后断开
const URL_BREAK_AFTER = /[/._\-@?&=]/;
const LONG_LATIN = 28;

function segment(word) {
  const chars = Array.from(word);
  const segments = [];
  let latin = "";

  const flushLatin = () => {
    if (!latin) return;
    if (latin.length > LONG_LATIN) {
      let piece = "";
      for (const char of latin) {
        piece += char;
        if (URL_BREAK_AFTER.test(char) && piece.length >= 6) {
          segments.push(piece);
          piece = "";
        }
      }
      if (piece) segments.push(piece);
    } else {
      segments.push(latin);
    }
    latin = "";
  };

  for (const char of chars) {
    if (CJK.test(char) || NO_LINE_START.test(char) || NO_LINE_END.test(char)) {
      flushLatin();
      segments.push(char);
    } else {
      latin += char;
    }
  }
  flushLatin();

  // 合并违反避头尾规则的片段
  const merged = [];
  for (const piece of segments) {
    const previous = merged[merged.length - 1];
    if (
      previous !== undefined &&
      (NO_LINE_START.test(Array.from(piece)[0]) || NO_LINE_END.test(Array.from(previous).at(-1)))
    ) {
      merged[merged.length - 1] = previous + piece;
    } else {
      merged.push(piece);
    }
  }
  return merged;
}

export function hyphenateResumeWord(word) {
  if (!word || (!CJK.test(word) && Array.from(word).length <= LONG_LATIN)) return [word];
  const pieces = segment(word);
  if (pieces.length <= 1) return [word];
  return pieces.flatMap((piece, index) => (index === pieces.length - 1 ? [piece] : [piece, ""]));
}

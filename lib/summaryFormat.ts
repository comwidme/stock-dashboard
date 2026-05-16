/** 뉴스 요약 문자열 정규화·검증 (순수 함수) */

export const latinLetterRatio = (s: string): number => {
  const letters = s.replace(/\s+/g, "");
  if (!letters) return 0;
  const latin = letters.replace(/[^A-Za-z]/g, "").length;
  return latin / letters.length;
};

export const normalizeBulletLines = (raw: string): string => {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines
    .map((l) => {
      const m = l.match(/^[-*•·]\s*(.+)$/);
      return m?.[1]?.trim() ?? "";
    })
    .filter(Boolean)
    .map((t) => `- ${t}`);

  return bullets.join("\n");
};

/** 티커·고유명사가 많은 뉴스를 위해 라틴 비율 허용치를 조금 넓힘 */
export const isAcceptableKoSummary = (s: string): boolean => {
  if (!s) return false;
  if (latinLetterRatio(s) > 0.4) return false;
  const lines = s.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return false;
  return lines.every((l) => /^-\s+/.test(l.trim()));
};

/** 불릿 단위로만 잘라 500자 이내로 맞춤(문장 중간 절단 방지) */
export const clampBulletsUnderMaxChars = (bullets: string, maxChars: number): string => {
  const lines = bullets.split("\n").map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];
  let count = 0;
  for (const line of lines) {
    const sep = out.length > 0 ? 1 : 0;
    if (count + sep + line.length > maxChars) break;
    out.push(line);
    count += sep + line.length;
  }
  return out.join("\n");
};

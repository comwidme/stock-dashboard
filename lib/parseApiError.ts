/** API/네트워크 오류 메시지를 사용자에게 읽기 쉽게 정리 */
export const parseApiErrorMessage = (raw: string): string => {
  const trimmed = raw.trim();
  if (!trimmed) return "요청에 실패했습니다.";

  try {
    const parsed = JSON.parse(trimmed) as { message?: string };
    if (typeof parsed.message === "string" && parsed.message) {
      return parsed.message;
    }
  } catch {
    /* not JSON */
  }

  if (trimmed === "fetch failed") {
    return "서버 연결에 실패했습니다. 네트워크와 API 키 설정을 확인해주세요.";
  }

  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
};

// 품종 의미 검색 (문장으로 찾기) · 챗봇 화면 문구

export const SENTENCE_QUERY_MIN = 2;
export const SENTENCE_QUERY_MAX = 100;
export const CHAT_MESSAGE_MAX = 300;

// 문장으로 찾기 예시 (누르면 바로 검색)
export const SENTENCE_EXAMPLES = [
  '햇빛 적은 방에서 키우기 쉬운 식물',
  '물을 자주 못 줘도 잘 자라는 식물',
  '몬스테라처럼 잎이 큰 식물',
  '개업 선물로 좋은 식물',
];

// 챗봇 첫 화면 예시 질문
export const CHAT_EXAMPLES = [
  '햇빛 적은 방에서 키우기 쉬운 식물 있어?',
  '물을 자주 못 주는 바쁜 직장인한테 맞는 식물은?',
  '개업 선물로 뭐가 좋아?',
];

// 의미 검색 오류 → 안내 문구 (BE AiErrorCode · Gateway 요청 수 제한)
export function getSentenceSearchErrorMessage(error) {
  const status = error.response?.status;
  const code = error.response?.data?.code;
  if (code === 'INVALID_SEARCH_QUERY')
    return `문장은 ${SENTENCE_QUERY_MIN} ~ ${SENTENCE_QUERY_MAX}자로 입력해 주세요.`;
  if (status === 503)
    return '지금은 문장으로 찾기를 쓸 수 없어요. 잠시 후 다시 시도하거나 이름으로 검색해 주세요.';
  if (status === 429) return '검색 요청이 많아요. 잠시 후 다시 시도해 주세요.';
  return error.response?.data?.message ?? '검색하지 못했어요. 잠시 후 다시 시도해 주세요.';
}

// 챗봇 오류 → { message, resetConversation }
// 403 · 404는 이어 갈 대화가 없으므로 대화 ID를 버리고 새 대화로 다시 보내게 함
export function getChatErrorInfo(error) {
  const status = error.response?.status;
  const code = error.response?.data?.code;
  if (code === 'CONVERSATION_FORBIDDEN' || code === 'CONVERSATION_NOT_FOUND') {
    return {
      message: '이전 대화를 이어 갈 수 없어 새 대화로 바꿨어요. 질문을 다시 보내 주세요.',
      resetConversation: true,
    };
  }
  if (status === 401)
    return { message: '로그인이 만료됐어요. 다시 로그인해 주세요.', resetConversation: true };
  if (status === 503)
    return {
      message: '지금은 챗봇이 답할 수 없어요. 잠시 후 다시 시도해 주세요.',
      resetConversation: false,
    };
  if (status === 429)
    return {
      message: '질문이 너무 빨라요. 몇 초 뒤에 다시 보내 주세요.',
      resetConversation: false,
    };
  if (status === 504 || error.code === 'ECONNABORTED') {
    return {
      message: '답변이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.',
      resetConversation: false,
    };
  }
  return {
    message: error.response?.data?.message ?? '답변을 받지 못했어요. 잠시 후 다시 시도해 주세요.',
    resetConversation: false,
  };
}

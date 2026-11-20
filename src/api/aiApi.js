import client from './client';

// 품종 의미 검색 (공개). query 2 ~ 100자, size 1 ~ 10(기본 5)
// → data: { items: [{ speciesId, name, similarity, productIds }] } (유사도 순, productIds는 판매 중 최신 3개)
export function searchSpeciesBySentence(query, size = 5) {
  return client.get('/api/v1/speciesSearches', { params: { query, size } });
}

// 챗봇 (로그인). message 1 ~ 300자, conversationId가 없으면 새 대화
// → data: { conversationId, answer, answerGenerated,
//           products: [{ productId, title, price, thumbnailUrl, speciesId, speciesName }], species: [{ speciesId, name }] }
// Gateway가 20초까지 기다리므로 공통 timeout(10초)보다 길게 둠
export function sendChatMessage({ conversationId, message }) {
  return client.post(
    '/api/v1/chatbot/messages',
    { conversationId: conversationId ?? null, message },
    { timeout: 25000 },
  );
}

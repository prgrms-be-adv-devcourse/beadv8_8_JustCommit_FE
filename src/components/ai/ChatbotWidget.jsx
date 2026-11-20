import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { sendChatMessage } from '../../api/aiApi';
import { CHAT_EXAMPLES, CHAT_MESSAGE_MAX, getChatErrorInfo } from '../../constants/ai';
import { formatPrice } from '../../utils/format';
import ProductThumbnail from '../product/ProductThumbnail';

// 식물 상담 챗봇 (ai POST chatbot/messages, 로그인 필요)
// 화면 오른쪽 아래 버튼 → 채팅 패널. Layout에 붙어 있어 화면을 옮겨도 대화가 남음
// 답변은 일반 텍스트로만 그림 (HTML로 해석하지 않음, 줄바꿈만 유지)

const FOREST = '#0f4c3a';

let nextMessageId = 1;
const createMessage = (fields) => ({ id: nextMessageId++, ...fields });

function ChatIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        d="M8 10h8M8 14h5M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.84L3 20l1.4-3.73A7.56 7.56 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChatProductCard({ product }) {
  return (
    <Link
      to={`/products/${product.productId}`}
      className="w-[132px] shrink-0 border border-[#e5e7eb] bg-white hover:border-[#0f4c3a] transition-colors"
    >
      <div className="w-full aspect-square bg-[#f0f5f1] overflow-hidden">
        <ProductThumbnail
          src={product.thumbnailUrl}
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-2">
        <p className="text-[12px] text-gray-800 line-clamp-1">{product.title}</p>
        <p className="text-[13px] font-bold text-[#191919]">{formatPrice(product.price)}</p>
        {product.speciesName && (
          <p className="text-[11px] text-gray-400 line-clamp-1">{product.speciesName}</p>
        )}
      </div>
    </Link>
  );
}

function BotMessage({ message }) {
  if (message.kind === 'error') {
    return (
      <p
        role="alert"
        className="self-start max-w-[85%] px-3 py-2 bg-[#fef2f2] border border-[#fecaca] text-[13px] text-[#b91c1c]"
      >
        {message.text}
      </p>
    );
  }

  return (
    <div className="self-start max-w-[92%] flex flex-col gap-2">
      <p className="px-3 py-2 bg-[#f3f4f6] text-[14px] text-[#111827] leading-relaxed whitespace-pre-wrap break-words">
        {message.text}
      </p>
      {message.answerGenerated === false && (
        <p className="text-[11px] text-gray-400">
          맞춤 답변을 만들지 못해 기본 안내를 보여 드려요.
        </p>
      )}
      {message.products?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="추천 상품">
          {message.products.map((product) => (
            <ChatProductCard key={product.productId} product={product} />
          ))}
        </div>
      )}
      {message.species?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-gray-400">참고한 품종</span>
          {message.species.map((species) => (
            <Link
              key={species.speciesId}
              to={`/?speciesId=${species.speciesId}`}
              className="px-2 py-0.5 border border-[#d1e7dd] text-[11px] text-[#0f4c3a] hover:bg-[#f0f5f1]"
            >
              {species.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function LoginRequired({ onLogin }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <ChatIcon className="w-10 h-10 text-[#0f4c3a]" />
      <p className="text-[15px] font-bold text-[#111827]">로그인하면 식물 상담을 받을 수 있어요</p>
      <p className="text-[13px] text-[#4b5563]">
        키우는 환경을 말해 주면 맞는 식물과 판매 중인 상품을 찾아 드려요.
      </p>
      <button
        type="button"
        className="mt-2 h-10 px-5 text-white text-[14px] font-bold"
        style={{ backgroundColor: FOREST }}
        onClick={onLogin}
      >
        로그인
      </button>
    </div>
  );
}

function ChatPanel({ isOpen }) {
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  // 새 메시지 · 로딩 표시가 생기면 맨 아래로
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, isSending]);

  // 패널을 열면 입력창에 바로 쓸 수 있게
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const send = async (text) => {
    const message = text.trim();
    if (!message || isSending) return;

    setMessages((prev) => [...prev, createMessage({ role: 'user', text: message })]);
    setInput('');
    setIsSending(true);

    try {
      const response = await sendChatMessage({ conversationId, message });
      const data = response.data.data;
      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        createMessage({
          role: 'bot',
          text: data.answer,
          answerGenerated: data.answerGenerated,
          products: data.products ?? [],
          species: data.species ?? [],
        }),
      ]);
    } catch (error) {
      const { message: errorText, resetConversation } = getChatErrorInfo(error);
      if (resetConversation) setConversationId(null);
      // 보낸 질문은 입력창에 다시 넣어 바로 다시 보낼 수 있게
      setInput(message);
      setMessages((prev) => [
        ...prev,
        createMessage({ role: 'bot', kind: 'error', text: errorText }),
      ]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setInput('');
  };

  return (
    <>
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="self-start max-w-[92%] px-3 py-2 bg-[#f3f4f6] text-[14px] text-[#111827] leading-relaxed">
              안녕하세요! 키우는 환경이나 찾는 식물을 말해 주세요. 판매 중인 상품에서 골라 알려
              드릴게요.
            </p>
            <div className="flex flex-col items-start gap-1.5 mt-1">
              {CHAT_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="px-3 py-1.5 border border-[#d1e7dd] text-left text-[13px] text-[#0f4c3a] hover:bg-[#f0f5f1]"
                  onClick={() => send(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) =>
          message.role === 'user' ? (
            <p
              key={message.id}
              className="self-end max-w-[85%] px-3 py-2 text-[14px] text-white leading-relaxed whitespace-pre-wrap break-words"
              style={{ backgroundColor: FOREST }}
            >
              {message.text}
            </p>
          ) : (
            <BotMessage key={message.id} message={message} />
          ),
        )}
        {isSending && (
          <p
            className="self-start px-3 py-2 bg-[#f3f4f6] text-[13px] text-gray-500 animate-pulse"
            role="status"
          >
            답변을 만드는 중이에요...
          </p>
        )}
      </div>

      <form
        className="border-t border-gray-200 p-3 flex flex-col gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
      >
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            rows={2}
            className="flex-1 resize-none border border-[#d1d5db] px-3 py-2 text-[14px] text-[#111827] placeholder-gray-400 focus:outline-none focus:border-[#0f4c3a] focus:ring-0"
            placeholder="식물에 대해 물어보세요"
            aria-label="챗봇에게 보낼 질문"
            maxLength={CHAT_MESSAGE_MAX}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              // Enter: 보내기, Shift + Enter: 줄바꿈 (한글 조합 중 Enter는 무시)
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send(input);
              }
            }}
          />
          <button
            type="submit"
            className="w-16 text-white text-[14px] font-bold disabled:opacity-40"
            style={{ backgroundColor: FOREST }}
            disabled={isSending || !input.trim()}
          >
            보내기
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <button
            type="button"
            className="hover:text-[#0f4c3a] disabled:opacity-40"
            onClick={startNewConversation}
            disabled={isSending || messages.length === 0}
          >
            새 대화 시작
          </button>
          <span className="tabular-nums">{`${input.length}/${CHAT_MESSAGE_MAX}`}</span>
        </div>
      </form>
    </>
  );
}

function ChatbotWidget() {
  const { user, isLoggedIn, isInitializing } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // 열려 있을 때 Esc로 닫기
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (isInitializing) return null;

  const close = () => setIsOpen(false);

  return (
    <>
      {/* 열고 닫아도 대화가 남도록 패널은 숨기기만 함. 회원이 바뀌면(key) 대화를 새로 시작 */}
      <section
        className={`fixed right-6 bottom-24 z-40 w-[380px] max-w-[calc(100vw-32px)] h-[560px] max-h-[calc(100vh-140px)] bg-white border border-gray-200 shadow-xl flex-col ${
          isOpen ? 'flex' : 'hidden'
        }`}
        aria-label="식물 상담 챗봇"
      >
        <header
          className="h-12 shrink-0 px-4 flex items-center justify-between text-white"
          style={{ backgroundColor: FOREST }}
        >
          <div className="flex items-center gap-2">
            <ChatIcon className="w-5 h-5" />
            <span className="text-[15px] font-bold">식물 상담 챗봇</span>
          </div>
          <button
            type="button"
            className="text-white/80 hover:text-white text-[20px] leading-none"
            aria-label="챗봇 닫기"
            onClick={close}
          >
            ×
          </button>
        </header>
        {isLoggedIn ? (
          <ChatPanel key={user.memberId} isOpen={isOpen} />
        ) : (
          <LoginRequired
            onLogin={() => {
              close();
              navigate('/login');
            }}
          />
        )}
      </section>

      <button
        type="button"
        className="fixed right-6 bottom-6 z-40 h-14 px-5 flex items-center gap-2 text-white shadow-lg hover:opacity-90 transition-opacity"
        style={{ backgroundColor: FOREST }}
        aria-expanded={isOpen}
        aria-label={isOpen ? '챗봇 닫기' : '식물 상담 챗봇 열기'}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <ChatIcon className="w-6 h-6" />
        <span className="text-[14px] font-bold">{isOpen ? '닫기' : '식물 상담'}</span>
      </button>
    </>
  );
}

export default ChatbotWidget;

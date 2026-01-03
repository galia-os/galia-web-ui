"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Lottie from "lottie-react";
import danceCatAnimation from "../../public/dance-cat.json";

interface AIHelperProps {
  question: string;
  hint: string;
  theme: string;
  answers: string[];
  userName?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_QUESTIONS = 3;

export default function AIHelper({
  question,
  hint,
  theme,
  answers,
  userName,
}: AIHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userQuestionCount, setUserQuestionCount] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // TTS refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const stoppedRef = useRef(false);
  const spokenLengthRef = useRef(0);
  const currentStreamRef = useRef("");

  // Sentence queue for sequential TTS processing
  const sentenceQueueRef = useRef<string[]>([]);
  const isProcessingSentenceRef = useRef(false);

  // Full conversation history for API (includes hidden messages)
  const conversationRef = useRef<ChatMessage[]>([]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Process sentence queue sequentially: fetch TTS, play, then next
  const processSentenceQueue = useCallback(async () => {
    if (isProcessingSentenceRef.current || stoppedRef.current) return;

    const sentence = sentenceQueueRef.current.shift();
    if (!sentence) {
      isProcessingSentenceRef.current = false;
      if (!isLoading) {
        setIsSpeaking(false);
      }
      return;
    }

    isProcessingSentenceRef.current = true;
    setIsSpeaking(true);

    try {
      // Fetch TTS for this sentence
      const response = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sentence }),
      });

      if (!response.ok || stoppedRef.current) {
        throw new Error("TTS failed or stopped");
      }

      const buffer = await response.arrayBuffer();
      if (stoppedRef.current) return;

      // Play the audio
      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      await new Promise<void>((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    } catch {
      // Continue to next sentence
    }

    isProcessingSentenceRef.current = false;

    // Process next sentence
    if (sentenceQueueRef.current.length > 0 && !stoppedRef.current) {
      processSentenceQueue();
    } else if (!isLoading) {
      setIsSpeaking(false);
    }
  }, [isLoading]);

  // Add sentence to queue and start processing
  const queueSentence = useCallback(
    (sentence: string) => {
      sentenceQueueRef.current.push(sentence);
      processSentenceQueue();
    },
    [processSentenceQueue]
  );

  // Process streaming text and extract sentences for TTS
  const processStreamForTTS = useCallback(
    (fullText: string) => {
      const newText = fullText.slice(spokenLengthRef.current);
      // Match complete sentences (ending with . ! or ?)
      const sentenceMatch = newText.match(/^[^.!?]*[.!?]+\s*/);

      if (sentenceMatch) {
        const sentence = sentenceMatch[0];
        spokenLengthRef.current += sentence.length;
        queueSentence(sentence.trim());
      }
    },
    [queueSentence]
  );

  const stopSpeaking = useCallback(() => {
    stoppedRef.current = true;
    sentenceQueueRef.current = [];
    isProcessingSentenceRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const sendMessage = async (userMessage: string, isHidden: boolean = false) => {
    const newUserMessage: ChatMessage = { role: "user", content: userMessage };

    // Add to full conversation history (for API context)
    conversationRef.current = [...conversationRef.current, newUserMessage];

    // Only show user message in UI if not hidden
    if (!isHidden) {
      setMessages(prev => [...prev, newUserMessage]);
    }
    setIsLoading(true);

    // Reset TTS state
    stoppedRef.current = false;
    spokenLengthRef.current = 0;
    sentenceQueueRef.current = [];
    isProcessingSentenceRef.current = false;
    currentStreamRef.current = "";

    // Unlock audio context on iOS
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationRef.current,
          question,
          hint,
          theme,
          answers,
          userName,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        currentStreamRef.current += chunk;

        // Process for TTS (sentence by sentence)
        processStreamForTTS(currentStreamRef.current);
      }

      // Queue any remaining text
      const remaining = currentStreamRef.current.slice(spokenLengthRef.current).trim();
      if (remaining && !stoppedRef.current) {
        queueSentence(remaining);
      }

      // Add completed assistant message to conversation history and chat
      const assistantMessage: ChatMessage = { role: "assistant", content: currentStreamRef.current };
      conversationRef.current = [...conversationRef.current, assistantMessage];
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = { role: "assistant", content: "Oops! I had a little trouble. Can you try asking again?" };
      conversationRef.current = [...conversationRef.current, errorMsg];
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = async () => {
    // MUST unlock audio synchronously on user gesture for iOS
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    // Play silent buffer immediately to unlock audio
    const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.start(0);

    setIsOpen(true);
    setUserQuestionCount(1);
    setMessages([]);
    // Hide the initial automatic message from UI (but still send to API)
    await sendMessage("Can you help me understand this math problem?", true);
  };

  const handleClose = () => {
    stopSpeaking();
    setIsOpen(false);
    setMessages([]);
    conversationRef.current = [];
    setUserQuestionCount(0);
    setInputValue("");
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading || userQuestionCount >= MAX_QUESTIONS) return;

    setInputValue("");
    setUserQuestionCount((c) => c + 1);
    await sendMessage(trimmedInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop propagation to prevent quiz answer selection when typing
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const remainingQuestions = MAX_QUESTIONS - userQuestionCount;
  const canAskMore = remainingQuestions > 0 && !isLoading;
  const isAnimating = isLoading || isSpeaking;

  return (
    <>
      {/* Floating button to open chat */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="group relative transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          title="Click me for help!"
          type="button"
        >
          <div className="pointer-events-none">
            <Lottie
              animationData={danceCatAnimation}
              loop={true}
              autoplay={false}
              className="h-24 w-24"
            />
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-500 px-3 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            Need help?
          </span>
        </button>
      )}

      {/* Chat drawer overlay - rendered via portal to escape parent transforms */}
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col">
            {/* Backdrop */}
            <div
              className="flex-shrink-0 h-[25%] bg-black/30"
              onClick={handleClose}
            />

            {/* Chat drawer */}
            <div
              className="flex-1 flex flex-col bg-gradient-to-b from-purple-50 to-white rounded-t-3xl shadow-2xl overflow-hidden"
              style={{ animation: "slideUp 0.3s ease-out" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-purple-100 bg-white/80 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Lottie
                    animationData={danceCatAnimation}
                    loop={true}
                    autoplay={isAnimating}
                    className="h-10 w-10"
                  />
                  <div>
                    <span className="font-semibold text-gray-800">Cat Tutor</span>
                    <p className="text-xs text-gray-500">
                      {isLoading
                        ? "Thinking..."
                        : isSpeaking
                          ? "Speaking..."
                          : remainingQuestions > 0
                            ? `${remainingQuestions} question${remainingQuestions !== 1 ? "s" : ""} left`
                            : "No more questions"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="flex h-8 items-center gap-1 rounded-full bg-red-100 px-3 text-red-600 text-sm font-medium transition-all hover:bg-red-200 active:scale-95"
                    >
                      <span>⏹</span> Stop
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-gray-200 active:scale-95"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 mr-2">
                        <Lottie
                          animationData={danceCatAnimation}
                          loop={isSpeaking && index === messages.length - 1}
                          autoplay={isSpeaking && index === messages.length - 1}
                          className="h-8 w-8"
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-purple-500 text-white rounded-br-md"
                          : "bg-white text-gray-800 shadow-md rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading/Speaking indicator */}
                {(isLoading || (isSpeaking && messages[messages.length - 1]?.role === "user")) && (
                  <div className="flex justify-start">
                    <div className="flex-shrink-0 mr-2">
                      <Lottie
                        animationData={danceCatAnimation}
                        loop={true}
                        autoplay={true}
                        className="h-8 w-8"
                      />
                    </div>
                    <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-md">
                      <div className="flex gap-1">
                        <span
                          className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-purple-100 bg-white px-4 py-3 pb-safe">
                {canAskMore ? (
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask a follow-up question..."
                      className="flex-1 rounded-full border border-purple-200 px-4 py-2.5 text-sm focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
                      disabled={isLoading || isSpeaking}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading || isSpeaking}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-white transition-all hover:bg-purple-600 active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-500 py-2">
                    You&apos;ve used all your questions. Close to continue the quiz!
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";
import Lottie from "lottie-react";
import danceCatAnimation from "../../public/dance-cat.json";

interface AIHelperProps {
  question: string;
  hint: string;
  theme: string;
  answers: string[];
  userName?: string;
}

export default function AIHelper({ question, hint, theme, answers, userName }: AIHelperProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { completion, isLoading, complete } = useCompletion({
    api: "/api/explain",
    streamProtocol: "text",
  });

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Auto-speak when completion is ready
  useEffect(() => {
    if (completion && !isLoading && isPlaying && !isSpeaking) {
      speak(completion);
    }
  }, [completion, isLoading, isPlaying]);

  const speakWithBrowser = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.name.includes("Samantha") || v.name.includes("Karen") || v.lang.startsWith("en")
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const speak = async (text: string) => {
    if (!text) return;

    setIsSpeaking(true);

    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        // Fall back to browser speech
        speakWithBrowser(text);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      // Fall back to browser speech
      speakWithBrowser(text);
    }
  };

  const handleAskHelp = async () => {
    setIsPlaying(true);
    await complete("", {
      body: {
        question,
        hint,
        theme,
        answers,
        userName,
      },
    });
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setIsSpeaking(false);
  };

  const handleReplay = () => {
    if (completion) {
      setIsPlaying(true);
      speak(completion);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Dancing Cat Button */}
      {!isPlaying && !completion && (
        <button
          onClick={handleAskHelp}
          disabled={isLoading}
          className="group relative transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
          title="Click me for help!"
        >
          <Lottie
            animationData={danceCatAnimation}
            loop={true}
            className="h-36 w-36"
          />
          {!isLoading && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-500 px-3 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
              Need help?
            </span>
          )}
          {isLoading && (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-500 px-3 py-1 text-xs font-semibold text-white animate-pulse">
              Thinking...
            </span>
          )}
        </button>
      )}

      {/* Show response with controls */}
      {(isLoading || completion) && (
        <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lottie
                animationData={danceCatAnimation}
                loop={isSpeaking}
                className="h-12 w-12"
              />
              <span className="font-semibold text-gray-700">Cat Tutor</span>
            </div>
            <div className="flex gap-2">
              {(isPlaying || isSpeaking) && (
                <button
                  onClick={handleStop}
                  className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-red-600 active:scale-95"
                >
                  ⏹ Stop
                </button>
              )}
              {completion && !isPlaying && !isSpeaking && (
                <button
                  onClick={handleReplay}
                  className="rounded-lg bg-purple-500 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-purple-600 active:scale-95"
                >
                  🔊 Replay
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-700 leading-relaxed">
            {isLoading && !completion ? (
              <span className="animate-pulse">Thinking about how to explain this...</span>
            ) : (
              completion
            )}
          </p>
          {isSpeaking && (
            <div className="mt-2 flex items-center gap-2 text-sm text-purple-600">
              <span className="animate-pulse">🔊</span>
              <span>Speaking...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

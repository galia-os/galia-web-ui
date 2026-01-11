"use client";

import { useState } from "react";

interface PasscodeScreenProps {
  onUnlock: () => void;
}

export default function PasscodeScreen({ onUnlock }: PasscodeScreenProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        localStorage.setItem("unlocked", "true");
        onUnlock();
      } else {
        setError(true);
        setCode("");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (code.length < 4) {
      const newCode = code + digit;
      setCode(newCode);
      setError(false);

      if (newCode.length === 4) {
        setTimeout(() => {
          setLoading(true);
          fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: newCode }),
          })
            .then((res) => {
              if (res.ok) {
                localStorage.setItem("unlocked", "true");
                onUnlock();
              } else {
                setError(true);
                setCode("");
              }
            })
            .catch(() => {
              setError(true);
              setCode("");
            })
            .finally(() => setLoading(false));
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setCode(code.slice(0, -1));
    setError(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-500 to-purple-600 p-6">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-extrabold text-white">
          Galia - Math
        </h1>
        <p className="text-white/80">Enter passcode to continue</p>
      </div>

      {/* Code display */}
      <div className="mb-8 flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold transition-all ${
              error
                ? "animate-shake bg-red-400"
                : code[i]
                  ? "bg-white text-indigo-600"
                  : "bg-white/30"
            }`}
          >
            {code[i] ? "•" : ""}
          </div>
        ))}
      </div>

      {error && <p className="mb-4 text-red-200">Wrong passcode, try again</p>}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "←"].map(
          (digit, i) => (
            <button
              key={i}
              onClick={() =>
                digit === "←" ? handleDelete() : digit && handleKeyPress(digit)
              }
              disabled={loading || digit === ""}
              className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold transition-all ${
                digit === ""
                  ? "invisible"
                  : "bg-white/20 text-white hover:bg-white/30 active:scale-95 disabled:opacity-50"
              }`}
            >
              {digit}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  text: string;
  className?: string;
  /** Style variant for math expressions */
  variant?: "default" | "minimal";
}

// Kid-friendly styles for math expressions
const mathStyles = {
  inline: "inline-block px-2 py-0.5 mx-0.5 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg border border-indigo-200 text-indigo-900 font-medium shadow-sm",
  display: "block my-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 text-indigo-900 font-medium shadow-md text-center",
};

/**
 * Renders text with LaTeX math expressions.
 * - Inline math: $expression$ (e.g., $x^2 + y^2$)
 * - Display math: $$expression$$ (e.g., $$\frac{a}{b}$$)
 */
export default function MathText({ text, className = "", variant = "default" }: MathTextProps) {
  const rendered = useMemo(() => {
    // Split by display math first ($$...$$), then inline math ($...$)
    const parts: { type: "text" | "inline" | "display"; content: string }[] = [];

    // Regex to match $$...$$ or $...$
    // We process display math first to avoid conflicts
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }

      const matchedText = match[0];
      if (matchedText.startsWith("$$")) {
        parts.push({
          type: "display",
          content: matchedText.slice(2, -2),
        });
      } else {
        parts.push({
          type: "inline",
          content: matchedText.slice(1, -1),
        });
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    return parts;
  }, [text]);

  // If no math expressions, return plain text
  if (rendered.length === 1 && rendered[0].type === "text") {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {rendered.map((part, index) => {
        if (part.type === "text") {
          return <span key={index}>{part.content}</span>;
        }

        try {
          const html = katex.renderToString(part.content, {
            throwOnError: false,
            displayMode: part.type === "display",
          });

          // Apply kid-friendly styles based on variant
          const styleClass = variant === "default"
            ? (part.type === "display" ? mathStyles.display : mathStyles.inline)
            : (part.type === "display" ? "block my-2" : "");

          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
              className={styleClass}
            />
          );
        } catch {
          // Fallback to plain text if KaTeX fails
          return (
            <span key={index}>
              {part.type === "display" ? `$$${part.content}$$` : `$${part.content}$`}
            </span>
          );
        }
      })}
    </span>
  );
}

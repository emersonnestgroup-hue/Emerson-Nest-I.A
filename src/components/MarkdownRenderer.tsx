import React, { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Échec de la copie", err);
    }
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-slate-400">
          <Terminal size={14} className="text-emerald-500" />
          <span className="text-[11px] font-medium tracking-wide uppercase">{language || "code"}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium transition-colors"
          title="Copier le code"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copié</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copier</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-slate-200 leading-relaxed font-mono">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
};

interface MarkdownRendererProps {
  text: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  if (!text) return null;

  // Split text by code blocks ```
  const tokens = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-slate-250 leading-relaxed text-[15px]">
      {tokens.map((token, index) => {
        if (token.startsWith("```") && token.endsWith("```")) {
          // It's a code block
          const match = token.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "code";
          const code = match ? match[2].trim() : token.slice(3, -3).trim();
          return <CodeBlock key={index} language={lang} code={code} />;
        } else {
          // Parse headings, bullet lists, inline bold text
          const lines = token.split("\n");
          return (
            <div key={index} className="space-y-2.5">
              {lines.map((line, lineIdx) => {
                const trimmed = line.trim();

                // Headers ###, ##, #
                if (trimmed.startsWith("### ")) {
                  return (
                    <h3 key={lineIdx} className="text-lg font-bold text-slate-100 mt-4 mb-2 tracking-tight">
                      {trimmed.slice(4)}
                    </h3>
                  );
                }
                if (trimmed.startsWith("## ")) {
                  return (
                    <h2 key={lineIdx} className="text-xl font-bold text-slate-50 mt-5 mb-2.5 tracking-tight border-b border-slate-800/40 pb-1">
                      {trimmed.slice(3)}
                    </h2>
                  );
                }
                if (trimmed.startsWith("# ")) {
                  return (
                    <h1 key={lineIdx} className="text-2xl font-extrabold text-white mt-6 mb-3 tracking-tight">
                      {trimmed.slice(2)}
                    </h1>
                  );
                }

                // Bullet Lists starting with "- " or "* "
                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                  const content = trimmed.slice(2);
                  return (
                    <ul key={lineIdx} className="list-disc list-inside pl-4 text-slate-300">
                      <li className="py-0.5">
                        {renderInlineFormatting(content)}
                      </li>
                    </ul>
                  );
                }

                // Numbered lists e.g. "1. "
                const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
                if (numMatch) {
                  const num = numMatch[1];
                  const content = numMatch[2];
                  return (
                    <ol key={lineIdx} className="list-decimal list-inside pl-4 text-slate-300">
                      <li className="py-0.5">
                        <span className="font-semibold text-emerald-400 mr-1">{num}.</span>
                        {renderInlineFormatting(content)}
                      </li>
                    </ol>
                  );
                }

                // Check for empty line
                if (trimmed === "") {
                  return <div key={lineIdx} className="h-2" />;
                }

                // Regular Paragraph
                return (
                  <p key={lineIdx} className="text-slate-300">
                    {renderInlineFormatting(line)}
                  </p>
                );
              })}
            </div>
          );
        }
      })}
    </div>
  );
};

// Helper function to render bold (**text**) and inline code (`code`)
function renderInlineFormatting(text: string): React.ReactNode[] {
  // Regex pattern for matching bold and inline code
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 mx-0.5 font-mono text-[13px] rounded bg-slate-900 border border-slate-800 text-emerald-400">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

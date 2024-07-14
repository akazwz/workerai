import { CheckIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import hljs from "highlight.js";
import { marked } from "marked";
import { useState } from "react";
import "highlight.js/styles/github-dark.min.css";

const CopyButton = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="absolute right-2 top-1 h-7 w-7 cursor-pointer"
      onClick={() => {
        try {
          setCopied(true);
          navigator.clipboard.writeText(content);
        } catch (e) {
          console.error(e);
        } finally {
          setTimeout(() => setCopied(false), 1000);
        }
      }}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
    </button>
  );
};

const Markdown = ({ content }: { content: string }) => {
  const tokens = marked.lexer(content);
  const codeBlock = (code: string) => {
    return (
      <pre>
        <code
          dangerouslySetInnerHTML={{ __html: hljs.highlightAuto(code).value }}
        />
        <CopyButton content={content} />
      </pre>
    );
  };

  return (
    <div className="prose py-0 dark:prose-invert prose-img:mx-auto prose-img:rounded-md md:prose-img:max-w-md prose-sm max-w-full bg-secondary p-2 rounded-md">
      {tokens.map((token, i) => {
        if (token.type === "code") {
          return codeBlock(token.text);
        }
        return (
          <div
            key={i}
            dangerouslySetInnerHTML={{ __html: marked(token.raw) }}
          />
        );
      })}
    </div>
  );
};

export default Markdown;

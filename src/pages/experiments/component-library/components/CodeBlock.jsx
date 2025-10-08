import React, { useState, useRef } from 'react';
import { copyToClipboard } from '../utils/copyToClipboard';

const CodeBlock = ({
  code,
  language = "jsx",
  title = "",
  filename = "",
  showLineNumbers = true,
  showCopyButton = true,
  maxHeight = "400px",
  className = "",
  theme = "dark" // "dark" or "light"
}) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  const handleCopy = async () => {
    const success = await copyToClipboard(code, codeRef.current);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLanguageColor = (lang) => {
    const colors = {
      jsx: "#61DAFB",
      javascript: "#F7DF1E",
      html: "#E34F26",
      css: "#1572B6",
      json: "#000000",
      bash: "#4EAA25",
      shell: "#4EAA25"
    };
    return colors[lang.toLowerCase()] || "#6B7280";
  };

  const formatCode = (codeString) => {
    if (!showLineNumbers) return codeString;

    return codeString
      .split('\n')
      .map((line, index) => ({
        number: index + 1,
        content: line
      }));
  };

  const formattedCode = formatCode(code);
  const languageColor = getLanguageColor(language);

  const themeClasses = {
    dark: {
      container: "bg-gray-900 text-gray-100",
      header: "bg-gray-800 border-gray-700",
      lineNumber: "text-gray-500",
      code: "text-gray-100"
    },
    light: {
      container: "bg-gray-50 text-gray-900",
      header: "bg-gray-100 border-gray-200",
      lineNumber: "text-gray-400",
      code: "text-gray-900"
    }
  };

  const currentTheme = themeClasses[theme];

  return (
    <div className={`rounded-lg border overflow-hidden ${className}`}>
      {/* Header */}
      {(title || filename || showCopyButton) && (
        <div className={`px-4 py-2 border-b flex items-center justify-between ${currentTheme.header}`}>
          <div className="flex items-center space-x-3">
            {(title || filename) && (
              <div>
                {title && (
                  <h4 className="font-medium text-sm">{title}</h4>
                )}
                {filename && (
                  <div className="text-xs opacity-75">{filename}</div>
                )}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: languageColor }}
              />
              <span className="text-xs font-medium uppercase tracking-wide">
                {language}
              </span>
            </div>
          </div>
          {showCopyButton && (
            <button
              ref={codeRef}
              onClick={handleCopy}
              className={`px-3 py-1 text-xs rounded transition-colors duration-200 ${
                copied
                  ? 'bg-green-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      )}

      {/* Code Content */}
      <div
        className={`overflow-auto ${currentTheme.container}`}
        style={{ maxHeight }}
      >
        <pre className="p-4 text-sm font-mono leading-relaxed">
          {showLineNumbers ? (
            <div>
              {formattedCode.map((line, index) => (
                <div key={index} className="flex">
                  <span className={`inline-block w-8 text-right mr-4 select-none ${currentTheme.lineNumber}`}>
                    {line.number}
                  </span>
                  <span className={currentTheme.code}>{line.content || ' '}</span>
                </div>
              ))}
            </div>
          ) : (
            <code className={currentTheme.code}>{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
};

// Preset code blocks for common use cases
export const JSXCodeBlock = (props) => (
  <CodeBlock language="jsx" theme="dark" {...props} />
);

export const HTMLCodeBlock = (props) => (
  <CodeBlock language="html" theme="dark" {...props} />
);

export const CSSCodeBlock = (props) => (
  <CodeBlock language="css" theme="dark" {...props} />
);

export const JSONCodeBlock = (props) => (
  <CodeBlock language="json" theme="light" {...props} />
);

// Inline code component
export const InlineCode = ({ children, className = "" }) => (
  <code className={`px-1.5 py-0.5 text-sm bg-gray-100 text-gray-800 rounded font-mono ${className}`}>
    {children}
  </code>
);

export default CodeBlock;
import React, { memo, useState, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { X, Star } from 'lucide-react';

/**
 * CodeBlockNode - Code snippet with syntax highlighting
 *
 * Features:
 * - Language selector
 * - Copy to clipboard
 * - Basic syntax highlighting (keywords, strings, comments)
 * - Line numbers
 * - Dark theme
 */

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'csharp', label: 'C#', ext: 'cs' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
  { id: 'go', label: 'Go', ext: 'go' },
  { id: 'rust', label: 'Rust', ext: 'rs' },
  { id: 'ruby', label: 'Ruby', ext: 'rb' },
  { id: 'php', label: 'PHP', ext: 'php' },
  { id: 'swift', label: 'Swift', ext: 'swift' },
  { id: 'kotlin', label: 'Kotlin', ext: 'kt' },
  { id: 'html', label: 'HTML', ext: 'html' },
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'json', label: 'JSON', ext: 'json' },
  { id: 'yaml', label: 'YAML', ext: 'yaml' },
  { id: 'markdown', label: 'Markdown', ext: 'md' },
  { id: 'bash', label: 'Bash', ext: 'sh' },
  { id: 'sql', label: 'SQL', ext: 'sql' },
  { id: 'graphql', label: 'GraphQL', ext: 'graphql' },
  { id: 'plain', label: 'Plain Text', ext: 'txt' },
];

// Basic syntax highlighting patterns
const SYNTAX_PATTERNS = {
  javascript: {
    keywords: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|throw|new|this|typeof|instanceof|null|undefined|true|false)\b/g,
    strings: /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  typescript: {
    keywords: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|throw|new|this|typeof|instanceof|null|undefined|true|false|type|interface|enum|implements|extends|public|private|protected|readonly|static|abstract|as|any|void|never|unknown)\b/g,
    strings: /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  python: {
    keywords: /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|raise|with|pass|True|False|None|and|or|not|in|is|lambda|yield|global|nonlocal|assert|break|continue|del|finally)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1|"""[\s\S]*?"""|'''[\s\S]*?'''/g,
    comments: /#.*/g,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  java: {
    keywords: /\b(public|private|protected|class|interface|extends|implements|static|final|void|return|if|else|for|while|do|switch|case|break|continue|new|this|super|try|catch|finally|throw|throws|import|package|null|true|false|int|long|double|float|boolean|char|byte|short|abstract|synchronized)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*[fFdDlL]?)\b/g,
  },
  csharp: {
    keywords: /\b(public|private|protected|internal|class|interface|struct|enum|extends|implements|static|readonly|const|void|return|if|else|for|foreach|while|do|switch|case|break|continue|new|this|base|try|catch|finally|throw|using|namespace|null|true|false|var|async|await|override|virtual|abstract|sealed|partial|get|set)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1|@"[^"]*"/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*[fFdDmM]?)\b/g,
  },
  cpp: {
    keywords: /\b(int|long|double|float|char|void|bool|class|struct|enum|union|public|private|protected|virtual|static|const|constexpr|inline|extern|return|if|else|for|while|do|switch|case|break|continue|new|delete|this|nullptr|true|false|try|catch|throw|namespace|using|include|define|template|typename|sizeof|auto)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*[fFlLuU]*)\b/g,
  },
  go: {
    keywords: /\b(func|return|if|else|for|range|switch|case|break|continue|go|defer|chan|select|struct|interface|type|var|const|import|package|nil|true|false|map|make|new|append|len|cap|error)\b/g,
    strings: /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  rust: {
    keywords: /\b(fn|let|mut|const|static|return|if|else|for|while|loop|match|break|continue|struct|enum|impl|trait|pub|mod|use|crate|self|Self|super|where|as|in|ref|move|async|await|dyn|type|true|false|Some|None|Ok|Err|Box|Vec|String|Option|Result)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*[fiu]\d*)\b/g,
  },
  ruby: {
    keywords: /\b(def|end|class|module|return|if|elsif|else|unless|for|while|until|do|case|when|break|next|begin|rescue|ensure|raise|yield|self|super|nil|true|false|and|or|not|in|require|include|extend|attr_reader|attr_writer|attr_accessor|private|protected|public)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /#.*/g,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  php: {
    keywords: /\b(function|return|if|elseif|else|for|foreach|while|do|switch|case|break|continue|class|interface|trait|extends|implements|public|private|protected|static|const|new|this|self|parent|try|catch|finally|throw|namespace|use|require|include|echo|print|null|true|false|array|global)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  swift: {
    keywords: /\b(func|return|if|else|guard|for|while|repeat|switch|case|break|continue|class|struct|enum|protocol|extension|var|let|static|override|init|deinit|self|Self|super|try|catch|throw|throws|import|nil|true|false|public|private|internal|fileprivate|open|final|lazy|weak|unowned|async|await|actor)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  kotlin: {
    keywords: /\b(fun|return|if|else|when|for|while|do|class|interface|object|data|sealed|enum|var|val|override|open|abstract|final|companion|init|this|super|try|catch|finally|throw|import|package|null|true|false|is|as|in|out|public|private|protected|internal|suspend|inline|lateinit)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*[fFdDlL]?)\b/g,
  },
  html: {
    keywords: /(&lt;\/?[a-zA-Z][a-zA-Z0-9]*)/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(&lt;!--[\s\S]*?--&gt;)/g,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  css: {
    keywords: /([.#]?[a-zA-Z_-][a-zA-Z0-9_-]*)\s*(?=\{)|(@[a-zA-Z-]+)/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(\/\*[\s\S]*?\*\/)/g,
    numbers: /\b(\d+\.?\d*(px|em|rem|%|vh|vw|deg|s|ms)?)\b/g,
  },
  sql: {
    keywords: /\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|LIKE|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|AS|DISTINCT|COUNT|SUM|AVG|MAX|MIN|NULL|TRUE|FALSE|PRIMARY|KEY|FOREIGN|REFERENCES|CONSTRAINT|DEFAULT|UNIQUE|CASCADE|VIEW|TRIGGER|PROCEDURE|FUNCTION|BEGIN|END|IF|ELSE|CASE|WHEN|THEN|VALUES)\b/gi,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(--.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  bash: {
    keywords: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|echo|export|source|alias|local|readonly|declare|typeset|eval|exec|set|unset|shift|cd|pwd|ls|rm|cp|mv|mkdir|cat|grep|sed|awk|find|xargs|sudo|chmod|chown|true|false)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /#.*/g,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  yaml: {
    keywords: /^(\s*[a-zA-Z_-]+)(?=:)/gm,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /#.*/g,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  json: {
    keywords: /"([^"\\]|\\.)*"(?=\s*:)/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(?!)/g,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  graphql: {
    keywords: /\b(query|mutation|subscription|type|interface|union|enum|input|scalar|fragment|on|extend|implements|directive|schema)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /#.*/g,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  markdown: {
    keywords: /(^#{1,6}\s.*$|^\*{3,}$|^-{3,}$|\*\*[^*]+\*\*|__[^_]+__|`[^`]+`)/gm,
    strings: /\[[^\]]+\]\([^)]+\)/g,
    comments: /(?!)/g,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
};

const CodeBlockNode = memo(({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(data.code || '// Your code here');
  const [copied, setCopied] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(data.language || 'javascript');
  const [showPreview, setShowPreview] = useState(false);

  const language = currentLanguage;

  // Check if language supports preview
  const supportsPreview = ['html', 'css', 'javascript'].includes(language);
  const filename = data.filename || '';
  const langInfo = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

  const handleLanguageChange = (langId) => {
    setCurrentLanguage(langId);
    setShowLangDropdown(false);
    if (data.onLanguageChange) {
      data.onLanguageChange(id, langId);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy code:', err);
    }
  };

  // Generate preview HTML for the iframe (memoized to prevent re-renders)
  const previewHTML = useMemo(() => {
    if (!showPreview || !supportsPreview) return '';

    try {
      if (language === 'html') {
        return code;
      } else if (language === 'css') {
        return `<!DOCTYPE html>
<html>
<head><style>${code}</style></head>
<body>
<div class="demo">Demo Content</div>
<p>Sample paragraph</p>
<button>Button</button>
</body>
</html>`;
      } else if (language === 'javascript') {
        // Wrap JS in try-catch for safe execution
        return `<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: system-ui, sans-serif; padding: 16px; background: #1e1e1e; color: #e5e7eb; }
.log { padding: 4px 8px; margin: 2px 0; background: #2d2d2d; border-radius: 4px; font-family: monospace; font-size: 12px; }
.error { color: #f87171; background: rgba(239, 68, 68, 0.1); }
</style>
</head>
<body>
<div id="output"></div>
<script>
const output = document.getElementById('output');
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  originalLog.apply(console, args);
  const div = document.createElement('div');
  div.className = 'log';
  div.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  output.appendChild(div);
};

console.error = (...args) => {
  originalError.apply(console, args);
  const div = document.createElement('div');
  div.className = 'log error';
  div.textContent = '❌ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  output.appendChild(div);
};

try {
${code}
} catch (e) {
  console.error(e.message);
}
</script>
</body>
</html>`;
      }
      return '';
    } catch (err) {
      console.error('Preview generation error:', err);
      return '';
    }
  }, [code, language, showPreview, supportsPreview]);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onCodeChange) {
      data.onCodeChange(id, code);
    }
  };

  // Very basic syntax highlighting
  const highlightCode = (text) => {
    const patterns = SYNTAX_PATTERNS[language];
    if (!patterns) return text;

    let highlighted = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply highlighting (order matters)
    highlighted = highlighted
      .replace(patterns.comments || /(?!)/g, '<span style="color: #6b7280;">$&</span>')
      .replace(patterns.strings || /(?!)/g, '<span style="color: #22c55e;">$&</span>')
      .replace(patterns.keywords || /(?!)/g, '<span style="color: #c084fc;">$&</span>')
      .replace(patterns.numbers || /(?!)/g, '<span style="color: #f97316;">$&</span>');

    return highlighted;
  };

  const codeLines = code.split('\n');

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '320px',
        backgroundColor: '#1e1e1e',
        border: `2px solid ${selected ? '#fbbf24' : '#3f3f46'}`,
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'grab',
        position: 'relative',
        boxShadow: selected
          ? '0 8px 24px rgba(251, 191, 36, 0.25)'
          : isHovered
            ? '0 8px 20px rgba(0, 0, 0, 0.15)'
            : '0 4px 8px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'scale(1.01)' : 'scale(1)',
        outline: selected ? '2px solid #3b82f6' : 'none',
        outlineOffset: selected ? '2px' : '0',
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#fbbf24',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />

      {/* Delete button - enhanced touch target (44px) */}
      {(isHovered || selected) && data.onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onDelete(id);
          }}
          className="unity-node-delete-btn"
          style={{
            position: 'absolute',
            top: '-12px',
            right: '-12px',
            padding: 0,
            zIndex: 10,
          }}
          title="Delete node"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      )}

      {/* Star button - enhanced touch target (44px) */}
      {(isHovered || selected || data.isStarred) && data.onToggleStar && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleStar(id);
          }}
          className={`nodrag unity-node-star-btn ${data.isStarred ? 'starred' : ''}`}
          style={{
            position: 'absolute',
            top: '-12px',
            left: '-12px',
            padding: 0,
            zIndex: 10,
          }}
          title={data.isStarred ? 'Unstar node' : 'Star node'}
        >
          <Star size={18} fill={data.isStarred ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
      )}

      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #3f3f46',
      }}>
        {/* Window buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#fbbf24' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
        </div>

        {/* Filename or language */}
        <span style={{
          flex: 1,
          fontSize: '11px',
          color: '#9ca3af',
          textAlign: 'center',
        }}>
          {filename || `snippet.${langInfo.ext}`}
        </span>

        {/* Preview toggle (for HTML/CSS/JS) */}
        {supportsPreview && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="nodrag"
            style={{
              padding: '4px 10px',
              backgroundColor: showPreview ? '#22c55e' : 'transparent',
              border: showPreview ? '1px solid #22c55e' : '1px solid #3f3f46',
              borderRadius: '4px',
              color: showPreview ? 'white' : '#9ca3af',
              fontSize: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onMouseEnter={(e) => {
              if (!showPreview) {
                e.currentTarget.style.borderColor = '#22c55e';
                e.currentTarget.style.color = '#22c55e';
              }
            }}
            onMouseLeave={(e) => {
              if (!showPreview) {
                e.currentTarget.style.borderColor = '#3f3f46';
                e.currentTarget.style.color = '#9ca3af';
              }
            }}
            title={showPreview ? 'Hide preview' : 'Run and preview code'}
          >
            <span style={{ fontSize: '8px' }}>{showPreview ? '●' : '▶'}</span>
            {showPreview ? 'Live' : 'Run'}
          </button>
        )}

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="nodrag"
          style={{
            padding: '4px 8px',
            backgroundColor: 'transparent',
            border: '1px solid #3f3f46',
            borderRadius: '4px',
            color: copied ? '#22c55e' : '#9ca3af',
            fontSize: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!copied) e.currentTarget.style.borderColor = '#fbbf24';
          }}
          onMouseLeave={(e) => {
            if (!copied) e.currentTarget.style.borderColor = '#3f3f46';
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>

      {/* Preview Pane (for HTML/CSS/JS) - Slideout animation */}
      {supportsPreview && (
        <div
          className="nodrag nopan"
          style={{
            maxHeight: showPreview ? '180px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-out, opacity 0.2s ease',
            opacity: showPreview ? 1 : 0,
            borderBottom: showPreview ? '1px solid #3f3f46' : 'none',
          }}
        >
          <div
            style={{
              padding: '8px',
              backgroundColor: language === 'javascript' ? '#1e1e1e' : '#f9fafb',
              position: 'relative',
            }}
          >
            {/* Preview header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: '600',
                color: '#22c55e',
                letterSpacing: '0.05em',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span style={{ fontSize: '6px' }}>●</span> LIVE PREVIEW
              </span>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  padding: '2px 6px',
                  backgroundColor: 'transparent',
                  border: '1px solid #3f3f46',
                  borderRadius: '3px',
                  color: '#6b7280',
                  fontSize: '9px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#3f3f46';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                ✕ Close
              </button>
            </div>
            <iframe
              title="Code Preview"
              srcDoc={previewHTML}
              sandbox="allow-scripts"
              style={{
                width: '100%',
                height: '130px',
                border: '1px solid #3f3f46',
                borderRadius: '4px',
                backgroundColor: language === 'javascript' ? '#1e1e1e' : '#ffffff',
              }}
            />
          </div>
        </div>
      )}

      {/* Code area */}
      <div
        onDoubleClick={handleDoubleClick}
        style={{
          padding: '12px',
          maxHeight: showPreview ? '120px' : '300px',
          overflowY: 'auto',
          cursor: isEditing ? 'text' : 'grab',
          transition: 'max-height 0.3s ease-out',
        }}
      >
        {isEditing ? (
          <textarea
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsEditing(false);
              }
              // Allow tab in code
              if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                setCode(code.substring(0, start) + '  ' + code.substring(end));
                setTimeout(() => {
                  e.target.selectionStart = e.target.selectionEnd = start + 2;
                }, 0);
              }
            }}
            className="nodrag"
            style={{
              width: '100%',
              minHeight: '120px',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontFamily: "'Fira Code', 'Consolas', monospace",
              fontSize: '12px',
              lineHeight: '1.6',
              color: '#e5e7eb',
              tabSize: 2,
            }}
          />
        ) : (
          <div style={{ display: 'flex' }}>
            {/* Line numbers */}
            <div style={{
              paddingRight: '12px',
              marginRight: '12px',
              borderRight: '1px solid #3f3f46',
              fontFamily: "'Fira Code', 'Consolas', monospace",
              fontSize: '12px',
              lineHeight: '1.6',
              color: '#6b7280',
              userSelect: 'none',
            }}>
              {codeLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code with syntax highlighting */}
            <pre style={{
              margin: 0,
              fontFamily: "'Fira Code', 'Consolas', monospace",
              fontSize: '12px',
              lineHeight: '1.6',
              color: '#e5e7eb',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              flex: 1,
            }}>
              {codeLines.map((line, i) => (
                <div
                  key={i}
                  dangerouslySetInnerHTML={{ __html: highlightCode(line) || '&nbsp;' }}
                />
              ))}
            </pre>
          </div>
        )}
      </div>

      {/* Language selector */}
      <div
        className="nodrag"
        style={{
          padding: '4px 12px',
          backgroundColor: '#2d2d2d',
          borderTop: '1px solid #3f3f46',
          fontSize: '10px',
          color: '#6b7280',
          position: 'relative',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowLangDropdown(!showLangDropdown);
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            fontSize: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3f3f46';
            e.currentTarget.style.color = '#fbbf24';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          {langInfo.label}
          <span style={{ fontSize: '8px' }}>▼</span>
        </button>

        {/* Language dropdown */}
        {showLangDropdown && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '8px',
              backgroundColor: '#1e1e1e',
              border: '1px solid #3f3f46',
              borderRadius: '6px',
              padding: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 50,
              boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
              minWidth: '120px',
            }}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLanguageChange(lang.id);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 10px',
                  backgroundColor: lang.id === currentLanguage ? '#3f3f46' : 'transparent',
                  border: 'none',
                  borderRadius: '4px',
                  color: lang.id === currentLanguage ? '#fbbf24' : '#9ca3af',
                  fontSize: '11px',
                  fontWeight: lang.id === currentLanguage ? '600' : '400',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (lang.id !== currentLanguage) {
                    e.currentTarget.style.backgroundColor = '#2d2d2d';
                    e.currentTarget.style.color = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (lang.id !== currentLanguage) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '12px',
          height: '12px',
          backgroundColor: '#fbbf24',
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}
      />
    </div>
  );
});

CodeBlockNode.displayName = 'CodeBlockNode';

export default CodeBlockNode;

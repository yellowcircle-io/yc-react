import React, { memo, useState } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';

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
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'html', label: 'HTML', ext: 'html' },
  { id: 'css', label: 'CSS', ext: 'css' },
  { id: 'json', label: 'JSON', ext: 'json' },
  { id: 'bash', label: 'Bash', ext: 'sh' },
  { id: 'sql', label: 'SQL', ext: 'sql' },
  { id: 'plain', label: 'Plain Text', ext: 'txt' },
];

// Basic syntax highlighting patterns
const SYNTAX_PATTERNS = {
  javascript: {
    keywords: /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|try|catch|throw|new|this)\b/g,
    strings: /(["'`])(?:(?!\1)[^\\]|\\.)*?\1/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
  python: {
    keywords: /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|raise|with|pass|True|False|None|and|or|not|in|is|lambda)\b/g,
    strings: /(["'])(?:(?!\1)[^\\]|\\.)*?\1|"""[\s\S]*?"""|'''[\s\S]*?'''/g,
    comments: /#.*/g,
    numbers: /\b(\d+\.?\d*)\b/g,
  },
};

const CodeBlockNode = memo(({ id, data, selected }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [code, setCode] = useState(data.code || '// Your code here');
  const [copied, setCopied] = useState(false);

  const language = data.language || 'javascript';
  const filename = data.filename || '';
  const langInfo = LANGUAGES.find(l => l.id === language) || LANGUAGES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Failed to copy code:', err);
    }
  };

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
            ? '0 6px 16px rgba(0, 0, 0, 0.3)'
            : '0 4px 8px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#fbbf24',
          border: '2px solid #1e1e1e',
        }}
      />

      {/* Delete button toolbar */}
      <NodeToolbar isVisible={isHovered || selected} position={Position.Top}>
        {data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete(id);
            }}
            style={{
              width: '24px',
              height: '24px',
              minWidth: '24px',
              minHeight: '24px',
              padding: 0,
              borderRadius: '50%',
              backgroundColor: '#374151',
              border: '2px solid white',
              color: 'white',
              fontSize: '14px',
              fontWeight: '400',
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              zIndex: 10,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1f2937';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#374151';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Delete node"
          >
            ×
          </button>
        )}
      </NodeToolbar>

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

      {/* Code area */}
      <div
        onDoubleClick={handleDoubleClick}
        style={{
          padding: '12px',
          maxHeight: '300px',
          overflowY: 'auto',
          cursor: isEditing ? 'text' : 'grab',
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

      {/* Language indicator */}
      <div style={{
        padding: '4px 12px',
        backgroundColor: '#2d2d2d',
        borderTop: '1px solid #3f3f46',
        fontSize: '10px',
        color: '#6b7280',
      }}>
        {langInfo.label}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#fbbf24',
          border: '2px solid #1e1e1e',
        }}
      />
    </div>
  );
});

CodeBlockNode.displayName = 'CodeBlockNode';

export default CodeBlockNode;

import React, { useState, useRef } from 'react';
import { copyToClipboard, generateComponentCode } from '../utils/copyToClipboard';

const ComponentCard = ({
  component,
  title,
  description,
  category,
  tags = [],
  preview = null,
  codeExample = "",
  htmlExample = "",
  props = {},
  onPreview,
  showPreview = true,
  showCode = true,
  library = "rho",
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied] = useState(false);
  const codeRef = useRef(null);

  const handleCopyCode = async () => {
    let codeToCopy = "";

    if (activeTab === 'jsx' && codeExample) {
      codeToCopy = codeExample;
    } else if (activeTab === 'html' && htmlExample) {
      codeToCopy = htmlExample;
    } else if (activeTab === 'props' && Object.keys(props).length > 0) {
      codeToCopy = generateComponentCode(title, props);
    }

    if (codeToCopy) {
      const success = await copyToClipboard(codeToCopy, codeRef.current);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const getLibraryColor = (libraryName) => {
    const colors = {
      rho: "#00ECC0",
      yellowcircle: "#EECF00",
      cath3dral: "#2D3748",
      "golden-unknown": "#FFD700"
    };
    return colors[libraryName] || "#6B7280";
  };

  const libraryColor = getLibraryColor(library);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Card Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
              {category && (
                <span
                  className="px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: libraryColor }}
                >
                  {category}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-600 mb-2">{description}</p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <nav className="flex space-x-1 px-4" aria-label="Component tabs">
          {showPreview && (
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'preview'
                  ? 'border-current text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={{
                borderBottomColor: activeTab === 'preview' ? libraryColor : undefined,
                color: activeTab === 'preview' ? libraryColor : undefined
              }}
            >
              Preview
            </button>
          )}
          {showCode && codeExample && (
            <button
              onClick={() => setActiveTab('jsx')}
              className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'jsx'
                  ? 'border-current text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={{
                borderBottomColor: activeTab === 'jsx' ? libraryColor : undefined,
                color: activeTab === 'jsx' ? libraryColor : undefined
              }}
            >
              JSX
            </button>
          )}
          {showCode && htmlExample && (
            <button
              onClick={() => setActiveTab('html')}
              className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'html'
                  ? 'border-current text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={{
                borderBottomColor: activeTab === 'html' ? libraryColor : undefined,
                color: activeTab === 'html' ? libraryColor : undefined
              }}
            >
              HTML
            </button>
          )}
          {Object.keys(props).length > 0 && (
            <button
              onClick={() => setActiveTab('props')}
              className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                activeTab === 'props'
                  ? 'border-current text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={{
                borderBottomColor: activeTab === 'props' ? libraryColor : undefined,
                color: activeTab === 'props' ? libraryColor : undefined
              }}
            >
              Props
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'preview' && (
          <div className="min-h-32 flex items-center justify-center bg-gray-50 rounded border">
            {preview ? (
              <div className="w-full">{preview}</div>
            ) : component ? (
              <div className="w-full">{component}</div>
            ) : (
              <div className="text-gray-400 text-sm">No preview available</div>
            )}
          </div>
        )}

        {activeTab === 'jsx' && codeExample && (
          <div className="relative">
            <button
              ref={codeRef}
              onClick={handleCopyCode}
              className="absolute top-2 right-2 px-3 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors duration-200"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
              <code>{codeExample}</code>
            </pre>
          </div>
        )}

        {activeTab === 'html' && htmlExample && (
          <div className="relative">
            <button
              ref={codeRef}
              onClick={handleCopyCode}
              className="absolute top-2 right-2 px-3 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors duration-200"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto">
              <code>{htmlExample}</code>
            </pre>
          </div>
        )}

        {activeTab === 'props' && Object.keys(props).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Component Props</h4>
              <button
                ref={codeRef}
                onClick={handleCopyCode}
                className="px-3 py-1 text-xs bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors duration-200"
              >
                {copied ? 'Copied!' : 'Copy Usage'}
              </button>
            </div>
            <div className="bg-gray-50 rounded p-3">
              <pre className="text-sm">
                <code>{generateComponentCode(title, props)}</code>
              </pre>
            </div>
            <div className="space-y-2">
              {Object.entries(props).map(([key, value]) => (
                <div key={key} className="flex items-start space-x-3 text-sm">
                  <span className="font-mono text-purple-600 bg-purple-50 px-2 py-1 rounded">
                    {key}
                  </span>
                  <span className="text-gray-600">
                    {typeof value === 'string' ? `"${value}"` : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      {onPreview && (
        <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-100">
          <button
            onClick={() => onPreview(component, title)}
            className="text-sm font-medium transition-colors duration-200 hover:underline"
            style={{ color: libraryColor }}
          >
            Open in Preview Mode →
          </button>
        </div>
      )}
    </div>
  );
};

export default ComponentCard;
import React, { useState, useRef } from 'react';

const PreviewFrame = ({
  children,
  title = "Component Preview",
  responsive = true,
  showDeviceFrames = true,
  backgroundColor = "#ffffff",
  padding = "20px",
  minHeight = "200px",
  maxHeight = "600px",
  className = ""
}) => {
  const [activeDevice, setActiveDevice] = useState('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const frameRef = useRef(null);

  const devices = {
    mobile: { width: '375px', height: '667px', name: 'Mobile', icon: '📱' },
    tablet: { width: '768px', height: '1024px', name: 'Tablet', icon: '📱' },
    desktop: { width: '100%', height: 'auto', name: 'Desktop', icon: '🖥️' }
  };

  const currentDevice = devices[activeDevice];

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDeviceChange = (device) => {
    setActiveDevice(device);
  };

  const frameStyle = {
    backgroundColor,
    padding,
    minHeight,
    maxHeight: isFullscreen ? '90vh' : maxHeight,
    width: responsive ? currentDevice.width : '100%',
    height: currentDevice.height !== 'auto' ? currentDevice.height : 'auto',
    overflow: 'auto',
    transition: 'all 0.3s ease'
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-full flex flex-col">
          {/* Fullscreen Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <div className="flex items-center space-x-4">
              {responsive && showDeviceFrames && (
                <div className="flex items-center space-x-2">
                  {Object.entries(devices).map(([key, device]) => (
                    <button
                      key={key}
                      onClick={() => handleDeviceChange(key)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${
                        activeDevice === key
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {device.icon} {device.name}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={toggleFullscreen}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200"
              >
                Exit Fullscreen
              </button>
            </div>
          </div>

          {/* Fullscreen Content */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="mx-auto" style={frameStyle}>
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          {responsive && showDeviceFrames && (
            <div className="flex items-center space-x-1">
              {Object.entries(devices).map(([key, device]) => (
                <button
                  key={key}
                  onClick={() => handleDeviceChange(key)}
                  className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
                    activeDevice === key
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                  title={device.name}
                >
                  {device.icon}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={toggleFullscreen}
            className="px-2 py-1 text-xs bg-white text-gray-700 rounded hover:bg-gray-100 transition-colors duration-200"
            title="Open in fullscreen"
          >
            ⛶
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-4 bg-gray-50">
        {responsive ? (
          <div className="mx-auto border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <div ref={frameRef} style={frameStyle}>
              {children}
            </div>
          </div>
        ) : (
          <div ref={frameRef} style={frameStyle}>
            {children}
          </div>
        )}
      </div>

      {/* Device Info */}
      {responsive && activeDevice !== 'desktop' && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center">
            {currentDevice.width} × {currentDevice.height} ({currentDevice.name})
          </div>
        </div>
      )}
    </div>
  );
};

// Specialized preview components
export const EmailPreviewFrame = ({ children, ...props }) => (
  <PreviewFrame
    backgroundColor="#f8f9fa"
    maxHeight="800px"
    responsive={false}
    showDeviceFrames={false}
    title="Email Template Preview"
    {...props}
  >
    <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff' }}>
      {children}
    </div>
  </PreviewFrame>
);

export const ComponentPreviewFrame = ({ children, ...props }) => (
  <PreviewFrame
    backgroundColor="#ffffff"
    padding="40px"
    responsive={true}
    showDeviceFrames={true}
    title="Component Preview"
    {...props}
  >
    {children}
  </PreviewFrame>
);

export const MobileOnlyPreviewFrame = ({ children, ...props }) => (
  <PreviewFrame
    responsive={false}
    showDeviceFrames={false}
    title="Mobile Preview"
    {...props}
  >
    <div style={{ width: '375px', margin: '0 auto' }}>
      {children}
    </div>
  </PreviewFrame>
);

export default PreviewFrame;
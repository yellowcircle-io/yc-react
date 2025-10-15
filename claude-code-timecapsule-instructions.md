# Travel Time Capsule - Claude Code Implementation Instructions

## Project Overview
Create a complete travel photo time capsule React application with drag-drop functionality, multi-source uploads, responsive scrolling, and dual CRM integration (Airtable & Zoho). This page will be accessible at `/uk-memories` route.

## Critical Execution Requirements

### 1. Pre-Implementation Setup

**Initialize Version Control & Failsafes:**
```bash
# Create backup branches
git checkout -b backup-pre-timecapsule
git checkout -b development-timecapsule

# Setup automated versioning
npm version patch
git add .
git commit -m "init: travel time capsule development branch"
```

**Install Required Dependencies:**
```bash
npm install @xyflow/react@^12.3.0 airtable@^0.12.2 axios@^1.7.7 framer-motion@^11.11.0 react-dropzone@^14.2.9 lucide-react@^0.447.0
```

### 2. Mandatory File Structure

Create the following files EXACTLY as specified:

```
src/
├── pages/
│   └── TimeCapsulePage.jsx          [NEW - MAIN COMPONENT]
├── components/
│   ├── travel/
│   │   ├── DraggablePhotoNode.jsx   [NEW - DRAG SYSTEM]
│   │   ├── PhotoUploadModal.jsx     [NEW - UPLOAD UI]
│   │   ├── LocationMarker.jsx       [NEW - GPS INTEGRATION]
│   │   ├── TimelineScroller.jsx     [NEW - DATE NAVIGATION]
│   │   └── ScrollOrientationToggle.jsx [NEW - RESPONSIVE TOGGLE]
│   └── ui/
│       ├── LoadingSpinner.jsx       [NEW - LOADING STATES]
│       └── ErrorBoundary.jsx        [NEW - ERROR HANDLING]
├── hooks/
│   ├── useDragDropFlow.js          [NEW - DRAG LOGIC]
│   ├── useMultiUpload.js           [NEW - UPLOAD ORCHESTRATION]
│   ├── useAirtableSubmission.js    [NEW - AIRTABLE API]
│   ├── useZohoSubmission.js        [NEW - ZOHO CRM API]
│   └── useResponsiveScroll.js      [NEW - SCROLL MANAGEMENT]
├── utils/
│   ├── uploadServices.js           [NEW - FILE UPLOAD UTILITIES]
│   ├── crmIntegration.js          [NEW - CRM API UTILITIES]
│   └── photoMetadata.js           [NEW - EXIF/METADATA EXTRACTION]
└── styles/
    └── timecapsule.css            [NEW - CUSTOM STYLES]
```

### 3. Core Component Implementations

#### A. Main Page Component (`TimeCapsulePage.jsx`)

```javascript
import React, { useState, useCallback } from 'react';
import { 
  ReactFlow, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState,
  addEdge 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import DraggablePhotoNode from '../components/travel/DraggablePhotoNode';
import PhotoUploadModal from '../components/travel/PhotoUploadModal';
import ScrollOrientationToggle from '../components/travel/ScrollOrientationToggle';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import { useResponsiveScroll } from '../hooks/useResponsiveScroll';
import { useMultiUpload } from '../hooks/useMultiUpload';
import { useAirtableSubmission } from '../hooks/useAirtableSubmission';
import { useZohoSubmission } from '../hooks/useZohoSubmission';

const nodeTypes = {
  photoNode: DraggablePhotoNode,
};

const TimeCapsulePage = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const { orientation, toggleOrientation, scrollStyles } = useResponsiveScroll();
  const { handleUpload, uploadMethod, setUploadMethod, isUploading } = useMultiUpload();
  const { submitToAirtable, isSubmitting: airtableSubmitting } = useAirtableSubmission();
  const { submitToZoho, isSubmitting: zohoSubmitting } = useZohoSubmission();

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handlePhotoUpload = async (files, metadata) => {
    try {
      // Upload files using selected method
      const uploadedFiles = await handleUpload(files, metadata);
      
      // Submit to selected CRM
      let crmSubmission;
      if (uploadMethod === 'airtable') {
        crmSubmission = await submitToAirtable({
          ...metadata,
          imageUrl: uploadedFiles[0]?.url,
          uploadMethod
        });
      } else if (uploadMethod === 'zoho') {
        crmSubmission = await submitToZoho({
          ...metadata,
          imageUrl: uploadedFiles[0]?.url,
          uploadMethod
        });
      }

      // Add nodes to React Flow
      const newNodes = uploadedFiles.map((file, index) => ({
        id: `photo-${Date.now()}-${index}`,
        type: 'photoNode',
        position: { 
          x: Math.random() * 600, 
          y: Math.random() * 400 
        },
        data: {
          imageUrl: file.url || file,
          location: metadata.location,
          date: metadata.date,
          description: metadata.description,
          crmId: crmSubmission?.id
        }
      }));

      setNodes(prev => [...prev, ...newNodes]);
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50">
        {/* Header */}
        <header className="flex justify-between items-center p-4 bg-white/90 backdrop-blur-sm shadow-sm border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">UK Travel Memories</h1>
            <p className="text-sm text-gray-600">Your digital time capsule</p>
          </div>
          <div className="flex gap-2">
            <ScrollOrientationToggle 
              orientation={orientation}
              onToggle={toggleOrientation}
            />
            <select 
              value={uploadMethod}
              onChange={(e) => setUploadMethod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-500"
            >
              <option value="airtable">Airtable</option>
              <option value="zoho">Zoho CRM</option>
              <option value="dropbox">Dropbox</option>
              <option value="github">GitHub</option>
              <option value="form">Local Form</option>
            </select>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              disabled={isUploading || airtableSubmitting || zohoSubmitting}
              className="px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 disabled:opacity-50 font-medium"
            >
              {isUploading ? 'Uploading...' : 'Add Memory'}
            </button>
          </div>
        </header>

        {/* Main Flow Area */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="travel-flow"
            style={scrollStyles}
          >
            <Controls />
            <Background variant="dots" gap={20} size={1} color="#fbbf24" />
          </ReactFlow>
        </div>

        {/* Upload Modal */}
        <PhotoUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handlePhotoUpload}
          uploadMethod={uploadMethod}
        />
      </div>
    </ErrorBoundary>
  );
};

export default TimeCapsulePage;
```

#### B. Draggable Photo Node (`DraggablePhotoNode.jsx`)

```javascript
import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Camera } from 'lucide-react';

const DraggablePhotoNode = memo(({ data, selected }) => {
  return (
    <motion.div
      className={`photo-node-container bg-white rounded-lg shadow-lg overflow-hidden border-2 ${
        selected ? 'border-yellow-400' : 'border-transparent'
      }`}
      whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-2 h-2 bg-yellow-400 border-white"
      />
      
      <div className="relative w-64 h-48">
        <img 
          src={data.imageUrl} 
          alt={data.description || 'Travel memory'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3" />
            <p className="text-sm font-medium truncate">{data.location}</p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <p className="text-xs opacity-90">{data.date}</p>
            </div>
            {data.crmId && (
              <div className="flex items-center gap-1">
                <Camera className="w-3 h-3" />
                <span className="text-xs opacity-75">Saved</span>
              </div>
            )}
          </div>
          
          {data.description && (
            <p className="text-xs mt-1 opacity-80 line-clamp-2">
              {data.description}
            </p>
          )}
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-2 h-2 bg-yellow-400 border-white"
      />
    </motion.div>
  );
});

DraggablePhotoNode.displayName = 'DraggablePhotoNode';

export default DraggablePhotoNode;
```

#### C. Photo Upload Modal (`PhotoUploadModal.jsx`)

```javascript
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { X, Upload, MapPin, Calendar, FileText, Loader2 } from 'lucide-react';

const PhotoUploadModal = ({ isOpen, onClose, onUpload, uploadMethod }) => {
  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState({
    location: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 10
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Please select at least one photo');
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpload(files, metadata);
      // Reset form
      setFiles([]);
      setMetadata({
        location: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMetadataChange = (field) => (e) => {
    setMetadata(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Add Travel Memory</h3>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Photos</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-yellow-400 bg-yellow-50' 
                      : 'border-gray-300 hover:border-yellow-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {isDragActive
                      ? 'Drop photos here'
                      : 'Drag photos here or click to select'
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supports: JPEG, PNG, GIF, WebP (max 10 files)
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Selected files:</p>
                    <ul className="text-sm text-gray-600">
                      {files.map((file, index) => (
                        <li key={index} className="truncate">
                          • {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={metadata.location}
                  onChange={handleMetadataChange('location')}
                  placeholder="e.g., Lake District, UK"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date
                </label>
                <input
                  type="date"
                  value={metadata.date}
                  onChange={handleMetadataChange('date')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Description (Optional)
                </label>
                <textarea
                  value={metadata.description}
                  onChange={handleMetadataChange('description')}
                  placeholder="Tell the story behind this memory..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                />
              </div>

              {/* Upload Method Info */}
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-sm text-gray-600">
                  <strong>Upload method:</strong> {uploadMethod.charAt(0).toUpperCase() + uploadMethod.slice(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Photos will be uploaded and metadata saved to your selected service.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || files.length === 0}
                  className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Add Memory'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhotoUploadModal;
```

### 4. Essential Hooks Implementation

#### A. Multi-Upload Hook (`useMultiUpload.js`)

```javascript
import { useState } from 'react';

// Import upload service functions
const uploadToDropbox = async (files, metadata, onProgress) => {
  // Placeholder - implement actual Dropbox upload
  onProgress(50);
  await new Promise(resolve => setTimeout(resolve, 1000));
  onProgress(100);
  return files.map(file => ({ url: URL.createObjectURL(file), name: file.name }));
};

const uploadToGitHub = async (files, metadata, onProgress) => {
  // Placeholder - implement actual GitHub upload
  onProgress(50);
  await new Promise(resolve => setTimeout(resolve, 1000));
  onProgress(100);
  return files.map(file => ({ url: URL.createObjectURL(file), name: file.name }));
};

const uploadViaForm = async (files, metadata, onProgress) => {
  // Local upload simulation
  onProgress(100);
  return files.map(file => ({ url: URL.createObjectURL(file), name: file.name }));
};

export const useMultiUpload = () => {
  const [uploadMethod, setUploadMethod] = useState('airtable');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadHandlers = {
    airtable: uploadViaForm, // Airtable doesn't handle file uploads directly
    zoho: uploadViaForm,     // Zoho CRM doesn't handle file uploads directly
    dropbox: uploadToDropbox,
    github: uploadToGitHub,
    form: uploadViaForm
  };

  const handleUpload = async (files, metadata) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const handler = uploadHandlers[uploadMethod];
      const result = await handler(files, metadata, setUploadProgress);
      setUploadProgress(100);
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return { 
    handleUpload, 
    setUploadMethod, 
    isUploading, 
    uploadProgress,
    uploadMethod 
  };
};
```

#### B. Airtable Integration Hook (`useAirtableSubmission.js`)

```javascript
import { useState } from 'react';

export const useAirtableSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitToAirtable = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Check for API key
      const apiKey = process.env.REACT_APP_AIRTABLE_API_KEY;
      const baseId = process.env.REACT_APP_AIRTABLE_BASE_ID;
      
      if (!apiKey || !baseId) {
        throw new Error('Airtable credentials not configured');
      }

      const response = await fetch(`https://api.airtable.com/v0/${baseId}/Travel_Memories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            'Photo_URL': formData.imageUrl || '',
            'Location': formData.location || '',
            'Date': formData.date || '',
            'Description': formData.description || '',
            'Upload_Method': formData.uploadMethod || 'airtable',
            'Created_At': new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Airtable submission error:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitToAirtable, isSubmitting, error };
};
```

#### C. Zoho CRM Integration Hook (`useZohoSubmission.js`)

```javascript
import { useState } from 'react';

export const useZohoSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submitToZoho = async (formData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const accessToken = process.env.REACT_APP_ZOHO_ACCESS_TOKEN;
      
      if (!accessToken) {
        throw new Error('Zoho credentials not configured');
      }

      const response = await fetch('https://www.zohoapis.com/crm/v8/Travel_Memories', {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: [{
            'Photo_URL': formData.imageUrl || '',
            'Location': formData.location || '',
            'Travel_Date': formData.date || '',
            'Description': formData.description || '',
            'Upload_Source': formData.uploadMethod || 'zoho',
            'Entry_Created': new Date().toISOString()
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Zoho API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0];
    } catch (err) {
      setError(err.message);
      console.error('Zoho submission error:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitToZoho, isSubmitting, error };
};
```

#### D. Responsive Scroll Hook (`useResponsiveScroll.js`)

```javascript
import { useState, useEffect } from 'react';

export const useResponsiveScroll = () => {
  const [orientation, setOrientation] = useState('horizontal');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768;
      const portrait = window.innerHeight > window.innerWidth;
      
      setIsMobile(mobile);
      
      // Auto-set orientation based on device
      if (mobile && portrait) {
        setOrientation('vertical');
      } else {
        setOrientation('horizontal');
      }
    };

    const handleResize = () => {
      setTimeout(checkDevice, 100); // Delay for accurate dimensions
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    checkDevice();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const toggleOrientation = () => {
    setOrientation(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  };

  const scrollStyles = {
    horizontal: {
      overflowX: 'auto',
      overflowY: 'hidden'
    },
    vertical: {
      overflowY: 'auto',
      overflowX: 'hidden'
    }
  }[orientation];

  return { 
    orientation, 
    setOrientation, 
    toggleOrientation,
    isMobile,
    scrollStyles
  };
};
```

### 5. Additional Required Components

#### A. Error Boundary (`ErrorBoundary.jsx`)

```javascript
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    console.error('TimeCapsule Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-600 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-red-500 mb-4">
              {this.state.error?.message || 'An unexpected error occurred in the time capsule.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 text-left bg-gray-100 p-2 rounded text-xs">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

#### B. Scroll Orientation Toggle (`ScrollOrientationToggle.jsx`)

```javascript
import React from 'react';
import { RotateCw, Monitor, Smartphone } from 'lucide-react';

const ScrollOrientationToggle = ({ orientation, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-yellow-500"
      title={`Switch to ${orientation === 'horizontal' ? 'vertical' : 'horizontal'} layout`}
    >
      {orientation === 'horizontal' ? (
        <Monitor className="w-4 h-4" />
      ) : (
        <Smartphone className="w-4 h-4" />
      )}
      <RotateCw className="w-3 h-3" />
    </button>
  );
};

export default ScrollOrientationToggle;
```

### 6. Router Integration

**Update your main App.jsx routing:**

```javascript
// Add this import
import TimeCapsulePage from './pages/TimeCapsulePage';

// Add this route to your existing Routes
<Route path="/uk-memories" element={<TimeCapsulePage />} />
```

### 7. Environment Variables Setup

Create or update your `.env` file:

```env
# Airtable Configuration
REACT_APP_AIRTABLE_API_KEY=your_airtable_personal_access_token
REACT_APP_AIRTABLE_BASE_ID=your_airtable_base_id

# Zoho CRM Configuration  
REACT_APP_ZOHO_ACCESS_TOKEN=your_zoho_oauth_access_token

# Optional: External File Uploads
REACT_APP_DROPBOX_ACCESS_TOKEN=your_dropbox_app_token
REACT_APP_GITHUB_TOKEN=your_github_personal_access_token
```

### 8. Testing & Validation

After implementation, test these critical functions:

1. **Drag & Drop**: Photos should drag smoothly in React Flow
2. **Upload Methods**: All 5 upload methods should work without errors
3. **CRM Integration**: Data should save to Airtable and/or Zoho
4. **Responsive Design**: Layout should adapt to screen orientation
5. **Error Handling**: Graceful failure states for failed uploads
6. **Mobile Compatibility**: Touch interactions should work properly

### 9. Deployment Checklist

```bash
# Pre-deployment validation
npm run build
npm run lint

# Version control
git add .
git commit -m "feat: implement travel time capsule with multi-CRM integration"
git push origin main

# Deploy to production
npm run deploy
```

## Critical Success Factors

- **MUST implement ALL specified files** - Do not skip any component
- **MUST include comprehensive error handling** - Every API call wrapped in try/catch
- **MUST ensure mobile compatibility** - Touch events and responsive design
- **MUST validate CRM integrations** - Test both Airtable and Zoho submissions
- **MUST maintain YellowCircle design standards** - Consistent styling and UX

## Final Execution Command

Execute this implementation exactly as specified. Create all files, implement all hooks, and ensure the `/uk-memories` route is fully functional with drag-drop photo management, multi-source uploads, and dual CRM integration. Test thoroughly and fix any errors automatically.
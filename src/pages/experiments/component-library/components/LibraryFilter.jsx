import React from 'react';

const LibraryFilter = ({
  activeLibrary = "rho",
  onLibraryChange,
  libraries = [
    { id: "yellowcircle", name: "yellowCircle", color: "#EECF00", description: "Personal portfolio components" },
    { id: "cath3dral", name: "Cath3dral", color: "#2D3748", description: "Architectural & sacred geometry" },
    { id: "golden-unknown", name: "Golden Unknown", color: "#FFD700", description: "Mysterious & artistic elements" },
    { id: "rho", name: "Rho", color: "#00ECC0", description: "Business & email components" }
  ],
  layout = "tabs", // "tabs" or "pills"
  showDescriptions = false,
  className = ""
}) => {
  const handleLibraryClick = (libraryId) => {
    if (onLibraryChange) {
      onLibraryChange(libraryId);
    }
  };

  if (layout === "pills") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {libraries.map((library) => (
          <button
            key={library.id}
            onClick={() => handleLibraryClick(library.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeLibrary === library.id
                ? 'text-white shadow-md transform scale-105'
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
            style={{
              backgroundColor: activeLibrary === library.id ? library.color : undefined
            }}
          >
            {library.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-8" aria-label="Library filters">
        {libraries.map((library) => (
          <button
            key={library.id}
            onClick={() => handleLibraryClick(library.id)}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeLibrary === library.id
                ? 'border-current text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            style={{
              borderBottomColor: activeLibrary === library.id ? library.color : undefined,
              color: activeLibrary === library.id ? library.color : undefined
            }}
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: library.color }}
              />
              <span>{library.name}</span>
            </div>
            {showDescriptions && (
              <div className="text-xs text-gray-400 mt-1">
                {library.description}
              </div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default LibraryFilter;
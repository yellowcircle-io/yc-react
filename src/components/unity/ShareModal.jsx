/**
 * ShareModal - Unity Collaboration sharing component
 * Enables sharing canvases with collaborators
 */

import { useState } from 'react';
import { X, Copy, Check, Link2, Users, Globe, Lock, Mail, Trash2 } from 'lucide-react';

const ShareModal = ({
  isOpen,
  onClose,
  capsuleId,
  title,
  isPublic,
  collaborators = [],
  onUpdateVisibility,
  onAddCollaborator,
  onRemoveCollaborator,
  shareLink
}) => {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  // Generate share link
  const fullShareLink = shareLink || `${window.location.origin}/capsule/${capsuleId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullShareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsAdding(true);
    setError(null);

    try {
      await onAddCollaborator(email.trim().toLowerCase(), role);
      setEmail('');
      setRole('viewer');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (collaboratorId) => {
    try {
      await onRemoveCollaborator(collaboratorId);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1a1a1a] rounded-xl w-full max-w-md mx-4 shadow-2xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#F5A623]" />
            <h2 className="text-lg font-semibold text-white">Share "{title}"</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Share Link Section */}
          <div className="space-y-2">
            <label className="text-sm text-white/60 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Share link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fullShareLink}
                readOnly
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-[#F5A623] hover:bg-[#F5A623]/90 rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-black" />
                    <span className="text-sm font-medium text-black">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-black" />
                    <span className="text-sm font-medium text-black">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="space-y-2">
            <label className="text-sm text-white/60">Visibility</label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateVisibility(true)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  isPublic
                    ? 'bg-[#F5A623]/20 border-[#F5A623] text-[#F5A623]'
                    : 'bg-black/30 border-white/10 text-white/60 hover:border-white/30'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">Public</span>
              </button>
              <button
                onClick={() => onUpdateVisibility(false)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  !isPublic
                    ? 'bg-[#F5A623]/20 border-[#F5A623] text-[#F5A623]'
                    : 'bg-black/30 border-white/10 text-white/60 hover:border-white/30'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Private</span>
              </button>
            </div>
            <p className="text-xs text-white/40">
              {isPublic
                ? 'Anyone with the link can view this canvas'
                : 'Only you and collaborators can access'}
            </p>
          </div>

          {/* Add Collaborator */}
          <div className="space-y-2">
            <label className="text-sm text-white/60 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Add collaborators
            </label>
            <form onSubmit={handleAddCollaborator} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5A623]/50"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                type="submit"
                disabled={isAdding || !email.trim()}
                className="px-4 py-2 bg-[#F5A623] hover:bg-[#F5A623]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-black transition-colors"
              >
                {isAdding ? '...' : 'Add'}
              </button>
            </form>
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
          </div>

          {/* Collaborators List */}
          {collaborators.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm text-white/60">
                Collaborators ({collaborators.length})
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id || collab.email}
                    className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F5A623]/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-[#F5A623]">
                          {(collab.email || collab.name || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-white">{collab.email || collab.name}</p>
                        <p className="text-xs text-white/40 capitalize">{collab.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(collab.id || collab.email)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-white/40 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/80 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

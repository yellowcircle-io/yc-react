# Unity Note Plus Analysis & Implementation Plan

**Date:** November 28, 2025
**Status:** Analysis Complete - Ready for Implementation
**Reference:** ThreadDeck (https://www.usethreaddeck.com/canvas)

---

## ThreadDeck Feature Analysis (From Screenshot)

### Core Architecture
ThreadDeck is a **canvas-first workspace** that enables visual organization of notes, ideas, and AI interactions on an infinite canvas.

### Card Types Identified

| Card Type | Description | Visual Style |
|-----------|-------------|--------------|
| **Videos** | YouTube embeds with thumbnails | Dark panel, teal header label |
| **Relevant Links** | Website links with title, description, URL | Dark panel, teal header |
| **AI Chat Assistant** | Central chat with multiple AI models | Large dark panel, input field |
| **My Notes** | Structured note cards with sections | Dark panel, organized by type |
| **Prompts** | System prompts with instructions | Dark panel, detailed text |
| **Generate Prompts** | AI generation templates | Dark panel, actionable |

### UI Components

| Component | Purpose | Position |
|-----------|---------|----------|
| Canvas Assistant | Floating AI button | Bottom-left |
| Sidebar Tools | +, link, more options | Left edge |
| Card Labels | Type identification | Top of panels |
| AI Model Selector | Switch between models | In chat panel |

### Key Features
1. **Multi-AI Integration** - OpenAI, Claude, Gemini, Perplexity, Grok
2. **Dark Theme** - Black background with teal/emerald accents
3. **Grouped Panels** - Cards organized visually by type
4. **Reusable Components** - Save prompts, notes for quick insertion
5. **Real-time Collaboration** - Shared canvas with public/private links

---

## Unity Notes Current State

### Current Features
1. React Flow infinite canvas (dots background)
2. Photo/image nodes only (DraggablePhotoNode)
3. Location, date, description metadata per node
4. Zoom controls (right rail: +, %, -, center)
5. Context menu (Add, Export, Import, Share, Clear, Footer)
6. Lightbox modal for full-screen photos
7. Edit memory modal
8. Firebase shareable URLs (capsule system)
9. Local storage persistence (unity-notes-data)
10. JSON export/import
11. Keyboard shortcuts (arrows, +, -, 0)
12. **Light theme only**

### Architecture
- **File:** `src/pages/UnityNotesPage.jsx` (1,084 lines)
- **Node Type:** `photoNode` → DraggablePhotoNode
- **Storage:** `STORAGE_KEY = 'unity-notes-data'`
- **Sharing:** Firebase capsule system
- **Layout:** Hidden sidebar variant (0px closed)

---

## Gap Analysis

### Missing from Unity Notes (ThreadDeck Has)

| Feature | ThreadDeck | Unity Notes | Priority |
|---------|------------|-------------|----------|
| Multiple card types | ✅ 6 types | ❌ Photo only | **P0** |
| AI Chat integration | ✅ Multi-model | ❌ None | **P0** |
| Text/note cards | ✅ Yes | ❌ No | **P1** |
| Link cards | ✅ URL preview | ❌ No | **P1** |
| Video embeds | ✅ YouTube | ❌ No | **P2** |
| Dark theme | ✅ Default | ❌ Light only | **P1** |
| Prompt templates | ✅ Reusable | ❌ No | **P2** |
| Canvas assistant | ✅ Floating | ❌ No | **P2** |
| Card type grouping | ✅ Visual | ❌ No | **P3** |

### Unity Notes Advantages
- **Photo-first design** - Optimized for visual notes
- **Firebase integration** - Shareable URLs built-in
- **Lightbox modal** - Full-screen image viewing
- **Export/Import** - JSON backup system

---

## Unity Note Plus Feature Specification

### Version: 2.0 - Multi-Card Canvas

**Route:** `/unity-note-plus`
**Page:** `UnityNotePlusPage.jsx`

### New Card Types

#### 1. Text Note Card
```javascript
type: 'textNode'
data: {
  title: string,
  content: string,     // Rich text or markdown
  color: string,       // Card accent color
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 2. Link Card
```javascript
type: 'linkNode'
data: {
  url: string,
  title: string,       // Fetched or manual
  description: string, // Meta description
  favicon: string,     // Site icon
  thumbnail: string,   // OG image
  createdAt: timestamp
}
```

#### 3. AI Chat Card
```javascript
type: 'aiChatNode'
data: {
  messages: [
    { role: 'user' | 'assistant', content: string, timestamp }
  ],
  model: 'gpt-4o' | 'claude-3' | 'groq',
  systemPrompt: string,  // Optional
  createdAt: timestamp
}
```

#### 4. Video Card
```javascript
type: 'videoNode'
data: {
  url: string,          // YouTube/Vimeo URL
  platform: 'youtube' | 'vimeo',
  videoId: string,
  title: string,
  thumbnail: string,
  createdAt: timestamp
}
```

### UI Enhancements

#### Theme Toggle
- Light theme (current)
- Dark theme (ThreadDeck-style: black + teal)

#### Quick Add Panel
Bottom-center floating menu:
- 📝 Note (text card)
- 🖼️ Image (photo card)
- 🔗 Link (link card)
- 🤖 AI Chat (AI card)
- 📹 Video (video card)

#### Card Type Colors
| Type | Light Theme | Dark Theme |
|------|-------------|------------|
| Photo | Yellow (#EECF00) | Yellow (#EECF00) |
| Note | Blue (#3B82F6) | Cyan (#06B6D4) |
| Link | Purple (#8B5CF6) | Violet (#A78BFA) |
| AI Chat | Green (#10B981) | Emerald (#34D399) |
| Video | Red (#EF4444) | Rose (#FB7185) |

### AI Integration

#### Supported Models
1. **Groq** (FREE tier) - llama-3.1-8b-instant
2. **OpenAI** - gpt-4o-mini, gpt-4o
3. **Anthropic** - claude-3-haiku, claude-3-sonnet

#### Implementation
- API keys stored in localStorage (encrypted)
- Canvas-wide or per-card model selection
- Optional system prompts per card

---

## Implementation Plan

### Phase 1: Foundation (4-6 hours)
1. Create UnityNotePlusPage.jsx (copy from UnityNotesPage)
2. Add to RouterApp.jsx at `/unity-note-plus`
3. Create multi-node type architecture
4. Implement TextNoteNode component

### Phase 2: Additional Cards (4-6 hours)
1. Implement LinkNode component (URL metadata fetching)
2. Implement VideoNode component (YouTube embed)
3. Implement AIChatNode component (basic chat)

### Phase 3: AI Integration (3-4 hours)
1. Add Groq integration (free tier)
2. Add model selector UI
3. Add API key settings panel

### Phase 4: Theme & Polish (2-3 hours)
1. Implement dark theme toggle
2. Add Quick Add floating panel
3. Add card type color coding

**Total Estimate:** 13-19 hours

---

## Files to Create

1. `src/pages/UnityNotePlusPage.jsx` - Main page
2. `src/components/unity-plus/TextNoteNode.jsx`
3. `src/components/unity-plus/LinkNode.jsx`
4. `src/components/unity-plus/VideoNode.jsx`
5. `src/components/unity-plus/AIChatNode.jsx`
6. `src/components/unity-plus/QuickAddPanel.jsx`
7. `src/components/unity-plus/ThemeToggle.jsx`
8. `src/hooks/useAIChat.js` - AI integration hook
9. `src/utils/linkMetadata.js` - URL metadata fetching

---

## Next Steps

1. ✅ Analysis complete
2. ⏳ Create UnityNotePlusPage foundation
3. ⏳ Implement TextNoteNode
4. ⏳ Add to router
5. ⏳ Test basic functionality
6. ⏳ Add remaining card types
7. ⏳ Integrate AI
8. ⏳ Add theme toggle

---

**Updated:** November 28, 2025
**Author:** Claude Code (MacBook Air)

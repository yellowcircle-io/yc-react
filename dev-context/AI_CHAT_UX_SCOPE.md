# AI Chat Card UX Improvements Scope
## UnityNOTE AI Assistant Enhancement

**Created:** December 6, 2025
**Status:** Scoped - Ready for Implementation

---

## Current State Analysis

### What Works
- AI queries use Hub's encrypted Groq API key
- AI can read context from other notes on the canvas
- Basic Q&A functionality is working

### Current UX Problems

1. **Single Textarea Thread** - All conversation is appended to one textarea
   - No visual distinction between user questions and AI responses
   - No clear thread structure
   - Hard to follow multi-turn conversations
   - Content gets very long and hard to read

2. **AI Cannot Write to Other Cards**
   - `gatherPageContext()` collects read-only context
   - No ability for AI to create or update other cards
   - User must manually copy/paste AI suggestions

3. **No MAP Node Awareness**
   - AI only reads `textNode` and `photoNode` types
   - No awareness of campaign structure (prospectNode, emailNode, waitNode, conditionNode)
   - Cannot help with campaign editing or optimization

---

## Proposed Solution Architecture

### Phase 1: Improved Thread UI (Immediate)

**Goal:** Better conversation experience without major architecture changes

```
┌─────────────────────────────────────────┐
│ 🤖 AI CHAT                              │
│ ─────────────────────────────────────── │
│ ┌─────────────────────────────────────┐ │
│ │ 💬 User: What's on my board?       │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 🤖 AI: I see 3 notes: a GTM        │ │
│ │ strategy note, a LinkedIn post     │ │
│ │ draft, and a list of prospects...  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 💬 User: Update the LinkedIn post  │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 🤖 AI: I've prepared an update:    │ │
│ │ [Apply to Note 2] [Copy]           │ │
│ └─────────────────────────────────────┘ │
│ ─────────────────────────────────────── │
│ ┌─────────────────────────────────────┐ │
│ │ Ask a question...              [→] │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Implementation:**
- Store conversation as array of messages: `{ role: 'user'|'assistant', content: string, timestamp }`
- Render messages in scrollable thread view
- Fixed input at bottom
- Each AI response can have action buttons

**Files to Modify:**
- `src/components/unity-plus/TextNoteNode.jsx`

**Estimated Effort:** 3-4 hours

---

### Phase 2: AI Write Capability (Medium-term)

**Goal:** Allow AI to suggest and apply changes to other cards

**New Capabilities:**
1. **Suggest Updates** - AI proposes changes to specific notes
2. **Create Notes** - AI can draft new cards (requires user approval)
3. **Action Buttons** - "Apply to Note X", "Create New Note", "Copy"

**Data Flow:**
```
User: "Update my LinkedIn post to mention the new campaign"
         ↓
AI reads: [Note 1: LinkedIn draft] + [Note 2: Campaign details]
         ↓
AI responds: "Here's an updated LinkedIn post that mentions your Q1 campaign..."
         ↓
User clicks: [Apply to Note 1]
         ↓
System: Updates Note 1 content via onUpdate callback
```

**Implementation:**
- Add `onCreateNote` callback prop to AI card
- Add `onUpdateOtherNode` callback prop
- AI responses include structured actions: `{ type: 'update', targetNodeId: 'note-123', content: '...' }`
- Parse AI responses for action blocks

**Files to Modify:**
- `src/components/unity-plus/TextNoteNode.jsx` - Add action handling
- `src/pages/UnityNotesPage.jsx` - Pass new callbacks to AI cards

**Estimated Effort:** 6-8 hours

---

### Phase 3: MAP Node Awareness (Future)

**Goal:** AI understands and can help with email campaigns

**New Capabilities:**
1. **Read Campaign Structure** - Understand prospects, email sequences, wait times
2. **Suggest Email Improvements** - Rewrite subject lines, body copy
3. **Analyze Campaign Flow** - Identify bottlenecks, suggest optimizations
4. **Create/Edit Nodes** - Add new emails, modify wait times (with approval)

**Enhanced Context Gathering:**
```javascript
const gatherMAPContext = () => {
  // Include MAP-specific nodes
  const mapNodes = savedNodes.filter(n =>
    ['prospectNode', 'emailNode', 'waitNode', 'conditionNode', 'exitNode'].includes(n.type)
  );

  return mapNodes.map(node => {
    switch (node.type) {
      case 'emailNode':
        return `[Email: ${node.data.label}] Subject: ${node.data.subject} | Preview: ${node.data.preview}`;
      case 'waitNode':
        return `[Wait] ${node.data.delay} ${node.data.unit}`;
      case 'conditionNode':
        return `[Condition] ${node.data.conditionType}: ${node.data.description}`;
      case 'prospectNode':
        return `[Prospects] ${node.data.count} contacts, segment: ${node.data.segment}`;
      default:
        return `[${node.type}] ${JSON.stringify(node.data)}`;
    }
  });
};
```

**AI Actions for MAP:**
- `{ type: 'update-email', targetNodeId: 'email-123', subject: '...', body: '...' }`
- `{ type: 'create-email', afterNodeId: 'wait-456', subject: '...', body: '...' }`
- `{ type: 'modify-wait', targetNodeId: 'wait-456', delay: 5, unit: 'days' }`

**Files to Modify:**
- `src/components/unity-plus/TextNoteNode.jsx` - Enhanced context gathering
- `src/pages/UnityNotesPage.jsx` - MAP node action handlers
- Possibly: New `AIAssistantNode.jsx` component for richer interactions

**Estimated Effort:** 12-16 hours

---

## Implementation Priority

| Phase | Priority | Effort | Impact |
|-------|----------|--------|--------|
| Phase 1: Thread UI | HIGH | 3-4 hrs | Immediate UX improvement |
| Phase 2: Write to Cards | MEDIUM | 6-8 hrs | Enables AI productivity |
| Phase 3: MAP Awareness | LOW | 12-16 hrs | Advanced campaign optimization |

---

## Phase 1 Detailed Implementation

### 1. Data Structure Change

**Current:**
```javascript
const [localContent, setLocalContent] = useState(data.content || '');
// Content is plain text with `---` separators
```

**Proposed:**
```javascript
const [messages, setMessages] = useState(data.messages || []);
// Array of { role, content, timestamp, actions? }
```

### 2. UI Components

```jsx
{/* Thread View */}
<div className="ai-thread" style={{ maxHeight: '300px', overflowY: 'auto' }}>
  {messages.map((msg, i) => (
    <div key={i} className={`message ${msg.role}`} style={{
      backgroundColor: msg.role === 'user' ? '#f3f4f6' : '#fef9c3',
      padding: '8px 12px',
      borderRadius: '8px',
      marginBottom: '8px',
    }}>
      <span className="role-icon">{msg.role === 'user' ? '💬' : '🤖'}</span>
      <span className="content">{msg.content}</span>
      {msg.actions && <ActionButtons actions={msg.actions} />}
    </div>
  ))}
</div>

{/* Input */}
<div className="ai-input" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
  <input
    value={inputValue}
    onChange={(e) => setInputValue(e.target.value)}
    placeholder="Ask a question..."
    style={{ flex: 1 }}
  />
  <button onClick={handleSend} disabled={isLoading}>
    {isLoading ? '⏳' : '→'}
  </button>
</div>
```

### 3. Message Handling

```javascript
const handleSend = async () => {
  if (!inputValue.trim() || isLoading) return;

  // Add user message
  const userMessage = { role: 'user', content: inputValue, timestamp: Date.now() };
  setMessages(prev => [...prev, userMessage]);
  setInputValue('');

  setIsLoading(true);
  try {
    const context = gatherPageContext();
    const response = await adapter.generate(inputValue + context, options);

    // Add AI response
    const aiMessage = { role: 'assistant', content: response, timestamp: Date.now() };
    setMessages(prev => [...prev, aiMessage]);

    // Save to node data
    data.onUpdate(id, { messages: [...messages, userMessage, aiMessage] });
  } catch (error) {
    // Handle error...
  } finally {
    setIsLoading(false);
  }
};
```

---

## Questions to Resolve

1. **Message Persistence:** Store messages in localStorage or only in node data?
2. **Context Window:** How many previous messages to include in AI context?
3. **Clear History:** Should users be able to clear conversation history?
4. **Export:** Allow exporting conversation as text/markdown?

---

## Success Metrics

- **Phase 1:** Users can have clear multi-turn conversations
- **Phase 2:** AI can update at least 2 other note types
- **Phase 3:** AI can read and suggest edits to email campaigns

---

*Document Version: 1.0*
*Last Updated: December 6, 2025*

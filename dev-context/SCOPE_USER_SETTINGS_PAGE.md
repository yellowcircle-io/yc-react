# User Settings/Configuration Page Scope

## Overview
User-level configuration page for Unity Platform tools. Distinct from admin pages - focused on personalization, not system management.

---

## Key Principle: Admin vs User Settings

### Admin Pages (`/admin/*`)
- System-wide configuration
- User management
- Analytics/reporting
- Content moderation
- Requires `isAdmin` role

### User Settings (`/account/settings`)
- Personal preferences
- Tool customization
- Account management
- NO admin capabilities
- Available to all authenticated users

---

## Research Comparison (Updated January 2026)

### Milanote Architecture
| Route | Purpose |
|-------|---------|
| `/account/settings` | Name, Email, Password, Delete account |
| `/account/notifications` | Email & notification preferences |
| `/account/interface` | Appearance settings |
| `/account/preferences` | General preferences |
| `/account/localization` | Language, timezone |
| `/account/toolbar` | Toolbar customization |
| `/account/privacy` | Privacy settings |

**Key Pattern:** Sidebar navigation with separate routes for each section.

### ThreadDeck Architecture
| Route | Purpose |
|-------|---------|
| `/account/canvases` | Saved layouts, folders, canvas management |
| `/account/usage` | Token allowance, overages |
| `/account/billing` | Plan controls, invoices |
| `/account/blocks` | Personas, briefs, prompts, notes |

**Key Pattern:** Workspace-focused settings with token/usage tracking.

### yellowCircle Approach
Hybrid approach: Single page with tabs (simpler than Milanote's multi-route) but with clear section organization (like ThreadDeck).

| Feature | Milanote | ThreadDeck | yellowCircle |
|---------|----------|------------|--------------|
| **Location** | `/account/*` (multi-route) | `/account/*` (multi-route) | `/account/settings` (single + tabs) |
| **Navigation** | Sidebar with links | Sidebar with links | Tab bar |
| **Sections** | 7 separate pages | 4 separate pages | 4 tabs on one page |
| **Theme** | Appearance page | Dark mode toggle | Appearance tab |
| **Tool Prefs** | Toolbar options | Canvas-specific | Unity Tools tab |

---

## Proposed Route Structure

```
/account/settings (main settings page - tabbed)
├── Tab: Profile (default)
├── Tab: Unity Tools
├── Tab: Appearance
└── Tab: Integrations (Future)
```

---

## Page Structure

### Tab 1: Profile
- Display name (editable)
- Profile photo/avatar
- Email (read-only, from auth)
- Email preferences
  - Marketing emails opt-in/out
  - Notification preferences

### Tab 2: Unity Tools
- **Link Archiver**
  - Default folder for new saves
  - Auto-archive after X days
  - Default view (All/Starred/Recent)
- **Unity NOTES**
  - Default node type when adding
  - Canvas zoom default (fit/100%/custom)
  - Show grid by default
  - Default capsule visibility (private/shared)
- **Unity MAP**
  - Journey template defaults
  - Default ESP integration

### Tab 3: Appearance
- Theme (Dark/Light/System)
  - Leverages existing ThemeContext
- Sidebar default state (expanded/collapsed)
- Density (Comfortable/Compact)
- Accent color (optional)

### Tab 4: Integrations (Future)
- Connected accounts
  - Google (already via Firebase Auth)
  - HubSpot (ESP)
  - Brevo (ESP)
- API keys (if applicable)
- Webhook URLs

---

## Technical Architecture

### New Files
```
src/pages/AccountSettingsPage.jsx    # Main settings page at /account/settings
src/contexts/UserSettingsContext.jsx # Settings state management
src/components/settings/             # Tab components
  ├── ProfileSettings.jsx
  ├── ToolsSettings.jsx
  ├── AppearanceSettings.jsx
  └── IntegrationsSettings.jsx
```

### Firestore Schema
```javascript
// Collection: user_settings
// Document ID: user.uid
{
  profile: {
    displayName: string,
    avatarUrl: string | null,
    emailPreferences: {
      marketing: boolean,
      notifications: boolean
    }
  },
  tools: {
    linkArchiver: {
      defaultFolderId: string | null,
      autoArchiveDays: number | null,
      defaultView: 'all' | 'starred' | 'recent'
    },
    unityNotes: {
      defaultNodeType: 'textNode' | 'photoNode' | 'stickyNode',
      defaultZoom: number,
      showGrid: boolean,
      defaultVisibility: 'private' | 'shared'
    },
    unityMap: {
      defaultTemplate: string | null
    }
  },
  appearance: {
    theme: 'light' | 'dark' | 'system',
    sidebarCollapsed: boolean,
    density: 'comfortable' | 'compact'
  },
  integrations: {
    // Future
  },
  updatedAt: Timestamp
}
```

### UserSettingsContext
```jsx
// src/contexts/UserSettingsContext.jsx
const UserSettingsContext = createContext();

export const UserSettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings on auth
  useEffect(() => {
    if (user?.uid) {
      loadUserSettings(user.uid).then(setSettings);
    }
  }, [user]);

  // Save settings
  const updateSettings = async (path, value) => {
    // Optimistic update
    // Firestore sync
  };

  return (
    <UserSettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export const useUserSettings = () => useContext(UserSettingsContext);
```

---

## UI/UX Guidelines

### Design Principles
1. **Simple navigation** - Tabs, not nested pages
2. **Immediate feedback** - Show saving indicator
3. **Sensible defaults** - Work out of the box
4. **Non-destructive** - Warn before data loss

### Styling
- Follow existing brand (yellowCircle yellow: #fbbf24)
- Consistent with Layout component
- Mobile responsive
- Match existing page patterns (LinkArchiverPage styles)

---

## Implementation Phases

### Phase 1: Foundation
1. Create SettingsPage.jsx with tab structure
2. Create UserSettingsContext.jsx
3. Add route to RouterApp.jsx
4. Basic Profile tab (display name, email prefs)

### Phase 2: Tool Settings
1. Link Archiver settings section
2. Unity NOTES settings section
3. Wire settings to respective pages

### Phase 3: Appearance
1. Theme toggle (integrate with ThemeContext)
2. Density settings
3. Sidebar default

### Phase 4: Polish
1. Loading states
2. Error handling
3. Success notifications
4. Mobile optimization

---

## Firestore Rules Update

```javascript
// Add to firestore.rules
match /user_settings/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## Router Update

```jsx
// src/RouterApp.jsx
import AccountSettingsPage from './pages/AccountSettingsPage';

// Add to routes
<Route path="/account/settings" element={<PrivateRoute><AccountSettingsPage /></PrivateRoute>} />
```

---

## Testing Checklist

- [ ] Settings load on page visit
- [ ] Settings persist after page refresh
- [ ] Settings sync across tabs/windows
- [ ] Theme toggle works immediately
- [ ] All form validations work
- [ ] Mobile responsive
- [ ] Loading states display correctly
- [ ] Error states handled gracefully

---

*Last Updated: January 18, 2026*
*Notion Task: https://www.notion.so/2ed15c1b110d8124bf84c3a2c1189934*

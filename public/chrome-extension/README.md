# yellowCircle Link Saver - Chrome Extension

Save links to your yellowCircle collection with one click or keyboard shortcut.

## Installation (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select this `chrome-extension` folder
5. The yellowCircle icon will appear in your toolbar

## Setup

1. Click the yellowCircle extension icon
2. Enter your API token (find it at [Account Settings](https://yellowcircle.io/account/settings))
3. Click **Connect Account**

## Usage

### Popup
- Click the extension icon to open the popup
- Optionally add tags
- Click **Save Link**

### Keyboard Shortcuts
- `Alt + S` (Mac: `Ctrl + S`) - Quick save current page (no popup)
- `Alt + Shift + S` (Mac: `Ctrl + Shift + S`) - Open popup

### Context Menu
- Right-click on any page → **Save to yellowCircle**
- Right-click on any link → **Save link to yellowCircle**
- Select text with URLs → Right-click → **Save selected links**

## Features

- One-click save from popup
- Keyboard shortcuts for power users
- Context menu for quick saving
- Right-click on links to save them
- Extract and save multiple URLs from selected text
- Tags support
- Desktop notifications for quick saves

## Permissions

- **activeTab** - Access current page URL and title
- **storage** - Store your API token locally
- **contextMenus** - Right-click menu integration
- **notifications** - Show save confirmations

## Troubleshooting

**"Invalid token" error**
- Verify your token starts with `yc_`
- Generate a new token at [Account Settings](https://yellowcircle.io/account/settings)

**Extension not saving links**
- Check your internet connection
- Ensure the token is still active (hasn't been revoked)

## Privacy

- Your API token is stored locally in Chrome sync storage
- Only the URL and title of pages you save are sent to yellowCircle servers
- No browsing history or other data is collected

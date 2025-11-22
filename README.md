# yellowCircle - Interactive Portfolio

A React-based interactive portfolio website showcasing design, development, and strategic thinking.

## 📚 Documentation Navigation

**📖 [Complete Repository Table of Contents](REPOSITORY_TOC.md)** - Full documentation index for entire repository

**Quick Links:**
- [Getting Started](#quick-start) - Local development setup
- [Deployment](#deployment) - Deploy to Firebase
- [Application Structure](REPOSITORY_TOC.md#-application-code) - Code organization
- [Multi-Machine Framework](.claude/TABLE_OF_CONTENTS.md) - Work across multiple devices

---

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Firebase CLI (`npm install -g firebase-tools`)

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Development server with network access
npm run start

# Lint code
npm run lint
```

Visit `http://localhost:5173` to view the application.

---

## Deployment

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Deploy to Firebase

```bash
# Login to Firebase (first time only)
firebase login

# Deploy to production
firebase deploy

# Deploy to preview channel
firebase hosting:channel:deploy preview-name
```

For detailed deployment instructions, see [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md).

---

## Technology Stack

- **Frontend:** React 19.1, Vite 5.4
- **Styling:** Tailwind CSS 4.1
- **Icons:** Lucide React
- **Hosting:** Firebase Hosting
- **Functions:** Firebase Cloud Functions
- **Images:** Cloudinary
- **Development:** ESLint, Builder.io dev tools

---

## Project Structure

```
yellowCircle/
├── src/                    # Application source code
│   ├── pages/              # React page components
│   ├── components/         # Reusable components
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # Context providers
│   └── config/             # Configuration files
│
├── .claude/                # Multi-Machine Framework
├── dev-context/            # Strategic planning
├── docs/                   # Documentation
├── public/                 # Static assets
└── functions/              # Firebase Cloud Functions
```

For complete structure, see [REPOSITORY_TOC.md](REPOSITORY_TOC.md).

---

## Key Features

### Application Features
- **Interactive Homepage** with parallax effects and device motion
- **Portfolio Showcase** for works and projects
- **Time Capsule** feature with Firebase integration
- **Thought Leadership** content system
- **Responsive Design** optimized for all devices

### Development Features
- **Multi-Machine Sync** via Dropbox + GitHub
- **Custom Slash Commands** for project management
- **Automated Maintenance** system for Mac Mini
- **Comprehensive Documentation** with dual TOC system

---

## Development Workflow

### For Claude Code Sessions

1. **Start Every Session:**
   ```bash
   ./.claude/verify-sync.sh
   cat .claude/shared-context/WIP_CURRENT_CRITICAL.md
   ```

2. **During Development:**
   - Update WIP file before machine switches
   - Commit significant changes to git
   - Wait 30 seconds for Dropbox sync

3. **End Every Session:**
   - Update `.claude/shared-context/WIP_CURRENT_CRITICAL.md`
   - Update `.claude/INSTANCE_LOG_[MACHINE].md`
   - Push to GitHub for remote access

See [CLAUDE.md](CLAUDE.md) for complete Claude Code instructions.

---

## Testing

```bash
# Run linting
npm run lint

# Build test
npm run build

# Preview production build
npm run preview
```

For comprehensive testing, see [PRODUCTION_TEST_PLAN.md](PRODUCTION_TEST_PLAN.md).

---

## Troubleshooting

### Common Issues
- **Sync problems:** Run `./.claude/verify-sync.sh`
- **Build errors:** Check [KNOWN_ISSUES.md](KNOWN_ISSUES.md)
- **Firebase quota:** See [FIREBASE-QUOTA-EXCEEDED.md](FIREBASE-QUOTA-EXCEEDED.md)

For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## Contributing

This is a personal portfolio project. For development guidelines:
- Read [CLAUDE.md](CLAUDE.md) for Claude Code workflow
- Follow [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) checklist
- Check [REPOSITORY_TOC.md](REPOSITORY_TOC.md) for documentation

---

## Documentation

### Primary Documentation
- **[REPOSITORY_TOC.md](REPOSITORY_TOC.md)** - Complete repository navigation
- **[.claude/TABLE_OF_CONTENTS.md](.claude/TABLE_OF_CONTENTS.md)** - Multi-Machine Framework
- **[CLAUDE.md](CLAUDE.md)** - Claude Code instructions
- **[QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md)** - Deployment guide

### Strategic Documents
- **[dev-context/PROJECT_ROADMAP_NOV2025.md](dev-context/PROJECT_ROADMAP_NOV2025.md)** - Current roadmap
- **[dev-context/OWN_YOUR_STORY_SERIES_BLUEPRINT.md](dev-context/OWN_YOUR_STORY_SERIES_BLUEPRINT.md)** - Content strategy

---

## License

Private project - All rights reserved

---

## Links

- **Production:** https://yellowcircle-app.web.app
- **Repository:** https://github.com/yellowcircle-io/yc-react
- **Firebase Console:** https://console.firebase.google.com

---

**Last Updated:** November 21, 2025
**Status:** Active Development
**Framework Version:** 2.1

# Repository Reorganization Plan

**Created:** 2026-01-15
**Status:** Planned
**Purpose:** Enable public portfolio/community branch while keeping sensitive data private

---

## Current State

| Aspect | Status |
|--------|--------|
| Repository | `yellowcircle-io/yc-react` |
| Visibility | PUBLIC (needs to be made PRIVATE) |
| Branch Strategy | Single `main` branch |
| Sensitive Files | `.env` removed from tracking (as of be040bf) |
| Claude Framework | `.claude/` directory tracked |
| Deployment | Firebase Hosting via GitHub Actions |

---

## Proposed Structure

### Option A: Single Repo with Public/Private Branches (Recommended)

```
yellowcircle-io/yc-react (PRIVATE repo)
├── main (private) - Full development branch
│   ├── .claude/         - Multi-machine framework
│   ├── dev-context/     - Development notes
│   ├── src/             - Full source code
│   ├── functions/       - Firebase functions
│   └── .github/workflows/ - All CI/CD
│
└── public-portfolio (public branch) - Curated showcase
    ├── src/             - Clean source code
    ├── README.md        - Portfolio documentation
    └── LICENSE          - Open source license
```

**Benefits:**
- Single repo to maintain
- Easy to sync changes from main → public-portfolio
- Sensitive files naturally excluded from public branch

**Implementation:**
1. Make repo private
2. Create `public-portfolio` orphan branch
3. Cherry-pick/copy clean files
4. Set branch visibility or use GitHub Pages from that branch

### Option B: Two Separate Repositories

```
yellowcircle-io/yc-react (PRIVATE)
├── Main development repo
├── All sensitive files
└── Full commit history

yellowcircle-io/yellowcircle-portfolio (PUBLIC)
├── Curated portfolio code
├── Clean commit history
└── Community-facing README
```

**Benefits:**
- Complete separation of concerns
- Cleaner public repository
- No risk of accidentally exposing private content

**Implementation:**
1. Make current repo private
2. Create new public repo
3. Copy clean files (no history)
4. Maintain manually or with automation

---

## Content Classification

### PRIVATE (Never in public branch)
- `.claude/` - Multi-machine framework, instance logs
- `.env` - API keys and tokens
- `dev-context/` - Internal development notes
- `functions/*.local.js` - Local function configs
- `scripts/*-capsule.cjs` - Firebase capsule scripts
- `.github/workflows/*.yml` - CI/CD with secrets refs
- `*.backup*`, `*.broken*` - WIP files

### PUBLIC (Safe for portfolio)
- `src/components/` - React components
- `src/pages/` - Page components (cleaned)
- `src/styles/` - CSS/Tailwind styles
- `src/hooks/` - Custom React hooks
- `README.md` - Project documentation (new version)
- `package.json` - Dependencies (cleaned)
- `vite.config.js` - Build configuration
- `tailwind.config.js` - Styling configuration

### REVIEW REQUIRED
- `src/config/` - May contain hardcoded values
- `firebase.json` - Contains project IDs
- `.firebaserc` - Contains project aliases

---

## Implementation Steps (Option A)

### Phase 1: Secure Main Branch
1. [x] Remove `.env` from git tracking
2. [x] Update `.gitignore` with new exclusions
3. [ ] Make repository PRIVATE (manual step)
4. [ ] Verify GitHub Actions still work

### Phase 2: Create Public Branch
```bash
# Create orphan branch (no history)
git checkout --orphan public-portfolio

# Remove all files
git rm -rf .

# Copy only public-safe files
cp -r ../main/src .
cp ../main/package.json .
cp ../main/vite.config.js .
cp ../main/tailwind.config.js .
cp ../main/index.html .

# Create new README for portfolio
echo "# Yellow Circle Portfolio" > README.md

# Initial commit
git add .
git commit -m "Initial public portfolio branch"
```

### Phase 3: Configure Public Access
**Option 3A: GitHub Pages from branch**
- Settings → Pages → Source: `public-portfolio`
- Provides read-only public view

**Option 3B: Branch-level visibility (Enterprise only)**
- Not available on free/pro plans

**Option 3C: Fork as public repo**
- Fork `public-portfolio` branch to new public repo
- Maintain with periodic syncs

---

## Community Features to Enable

### For Personal Development (PD) Showcase
- Clean README with project overview
- Technology stack highlights
- Interactive demo links (Firebase hosted)
- Code samples demonstrating skills

### For Community Engagement
- MIT or Apache 2.0 license
- Contributing guidelines
- Issue templates for feedback
- Discussion board (GitHub Discussions)

---

## Recommended Next Actions

1. **Immediate:** Make repo private via GitHub settings
2. **Short-term:** Decide between Option A or B
3. **Medium-term:** Create public branch/repo with curated content
4. **Ongoing:** Establish sync process for updates

---

## Manual Step Required

**To make repository private:**
1. Go to https://github.com/yellowcircle-io/yc-react/settings
2. Scroll to "Danger Zone" section
3. Click "Change repository visibility"
4. Select "Make private"
5. Type repository name to confirm

**Note:** This will NOT affect:
- Existing clones
- GitHub Actions (secrets remain)
- Firebase deployment
- Collaborator access

---

## Document History
- 2026-01-15: Initial plan created

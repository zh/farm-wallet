# Farm Wallet Implementation Plan

## Overview
Simple single-token eCash wallet with English/French internationalization support.

## Project Structure
```
farm-wallet/
├── package.json ✓
├── vite.config.js
├── index.html
├── docs/
│   ├── IMPLEMENTATION_PLAN.md ✓
│   └── TODO.md ✓
├── public/
│   └── minimal-xec-wallet.min.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── atoms.js (simplified + locale + tokenId)
    ├── i18n/
    │   ├── index.js (i18n setup)
    │   └── locales/
    │       ├── en.json
    │       └── fr.json
    ├── components/
    │   ├── TokenBalance.jsx
    │   ├── TokenSend.jsx
    │   ├── XecFeeBalance.jsx
    │   ├── LanguageToggle.jsx
    │   └── Layout/ (reused)
    ├── pages/
    │   ├── HomePage.jsx
    │   ├── SendPage.jsx
    │   └── FundPage.jsx
    ├── hooks/
    │   └── useTranslation.js
    ├── utils/ (reused)
    └── styles/ (reused)
```

## Implementation Stages

### Stage 1: Project Setup & Configuration ✓
- [x] Create project structure
- [x] Setup package.json with i18n dependencies
- [x] Create docs directory
- [ ] Copy assets from ecash-wallet
- [ ] Setup environment configuration

### Stage 2: Locale Infrastructure
- [ ] Create i18n configuration with localStorage persistence
- [ ] Create translation files (en.json, fr.json)
- [ ] Extended atoms.js with localeAtom and tokenIdAtom
- [ ] Create useTranslation hook
- [ ] Create LanguageToggle component

### Stage 3: Core Components with i18n
- [ ] TokenBalance component
- [ ] XecFeeBalance component  
- [ ] Update Layout components with translations
- [ ] Update Address component with translations

### Stage 4: Page Implementation with i18n
- [ ] HomePage with translations
- [ ] SendPage with translations and fee balance
- [ ] FundPage with translations

### Stage 5: Translation Completion
- [ ] Complete all translation files
- [ ] Test language switching
- [ ] Verify persistence

### Stage 6: Final Testing & Polish
- [ ] Test all functionality in both languages
- [ ] Update documentation
- [ ] Final verification

## Key Features
- ✓ Dual Language Support (EN/FR)
- ✓ Language Persistence (localStorage)
- Single Token Operation (VITE_TOKEN_ID)
- Fixed hdPath: m/44'/1899'/0'/0/0 (Cashtab)
- Simple fee balance display
- 3 Pages: Home, Send, Fund

## Dependencies Added
- ✓ react-i18next: ^13.5.0
- ✓ i18next: ^23.15.1
- ✓ i18next-browser-languagedetector: ^7.2.1

## Status: Stage 1 in Progress
Current focus: Setting up basic project structure and configuration files.
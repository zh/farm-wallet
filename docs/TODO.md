# Farm Wallet TODO List

## Current Sprint: Project Setup & Basic Infrastructure

### ✅ Completed
- [x] Research existing ecash-wallet structure
- [x] Create project directory structure
- [x] Setup package.json with i18n dependencies
- [x] Create documentation files

### 🚧 In Progress
- [ ] Copy reusable assets from ecash-wallet
- [ ] Setup basic configuration files

### 📋 Next Up
- [ ] Setup i18n configuration with localStorage persistence
- [ ] Create translation files (en.json, fr.json) with base translations
- [ ] Create simplified atoms.js with localeAtom and tokenIdAtom

## Backlog

### Stage 2: Internationalization Infrastructure
- [ ] Create i18n/index.js configuration
- [ ] Setup useTranslation custom hook
- [ ] Create LanguageToggle component
- [ ] Test language switching functionality

### Stage 3: Core Components
- [ ] Create TokenBalance component (single token focus)
- [ ] Create XecFeeBalance component (fee balance display)
- [ ] Copy and adapt Layout components with i18n
- [ ] Update Address component with translations

### Stage 4: Pages Implementation
- [ ] HomePage with token balance and receive functionality
- [ ] SendPage with token send and fee balance display
- [ ] FundPage with wallet details and XEC receiving

### Stage 5: Translation & Polish
- [ ] Complete all English translations
- [ ] Complete all French translations
- [ ] Test language persistence
- [ ] Verify all UI text is translated

### Stage 6: Final Testing
- [ ] Test with sample token ID
- [ ] Verify all functionality works in both languages
- [ ] Test QR scanner functionality
- [ ] Final documentation update

## Blockers
None currently identified.

## Notes
- Using fixed hdPath: m/44'/1899'/0'/0/0 (Cashtab compatibility)
- Token ID will be configured via VITE_TOKEN_ID environment variable
- No wallet health monitoring or complex features
- Minimal UI with focus on single token operations

## Environment Configuration Needed
- [ ] VITE_TOKEN_ID - Token ID to operate on
- [ ] Create .env.example file
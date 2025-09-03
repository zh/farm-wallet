# Farm Wallet

A simple, user-friendly single-token wallet for eCash (XEC) built with React and Vite. This wallet is designed to handle one specific token at a time, making it perfect for projects that need a focused, streamlined wallet experience.

## Features

- 🪙 **Single-token focus** - Configure for one specific token
- 🌍 **Multi-language support** - Built-in internationalization
- 📱 **Mobile-friendly** - Responsive design that works on all devices  
- 📷 **QR code support** - Scan QR codes for easy transactions
- ⚡ **Fast development** - Built with Vite for quick development cycles
- 🔄 **Modern state management** - Uses Jotai for predictable state handling

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/zh/farm-wallet.git
cd farm-wallet
npm install
```

### 2. Configure Your Token
Copy the environment example file and set your token ID:

```bash
cp .env.example .env
```

Edit `.env` and set your token ID:

```bash
VITE_TOKEN_ID=your_token_id_here
```

### 3. Start Development

```bash
npm run dev
```

Your wallet will be available at `http://localhost:5173`

## Environment Configuration

### Setting VITE_TOKEN_ID

The `VITE_TOKEN_ID` is the most important configuration. This determines which token your wallet will handle.

1. **Find your token ID**: This is a long string (usually 64 characters) that uniquely identifies your token on the eCash network
2. **Add it to .env**: Replace `your_token_id_here` with your actual token ID
3. **Restart the dev server**: Environment changes require a restart

Example:

```bash
VITE_TOKEN_ID=4bd147fc5d5ff26249a9299c46b80920c0b81f59a60895a2ca91a5a6fb9d8da1
```

### Other Configuration Options

You can add other environment variables to customize the wallet:

```bash
# Optional: Custom API endpoints
VITE_API_BASE_URL=https://your-api.com

# Optional: Network configuration  
VITE_NETWORK=mainnet
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

## Repository Structure

```
farm-wallet/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Main wallet pages
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Helper functions
│   ├── i18n/          # Translation files
│   └── styles/        # Styling
├── public/            # Static assets
└── dist/             # Built files (after npm run build)
```

## Deployment

### Deploy to Vercel
1. Build your project: `npm run build`
2. Install Vercel CLI: `npm i -g vercel`
3. Deploy: `vercel --prod`
4. Set `VITE_TOKEN_ID` environment variable in your Vercel dashboard

### Deploy to Netlify
1. Build your project: `npm run build`
2. Upload the `dist/` folder to Netlify
3. Set environment variables in your Netlify site settings

### Deploy Anywhere
The wallet builds to static files, so you can deploy the `dist/` folder to any web server:

```bash
npm run build
# Upload everything in dist/ to your web server
```

## Customizing the Wallet

### Adding New Languages
1. Add translation files in `src/i18n/locales/`
2. Import them in `src/i18n/index.js`
3. The wallet will automatically detect user language

### Styling
- Global styles: `src/styles/`
- Component styles: Each component has its own CSS file
- The wallet uses modern CSS with CSS custom properties

### Adding Features
1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Use Jotai atoms in `src/atoms.js` for state management

## Troubleshooting

### Common Issues

**Wallet won't start**: Make sure you've set `VITE_TOKEN_ID` in your `.env` file

**Token not loading**: Verify your token ID is correct and the token exists on the eCash network

**Build failing**: Run `npm run lint:fix` to fix common code issues

**Dependencies issues**: Delete `node_modules` and `package-lock.json`, then run `npm install`

## Contributing

This wallet is open source and welcomes contributions!

1. Fork the repository: https://github.com/zh/farm-wallet
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test them
4. Run the linter: `npm run lint:fix`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Tech Stack

- **Frontend**: React 19 + Vite 6
- **State Management**: Jotai
- **Styling**: Modern CSS
- **Blockchain**: ecash-lib for eCash integration
- **QR Codes**: Built-in QR code scanning and generation
- **i18n**: react-i18next for translations

## License

This project is open source and available under the [MIT License](LICENSE).
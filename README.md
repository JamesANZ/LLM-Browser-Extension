# LLM Browser Extension

A browser extension that allows Large Language Models (LLMs) to modify webpages via API calls. Users can select text, ask questions, and have the AI modify the webpage in real-time.

## Features

- 🤖 **LLM Integration**: Support for OpenAI, Anthropic, and custom API endpoints
- 🎯 **Text Selection**: Select any text on a webpage and ask the AI to explain or modify it
- 🎨 **Webpage Modification**: Change colors, styles, content, and structure
- ⚡ **Real-time Updates**: See changes applied instantly to the webpage
- 🔧 **Easy Configuration**: Simple setup for API keys and model selection
- 🚀 **Quick Actions**: Pre-built actions for common tasks

## Installation

### Development Setup

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd llm-browser-extension
npm install
```

2. **Build the extension:**

```bash
npm run build
```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

### Production Build

```bash
npm run build
```

## Configuration

1. Click the extension icon in your browser toolbar
2. Go to the "Settings" tab
3. Configure your LLM provider:
   - **OpenAI**: Enter your API key and model (e.g., `gpt-4`)
   - **Anthropic**: Enter your API key and model (e.g., `claude-3-sonnet`)
   - **Custom**: Enter your API endpoint and model

## Usage

### Basic Usage

1. **Activate the extension** on any webpage by clicking the 🤖 button
2. **Select text** you want to modify or explain
3. **Open the popup** and choose a quick action or enter a custom request
4. **Watch the magic** as the AI modifies the webpage

### Quick Actions

- **Change Color**: Modernize the webpage's color scheme
- **Explain Text**: Get explanations for selected text
- **Summarize**: Get a summary of the webpage content
- **Translate**: Translate content to English

### Custom Requests

You can ask the AI to do almost anything:

- "Make this page more accessible"
- "Add a dark mode toggle"
- "Simplify the navigation"
- "Make the text more readable"
- "Add animations to buttons"

## Development

### Project Structure

```
src/
├── background/          # Background service worker
├── content/            # Content script for DOM manipulation
├── popup/              # Extension popup UI
├── services/           # LLM API integration
└── shared/             # Shared types and utilities
```

### Available Scripts

- `npm run build` - Build for production
- `npm run dev` - Build and watch for development
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run type-check` - TypeScript type checking

### Testing

```bash
npm test
```

## API Integration

The extension supports multiple LLM providers:

### OpenAI

```json
{
  "provider": "openai",
  "apiKey": "your-api-key",
  "model": "gpt-4"
}
```

### Anthropic

```json
{
  "provider": "anthropic",
  "apiKey": "your-api-key",
  "model": "claude-3-sonnet"
}
```

### Custom API

```json
{
  "provider": "custom",
  "apiKey": "your-api-key",
  "model": "your-model",
  "baseUrl": "https://your-api.com/v1"
}
```

## Security

- API keys are stored securely in Chrome's sync storage
- All API calls are made from the background script
- Content scripts only handle DOM manipulation
- No data is sent to third parties except your configured LLM provider

## Troubleshooting

### Common Issues

1. **Extension not working**: Make sure you've configured your API key in settings
2. **Changes not applying**: Check that the content script is loaded (look for the 🤖 button)
3. **API errors**: Verify your API key and model name are correct

### Debug Mode

Enable Chrome's developer tools to see console logs from the extension.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Privacy

This extension:

- Stores your API key locally in Chrome's secure storage
- Only sends webpage content to your configured LLM provider
- Does not collect or store any personal data
- Does not track your browsing activity

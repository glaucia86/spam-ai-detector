# 🛡️ Spam E-mail AI Detector with LangChain.js & GitHub Models

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub_Models-100000?style=for-the-badge&logo=github&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)


> Before you start, please give a ⭐️ to this repository if you find it useful! And **[open an issue](https://github.com/glaucia86/spam-ai-detector/issues)** if you have any questions or suggestions.

An advanced, production-ready spam detection system built with **[LangChain.js](https://js.langchain.com/docs/introduction/)**, **[Next.js](https://nextjs.org/)**, and **[GitHub Models](https://github.com/marketplace?type=models)**. Features multiple AI-powered detection algorithms, memory capabilities, caching, and a beautiful web interface.

![Project Demo](./resource/images/spam_detector_ai_01.gif)

## 🧪 Do you want to test the application?

Click in the Codespaces button below to get started.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/glaucia86/spam-ai-detector)

## 🚀 Features

- ✅ **4 Different Detection Algorithms** - Basic, Advanced, Memory, and Comparison modes
- ✅ **LangChain.js Integration** - Structured output parsing and chain orchestration
- ✅ **Memory & Learning** - Detector that learns from previous analyses
- ✅ **Smart Caching** - Reduces API calls and improves performance
- ✅ **Multi-step Analysis** - Content analysis → Threat assessment → Final decision
- ✅ **GitHub Models Integration** - Cost-effective AI inference
- ✅ **Beautiful Web Interface** - Modern UI built with Next.js and Tailwind CSS
- ✅ **TypeScript** - Full type safety and better DX
- ✅ **Production Ready** - Error handling, retries, and validation

## 🏗️ Tech Stack

| Technology | Purpose | Version |
|-----------|---------|---------|
| **Next.js 15** | Full-stack React framework | `^15.3.4` |
| **TypeScript** | Type safety and better DX | `^5.0` |
| **LangChain.js** | LLM orchestration and chains | `^0.3.29` |
| **@langchain/openai** | OpenAI integration | `^0.5.16` |
| **Tailwind CSS** | Styling and responsive design | `^3.4.16` |
| **Zod** | Schema validation | `^3.25.71` |
| **GitHub Models** | AI inference provider | Latest |

## 🎯 Detection Algorithms

### 1. **Basic Detector** (`spam-detector-langchain.ts`)

- **Purpose**: Fast, lightweight spam detection
- **Technology**: LangChain with structured output parsing
- **Use Case**: Quick analysis for high-volume scenarios
- **Response Time**: ~1-2 seconds

```typescript
// Basic analysis with confidence scoring
{
  isSpam: boolean,
  reason: string,
  confidence: number,
  threatLevel: "LOW" | "MEDIUM" | "HIGH"
}
```

### 2. **Advanced Detector** (`spam-detector-advanced.ts`)

- **Purpose**: Multi-step analysis with threat categorization
- **Technology**: Chain of specialized analyzers
- **Steps**: Content Analysis → Threat Assessment → Final Decision
- **Use Case**: Detailed analysis requiring comprehensive evaluation

```typescript
// Advanced analysis with detailed breakdown
{
  isSpam: boolean,
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  analysis: {
    suspiciousKeywords: string[],
    phishingProbability: number,
    spamCategory: "FINANCIAL" | "PHISHING" | "LOTTERY" | etc.
  }
}
```

### 3. **Memory Detector** (`spam-detector-memory.ts`)

- **Purpose**: Learning detector with context awareness
- **Technology**: BufferMemory + intelligent caching
- **Features**: 
  - Learns from previous analyses
  - Pattern similarity scoring
  - Smart caching (1-hour expiry, 100 item limit)
- **Use Case**: Adaptive detection that improves over time

```typescript
// Memory-enhanced analysis
{
  isSpam: boolean,
  patternSimilarity: number,
  learningFeedback: string,
  fromCache: boolean
}
```

### 4. **Comparison Mode** (`unified-spam-detector.ts`)

- **Purpose**: Consensus-based detection using all algorithms
- **Technology**: Parallel execution with agreement scoring
- **Output**: Results from all detectors + consensus decision
- **Use Case**: High-stakes scenarios requiring maximum accuracy

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js 18+** 
- **npm** or **yarn**
- **GitHub Models API token** (free)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/spam-ai-detector.git
cd spam-ai-detector
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_OPEN_API_GITHUB_MODEL_TOKEN="your_github_token_here"
NEXT_PUBLIC_OPEN_API_GITHUB_MODEL_ENDPOINT="https://models.inference.ai.azure.com"
```

### 4. Get GitHub Models API Token

1. Go to [GitHub Settings](https://github.com/settings/tokens)
2. Navigate to **Developer settings** → **Personal access tokens**
3. Create a new token with **GitHub Models** access
4. Copy the token to your `.env.local` file

### 5. Run the Application

**Development Mode:**

```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 API Reference

### Analyze Email

**POST** `/api/analyze`

```typescript
// Request
{
  "email": "Email content to analyze",
  "detectorType": "basic" | "advanced" | "memory",
  "compare": false
}

// Response
{
  "success": true,
  "data": {
    "isSpam": boolean,
    "reason": string,
    "confidence": number,
    "threatLevel": string,
    "detectorUsed": string,
    "analysisTime": number,
    "additionalInfo": { ... }
  }
}
```

### System Stats

**GET** `/api/analyze?action=stats`

```typescript
// Response
{
  "status": "ok",
  "service": "LangChain.js Spam AI Detector",
  "version": "3.0.0",
  "detectors": ["basic", "advanced", "memory"],
  "memoryStats": { ... }
}
```

### Clear Cache

**GET** `/api/analyze?action=clear-cache`

## 🎨 Web Interface

The application includes a modern, responsive web interface with:

- **Detector Selection**: Choose between Basic, Advanced, Memory, or Compare modes
- **Real-time Analysis**: Live spam detection with loading states
- **Detailed Results**: Comprehensive analysis breakdown
- **Example Library**: Pre-loaded test cases for different spam types
- **Statistics Dashboard**: Cache performance and memory usage
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🔧 Architecture

```
├── src/
│   ├── app/
│   │   ├── api/analyze/          # REST API endpoints
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # App layout
│   │   └── page.tsx              # Main interface
│   ├── lib/
│   │   ├── spam-detector-langchain.ts    # Basic detector
│   │   ├── spam-detector-advanced.ts     # Advanced detector  
│   │   ├── spam-detector-memory.ts       # Memory detector
│   │   └── unified-spam-detector.ts      # Unified API
│   └── index.ts                  # Legacy detector
├── public/                       # Static assets
├── .env.local                    # Environment variables
└── package.json                  # Dependencies
```

## 🧪 Testing Examples

The application includes built-in test cases:

### Legitimate Email

```
Hello John, I hope you're doing well. I'd like to follow up on our meeting yesterday about the project timeline...
```

### Obvious Spam

```
CONGRATULATIONS!!! You WON $1,000,000 in our AMAZING lottery! CLICK HERE NOW to claim your prize...
```

### Phishing Attempt

```
Hello, I detected suspicious activity on your bank account. To protect your data, click this link immediately...
```

## 🛡️ Security Features

- **Input Sanitization**: Automatic removal of prompt injection attempts
- **Rate Limiting**: Built-in protection against abuse
- **Error Handling**: Graceful degradation on API failures
- **Type Safety**: Full TypeScript implementation
- **Validation**: Zod schemas for all inputs/outputs

## 📊 Performance

| Detector | Avg Response Time | Memory Usage | Cache Hit Rate |
|----------|------------------|--------------|----------------|
| Basic    | ~1-2s           | Low          | N/A            |
| Advanced | ~3-5s           | Medium       | N/A            |
| Memory   | ~1-3s           | Medium       | ~60-80%        |
| Compare  | ~5-8s           | High         | Mixed          |

## 🐛 Troubleshooting

### Common Issues

**"Token not found"**

- Verify your GitHub token in `.env.local`
- Ensure the token has GitHub Models access

**"API Error" / Rate Limits**

- Check your GitHub Models quota
- The app has built-in retry logic with exponential backoff

**"NaN%" Confidence**

- Fixed in latest version with proper validation
- Ensure you're using the updated detector files

**Memory Detector Not Learning**

- Clear cache using the API endpoint
- Check browser console for memory-related errors

### Debug Mode

Set `NODE_ENV=development` for detailed logging:

```bash
NODE_ENV=development npm run dev
```

## 🎯 Production Deployment

### Environment Variables

```env
# Required
NEXT_PUBLIC_OPEN_API_GITHUB_MODEL_TOKEN=your_token
NEXT_PUBLIC_OPEN_API_GITHUB_MODEL_ENDPOINT=https://models.inference.ai.azure.com

# Optional
NODE_ENV=production
```

### Recommended Additions for Production

- [ ] Database for analysis history
- [ ] User authentication
- [ ] Advanced rate limiting
- [ ] Monitoring and analytics
- [ ] Email integration
- [ ] Webhook support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **LangChain.js** team for the excellent framework
- **GitHub Models** for free AI inference
- **Next.js** team for the amazing React framework
- **Tailwind CSS** for beautiful, responsive design

---

**Built with ❤️ by Glaucia Lemos**

*Fighting spam, one email at a time* 🛡️
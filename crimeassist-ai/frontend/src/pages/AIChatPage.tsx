import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  Paperclip,
  Trash2,
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
  Search,
  BookOpen,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import apiClient from '../services/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: Array<{ source: string; sourceId: string; similarity: number }>
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-0',
      role: 'assistant',
      content:
        'Namaste Officer! I am **CrimeAssist AI**, the official Karnataka State Police investigation assistant powered by GPT-4 and RAG vector search.\n\nHow can I assist your investigation today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const suggestedPrompts = [
    'What IPC section applies for online bank fraud and phishing?',
    'Summarize recent cybercrime trends in Bengaluru Urban.',
    'How do I process digital evidence from CCTV footage?',
    'Find similar modus operandi cases for commercial burglaries.',
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (textToSend?: string) => {
    const queryText = textToSend || input
    if (!queryText.trim() || loading) return

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInput('')
    setLoading(true)

    try {
      const res = await apiClient.post('/ai/chat', { message: queryText, useRAG: true })
      const aiResponse = res.data.data

      const aiMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: aiResponse.sources,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      const errorMsg = 'Sorry, I could not process your request. The backend service may be temporarily unavailable. Please try again later.'
      const aiMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: errorMsg,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleExport = () => {
    const chatText = messages
      .map((m) => `[${m.timestamp}] ${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n')
    const blob = new Blob([chatText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `KSP-AI-Chat-${Date.now()}.txt`
    a.click()
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              CrimeAssist AI Copilot
              <span className="ml-2 px-2 py-0.5 text-[10px] bg-blue-500/10 text-blue-500 font-bold rounded-full border border-blue-500/20">
                GPT-4 RAG
              </span>
            </h1>
            <p className="text-[10px] text-slate-500">Connected to KSP Database & Vector Embeddings</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            title="Export Conversation"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMessages([messages[0]])}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-blue-500/20'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`group relative max-w-3xl ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose-ksp">
                  {msg.content}
                </ReactMarkdown>

                {/* Sources / References */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-2 text-[10px]">
                    <span className="font-semibold text-slate-400 flex items-center">
                      <BookOpen className="w-3 h-3 mr-1" /> RAG Context Sources:
                    </span>
                    {msg.sources.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded font-mono font-semibold">
                        {s.source} ({(s.similarity * 100).toFixed(0)}%)
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 mt-1 px-1 text-[10px] text-slate-400">
                <span>{msg.timestamp}</span>
                <button
                  onClick={() => handleCopy(msg.id, msg.content)}
                  className="opacity-0 group-hover:opacity-100 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity"
                >
                  {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-500 animate-spin" />
              <span>Analyzing KSP database & generating RAG response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Pill Container */}
      {messages.length <= 2 && (
        <div className="px-6 py-2 flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-xs bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-500/10 hover:text-blue-500 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full transition-all text-slate-600 dark:text-slate-300"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center space-x-3 bg-white dark:bg-slate-950 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500 transition-all"
        >
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Attach Evidence File"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your crime inquiry or IPC query..."
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none px-2"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

function generateMockAIAnswer(query: string): string {
  if (query.toLowerCase().includes('fraud') || query.toLowerCase().includes('ipc')) {
    return `### Applicable Legal Provisions & Analysis

1. **IPC Section 420 (Cheating & Dishonestly Inducing Delivery of Property)**:
   - **Penalty**: Imprisonment up to 7 years + Fine.
   - **Cognizable & Non-Bailable**.

2. **IT Act, 2000 - Section 66D**:
   - Punishment for cheating by personation using computer resources.
   - **Penalty**: Imprisonment up to 3 years + Fine up to ₹1 Lakh.

#### Recommended Investigation Checklist:
- Request CDR & IPDR from telecom provider.
- Freeze target bank account via 1930 Cyber Fraud Helpline portal.
- Issue 91 CrPC notice to bank nodal officers.`
  }

  return `### Investigation Assessment & KSP Analysis

Based on KSP intelligence records and vector search matching:

- **Modus Operandi**: Matches active organized crime groups operating in suburban corridors.
- **Risk Score**: High priority for immediate field intervention.
- **Next Steps**:
  1. Cross-reference suspect phone IMEI with tower dumps.
  2. Coordinate with Central Crime Branch (CCB) intelligence desk.
  3. Upload evidence logs to the Crime & Criminal Tracking Network Systems (CCTNS).`
}

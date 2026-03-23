import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Sparkles, X, AlertCircle, Menu, History, MessageSquare, FileText, File } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

// Custom Icons
const TwoDots = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="12" cy="15.5" r="1.5" fill="currentColor" />
  </svg>
);

const AshokaChakra = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" />
    <g stroke="currentColor" strokeWidth="2.5">
      {[...Array(24)].map((_, i) => (
        <line key={i} x1="50" y1="50" x2="50" y2="6" transform={`rotate(${i * 15} 50 50)`} />
      ))}
    </g>
    <circle cx="50" cy="50" r="7" fill="currentColor" />
  </svg>
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Message = {
  role: 'user' | 'model';
  text: string;
  file?: {
    url: string;
    data: string;
    mimeType: string;
    name: string;
    isImage: boolean;
  } | null;
};

export default function App() {
  // App State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Namaste! I am your AI assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<Message['file']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHindi, setIsHindi] = useState(false);
  
  // Customization State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appTitle, setAppTitle] = useState('Bharat AI');
  const [systemPrompt, setSystemPrompt] = useState('You are a warm, conversational, and culturally aware AI assistant from Bharat. Always provide answers that are highly humanized, natural, and easy to understand. Avoid robotic jargon. Make your responses interactive by occasionally asking relevant follow-up questions to keep the conversation engaging.');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Flip animation timer for the title
  useEffect(() => {
    const interval = setInterval(() => {
      setIsHindi(prev => !prev);
    }, 3000); // Flips every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: Prevent extremely large files from freezing the UI
    if (file.size > 20 * 1024 * 1024) {
      setError('File is too large. Please select a file under 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      const isImage = file.type.startsWith('image/');
      
      setAttachedFile({
        url: base64String, 
        data: base64Data,  
        mimeType: file.type || 'text/plain',
        name: file.name,
        isImage: isImage
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset file input
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachedFile) || isLoading) return;

    const userMessage: Message = { 
      role: 'user', 
      text: input.trim(), 
      file: attachedFile 
    };
    
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput('');
    setAttachedFile(null);
    setIsLoading(true);
    setError(null);

    try {
      const contents = updatedMessages.map(m => {
        const parts: any[] = [];
        
        if (m.file) {
          parts.push({
            inlineData: {
              mimeType: m.file.mimeType,
              data: m.file.data
            }
          });
        }
        
        if (m.text) {
          parts.push({ text: m.text });
        }
        
        return { role: m.role, parts };
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: systemPrompt
        }
      });
      
      const aiResponseText = response.text || '';
      
      setMessages(prev => [...prev, { role: 'model', text: aiResponseText }]);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setMessages(prev => prev.slice(0, -1)); // Remove the failed message
      setInput(userMessage.text);
      if (userMessage.file) setAttachedFile(userMessage.file);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen text-slate-800 font-sans relative overflow-hidden sm:flex-row bg-orange-50/30">
      
      {/* Background Ambience (Blurry Tricolor Mesh) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF9933]/10 via-white/40 to-[#138808]/10" />
        <div className="absolute -top-[25%] -left-[15%] w-[60%] h-[70%] bg-[#FF9933]/40 rounded-full blur-[140px]" />
        <div className="absolute top-[20%] -right-[15%] w-[50%] h-[60%] bg-[#000080]/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[25%] -right-[15%] w-[60%] h-[70%] bg-[#138808]/40 rounded-full blur-[140px]" />
        <div className="absolute bottom-[10%] -left-[15%] w-[40%] h-[50%] bg-[#FF9933]/20 rounded-full blur-[120px]" />
      </div>

      {/* Tricolor Top Border */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF9933] via-white to-[#138808] z-50" />

      {/* Sidebar Overlay (Mobile) */}
      <div className={`
        fixed inset-0 z-40 bg-[#000080]/10 backdrop-blur-sm transition-opacity duration-300 sm:hidden
        ${isSettingsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `} onClick={() => setIsSettingsOpen(false)} />

      {/* History Sidebar */}
      <aside className={`
        fixed sm:relative top-0 left-0 z-50 h-full w-[85%] sm:w-80 bg-white/90 backdrop-blur-xl border-r border-[#FF9933]/20 shadow-2xl sm:shadow-none transform transition-transform duration-400 ease-out flex flex-col pt-1.5
        ${isSettingsOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
        ${!isSettingsOpen && 'sm:hidden lg:flex'} 
      `}>
        <div className="p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#000080] flex items-center gap-2">
            <History size={22} className="text-[#FF9933]" />
            History
          </h2>
          <button 
            onClick={() => setIsSettingsOpen(false)}
            className="sm:hidden p-2 text-slate-400 hover:text-[#FF9933] rounded-full hover:bg-orange-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-6 flex-1 overflow-y-auto space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Search History</h3>
          
          {messages.filter(m => m.role === 'user').length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <History size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Your searches will appear here</p>
            </div>
          ) : (
            [...messages].reverse().filter(m => m.role === 'user').map((msg, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-700 cursor-pointer hover:bg-orange-50 transition-colors border border-slate-100 hover:border-[#FF9933]/50">
                <MessageSquare size={16} className="shrink-0 text-[#138808]" />
                <p className="truncate font-medium">{msg.text || (msg.file ? `Uploaded ${msg.file.name}` : 'Search query')}</p>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative z-10 pt-1.5">
        
        {/* Header */}
        <header className="h-20 px-4 sm:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2.5 text-[#000080] hover:bg-[#000080]/5 rounded-xl transition-colors lg:hidden shadow-sm bg-white/50 border border-white"
            >
              <Menu size={22} />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF9933] via-white to-[#138808] border border-slate-100 flex items-center justify-center text-[#000080] shadow-lg shadow-slate-200/50 transition-transform hover:scale-105">
              <AshokaChakra size={26} className={isLoading ? "animate-[spin_1.5s_linear_infinite]" : "animate-[spin_6s_linear_infinite]"} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#000080] tracking-tight">
                {appTitle.split(/(Bharat)/i).map((part, i) => {
                  if (part.toLowerCase() === 'bharat') {
                    return (
                      <span key={i} className="inline-grid [perspective:1000px]">
                        <span className={`col-start-1 row-start-1 transition-transform duration-700 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] ${isHindi ? '[transform:rotateX(-180deg)]' : '[transform:rotateX(0deg)]'}`}>
                          {part}
                        </span>
                        <span className={`col-start-1 row-start-1 text-[#FF9933] transition-transform duration-700 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] ${isHindi ? '[transform:rotateX(0deg)]' : '[transform:rotateX(180deg)]'}`}>
                          भारत
                        </span>
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs font-medium text-[#138808] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#138808] animate-pulse" />
                  Online & Ready
                </p>
                <span className="text-xs text-slate-300">|</span>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                  Developed by <span className="text-[#FF9933]">AYUSH</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Chat History Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-4 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-8 py-4">
            
            {/* Timestamp / Date divider */}
            <div className="flex justify-center">
              <span className="text-xs font-medium text-slate-400 bg-white/60 px-4 py-1.5 rounded-full shadow-sm border border-slate-100 backdrop-blur-sm">
                Today
              </span>
            </div>

            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end`}
              >
                {/* Avatar */}
                <div className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-white text-[#000080] border border-blue-100'}
                `}>
                  {msg.role === 'user' ? <User size={18} /> : <AshokaChakra size={20} />}
                </div>
                
                {/* Message Bubble */}
                <div className={`
                  px-6 py-4 rounded-3xl text-[15.5px] leading-relaxed max-w-[80%] shadow-sm overflow-hidden
                  ${msg.role === 'user' 
                    ? 'bg-gradient-to-br from-[#000080] to-[#1a1a9e] text-white rounded-br-sm shadow-blue-900/10' 
                    : 'bg-white/80 backdrop-blur-md text-slate-800 border border-slate-200/50 rounded-bl-sm'}
                `}>
                  {msg.file && (
                    <div className="mb-3">
                      {msg.file.isImage ? (
                        <img 
                          src={msg.file.url} 
                          alt="Uploaded content" 
                          className="max-w-full h-auto rounded-xl shadow-sm border border-white/20" 
                          style={{ maxHeight: '300px' }}
                        />
                      ) : (
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${msg.role === 'user' ? 'bg-white/20 border-white/30' : 'bg-slate-50 border-slate-200'}`}>
                          <File size={20} className={msg.role === 'user' ? 'text-white' : 'text-[#FF9933]'} />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-semibold truncate">{msg.file.name}</span>
                            <span className="text-[10px] opacity-70 uppercase tracking-wider truncate">{msg.file.mimeType.split('/')[1] || 'FILE'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {msg.text && msg.text.split('\n').map((paragraph, i) => (
                    <p key={i} className={i !== 0 ? 'mt-3' : ''}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {/* Loading Indicator - Tricolor Dots */}
            {isLoading && (
              <div className="flex gap-4 items-end flex-row">
                <div className="w-10 h-10 rounded-2xl bg-white text-[#000080] border border-blue-100 flex items-center justify-center shrink-0 shadow-sm">
                  <AshokaChakra size={20} className="animate-[spin_3s_linear_infinite]" />
                </div>
                <div className="px-6 py-5 rounded-3xl bg-white/80 backdrop-blur-md border border-slate-200/50 shadow-sm rounded-bl-sm flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF9933] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#000080] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#138808] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-8 mb-4">
            <div className="bg-red-50 border border-red-100 text-red-600 px-5 py-3.5 rounded-2xl flex items-center gap-3 text-sm shadow-sm">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Floating Input Area */}
        <div className="p-4 sm:px-8 sm:pb-8 shrink-0 relative z-20">
          
          {/* File Preview Pop-up */}
          {attachedFile && (
            <div className="max-w-4xl mx-auto mb-3">
              <div className="inline-block relative bg-white p-2.5 rounded-2xl shadow-lg border border-slate-200">
                <button 
                  onClick={() => setAttachedFile(null)}
                  className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-red-500 transition-colors shadow-sm z-10"
                >
                  <X size={14} />
                </button>
                {attachedFile.isImage ? (
                  <img 
                    src={attachedFile.url} 
                    alt="Preview" 
                    className="h-20 w-auto rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 h-16 min-w-[150px]">
                    <FileText size={24} className="text-[#FF9933]" />
                    <div className="flex flex-col max-w-[200px] overflow-hidden">
                      <span className="text-sm font-semibold text-slate-700 truncate">{attachedFile.name}</span>
                      <span className="text-xs text-slate-400 truncate">{attachedFile.mimeType}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative flex items-end gap-3"
          >
            <div className="relative flex-1 bg-white border border-slate-200 rounded-[28px] shadow-lg shadow-slate-200/40 focus-within:shadow-xl focus-within:border-[#FF9933]/50 focus-within:ring-4 focus-within:ring-[#FF9933]/10 transition-all duration-300 flex items-center pl-2">
              
              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="*/*" 
                className="hidden" 
              />
              
              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-400 hover:text-[#FF9933] hover:bg-orange-50 rounded-full transition-colors shrink-0 ml-1"
                title="Upload File"
              >
                <TwoDots size={22} />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={attachedFile ? "Add a message..." : "Type your message..."}
                className="w-full max-h-40 min-h-[60px] bg-transparent outline-none py-4 pl-3 pr-14 resize-none text-[15px] font-medium placeholder-slate-400 text-slate-800 rounded-[28px]"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={(!input.trim() && !attachedFile) || isLoading}
              className={`
                h-[60px] w-[60px] rounded-[24px] flex items-center justify-center shrink-0 transition-all duration-300
                ${(!input.trim() && !attachedFile) || isLoading 
                  ? 'bg-white border border-slate-200 text-slate-300 shadow-sm cursor-not-allowed' 
                  : 'bg-gradient-to-br from-[#FF9933] to-[#E87A15] text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95'}
              `}
            >
              <Send size={22} className={`${isLoading ? 'opacity-50' : 'opacity-100'} ${(input.trim() || attachedFile) && !isLoading ? 'ml-1' : ''} transition-all`} />
            </button>
          </form>

          {/* Bharat Footer */}
          <div className="text-center mt-4 flex flex-col items-center justify-center opacity-80 hover:opacity-100 transition-opacity select-none">
            <p className="text-xs font-bold tracking-[0.2em] text-slate-500">
              MAKE IN <span className="text-[#FF9933]">BHARAT</span>
            </p>
            <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400 mt-0.5">
              MADE BY <span className="text-[#138808]">BHARATIYA</span>
            </p>
          </div>

        </div>
      </main>

    </div>
  );
}

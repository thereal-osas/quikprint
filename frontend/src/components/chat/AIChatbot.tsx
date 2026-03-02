import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, X, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  messages: Message[];
  isActive: boolean;
  startTime: Date;
}

const AIChatbot = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('print') || lowerMessage.includes('business card')) {
      const responses = [
        'We offer various printing services including business cards, flyers, and brochures. What type of printing are you interested in?',
        'Our business cards start at ₦5,000 for 100 cards. Would you like to know about our bulk pricing?',
        'We provide same-day business card printing. What quantity do you need?',
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return 'Our pricing varies by quantity and product type. Can you tell me more about your project?';
    }
    
    if (lowerMessage.includes('hour') || lowerMessage.includes('time') || lowerMessage.includes('location')) {
      return 'We are open Monday to Friday, 9AM to 6PM. Our location is 116 Ikorodu Road, Onipanu Somolu, Lagos.';
    }
    
    if (lowerMessage.includes('contact') || lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return 'You can reach us at +234 816 0365 or info@quikprint.com. Live chat support is available 9AM-6PM.';
    }
    
    if (lowerMessage.includes('social media') || lowerMessage.includes('video') || lowerMessage.includes('design')) {
      return 'We offer comprehensive social media design and video production services. What do you need?';
    }
    
    return 'Welcome to QuikPrint! How can I assist you today with printing services, products, or pricing?';
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, userMessage]
      } : null);
    } else {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        messages: [userMessage],
        isActive: true,
        startTime: new Date(),
      };
      setSessions(prev => [...prev, newSession]);
      setCurrentSession(newSession);
    }
    
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(input),
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setInput('');
      setIsTyping(true);
      
      setTimeout(() => {
        setCurrentSession(prev => prev ? {
          ...prev,
          messages: [...prev.messages, botResponse]
        } : null);
        setIsTyping(false);
      }, 1000);
    }, 500);
  };

  const handleEndSession = () => {
    if (currentSession) {
      setCurrentSession(prev => prev ? {
        ...prev,
        isActive: false
      } : null);
    }
  };

  const handleCustomerCareRedirect = () => {
    window.open('https://wa.me/2348160365?text=I%20need%20human%20assistance', '_blank');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <div className={`w-96 bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col ${isMinimized ? 'h-12' : 'h-96'} transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-primary text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span className="font-medium">QuikPrint Assistant</span>
            <span className="text-sm opacity-75">
              {isTyping ? 'Typing...' : 'Online'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={handleEndSession}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Messages */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
              {currentSession?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="flex items-start gap-2">
                      {message.sender === 'bot' && <Bot className="h-4 w-4 mt-1 flex-shrink-0" />}
                      <div>
                        <p className="text-sm">{message.text}</p>
                        <span className="text-xs opacity-75 mt-1 block">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {!currentSession?.messages.length && (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <p className="mb-2">Welcome to QuikPrint!</p>
                  <p className="text-sm">How can I help you today?</p>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about printing, pricing, products..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Session Selector */}
      {sessions.length > 1 && !isMinimized && (
        <div className="border-t border-gray-200 p-2 bg-white">
          <div className="text-xs text-gray-500 mb-2">Previous Sessions</div>
          <div className="flex gap-2 overflow-x-auto">
            {sessions.slice(-3).map((session) => (
              <button
                key={session.id}
                onClick={() => setCurrentSession(session)}
                className={`px-3 py-2 text-xs rounded border ${
                  currentSession?.id === session.id
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="text-left">
                  <div className="font-medium truncate">
                    {new Date(session.startTime).toLocaleTimeString()}
                  </div>
                  <div className="text-gray-500 truncate">
                    {session.messages.length} messages
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Customer Care Button */}
      {!isMinimized && (
        <div className="p-2 bg-white rounded-b-lg border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCustomerCareRedirect}
            className="w-full"
          >
            <User className="h-4 w-4 mr-2" />
            Need Human Assistance
          </Button>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;

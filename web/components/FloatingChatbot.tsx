'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Avatar from './Avatar';
import { NeurolancerChatbot } from '../lib/chatbot';
import { getUser } from '../lib/auth';

interface ChatMessage {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  actionCards?: ActionCard[];
}

interface ActionCard {
  title: string;
  description: string;
  action: string;
  icon: string;
  color: string;
}

export default function FloatingChatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatbot] = useState(() => new NeurolancerChatbot());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = getUser();

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: ChatMessage = {
      id: 1,
      content: "👋 Hi! I'm your Neurolancer AI Assistant. I can help you with:\n\n• **Creating jobs and gigs**\n• **Finding freelancers**\n• **Platform navigation**\n• **Account management**\n• **General questions**\n\nWhat would you like to know?",
      sender: 'ai',
      timestamp: new Date(),
      actionCards: [
        {
          title: "Post a Job",
          description: "Find the perfect AI expert for your project",
          action: "/post-job",
          icon: "💼",
          color: "from-blue-500 to-blue-600"
        },
        {
          title: "Browse Gigs",
          description: "Discover AI services from experts",
          action: "/gigs",
          icon: "🚀",
          color: "from-purple-500 to-purple-600"
        },
        {
          title: "Find Freelancers",
          description: "Connect with AI professionals",
          action: "/freelancers",
          icon: "👥",
          color: "from-green-500 to-green-600"
        }
      ]
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateActionCards = (content: string): ActionCard[] => {
    const cards: ActionCard[] = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('job') || lowerContent.includes('hire') || lowerContent.includes('project')) {
      cards.push({
        title: "Post a Job",
        description: "Create a job posting to find experts",
        action: "/post-job",
        icon: "💼",
        color: "from-blue-500 to-blue-600"
      });
    }

    if (lowerContent.includes('gig') || lowerContent.includes('service') || lowerContent.includes('buy')) {
      cards.push({
        title: "Browse Gigs",
        description: "Find ready-made AI services",
        action: "/gigs",
        icon: "🛒",
        color: "from-purple-500 to-purple-600"
      });
    }

    if (lowerContent.includes('freelancer') || lowerContent.includes('expert') || lowerContent.includes('professional')) {
      cards.push({
        title: "Find Freelancers",
        description: "Browse AI expert profiles",
        action: "/freelancers",
        icon: "👨‍💻",
        color: "from-green-500 to-green-600"
      });
    }

    if (lowerContent.includes('learn') || lowerContent.includes('course') || lowerContent.includes('skill')) {
      cards.push({
        title: "Learn AI",
        description: "Take courses to improve your skills",
        action: "/courses",
        icon: "🎓",
        color: "from-indigo-500 to-indigo-600"
      });
    }

    if (lowerContent.includes('dashboard') || lowerContent.includes('account') || lowerContent.includes('profile')) {
      cards.push({
        title: "Go to Dashboard",
        description: "Manage your account and activities",
        action: "/dashboard",
        icon: "📊",
        color: "from-teal-500 to-teal-600"
      });
    }

    if (lowerContent.includes('message') || lowerContent.includes('chat') || lowerContent.includes('contact')) {
      cards.push({
        title: "Messages",
        description: "Chat with clients and freelancers",
        action: "/messages",
        icon: "💬",
        color: "from-pink-500 to-pink-600"
      });
    }

    return cards.slice(0, 3); // Limit to 3 cards
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      const aiResponse = await chatbot.sendMessage(newMessage);
      const actionCards = generateActionCards(newMessage + ' ' + aiResponse);

      const aiMessage: ChatMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
        actionCards: actionCards.length > 0 ? actionCards : undefined
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 2,
        content: "I apologize, but I'm experiencing technical difficulties. Please try again or contact support at neurolancermail@gmail.com",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action: string) => {
    router.push(action);
    setIsOpen(false);
  };

  const clearChat = () => {
    setMessages([{
      id: 1,
      content: "Chat cleared! How can I help you today?",
      sender: 'ai',
      timestamp: new Date()
    }]);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-40 hover:z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
            isOpen 
              ? 'bg-red-500 hover:bg-red-600 rotate-45' 
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 animate-pulse'
          }`}
        >
          {isOpen ? (
            <svg className="w-6 h-6 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ) : (
            <div className="text-white text-xl">🤖</div>
          )}
        </button>

        {/* Notification Badge */}
        {!isOpen && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-bounce">
            AI
          </div>
        )}
      </div>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-end p-4 hover:z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-20"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Window */}
          <div className="relative w-full max-w-md h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col animate-slide-up">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    🤖
                  </div>
                  <div>
                    <h3 className="font-semibold">Neurolancer AI</h3>
                    <p className="text-xs opacity-90">Always here to help</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearChat}
                    className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                    title="Clear Chat"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                    }`}>
                      {message.sender === 'ai' ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>

                    {/* Action Cards */}
                    {message.actionCards && message.actionCards.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.actionCards.map((card, index) => (
                          <button
                            key={index}
                            onClick={() => handleActionClick(card.action)}
                            className={`w-full p-3 rounded-xl bg-gradient-to-r ${card.color} text-white text-left hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{card.icon}</span>
                              <div>
                                <h4 className="font-semibold text-sm">{card.title}</h4>
                                <p className="text-xs opacity-90">{card.description}</p>
                              </div>
                              <svg className="w-4 h-4 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-2 border border-gray-200 dark:border-gray-600">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask me anything about Neurolancer..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isTyping}
                  className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
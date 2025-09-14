'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Avatar from './Avatar';
import { NeurolancerChatbot } from '../lib/chatbot';
import { getProfile } from '../lib/auth';

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

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date';
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface ChatForm {
  id: string;
  title: string;
  fields: FormField[];
  submitText: string;
  type: 'job' | 'gig' | 'project';
}

export default function FloatingChatbot() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatbot] = useState(() => new NeurolancerChatbot());
  const [activeForm, setActiveForm] = useState<ChatForm | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = getProfile();

  useEffect(() => {
    // Load messages from localStorage
    const savedMessages = localStorage.getItem('neurolancer-chat-messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
        return;
      } catch (error) {
        console.error('Error loading saved messages:', error);
      }
    }

    // Initialize with welcome message if no saved messages
    const getWelcomeCards = () => {
      if (currentUser?.user_type === 'freelancer') {
        return [
          {
            title: "Create Gig",
            description: "Offer your AI services",
            action: "/create-gig",
            icon: "🚀",
            color: "from-purple-500 to-purple-600"
          },
          {
            title: "Browse Jobs",
            description: "Find work opportunities",
            action: "/jobs",
            icon: "💼",
            color: "from-blue-500 to-blue-600"
          },
          {
            title: "My Dashboard",
            description: "Manage your freelance business",
            action: "/dashboard",
            icon: "📊",
            color: "from-teal-500 to-teal-600"
          }
        ];
      } else if (currentUser?.user_type === 'client') {
        return [
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
        ];
      } else {
        // Default for both or unauthenticated users
        return [
          {
            title: "Browse Jobs",
            description: "Explore work opportunities",
            action: "/jobs",
            icon: "💼",
            color: "from-blue-500 to-blue-600"
          },
          {
            title: "Browse Gigs",
            description: "Discover AI services",
            action: "/gigs",
            icon: "🚀",
            color: "from-purple-500 to-purple-600"
          },
          {
            title: "Learn More",
            description: "Explore our platform",
            action: "/courses",
            icon: "🎓",
            color: "from-indigo-500 to-indigo-600"
          }
        ];
      }
    };

    const welcomeMessage: ChatMessage = {
      id: 1,
      content: "👋 Hi! I'm your Neurolancer AI Assistant. I can help you with:\n\n• **Creating jobs and gigs**\n• **Finding freelancers**\n• **Platform navigation**\n• **Account management**\n• **General questions**\n\nWhat would you like to know?",
      sender: 'ai',
      timestamp: new Date(),
      actionCards: getWelcomeCards()
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
    // Save messages to localStorage
    localStorage.setItem('neurolancer-chat-messages', JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const jobCreationForm: ChatForm = {
    id: 'create-job',
    title: 'Create Job Posting',
    type: 'job',
    submitText: 'Post Job',
    fields: [
      { name: 'title', label: 'Job Title', type: 'text', required: true, placeholder: 'e.g., Build AI Chatbot for E-commerce' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe your project requirements...' },
      { name: 'budget', label: 'Budget ($)', type: 'number', required: true, placeholder: '1000' },
      { name: 'job_type', label: 'Payment Type', type: 'select', required: true, options: [
        { value: 'fixed', label: 'Fixed Price' },
        { value: 'hourly', label: 'Hourly Rate' }
      ]},
      { name: 'experience_level', label: 'Experience Level', type: 'select', required: true, options: [
        { value: 'entry', label: 'Entry Level' },
        { value: 'intermediate', label: 'Intermediate' },
        { value: 'expert', label: 'Expert' }
      ]}
    ]
  };

  const gigCreationForm: ChatForm = {
    id: 'create-gig',
    title: 'Create Gig Service',
    type: 'gig',
    submitText: 'Create Gig',
    fields: [
      { name: 'title', label: 'Gig Title', type: 'text', required: true, placeholder: 'I will create an AI chatbot for your business' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe your service in detail...' },
      { name: 'basic_title', label: 'Basic Package Title', type: 'text', required: true, placeholder: 'Basic AI Solution' },
      { name: 'basic_price', label: 'Basic Package Price ($)', type: 'number', required: true, placeholder: '500' },
      { name: 'basic_delivery_time', label: 'Basic Delivery Time (days)', type: 'number', required: true, placeholder: '7' }
    ]
  };

  const projectCreationForm: ChatForm = {
    id: 'create-project',
    title: 'Create Project',
    type: 'project',
    submitText: 'Create Project',
    fields: [
      { name: 'title', label: 'Project Title', type: 'text', required: true, placeholder: 'Enter project title...' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe your project goals and objectives...' },
      { name: 'total_budget', label: 'Budget (USD)', type: 'number', required: true, placeholder: '5000' },
      { name: 'deadline', label: 'Deadline', type: 'date' }
    ]
  };

  const generateActionCards = (content: string): ActionCard[] => {
    const cards: ActionCard[] = [];
    const lowerContent = content.toLowerCase();

    // Role-based job creation (clients only)
    if ((lowerContent.includes('job') || lowerContent.includes('hire')) && currentUser?.user_type === 'client') {
      cards.push({
        title: "Create Job in Chat",
        description: "Post a job directly here",
        action: "form:create-job",
        icon: "💼",
        color: "from-blue-500 to-blue-600"
      });
    }

    // Role-based gig creation (freelancers only)
    if ((lowerContent.includes('gig') || lowerContent.includes('service') || lowerContent.includes('sell')) && (currentUser?.user_type === 'freelancer' || currentUser?.user_type === 'both')) {
      cards.push({
        title: "Create Gig in Chat",
        description: "Offer your service directly here",
        action: "form:create-gig",
        icon: "🚀",
        color: "from-purple-500 to-purple-600"
      });
    }

    // Project creation (clients only)
    if ((lowerContent.includes('project') || lowerContent.includes('manage')) && currentUser?.user_type === 'client') {
      cards.push({
        title: "Create Project in Chat",
        description: "Start a new project here",
        action: "form:create-project",
        icon: "📁",
        color: "from-indigo-500 to-indigo-600"
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

    const messageContent = newMessage.trim();
    setNewMessage('');

    const userMessage: ChatMessage = {
      id: Date.now(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const aiResponse = await chatbot.sendMessage(messageContent);
      const actionCards = generateActionCards(messageContent + ' ' + aiResponse);

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
    if (action.startsWith('form:')) {
      if (!currentUser) {
        // Show login message for guest users
        const loginMessage: ChatMessage = {
          id: Date.now(),
          content: "🔐 **Please log in to continue**\n\nYou need to be logged in to create jobs, gigs, or projects. Please sign in or create an account to get started.",
          sender: 'ai',
          timestamp: new Date(),
          actionCards: [
            {
              title: "Login",
              description: "Sign in to your account",
              action: "/auth?mode=login",
              icon: "🔑",
              color: "from-blue-500 to-blue-600"
            },
            {
              title: "Register",
              description: "Create a new account",
              action: "/auth?mode=register",
              icon: "📝",
              color: "from-green-500 to-green-600"
            }
          ]
        };
        setMessages(prev => [...prev, loginMessage]);
        return;
      }
      
      const formId = action.replace('form:', '');
      if (formId === 'create-job') {
        setActiveForm(jobCreationForm);
      } else if (formId === 'create-gig') {
        setActiveForm(gigCreationForm);
      } else if (formId === 'create-project') {
        setActiveForm(projectCreationForm);
      }
    } else {
      router.push(action);
      setIsOpen(false);
    }
  };

  const clearChat = () => {
    const newMessages: ChatMessage[] = [{
      id: 1,
      content: "Chat cleared! How can I help you today?",
      sender: 'ai' as const,
      timestamp: new Date()
    }];
    setMessages(newMessages);
    setActiveForm(null);
    setFormData({});
    localStorage.setItem('neurolancer-chat-messages', JSON.stringify(newMessages));
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
              : 'bg-gradient-to-r animate-pulse'
          }`}
          style={!isOpen ? {background: 'linear-gradient(135deg, #0D9E86, #0B8A73)'} : {}}
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
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 text-white rounded-t-2xl" style={{background: 'linear-gradient(135deg, #0D9E86, #0B8A73)'}}>
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
                        ? 'text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                    }`} style={message.sender === 'user' ? {background: 'linear-gradient(135deg, #0D9E86, #0B8A73)'} : {}}>
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
                      <div className="mt-3">
                        {/* Form buttons (full width) */}
                        {message.actionCards.filter(card => card.action.startsWith('form:')).map((card, index) => (
                          <button
                            key={index}
                            onClick={() => handleActionClick(card.action)}
                            className={`w-full p-3 mb-2 rounded-xl bg-gradient-to-r ${card.color} text-white text-left hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
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
                        
                        {/* Navigation buttons (horizontal grid) */}
                        {message.actionCards.filter(card => !card.action.startsWith('form:')).length > 0 && (
                          <div className="grid grid-cols-3 gap-1">
                            {message.actionCards.filter(card => !card.action.startsWith('form:')).map((card, index) => (
                              <button
                                key={index}
                                onClick={() => handleActionClick(card.action)}
                                className={`p-2 rounded-lg bg-gradient-to-r ${card.color} text-white text-center hover:shadow-lg transform hover:scale-105 transition-all duration-200`}
                                title={card.description}
                              >
                                <div className="flex flex-col items-center space-y-1">
                                  <span className="text-lg">{card.icon}</span>
                                  <h4 className="font-medium text-xs leading-tight">{card.title}</h4>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
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

            {/* Interactive Form */}
            {activeForm && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{activeForm.title}</h3>
                  <button
                    onClick={() => { setActiveForm(null); setFormData({}); }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3">
                  {activeForm.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                          placeholder={field.placeholder}
                          required={field.required}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.required}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.name] || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                        />
                      )}
                    </div>
                  ))}
                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => {
                        const successMessage: ChatMessage = {
                          id: Date.now(),
                          content: `✅ **${activeForm.type === 'job' ? 'Job' : activeForm.type === 'gig' ? 'Gig' : 'Project'} created successfully!**\n\nYour ${activeForm.type} "${formData.title}" has been posted.`,
                          sender: 'ai',
                          timestamp: new Date()
                        };
                        setMessages(prev => [...prev, successMessage]);
                        setActiveForm(null);
                        setFormData({});
                      }}
                      className="flex-1 py-2 px-4 text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium"
                      style={{background: 'linear-gradient(135deg, #0D9E86, #0B8A73)'}}
                    >
                      {activeForm.submitText}
                    </button>
                    <button
                      onClick={() => { setActiveForm(null); setFormData({}); }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                  className="p-2 text-white rounded-full hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{background: 'linear-gradient(135deg, #0D9E86, #0B8A73)'}}
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
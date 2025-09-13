'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Navigation from '../../components/Navigation';
import Avatar from '../../components/Avatar';
import MessageAttachment from '../../components/MessageAttachment';
import GroupChatModal from '../../components/GroupChatModal';
import FileUploadModal from '../../components/FileUploadModal';
import GroupDiscoveryModal from '../../components/GroupDiscoveryModal';
import GroupInviteModal from '../../components/GroupInviteModal';
import MessageContent from '../../components/MessageContent';

import { isAuthenticated, getUser } from '../../lib/auth';
// import { useWebSocket } from '../../lib/websocket'; // Disabled for free tier
import api from '../../lib/api';
import { ALL_EMOJIS, POPULAR_EMOJIS } from '../../lib/emojis';
import { searchEmojisWithMapping } from '../../lib/emoji-search-mappings';
import { NeurolancerChatbot } from '../../lib/chatbot';
import api from '../../lib/api';

interface Conversation {
  id: number;
  name: string;
  participants: any[];
  last_message?: {
    content: string;
    created_at: string;
    sender: any;
  };
  conversation_type: 'direct' | 'group';
  unread_count?: number;
  group_info?: {
    description: string;
    admin: any;
    member_count: number;
  };
}

interface Message {
  id: number;
  content: string;
  sender: any;
  created_at: string;
  is_read: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_size?: number;
  message_type?: 'text' | 'file' | 'image' | 'system';
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGroupDiscovery, setShowGroupDiscovery] = useState(false);
  const [showGroupInvite, setShowGroupInvite] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups'>('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const [visibleEmojis, setVisibleEmojis] = useState(60);
  const [chatbot] = useState(() => new NeurolancerChatbot());
  const [aiMessages, setAiMessages] = useState<any[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [aiModeEnabled, setAiModeEnabled] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [activeForm, setActiveForm] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const currentUser = getUser();

  const jobCreationForm = {
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

  const gigCreationForm = {
    id: 'create-gig',
    title: 'Create Gig Service',
    type: 'gig',
    submitText: 'Create Gig',
    fields: [
      { name: 'title', label: 'Gig Title', type: 'text', required: true, placeholder: 'I will build an AI chatbot for your business' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe what you will deliver...' },
      { name: 'price', label: 'Starting Price ($)', type: 'number', required: true, placeholder: '50' },
      { name: 'delivery_time', label: 'Delivery Time (days)', type: 'number', required: true, placeholder: '7' }
    ]
  };

  const generateActionCards = (content: string) => {
    const cards: any[] = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes('job') || lowerContent.includes('hire') || lowerContent.includes('project')) {
      cards.push({
        title: "Create Job in Chat",
        description: "Post a job directly here",
        action: "form:create-job",
        icon: "💼",
        color: "from-blue-500 to-blue-600"
      });
    }

    if (lowerContent.includes('gig') || lowerContent.includes('service') || lowerContent.includes('sell')) {
      cards.push({
        title: "Create Gig in Chat",
        description: "Offer your service directly here",
        action: "form:create-gig",
        icon: "🚀",
        color: "from-purple-500 to-purple-600"
      });
    }

    if (lowerContent.includes('freelancer') || lowerContent.includes('expert') || lowerContent.includes('professional')) {
      cards.push({
        title: "Find Freelancers",
        description: "Browse AI expert profiles",
        action: "/freelancers",
        icon: "👨💻",
        color: "from-green-500 to-green-600"
      });
    }

    return cards.slice(0, 3);
  };

  const handleActionClick = (action: string) => {
    if (action.startsWith('form:')) {
      const formId = action.replace('form:', '');
      if (formId === 'create-job') {
        setActiveForm(jobCreationForm);
      } else if (formId === 'create-gig') {
        setActiveForm(gigCreationForm);
      }
    } else {
      window.open(action, '_blank');
    }
  };

  // WebSocket disabled for free tier - keeping code for future upgrade
  // const { connectionStatus, lastMessage, sendMessage: wsSend, lastMetaConversationId } = useWebSocket(selectedConversation?.id);
  const connectionStatus = 'connected'; // Always show as connected
  const lastMessage = null;
  const wsSend = () => {}; // No-op function
  const lastMetaConversationId = null;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    loadConversations();
    
    // Add AI Assistant conversation if not exists
    const addAIAssistant = () => {
      const aiConversation = {
        id: -1, // Special ID for AI assistant
        name: 'Neurolancer AI Assistant',
        participants: [{
          id: -1,
          first_name: 'Neurolancer',
          last_name: 'AI',
          username: 'neurolancer_ai',
          profile_picture: null,
          avatar_type: 'default',
          selected_avatar: 'ai',
          google_photo_url: null
        }],
        conversation_type: 'direct' as const,
        last_message: {
          content: 'Hello! I\'m your AI assistant. How can I help you today?',
          created_at: new Date().toISOString(),
          sender: {
            id: -1,
            first_name: 'Neurolancer',
            last_name: 'AI'
          }
        }
      };
      
      setConversations(prev => {
        const hasAI = prev.some(conv => conv.id === -1);
        if (!hasAI) {
          return [aiConversation, ...prev];
        }
        return prev;
      });
    };
    
    setTimeout(addAIAssistant, 500);
    
    // Initialize AI messages after chatbot loads conversation
    const initializeAiMessages = async () => {
      // Wait a bit for chatbot to load from database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const history = chatbot.getConversationHistory();
      const initAiMessages = history.map((msg, index) => ({
        id: -index - 1,
        content: msg.content,
        sender: {
          id: msg.role === 'user' ? currentUser?.id : -1,
          first_name: msg.role === 'user' ? currentUser?.first_name : 'Neurolancer',
          last_name: msg.role === 'user' ? currentUser?.last_name : 'AI',
          profile_picture: null,
          avatar_type: 'default',
          selected_avatar: msg.role === 'user' ? 'user' : 'ai'
        },
        created_at: msg.timestamp.toISOString(),
        is_read: true
      }));
      setAiMessages(initAiMessages);
    };
    
    initializeAiMessages();
  }, [router]);

  // WebSocket pause/resume disabled for free tier
  // useEffect(() => {
  //   if (!selectedConversation || selectedConversation.id === -1) return;
  //   try {
  //     if (isAtBottom) {
  //       wsSend({ type: 'resume_updates', conversation_id: selectedConversation.id });
  //     } else {
  //       wsSend({ type: 'pause_updates', conversation_id: selectedConversation.id });
  //     }
  //   } catch {}
  // }, [isAtBottom, selectedConversation, wsSend]);

  // WebSocket message handling disabled for free tier
  // useEffect(() => {
  //   if (lastMessage && selectedConversation) {
  //     if (lastMessage.conversation === selectedConversation.id) {
  //       const isOwnMessage = lastMessage.sender.id === currentUser?.id;
  //       
  //       // Always add own messages immediately
  //       if (isOwnMessage) {
  //         setMessages(prev => {
  //           const exists = prev.find(m => m.id === lastMessage.id);
  //           if (exists) return prev;
  //           return [...prev, { ...lastMessage, is_read: (lastMessage as any).is_read ?? true }];
  //         });
  //         setTimeout(scrollToBottom, 50);
  //       } else {
  //         // For other users' messages, only add if at bottom
  //         if (isAtBottom) {
  //           setMessages(prev => {
  //             const exists = prev.find(m => m.id === lastMessage.id);
  //             if (exists) return prev;
  //             return [...prev, { ...lastMessage, is_read: (lastMessage as any).is_read ?? true }];
  //           });
  //           setTimeout(scrollToBottom, 50);
  //         } else {
  //           // Buffer messages when not at bottom
  //           setPendingMessages(prev => {
  //             const exists = prev.find(m => m.id === lastMessage.id);
  //             if (exists) return prev;
  //             return [...prev, { ...lastMessage, is_read: (lastMessage as any).is_read ?? true }];
  //           });
  //           setNewMessageCount(prev => prev + 1);
  //         }
  //       }

  //       // AI participation triggers (do not depend on whether buffered or not)
  //       if (selectedConversation.conversation_type === 'group' &&
  //           !isOwnMessage &&
  //           !lastMessage.content.startsWith('🤖')) {
  //         if ((lastMessage as any).attachment_url && (lastMessage as any).attachment_type === 'image' && aiModeEnabled) {
  //           handleAiImageAnalysis(selectedConversation.id, lastMessage as any);
  //         } else {
  //           handleRandomAiParticipation(selectedConversation.id, lastMessage.content);
  //         }
  //       }
  //     }

  //     loadConversations();
  //   }
  // }, [lastMessage, selectedConversation, isAtBottom, currentUser, aiModeEnabled]);

  // WebSocket meta notifications disabled for free tier
  // useEffect(() => {
  //   if (!selectedConversation || selectedConversation.id === -1) return;
  //   if (lastMetaConversationId && lastMetaConversationId === selectedConversation.id) {
  //     if (!isAtBottom) {
  //       setNewMessageCount(prev => prev + 1);
  //     }
  //   }
  // }, [lastMetaConversationId, selectedConversation, isAtBottom]);

  // Simple polling for message updates (no live updates)
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    
    if (selectedConversation && selectedConversation.id !== -1) {
      // Poll every 15 seconds for new messages (non-forced to prevent glitching)
      pollingInterval = setInterval(() => {
        loadMessages(selectedConversation.id, false);
        loadConversations();
      }, 15000);
    }
    
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [selectedConversation]);

  // Removed auto-refresh for groups - using single polling interval above

  // Monitor scroll position
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atBottom = scrollHeight - scrollTop - clientHeight <= 10;
      setIsAtBottom(atBottom);
    };

    container.addEventListener('scroll', handleScroll);
    
    // Check initial scroll position
    handleScroll();
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset visible emojis when search or mode changes
  useEffect(() => {
    setVisibleEmojis(60);
  }, [emojiSearch, showAllEmojis]);

  // Update messages when AI messages change
  useEffect(() => {
    if (selectedConversation?.id === -1) {
      setMessages(aiMessages);
      setTimeout(scrollToBottom, 100);
    }
  }, [aiMessages, selectedConversation]);

  const loadConversations = async () => {
    try {
      const response = await api.get('/conversations/');
      setConversations(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      console.error('Error details:', (error as any).response?.data);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: number, force = false) => {
    try {
      const response = await api.get(`/conversations/${conversationId}/messages/`);
      const messageData = response.data.results || response.data;
      
      // Sort messages by created_at to ensure proper order
      const sortedMessages = messageData.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      // Only update if messages changed or forced
      if (force || messages.length !== sortedMessages.length || 
          (sortedMessages.length > 0 && messages.length > 0 && 
           sortedMessages[sortedMessages.length - 1].id !== messages[messages.length - 1]?.id)) {
        setMessages(sortedMessages);
        setNewMessageCount(0);
        if (force) setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (force) setMessages([]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage;
    setNewMessage('');

    // Handle AI Assistant conversation
    if (selectedConversation.id === -1) {
      // Add user message immediately for UI responsiveness
      const userMsg = {
        id: Date.now(),
        content: messageContent,
        sender: {
          id: currentUser?.id,
          first_name: currentUser?.first_name,
          last_name: currentUser?.last_name,
          profile_picture: null,
          avatar_type: 'default',
          selected_avatar: 'user'
        },
        created_at: new Date().toISOString(),
        is_read: true
      };
      
      setAiMessages(prev => [...prev, userMsg]);
      setIsAiTyping(true);
      setTimeout(scrollToBottom, 100);
      
      try {
        // Send message to chatbot (this will save to database)
        const aiResponse = await chatbot.sendMessage(messageContent);
        
        // Generate action cards based on user message and AI response
        const actionCards = generateActionCards(messageContent + ' ' + aiResponse);
        
        const aiMsg = {
          id: Date.now() + 1,
          content: aiResponse,
          sender: {
            id: -1,
            first_name: 'Neurolancer',
            last_name: 'AI',
            profile_picture: null,
            avatar_type: 'default',
            selected_avatar: 'ai'
          },
          created_at: new Date().toISOString(),
          is_read: true,
          actionCards: actionCards.length > 0 ? actionCards : undefined
        };
        
        setAiMessages(prev => [...prev, aiMsg]);
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error('AI chatbot error:', error);
        // Add error message
        const errorMsg = {
          id: Date.now() + 2,
          content: 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact support.',
          sender: {
            id: -1,
            first_name: 'Neurolancer',
            last_name: 'AI',
            profile_picture: null,
            avatar_type: 'default',
            selected_avatar: 'ai'
          },
          created_at: new Date().toISOString(),
          is_read: true
        };
        setAiMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsAiTyping(false);
      }
      return;
    }

    try {
      let finalContent = messageContent;
      
      // Add reply context for user messages
      if (replyingToMessage) {
        const replyPreview = replyingToMessage.attachment_type === 'image' 
          ? `[Image from ${replyingToMessage.sender.first_name}]`
          : `"${replyingToMessage.content.substring(0, 50)}..."`;
        finalContent = `**↳ Replying to ${replyingToMessage.sender.first_name}:** ${replyPreview}

${messageContent}`;
      }
      
      const response = await api.post('/messages/create/', {
        conversation: selectedConversation.id,
        content: finalContent,
        message_type: 'text'
      });
      
      // Check if AI mode is enabled or message mentions @ai in group chat
      if (selectedConversation.conversation_type === 'group') {
        if (aiModeEnabled || messageContent.toLowerCase().includes('@ai')) {
          handleAiMentionInGroup(messageContent, selectedConversation.id, replyingToMessage);
        }
      }
      
      // Clear reply after sending
      setReplyingToMessage(null);
      
      setTimeout(scrollToBottom, 100);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageContent);
    }
  };

  const sendFiles = async (files: File[]) => {
    if (!selectedConversation) return;

    for (const file of files) {
      const formData = new FormData();
      formData.append('conversation', selectedConversation.id.toString());
      formData.append('content', `📎 ${file.name}`); // Use filename with attachment icon as content
      formData.append('attachment', file); // Use 'attachment' field name to match backend model

      try {
        const response = await api.post('/messages/create/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Reload messages to show the uploaded file
        if (selectedConversation.id !== -1) {
          loadMessages(selectedConversation.id, true);
        }
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error('Error sending file:', error);
        console.error('Error details:', (error as any).response?.data);
      }
    }
    
    loadConversations();
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setNewMessageCount(0);
    setPendingMessages([]);
    setShowConversationInfo(false);
    setShowSidebar(false);
    setReplyingToMessage(null);
    
    if (conversation.id === -1) {
      setMessages(aiMessages);
      setTimeout(scrollToBottom, 100);
    } else {
      loadMessages(conversation.id, true); // Force load with scroll
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleScrollToBottom = () => {
    if (pendingMessages.length > 0) {
      // Add separator and merge buffered messages
      const separator: any = {
        id: -Date.now(),
        isSeparator: true,
        content: '',
        sender: {},
        created_at: new Date().toISOString(),
        is_read: true,
        message_type: 'system'
      };
      setMessages(prev => [...prev, separator, ...pendingMessages]);
      setPendingMessages([]);
    } else if (newMessageCount > 0 && selectedConversation) {
      // Fetch latest messages if only meta events were received
      loadMessages(selectedConversation.id);
    }
    
    setNewMessageCount(0);
    setTimeout(scrollToBottom, 100);
  };

  const handleTyping = () => {
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleAiMentionInGroup = async (messageContent: string, conversationId: number, replyTo?: Message | null) => {
    const aiMentionRegex = /@ai\s+(.+)/i;
    const match = messageContent.match(aiMentionRegex);
    const aiQuery = match ? match[1] : messageContent.replace(/@ai/i, '').trim();
    
    if (!aiQuery) return;
    
    setTimeout(async () => {
      try {
        let aiResponse;
        
        // Check if replying to an image
        if (replyTo && replyTo.attachment_url && replyTo.attachment_type === 'image') {
          const getFileUrl = (url: string) => {
            if (url.startsWith('http')) return url;
            return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url.startsWith('/') ? url : '/' + url}`;
          };
          const imageUrl = getFileUrl(replyTo.attachment_url);
          aiResponse = await chatbot.analyzeImage(imageUrl, aiQuery);
        } else {
          let contextMessage = aiQuery;
          if (replyTo) {
            contextMessage = `Replying to "${replyTo.content.substring(0, 100)}...": ${aiQuery}`;
          }
          aiResponse = await chatbot.sendGroupMessage(contextMessage);
        }
        
        let responseContent = `🤖 ${aiResponse}`;
        if (replyTo) {
          const replyPreview = replyTo.attachment_type === 'image' 
            ? `[Image from ${replyTo.sender.first_name}]`
            : `"${replyTo.content.substring(0, 50)}..."`;
          responseContent = `🤖 **↳ Replying to ${replyTo.sender.first_name}:** ${replyPreview}

${aiResponse}`;
        }
        
        await api.post('/messages/create/', {
          conversation: conversationId,
          content: responseContent,
          message_type: 'text',
          sender_override: 'ai'
        });
        
        loadConversations();
      } catch (error) {
        console.error('AI group response error:', error);
        await api.post('/messages/create/', {
          conversation: conversationId,
          content: '🤖 Sorry, I\'m having technical difficulties right now.',
          message_type: 'text',
          sender_override: 'ai'
        });
      }
    }, 1000 + Math.random() * 2000);
  };

  const shouldAiParticipate = (messageContent: string) => {
    const keywords = ['ai', 'help', 'question', 'problem'];
    const hasKeyword = keywords.some(keyword => messageContent.toLowerCase().includes(keyword));
    return hasKeyword || Math.random() < 0.1;
  };

  const handleRandomAiParticipation = async (conversationId: number, lastMessage: string) => {
    if (!shouldAiParticipate(lastMessage)) return;
    
    setTimeout(async () => {
      try {
        const responses = [
          'That\'s interesting! 🤔',
          'I can help with that! 💡',
          'Great discussion! 👍',
          'Feel free to ask me anything! 🚀'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        await api.post('/messages/create/', {
          conversation: conversationId,
          content: `🤖 ${randomResponse}`,
          message_type: 'text',
          sender_override: 'ai'
        });
        
        loadConversations();
      } catch (error) {
        console.error('Random AI participation error:', error);
      }
    }, 3000 + Math.random() * 5000);
  };

  const handleAiImageAnalysis = async (conversationId: number, imageMessage: Message) => {
    setTimeout(async () => {
      try {
        const getFileUrl = (url: string) => {
          if (url.startsWith('http')) return url;
          return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url.startsWith('/') ? url : '/' + url}`;
        };
        const imageUrl = getFileUrl(imageMessage.attachment_url!);
        const aiResponse = await chatbot.analyzeImage(imageUrl);
        
        const responseContent = `🤖 **Analyzing image from ${imageMessage.sender.first_name}:**\n\n${aiResponse}`;
        
        await api.post('/messages/create/', {
          conversation: conversationId,
          content: responseContent,
          message_type: 'text',
          sender_override: 'ai'
        });
        
        loadConversations();
      } catch (error) {
        console.error('AI image analysis error:', error);
      }
    }, 2000 + Math.random() * 3000);
  };

  const currentEmojis = showAllEmojis ? ALL_EMOJIS : POPULAR_EMOJIS;
  const filteredEmojis = emojiSearch.trim() 
    ? searchEmojisWithMapping(emojiSearch, currentEmojis)
    : currentEmojis;
  const displayedEmojis = filteredEmojis.slice(0, visibleEmojis);

  const loadMoreEmojis = () => {
    setVisibleEmojis(prev => Math.min(prev + 60, filteredEmojis.length));
  };

  const leaveGroup = async () => {
    if (!selectedConversation || selectedConversation.conversation_type !== 'group') return;
    
    if (!confirm(`Are you sure you want to leave "${selectedConversation.name}"?`)) return;
    
    try {
      await api.post(`/groups/${selectedConversation.id}/leave/`);
      
      // Remove conversation from list and clear selection
      setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
      setSelectedConversation(null);
      setShowConversationInfo(false);
      
      alert('You have left the group.');
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group. Please try again.');
    }
  };

  const getConnectionStatusColor = () => {
    return 'text-green-500'; // Always show as connected
  };

  const getConnectionStatusText = () => {
    return 'Online'; // Always show as online
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                     (activeTab === 'direct' && conv.conversation_type === 'direct') ||
                     (activeTab === 'groups' && conv.conversation_type === 'group');
    return matchesSearch && matchesTab;
  });

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card rounded-xl shadow-sm h-[700px] flex overflow-hidden">
          {/* Conversations Sidebar */}
          <div className={`${showSidebar ? 'flex' : 'hidden'} md:flex w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex-col`}>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Messages</h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowGroupModal(true)}
                    className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                    title="Create Group"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowGroupDiscovery(true)}
                    className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                    title="Discover Groups"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full px-4 py-2 pl-10 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:bg-opacity-30"
                />
                <svg className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Conversation Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { key: 'all', label: 'All', count: conversations.length },
                { key: 'direct', label: 'Direct', count: conversations.filter(c => c.conversation_type === 'direct').length },
                { key: 'groups', label: 'Groups', count: conversations.filter(c => c.conversation_type === 'group').length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {/* Conversations List */}
            <div className="h-96 overflow-y-auto custom-scrollbar no-horizontal-scroll">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="font-medium text-gray-900 dark:text-gray-100">No conversations found</p>
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                    {searchQuery ? 'Try a different search term' : 'Start a conversation with a freelancer or client'}
                  </p>
                </div>
              ) : (
                filteredConversations.map(conversation => (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation)}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="relative">
                        {conversation.conversation_type === 'group' ? (
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        ) : conversation.id === -1 ? (
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                            🤖
                          </div>
                        ) : (
                          conversation.participants.length > 0 && conversation.participants[0] ? (
                            <Avatar
                              src={conversation.participants[0].profile_picture}
                              avatarType={(conversation.participants[0].avatar_type as "upload" | "avatar" | "google") || 'avatar'}
                              selectedAvatar={conversation.participants[0].selected_avatar}
                              googlePhotoUrl={conversation.participants[0].google_photo_url}
                              size="md"
                              alt={conversation.participants[0].first_name}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                              {conversation.name ? conversation.name[0].toUpperCase() : 'U'}
                            </div>
                          )
                        )}
                        {conversation.unread_count && conversation.unread_count > 0 && selectedConversation?.id !== conversation.id && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {conversation.conversation_type === 'direct' && conversation.participants.length > 0 
                              ? `${conversation.participants.find(p => p.id !== currentUser?.id)?.first_name || ''} ${conversation.participants.find(p => p.id !== currentUser?.id)?.last_name || ''}`.trim() || conversation.name
                              : conversation.name || 'Conversation'
                            }
                          </div>
                          {conversation.conversation_type === 'group' && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {conversation.group_info?.member_count || conversation.participants.length} members
                            </span>
                          )}
                        </div>
                        {conversation.last_message && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                            <span className="font-medium">{conversation.last_message.sender.first_name}:</span>
                            {' '}{conversation.last_message.content}
                          </div>
                        )}
                        {conversation.last_message && (
                          <div className="text-xs text-gray-400 mt-1">
                            {formatMessageTime(conversation.last_message.created_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className={`flex-1 flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative">
                        {selectedConversation.conversation_type === 'group' ? (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        ) : selectedConversation.id === -1 ? (
                          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                            🤖
                          </div>
                        ) : (
                          selectedConversation.participants.length > 0 && selectedConversation.participants[0] ? (
                            <Avatar
                              src={selectedConversation.participants[0].profile_picture}
                              avatarType={(selectedConversation.participants[0].avatar_type as "upload" | "avatar" | "google") || 'avatar'}
                              selectedAvatar={selectedConversation.participants[0].selected_avatar}
                              googlePhotoUrl={selectedConversation.participants[0].google_photo_url}
                              size="sm"
                              alt={selectedConversation.participants[0].first_name}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                              {selectedConversation.name ? selectedConversation.name[0].toUpperCase() : 'U'}
                            </div>
                          )
                        )}
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getConnectionStatusColor().replace('text-', 'bg-')}`}></div>
                      </div>
                      <div className="ml-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {selectedConversation.conversation_type === 'direct' && selectedConversation.participants.length > 0
                            ? `${selectedConversation.participants.find(p => p.id !== currentUser?.id)?.first_name || ''} ${selectedConversation.participants.find(p => p.id !== currentUser?.id)?.last_name || ''}`.trim() || selectedConversation.name
                            : selectedConversation.name || 'Conversation'
                          }
                        </h3>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className={getConnectionStatusColor()}>
                            {getConnectionStatusText()}
                          </span>
                          {selectedConversation.conversation_type === 'group' && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {selectedConversation.group_info?.member_count || selectedConversation.participants.length} members
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => {
                          setShowSidebar(true);
                          setSelectedConversation(null);
                        }}
                        className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      {selectedConversation?.conversation_type === 'group' && (
                        <button 
                          onClick={() => setShowGroupInvite(true)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                          title="Invite Members"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                          </svg>
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (selectedConversation && selectedConversation.id !== -1) {
                            loadMessages(selectedConversation.id, true);
                            loadConversations();
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="Refresh Messages"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => setShowConversationInfo(!showConversationInfo)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex flex-1 overflow-hidden">
                  {/* Messages */}
                  <div className={`flex-1 flex flex-col ${showConversationInfo ? 'border-r border-gray-200' : ''}`}>
                    <div 
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto custom-scrollbar no-horizontal-scroll p-4 space-y-4 bg-gray-50 dark:bg-gray-800"
                    >
                      {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No messages yet</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Start the conversation!</p>
                          </div>
                        </div>
                      ) : (
                        messages.map((message, index) => {
                          // Separator for new messages
                          if ((message as any).isSeparator) {
                            return (
                              <div key={`sep_${index}`} className="flex justify-center">
                                <div className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 px-3 py-1 rounded-full">New messages above</div>
                              </div>
                            );
                          }
                          const isAiMessage = (message as any).sender?.username === 'neurolancer_ai' || (message.content || '').startsWith('🤖');
                          const isCurrentUser = !isAiMessage && message.sender.id === currentUser?.id;
                          const showAvatar = index === 0 || messages[index - 1].sender.id !== message.sender.id;
                          
                          return (
                            <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`flex max-w-[280px] sm:max-w-xs lg:max-w-md prevent-overflow ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                {showAvatar && !isCurrentUser && (
                                  <div className="mr-2">
                                    <Avatar
                                      src={message.sender.profile_picture}
                                      avatarType={(message.sender.avatar_type as "upload" | "avatar" | "google") || 'avatar'}
                                      selectedAvatar={message.sender.selected_avatar}
                                      googlePhotoUrl={message.sender.google_photo_url}
                                      size="sm"
                                      alt={message.sender.first_name}
                                    />
                                  </div>
                                )}
                                <div className={`${showAvatar && !isCurrentUser ? '' : 'ml-10'} ${isCurrentUser ? 'mr-2' : ''}`}>
                                  {showAvatar && (
                                    <div className={`text-xs text-gray-500 mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                                      {isCurrentUser ? 'You' : message.sender.first_name}
                                      <span className="ml-2">
                                        {formatMessageTime(message.created_at)}
                                      </span>
                                    </div>
                                  )}
                                  <div className={`rounded-2xl px-4 py-2 relative group ${
                                    isCurrentUser 
                                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600 shadow-sm'
                                  }`}>
                                    {/* Reply button for group chats */}
                                    {selectedConversation?.conversation_type === 'group' && (
                                      <button
                                        onClick={() => setReplyingToMessage(message)}
                                        className="absolute -right-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
                                        title="Reply"
                                      >
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                        </svg>
                                      </button>
                                    )}
                                    {/* Show attachment if present */}
                                    {message.attachment_url ? (
                                      <div>
                                        {(() => {
                                          const getFileUrl = (url: string) => {
                                            if (url.startsWith('http')) return url;
                                            return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${url.startsWith('/') ? url : '/' + url}`;
                                          };
                                          const fileUrl = getFileUrl(message.attachment_url!);
                                          
                                          if (message.attachment_type === 'image') {
                                            return (
                                              <div className="relative group">
                                                <Image
                                                  src={fileUrl}
                                                  alt={message.attachment_name || 'Image'}
                                                  width={300}
                                                  height={200}
                                                  className="rounded-lg max-w-xs object-cover cursor-pointer"
                                                  onClick={() => window.open(fileUrl, '_blank')}
                                                  onError={(e) => {
                                                    console.error('Image load error:', fileUrl);
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                  }}
                                                />
                                                <a
                                                  href={fileUrl}
                                                  download={message.attachment_name}
                                                  className={`absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                                                    isCurrentUser ? 'bg-white bg-opacity-80 text-gray-700' : 'bg-gray-800 bg-opacity-80 text-white'
                                                  }`}
                                                  title="Download"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                  </svg>
                                                </a>
                                                {message.attachment_name && (
                                                  <p className="text-xs opacity-70 mt-1">{message.attachment_name}</p>
                                                )}
                                              </div>
                                            );
                                          } else if (message.attachment_type === 'video') {
                                            return (
                                              <div className="relative group">
                                                <video controls className="max-w-xs rounded-lg">
                                                  <source src={fileUrl} type="video/mp4" />
                                                  Your browser does not support the video element.
                                                </video>
                                                <a
                                                  href={fileUrl}
                                                  download={message.attachment_name}
                                                  className={`absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                                                    isCurrentUser ? 'bg-white bg-opacity-80 text-gray-700' : 'bg-gray-800 bg-opacity-80 text-white'
                                                  }`}
                                                  title="Download"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                  </svg>
                                                </a>
                                                {message.attachment_name && (
                                                  <p className="text-xs opacity-70 mt-1">{message.attachment_name}</p>
                                                )}
                                              </div>
                                            );
                                          } else if (message.attachment_type === 'audio') {
                                            return (
                                              <div className="relative group">
                                                <audio controls className="max-w-xs">
                                                  <source src={fileUrl} type="audio/mpeg" />
                                                  Your browser does not support the audio element.
                                                </audio>
                                                <a
                                                  href={fileUrl}
                                                  download={message.attachment_name}
                                                  className={`absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                                                    isCurrentUser ? 'bg-white bg-opacity-80 text-gray-700' : 'bg-gray-800 bg-opacity-80 text-white'
                                                  }`}
                                                  title="Download"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                  </svg>
                                                </a>
                                                {message.attachment_name && (
                                                  <p className="text-xs opacity-70 mt-1">{message.attachment_name}</p>
                                                )}
                                              </div>
                                            );
                                          } else {
                                            return (
                                              <div className={`flex items-center space-x-2 rounded-lg p-3 max-w-xs ${
                                                isCurrentUser ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                                              }`}>
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                                                  isCurrentUser ? 'bg-white bg-opacity-30' : 'bg-gray-200'
                                                }`}>
                                                  📎
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium truncate">{message.attachment_name}</p>
                                                  <div className="flex items-center space-x-2 mt-1">
                                                    <button
                                                      onClick={() => window.open(fileUrl, '_blank')}
                                                      className="text-xs opacity-70 hover:opacity-100"
                                                    >
                                                      Open
                                                    </button>
                                                    <span className="text-xs opacity-50">•</span>
                                                    <a
                                                      href={fileUrl}
                                                      download={message.attachment_name}
                                                      className="text-xs opacity-70 hover:opacity-100"
                                                    >
                                                      Download
                                                    </a>
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          }
                                        })()}
                                      </div>
                                    ) : (
                                      /* Show text content if no attachment */
                                      message.content && message.content.trim() && (
                                        (selectedConversation?.id === -1 && message.sender.id === -1) || isAiMessage || message.content.includes('**↳ Replying to') ? (
                                          <div className={`prose prose-sm max-w-none prevent-overflow ${isCurrentUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                              {message.content}
                                            </ReactMarkdown>
                                          </div>
                                        ) : (
                                          <MessageContent 
                                            content={message.content} 
                                            isCurrentUser={isCurrentUser}
                                          />
                                        )
                                      )
                                    )}
                                  </div>

                                    {/* Action Cards for AI messages */}
                                    {selectedConversation?.id === -1 && (message as any).actionCards && (message as any).actionCards.length > 0 && (
                                      <div className="mt-3">
                                        {/* Form buttons (full width) */}
                                        {(message as any).actionCards.filter((card: any) => card.action.startsWith('form:')).map((card: any, index: number) => (
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
                                        {(message as any).actionCards.filter((card: any) => !card.action.startsWith('form:')).length > 0 && (
                                          <div className="grid grid-cols-3 gap-1">
                                            {(message as any).actionCards.filter((card: any) => !card.action.startsWith('form:')).map((card: any, index: number) => (
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
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Interactive Form */}
                      {selectedConversation?.id === -1 && activeForm && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 mx-4">
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
                            {activeForm.fields.map((field: any) => (
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
                                    {field.options?.map((option: any) => (
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
                                  const successMessage = {
                                    id: Date.now(),
                                    content: `✅ **${activeForm.type === 'job' ? 'Job' : 'Gig'} created successfully!**\n\nYour ${activeForm.type} "${formData.title}" has been posted.`,
                                    sender: {
                                      id: -1,
                                      first_name: 'Neurolancer',
                                      last_name: 'AI',
                                      profile_picture: null,
                                      avatar_type: 'default',
                                      selected_avatar: 'ai'
                                    },
                                    created_at: new Date().toISOString(),
                                    is_read: true
                                  };
                                  setAiMessages(prev => [...prev, successMessage]);
                                  setActiveForm(null);
                                  setFormData({});
                                  setTimeout(scrollToBottom, 100);
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

                      <div ref={messagesEndRef} />
                      
                      {/* Typing indicator */}
                      {(isTyping || (selectedConversation?.id === -1 && isAiTyping)) && (
                        <div className="flex justify-start">
                          <div className="bg-white dark:bg-gray-700 rounded-2xl px-4 py-2 shadow-sm">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>



                    {/* Message Input */}
                    <form onSubmit={sendMessage} className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 card">
                      {/* Reply indicator */}
                      {replyingToMessage && (
                        <div className="px-3 py-2 bg-blue-50 border-l-4 border-blue-500 mb-2 rounded">
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="font-medium text-blue-600">Replying to {replyingToMessage.sender.first_name}:</span>
                              <p className="text-gray-600 truncate">{replyingToMessage.content.substring(0, 50)}...</p>
                            </div>
                            <button 
                              onClick={() => setReplyingToMessage(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <button 
                          type="button" 
                          onClick={() => setShowFileModal(true)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </button>
                        
                        {selectedConversation?.conversation_type === 'group' && (
                          <button 
                            type="button" 
                            onClick={() => setAiModeEnabled(!aiModeEnabled)}
                            className={`p-2 rounded-lg transition-colors ${
                              aiModeEnabled 
                                ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                                : 'text-gray-400 hover:text-green-600 hover:bg-gray-100'
                            }`}
                            title={aiModeEnabled ? 'AI Mode: ON (includes image analysis) - Click to disable' : 'AI Mode: OFF - Click to enable AI responses and image analysis'}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {aiModeEnabled && (
                              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
                            )}
                          </button>
                        )}
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value);
                              handleTyping();
                            }}
                            onFocus={() => setShowEmojiPicker(false)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && showEmojiPicker) {
                                setShowEmojiPicker(false);
                              }
                            }}
                            placeholder={selectedConversation?.conversation_type === 'group' && aiModeEnabled ? 'AI Mode ON - Type a message for AI to respond...' : 'Type a message...'}
                            className="input-field rounded-full pr-10 sm:pr-12"
                            disabled={false}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2" ref={emojiPickerRef}>
                            <button 
                              type="button" 
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            
                            {showEmojiPicker && (
                              <div className="absolute bottom-12 right-0 card border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg w-80 z-50">
                                <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                                  <input
                                    type="text"
                                    value={emojiSearch}
                                    onChange={(e) => setEmojiSearch(e.target.value)}
                                    placeholder="Search emojis..."
                                    className="input-field text-sm mb-2"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setShowAllEmojis(false)}
                                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                        !showAllEmojis ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                    >
                                      Popular
                                    </button>
                                    <button
                                      onClick={() => setShowAllEmojis(true)}
                                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                        showAllEmojis ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                    >
                                      All ({ALL_EMOJIS.length})
                                    </button>
                                  </div>
                                </div>
                                <div 
                                  className="max-h-48 overflow-y-auto custom-scrollbar no-horizontal-scroll p-3"
                                  onScroll={(e) => {
                                    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
                                    if (scrollHeight - scrollTop - clientHeight < 50 && visibleEmojis < filteredEmojis.length) {
                                      loadMoreEmojis();
                                    }
                                  }}
                                >
                                  <div className="grid grid-cols-6 gap-2">
                                    {displayedEmojis.map((emoji, index) => (
                                      <button
                                        key={`${emoji.code}-${index}`}
                                        onClick={() => addEmoji(emoji.unicode)}
                                        className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-600 rounded p-1 transition-colors flex items-center justify-center"
                                        title={emoji.name}
                                      >
                                        {emoji.unicode}
                                      </button>
                                    ))}
                                  </div>
                                  {visibleEmojis < filteredEmojis.length && (
                                    <div className="text-center py-2">
                                      <button
                                        onClick={loadMoreEmojis}
                                        className="text-xs text-blue-600 hover:underline"
                                      >
                                        Load more... ({filteredEmojis.length - visibleEmojis} remaining)
                                      </button>
                                    </div>
                                  )}
                                  {filteredEmojis.length === 0 && (
                                    <div className="text-center text-gray-500 py-4">
                                      <p className="text-sm">No emojis found</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <button 
                          type="submit" 
                          disabled={!newMessage.trim()}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          onClick={() => setShowEmojiPicker(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                      </div>
                      

                    </form>
                  </div>

                  {/* Conversation Info Sidebar */}
                  {showConversationInfo && (
                    <div className="w-full md:w-80 card p-4 sm:p-6 flex-1 overflow-y-auto custom-scrollbar no-horizontal-scroll">
                      <div className="text-center mb-6">
                        {selectedConversation.conversation_type === 'group' ? (
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        ) : (
                          selectedConversation.participants.length > 0 && selectedConversation.participants[0] ? (
                            <div className="mx-auto mb-4">
                              <Avatar
                                src={selectedConversation.participants[0].profile_picture}
                                avatarType={(selectedConversation.participants[0].avatar_type as "upload" | "avatar" | "google") || 'avatar'}
                                selectedAvatar={selectedConversation.participants[0].selected_avatar}
                                googlePhotoUrl={selectedConversation.participants[0].google_photo_url}
                                size="xl"
                                alt={selectedConversation.participants[0].first_name}
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                              {selectedConversation.name ? selectedConversation.name[0].toUpperCase() : 'U'}
                            </div>
                          )
                        )}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {selectedConversation.conversation_type === 'direct' && selectedConversation.participants.length > 0
                            ? `${selectedConversation.participants.find(p => p.id !== currentUser?.id)?.first_name || ''} ${selectedConversation.participants.find(p => p.id !== currentUser?.id)?.last_name || ''}`.trim() || selectedConversation.name
                            : selectedConversation.name
                          }
                        </h3>
                        {selectedConversation.conversation_type === 'group' && selectedConversation.group_info?.description && (
                          <p className="text-sm text-gray-600 mt-2">{selectedConversation.group_info.description}</p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                            {selectedConversation.conversation_type === 'group' ? 'Members' : 'Participants'} 
                            ({selectedConversation.participants.length})
                          </h4>
                          <div className="space-y-2">
                            {selectedConversation.participants.map(participant => (
                              <div key={participant.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                <div className="mr-3">
                                  <Avatar
                                    src={participant.profile_picture}
                                    avatarType={(participant.avatar_type as "upload" | "avatar" | "google") || 'avatar'}
                                    selectedAvatar={participant.selected_avatar}
                                    googlePhotoUrl={participant.google_photo_url}
                                    size="sm"
                                    alt={participant.first_name}
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{participant.first_name} {participant.last_name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">@{participant.username}</div>
                                </div>
                                {selectedConversation.conversation_type === 'group' && 
                                 selectedConversation.group_info?.admin?.id === participant.id && (
                                  <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full">Admin</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-600 space-y-2">
                          {selectedConversation.conversation_type === 'group' && (
                            <button 
                              onClick={() => setShowGroupInvite(true)}
                              className="w-full text-left p-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm flex items-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              <span>Invite Members</span>
                            </button>
                          )}
                          <button 
                            onClick={selectedConversation.conversation_type === 'group' ? leaveGroup : undefined}
                            className="w-full text-left p-2 text-red-600 hover:bg-red-50 rounded-lg text-sm flex items-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedConversation.conversation_type === 'group' ? "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" : "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"} />
                            </svg>
                            <span>{selectedConversation.conversation_type === 'group' ? 'Leave Group' : 'Delete Conversation'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                <div className="text-center">
                  <svg className="w-20 h-20 mx-auto mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Select a conversation</p>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Choose a conversation from the sidebar to start messaging</p>
                  <button
                    onClick={() => setShowGroupModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                  >
                    Create Group Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <GroupChatModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={(group) => {
          loadConversations();
          setSelectedConversation(group as any);
        }}
      />

      <GroupDiscoveryModal
        isOpen={showGroupDiscovery}
        onClose={() => setShowGroupDiscovery(false)}
        onGroupJoined={(group) => {
          loadConversations();
          setSelectedConversation(group as any);
        }}
        onConversationStarted={(conversation) => {
          loadConversations();
          setSelectedConversation(conversation);
        }}
      />

      {selectedConversation && (
        <GroupInviteModal
          isOpen={showGroupInvite}
          onClose={() => setShowGroupInvite(false)}
          groupId={selectedConversation.id}
          groupName={selectedConversation.name}
        />
      )}

      <FileUploadModal
        isOpen={showFileModal}
        onClose={() => setShowFileModal(false)}
        onFileSelect={sendFiles}
      />
    </div>
  );
}
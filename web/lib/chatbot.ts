const GOOGLE_AI_API_KEY = 'AIzaSyDb_PBXL72bNTrJZeyy0TSkJrHHi7bAXvw';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const VISION_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class NeurolancerChatbot {
  private conversationHistory: ChatMessage[] = [];
  private isInitialized = false;

  constructor() {
    // Load conversation from database on initialization
    this.loadConversationFromDB();
  }

  private async loadConversationFromDB() {
    // Skip database loading for now - just initialize with welcome
    this.initializeWithWelcome();
    this.isInitialized = true;
  }

  private initializeWithWelcome() {
    this.conversationHistory = [{
      role: 'assistant',
      content: `Hello! I'm Neurolancer AI, your intelligent assistant for the Neurolancer platform. I can help you with:

🎯 **Gig Marketplace**: Finding AI services, creating gigs, managing orders
💼 **Job Board**: Posting jobs, submitting proposals, project management  
💬 **Platform Support**: Account help, payment issues, technical support
📊 **Analytics**: Understanding your performance metrics

How can I assist you today?`,
      timestamp: new Date()
    }];
  }

  private async saveMessageToDB(role: 'user' | 'assistant', content: string) {
    // Skip database saving for now
    console.log('Would save to DB:', role, content.substring(0, 50) + '...');
  }

  async sendMessage(userMessage: string): Promise<string> {
    try {
      // Wait for initialization if not ready
      if (!this.isInitialized) {
        await new Promise(resolve => {
          const checkInit = () => {
            if (this.isInitialized) {
              resolve(true);
            } else {
              setTimeout(checkInit, 100);
            }
          };
          checkInit();
        });
      }

      // Add user message to history
      const userMsg = {
        role: 'user' as const,
        content: userMessage,
        timestamp: new Date()
      };
      this.conversationHistory.push(userMsg);

      // Save user message to database (disabled for debugging)
      await this.saveMessageToDB('user', userMessage);

      // Prepare context for AI
      const context = this.buildContext();
      const prompt = this.buildPrompt(userMessage, context);

      console.log('Sending request to Google AI API...');
      console.log('API URL:', `${API_URL}?key=${GOOGLE_AI_API_KEY}`);
      console.log('Request body:', JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }, null, 2));
      
      const response = await fetch(`${API_URL}?key=${GOOGLE_AI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('API Response data:', data);
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process your request.';

      // Add AI response to history
      const assistantMsg = {
        role: 'assistant' as const,
        content: aiResponse,
        timestamp: new Date()
      };
      this.conversationHistory.push(assistantMsg);

      // Save AI response to database (disabled for debugging)
      await this.saveMessageToDB('assistant', aiResponse);

      return aiResponse;
    } catch (error) {
      console.error('Chatbot error:', error);
      return 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact support at kbrian1237@gmail.com.';
    }
  }

  private buildContext(isGroupChat = false): string {
    const baseContext = `You are Neurolancer AI, an intelligent assistant for the Neurolancer AI freelance marketplace platform.`;
    
    const groupContext = isGroupChat ? `

GROUP CHAT MODE:
- You are participating in a group conversation
- Keep responses brief and conversational
- Only respond when directly mentioned with @ai or when you have valuable input
- Be friendly and helpful but not overwhelming
- Use emojis sparingly in group settings` : '';
    
    return `${baseContext}

PLATFORM OVERVIEW:
Neurolancer is a comprehensive AI freelance marketplace with these key features:
- Gig Marketplace: AI service offerings with package-based pricing
- Job Board: Project postings with proposal system
- Project Management: Multi-task collaboration tools
- Real-time Messaging: Communication between users
- Payment System: Paystack integration with escrow
- Analytics: Performance tracking and insights${groupContext}

RESPONSE GUIDELINES:
- Be helpful, professional, and knowledgeable about AI/ML topics
- Provide specific guidance for platform features
- Use markdown formatting for better readability
- Include relevant emojis to make responses engaging
- Offer actionable advice and next steps
- Reference platform features when relevant
- Keep responses concise but informative

CURRENT CONVERSATION CONTEXT:
${this.conversationHistory.slice(-5).map(msg => `${msg.role}: ${msg.content}`).join('\n')}`;
  }

  private buildPrompt(userMessage: string, context: string): string {
    return `${context}

USER MESSAGE: ${userMessage}

Please provide a helpful response as Neurolancer AI assistant. Use markdown formatting and include relevant emojis.`;
  }

  async sendGroupMessage(userMessage: string): Promise<string> {
    try {
      const context = this.buildContext(true);
      const prompt = this.buildPrompt(userMessage, context);

      console.log('Sending group message to Google AI API...');
      const response = await fetch(`${API_URL}?key=${GOOGLE_AI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not process your request.';

      return aiResponse;
    } catch (error) {
      console.error('Group chatbot error:', error);
      return 'I apologize, but I\'m experiencing technical difficulties. Please try again later.';
    }
  }

  async analyzeImage(imageUrl: string, userMessage?: string): Promise<string> {
    try {
      // Convert image URL to base64
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();
      const base64 = await this.blobToBase64(imageBlob);
      const mimeType = imageBlob.type;
      
      const context = this.buildContext(true);
      const prompt = userMessage 
        ? `${context}\n\nUser question about the image: ${userMessage}\n\nPlease analyze the image and answer the question.`
        : `${context}\n\nPlease analyze this image and describe what you see. Focus on relevant details for the Neurolancer platform context.`;

      console.log('Sending image to Google AI Vision API...');
      const response = await fetch(`${VISION_API_URL}?key=${GOOGLE_AI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64.split(',')[1] // Remove data:image/jpeg;base64, prefix
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Vision API Error:', response.status, errorText);
        throw new Error(`Vision API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not analyze this image.';

      return aiResponse;
    } catch (error) {
      console.error('Image analysis error:', error);
      return 'I apologize, but I cannot analyze this image right now. Please try again later.';
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  async clearHistory(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/ai/conversation/clear/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Failed to clear AI conversation:', error);
    }
    
    this.initializeWithWelcome();
  }
}
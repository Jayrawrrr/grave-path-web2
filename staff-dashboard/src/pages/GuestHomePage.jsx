import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import eventBus, { EVENTS } from '../utils/eventBus';
import {
  MapPin as MapIcon,
  Info as VisitorInfoIcon,
  CalendarCheck as BookingIcon,
  MessageCircle as ChatIcon,
  Send as SendIcon,
  X as CloseIcon,
  Bot as BotIcon,
  User as UserIcon,
  RotateCcw as ClearIcon,
} from 'lucide-react';
import './HomePage.css';
import axios from 'axios';

export default function GuestHomePage() {
  const navigate = useNavigate();
  const { handleNavigate, handleVisitorInfo } = useOutletContext();
  const messagesEndRef = useRef(null);
  
  // Create initial welcome message for guests
  const createInitialMessage = () => {
    return {
      role: 'assistant',
      content: `👋 Welcome to Garden of Memories Memorial Park! \n\nAs a guest, I can help you with:\n• 📍 **Find graves and locate plots** (using our Grave Locator)\n• 💰 Plot pricing and availability information\n• ⏰ Visiting hours and policies\n• 🏗️ Facilities and amenities\n• 📍 General park information\n• 🗺️ Park navigation and directions\n\n**Please note:** To make plot reservations, you'll need to create an account and log in.\n\nHow can I assist you today? 😊`,
      timestamp: new Date().toISOString()
    };
  };

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([createInitialMessage()]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add grave locator keywords
  const graveLocatorKeywords = [
    'find grave', 'locate grave', 'find someone', 'locate someone', 'grave locator', 
    'find plot', 'locate plot', 'find lot', 'locate lot', 'where is', 'search for',
    'looking for', 'find my', 'locate my'
  ];

  // Add grave locator state
  const [graveLocatorMode, setGraveLocatorMode] = useState(false);
  const [graveLocatorData, setGraveLocatorData] = useState({ lotName: '', lotId: '', foundLot: null });

  // Quick response buttons for guests - will be loaded dynamically
  const [quickResponses, setQuickResponses] = useState([
    "I want to find a grave",
    "What are the visiting hours for Garden of Memories?",
    "How much does a cemetery plot cost?",
    "What facilities and amenities are available?",
    "Tell me about the history of Garden of Memories Memorial Park",
    "What are the visiting policies and rules?",
    "How do I get directions to the park?"
  ]);
  
  // State to control quick questions visibility
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);

  // Load conversation from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('gravepath-guest-chat-history');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Load quick questions from API
  useEffect(() => {
    const fetchQuickQuestions = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/chatbot/config?userType=guest`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.quickQuestions) {
            const questions = data.data.quickQuestions.map(q => q.question);
            setQuickResponses(questions);
          }
        }
      } catch (error) {
        console.error('Error fetching quick questions:', error);
        // Keep default questions if API fails
      }
    };

    fetchQuickQuestions();
  }, []);

  // Save conversation to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('gravepath-guest-chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Clear conversation
  const clearConversation = () => {
    setMessages([createInitialMessage()]);
    localStorage.removeItem('gravepath-guest-chat-history');
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Helper to check lot availability
  const checkLotAvailability = async (lotId) => {
    try {
      // Use public endpoint for guests
      const response = await axios.get(`https://api.grave-path.com/api/public/lots`);
      const lots = response.data;
      // Find by id or name (case-insensitive)
      const lot = lots.find(l => 
        l.id?.toLowerCase() === lotId.toLowerCase() ||
        l.name?.toLowerCase() === lotId.toLowerCase()
      );
      if (!lot) return { found: false };
      // Consider reserved/taken/unavailable
      const unavailableStatuses = ['reserved', 'pending', 'active', 'occupied', 'unavailable', 'confirmed'];
      if (unavailableStatuses.includes(lot.status?.toLowerCase())) {
        return { found: true, available: false, status: lot.status, lot };
      }
      return { found: true, available: true, lot };
    } catch (err) {
      return { found: false, error: true };
    }
  };

  // Helper function to detect if input looks like a lot ID
  const looksLikeLotId = (input) => {
    const lotPatterns = [
      /^LOT-/i,                    // Starts with LOT-
      /^[A-Z]\d+$/i,              // Letter followed by numbers (A1, B2, etc.)
      /^[A-Z]+\d+$/i,             // Letters followed by numbers (ABC123)
      /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+/i, // Dash-separated codes
      /^Plot\s+[A-Z0-9]/i,        // "Plot A1", "Plot 123"
      /^Section\s+[A-Z0-9]/i      // "Section A", "Section 1"
    ];
    return lotPatterns.some(pattern => pattern.test(input.trim()));
  };

  // Secure API call through backend
  const sendMessageToOpenAI = async (userMessage, skipUserMessage = false) => {
    setIsLoading(true);

    try {
      const response = await fetch(`https://api.grave-path.com/api/chatbot/guest-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: [
            {
              role: 'system',
              content: `You are a helpful AI assistant for Garden of Memories Memorial Park. You are speaking to a GUEST USER who is not logged in. 

              IMPORTANT LIMITATIONS FOR GUESTS:
              - Guests CANNOT make reservations - always redirect them to create an account and log in for reservations
              - You can help with: grave locating, plot availability info, pricing, visiting hours, facilities, general information
              - If they ask about reservations, politely explain they need to create an account first

              Be warm, professional, and helpful while respecting these limitations.`
            },
            ...messages.slice(-5).map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          isGuest: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from chatbot');
      }

      const data = await response.json();
      
      // Add user message if not skipping
      if (!skipUserMessage) {
        setMessages(prev => [...prev, {
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString()
        }]);
      }

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add user message if not skipping
      if (!skipUserMessage) {
        setMessages(prev => [...prev, {
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString()
        }]);
      }

      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment, or contact our staff directly for assistance.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start grave locator flow
  const startGraveLocator = () => {
    setGraveLocatorMode(true);
    setGraveLocatorData({ lotName: '', lotId: '', foundLot: null });
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: "🔍 **Grave Locator Started**\n\nI'll help you find a grave or plot. Please provide the **name of the person** you're looking for, or if you know the **plot/lot number**, you can share that instead.\n\nExample: \"John Smith\" or \"Plot A-15\"",
      timestamp: new Date().toISOString()
    }]);
  };

  // Handle grave locator input
  const handleGraveLocatorInput = async (input) => {
    try {
      const response = await axios.get(`https://api.grave-path.com/api/public/lots/search-graves`, {
        params: { query: input }
      });
      
      if (response.data && response.data.length > 0) {
        const results = response.data.slice(0, 5); // Limit to 5 results
        let resultText = `🔍 **Found ${results.length} result(s):**\n\n`;
        
        results.forEach((result, index) => {
          resultText += `${index + 1}. **${result.deceased_name}**\n`;
          
          if (result.type === 'columbarium') {
            resultText += `   🏛️ Columbarium Building\n`;
            resultText += `   📍 Floor ${result.floor}, Section ${result.section}, Row ${result.row}, Column ${result.column}\n`;
            resultText += `   📦 Slot: ${result.slot_id}\n`;
            if (result.birth_date || result.death_date) {
              resultText += `   📅 ${result.birth_date ? new Date(result.birth_date).toLocaleDateString() : 'Unknown'} - ${result.death_date ? new Date(result.death_date).toLocaleDateString() : 'Unknown'}\n`;
            }
            resultText += `   🗺️ [Navigate to Columbarium](javascript:void(0))\n\n`;
            
            // Store the columbarium result for potential navigation
            window.columbariumSearchResult = result;
          } else {
            resultText += `   📍 Plot: ${result.lot_name || result.lot_id}\n`;
            if (result.birth_date || result.death_date) {
              resultText += `   📅 ${result.birth_date || 'Unknown'} - ${result.death_date || 'Unknown'}\n`;
            }
            resultText += `   🗺️ [View on Map](javascript:void(0))\n\n`;
          }
        });
        
        resultText += "Would you like me to show any of these locations on the map?";
        
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: resultText,
          timestamp: new Date().toISOString(),
          hasColumbariumResults: results.some(r => r.type === 'columbarium')
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "❌ I couldn't find any graves matching that name or plot number. \n\nPlease try:\n• Different spelling\n• First name only\n• Last name only\n• Plot/lot number if you know it\n\nOr visit our office for assistance with locating graves.",
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "❌ I'm having trouble searching right now. Please try again or visit our office for assistance.",
        timestamp: new Date().toISOString()
      }]);
    }
    
    setGraveLocatorMode(false);
  };

  // Handle columbarium navigation
  const handleColumbariumNavigation = () => {
    if (window.columbariumSearchResult) {
      eventBus.emit(EVENTS.COLUMBARIUM_SEARCH_NAVIGATE, window.columbariumSearchResult);
      // Navigate to map view
      navigate('/client/map');
    }
  };

  // Expose navigation functions to global scope for button clicks
  useEffect(() => {
    window.handleColumbariumNavigation = handleColumbariumNavigation;
    return () => {
      delete window.handleColumbariumNavigation;
    };
  }, []);

  // Handle send message
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userInput = inputMessage.trim();
    setInputMessage('');

    // Check if in grave locator mode
    if (graveLocatorMode) {
      await handleGraveLocatorInput(userInput);
      return;
    }

    // Check for grave locator keywords
    const isGraveLocator = graveLocatorKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isGraveLocator || looksLikeLotId(userInput)) {
      startGraveLocator();
      await handleGraveLocatorInput(userInput);
      return;
    }

    // Handle reservation requests by redirecting to login
    const reservationKeywords = ['reserve', 'reservation', 'book', 'booking', 'purchase', 'buy'];
    const isReservationRequest = reservationKeywords.some(keyword => 
      userInput.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isReservationRequest) {
      setMessages(prev => [...prev, 
        {
          role: 'user',
          content: userInput,
          timestamp: new Date().toISOString()
        },
        {
          role: 'assistant',
          content: "🔐 **Account Required for Reservations**\n\nTo make a plot reservation, you'll need to create an account and log in first. This ensures your reservation is properly linked to your information.\n\n**To get started:**\n1. Click the **Login** button in the top-right corner\n2. Select **Register** to create a new account\n3. Once logged in, you can make reservations through our system\n\nWould you like me to help you with anything else about our memorial park in the meantime?",
          timestamp: new Date().toISOString()
        }
      ]);
      return;
    }

    // Regular chat message
    await sendMessageToOpenAI(userInput);
  };

  // Handle quick responses
  const handleQuickResponse = async (responseText) => {
    setInputMessage('');
    
    // Hide quick questions after clicking one
    setShowQuickQuestions(false);
    
    if (responseText.toLowerCase().includes('find a grave')) {
      startGraveLocator();
      return;
    }
    
    await sendMessageToOpenAI(responseText);
  };

  // Features array for guest users (no reservations)
  const features = [
    {
      icon: <MapIcon size={24} />,
      title: "Visit Your Loved Ones",
      description: "Easily locate and navigate to grave sites with our interactive map.",
      action: () => {
        handleNavigate('map');
      },
      color: "#34c759"
    },
    {
      icon: <VisitorInfoIcon size={24} />,
      title: "Visitor Information", 
      description: "Learn about visiting hours, guidelines, and cemetery policies.",
      action: () => {
        handleVisitorInfo();
      },
      color: "#5856d6"
    },
    {
      icon: <BookingIcon size={24} />,
      title: "Plot Availability",
      description: "View available plots and pricing. Login required for reservations.",
      action: () => {
        handleNavigate('map');
      },
      color: "#007aff"
    },
    {
      icon: <ChatIcon size={24} />,
      title: "AI Assistant",
      description: "Get instant help and answers to your questions with our AI chatbot.",
      action: () => {
        setIsChatOpen(true);
      },
      color: "#ff9500"
    }
  ];

  return (
    <div className="home-page">
      <div className="background-container" />
      <img 
        src={process.env.PUBLIC_URL + '/background-pattern.svg'}
        alt=""
        className="background-svg"
      />
      <div className="welcome-section">
        <h1>Welcome to GravePath</h1>
        <p>Your compassionate guide to cemetery services</p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="feature-card"
            onClick={feature.action}
            style={{ '--hover-color': feature.color }}
          >
            <div className="butterfly">
              <img 
                src="/butterfly-transparent.gif" 
                alt="" 
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  objectFit: 'cover',
                  opacity: 0
                }}
              />
            </div>
            <div className="feature-icon" style={{ color: feature.color }}>
              {feature.icon}
            </div>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Floating Chat Button */}
      {!isChatOpen && (
        <button 
          className="floating-chat-button"
          onClick={() => setIsChatOpen(true)}
          title="Open AI Assistant"
        >
          <ChatIcon size={24} />
        </button>
      )}

      {/* Chatbot Modal */}
      {isChatOpen && (
        <div className="chatbot-overlay">
          <div className="chatbot-modal">
            <div className="chatbot-header">
              <div className="chatbot-title">
                <BotIcon size={20} />
                <span>Garden of Memories AI Assistant</span>
              </div>
              <div className="chatbot-header-actions">
                <button 
                  className="clear-chat-button"
                  onClick={clearConversation}
                  title="Clear conversation"
                >
                  <ClearIcon size={16} />
                </button>
                <button 
                  className="close-chat-button"
                  onClick={() => setIsChatOpen(false)}
                  title="Close chat"
                >
                  <CloseIcon size={16} />
                </button>
              </div>
            </div>

            <div className="chatbot-messages">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}>
                  <div className="message-icon">
                    {message.role === 'user' ? <UserIcon size={16} /> : <BotIcon size={16} />}
                  </div>
                  <div className="message-bubble">
                    <div 
                      className="message-content"
                      dangerouslySetInnerHTML={{ 
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\[Navigate to Columbarium\]\(javascript:void\(0\)\)/g, '<button class="columbarium-nav-btn" onclick="window.handleColumbariumNavigation && window.handleColumbariumNavigation()">Navigate to Columbarium</button>')
                          .replace(/\[View on Map\]\(javascript:void\(0\)\)/g, '<button class="map-nav-btn" onclick="window.handleMapNavigation && window.handleMapNavigation()">View on Map</button>')
                          .replace(/\n/g, '<br/>')
                      }}
                    />
                    <div className="message-timestamp">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="message bot-message">
                  <div className="message-icon">
                    <BotIcon size={16} />
                  </div>
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {showQuickQuestions ? (
              <div className="quick-responses">
                <div className="quick-responses-title">Quick Questions</div>
                <div className="quick-responses-grid">
                  {quickResponses.map((response, index) => (
                    <button
                      key={index}
                      className="quick-response-button"
                      onClick={() => handleQuickResponse(response)}
                      disabled={isLoading}
                    >
                      {response}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="show-quick-questions">
                <button 
                  className="show-quick-questions-btn"
                  onClick={() => setShowQuickQuestions(true)}
                  disabled={isLoading}
                >
                  💡 Show Quick Questions
                </button>
              </div>
            )}

            <div className="chatbot-input">
              <div className="chatbot-input-row">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about visiting hours, grave locations, or general information..."
                  disabled={isLoading}
                />
                <button 
                  type="submit" 
                  disabled={isLoading || !inputMessage.trim()} 
                  className="send-button"
                  onClick={handleSendMessage}
                  title="Send message"
                >
                  <SendIcon size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
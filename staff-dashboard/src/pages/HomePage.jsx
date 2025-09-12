import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
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

export default function HomePage() {
  const navigate = useNavigate();
  const { handleNavigate, handleVisitorInfo, handleBookingPill } = useOutletContext();
  const { token, role, user } = useContext(AuthContext);
  const messagesEndRef = useRef(null);
  
  // Helper function to decode token and get user info
  const getUserFromToken = () => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  };
  
  // Get user info from either user object or token
  const currentUser = user || getUserFromToken();
  
  // Create initial welcome message based on login status
  const createInitialMessage = () => {
    if (token && currentUser) {
      const userName = currentUser?.name || currentUser?.firstName || currentUser?.username || 'there';
      return {
        role: 'assistant',
        content: `Hello **${userName}**! 👋 I'm your personal Garden of Memories AI assistant. 🏛️\n\nSince you're logged in, I can help you with:\n• 📋 **Make plot reservations** (linked to your account)\n• 💰 Plot pricing and payment options\n• ⏰ Visiting hours and policies\n• 🏗️ Facilities and amenities\n• 📍 General park information\n\nWould you like to **reserve a plot** or do you have other questions about our memorial park? 😊`,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        role: 'assistant',
        content: '👋 Welcome to Garden of Memories! \n\n🔒 **Please log in first** to use the AI assistant for plot reservations.\n\nOnce logged in, I can help you with:\n• 📋 **Make plot reservations** (linked to your account)\n• 💰 Plot pricing and payment options\n• ⏰ Visiting hours and policies\n• 🏗️ Facilities and amenities\n• 📍 General park information\n\nPlease log in to get started! 😊',
        timestamp: new Date().toISOString()
      };
    }
  };

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([createInitialMessage()]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reservationMode, setReservationMode] = useState(false);
  const [reservationData, setReservationData] = useState({
    step: 'process_info',
    selectedLot: null,
    clientName: '',
    clientContact: '',
    clientEmail: '',
    paymentMethod: '',
    lotName: '',
    reservationId: null
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Add grave locator keywords - make more comprehensive
  const graveLocatorKeywords = [
    'find grave', 'locate grave', 'find someone', 'locate someone', 'grave locator', 
    'find plot', 'locate plot', 'find lot', 'locate lot', 'where is', 'search for',
    'looking for', 'find my', 'locate my'
  ];

  // Add grave locator state
  const [graveLocatorMode, setGraveLocatorMode] = useState(false);
  const [graveLocatorData, setGraveLocatorData] = useState({ lotName: '', lotId: '', foundLot: null });

  // Quick response buttons - will be loaded dynamically
  const [quickResponses, setQuickResponses] = useState([
    "I want to make a reservation",
    "I want to find a grave",
    "What are the visiting hours for Garden of Memories?",
    "How much does a cemetery plot cost?",
    "What facilities and amenities are available?",
    "Tell me about the history of Garden of Memories Memorial Park",
    "What are the visiting policies and rules?"
  ]);

  // Load conversation from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('gravepath-chat-history');
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/chatbot/config?userType=client`);
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
      localStorage.setItem('gravepath-chat-history', JSON.stringify(messages));
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
    localStorage.removeItem('gravepath-chat-history');
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
      // Use client endpoint for users
      const endpoint = role === 'client' ? 'client' : 'staff';
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/${endpoint}/lots`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: [
            {
              role: 'system',
              content: `You are a helpful AI assistant for Garden of Memories Memorial Park in Pateros, Philippines. You provide accurate information about our specific cemetery services and facilities. You can also help visitors with plot reservations through our interactive booking system.

CRITICAL: DO NOT handle grave location requests or lot ID searches directly! If users ask to find graves, locate plots, or provide lot IDs, redirect them to use the built-in tools.

GARDEN OF MEMORIES MEMORIAL PARK INFORMATION:

🏛️ HISTORY & ESTABLISHMENT:
- Founded: January 1978 under TAPAT Park Developers, Inc.
- Established by: Engr. Tomas Sanchez Jr.
- Location: Pateros, Philippines
- Started operations: July 1978
- Initial capital: ₱25 million
- Founded to address overcrowded and unsightly conditions of local cemeteries
- 40th Anniversary: 2018, with new Columbarium and Chapel Complex
- Recognition: One of the premier memorial parks in the Philippines

⏰ OPERATING HOURS:
- Monday – Friday: 9:00 AM – 5:00 PM
- Saturday – Sunday: 10:00 AM – 4:00 PM
- Holidays: 10:00 AM – 2:00 PM

📋 VISITING POLICIES:
- Please check in at the reception area upon arrival
- Maintain silence and respect for other visitors
- No outside food and drinks allowed within the grounds
- Keep the premises clean at all times
- Follow designated pathways
- Photography requires permission from management

🏗️ FACILITIES & AMENITIES:
- Memorial Church: Peaceful sanctuary for prayer and reflection
- Memorial Garden: Beautifully landscaped gardens for quiet contemplation
- Memorial Chapel: Intimate space for private ceremonies
- Fountain Plaza: Serene water feature with seating areas
- Parking Area: Spacious parking facility with 24/7 security
- Columbarium: Modern facility for cremated remains
- Chapel Complex: Full-service facility for memorial services

💰 PLOT PRICING & SERVICES:
- Standard plot size: 12.5 square meters
- Base price: ₱4,000 per square meter
- Total plot price: Starting from ₱50,000
- Reservation fee: 10% of total plot price (required to secure plot)
- Payment methods: Cash, GCash, Bank Transfer
- Reservation policy: 10% deposit required, full payment within 30 days
- Cancellation: Must be made 7 days before scheduled service

📞 CONTACT & LOCATION:
- Location: Pateros, Philippines

🚨 GRAVE LOCATION REQUESTS - CRITICAL INSTRUCTIONS:
- DO NOT handle grave location or plot finding requests
- DO NOT ask for deceased names or lot information  
- DO NOT try to help locate specific graves
- INSTEAD: Direct users to use the built-in grave locator by saying "Please use the 'I want to find a grave' quick button or say exactly 'I want to find a grave' to use our built-in grave locator tool."

📝 RESERVATION SERVICES - CRITICAL INSTRUCTIONS:

⚠️ NEVER tell users to email payment proof to any email address!
⚠️ ALWAYS direct users to use the built-in reservation system with file upload!

WHEN USERS ASK ABOUT RESERVATIONS, PAYMENTS, OR BOOKING:
1. IMMEDIATELY offer to start the reservation process: "I can help you make a reservation right now!"
2. DO NOT give generic payment information
3. DO NOT mention emailing proof to any email address  
4. ALWAYS use the reservation flow that includes file upload

YOUR RESERVATION CAPABILITIES:
- YOU CAN create complete plot reservations through this chatbot
- YOU CAN collect all personal and payment information
- YOU CAN guide users through online payment (GCash/Bank Transfer)
- YOU CAN enable users to upload payment proof directly in this chat
- Reservations create pending entries for admin review with attached proof files

PAYMENT PROOF PROCESS:
- After reservation: User pays online (GCash/Bank Transfer)
- Then: User uploads proof file directly in this chatbot (NOT email!)
- Admin sees: Pending reservation with attached proof file for review

NEVER MENTION:
- Emailing proof to reservations@gardenofmemories.ph
- Sending screenshots to any email
- Manual email submission processes

ALWAYS SAY:
- "I'll help you make a reservation right now!"
- "You can upload your payment proof directly here after payment"
- "The admin will see your proof file attached to your reservation"

🌿 SPECIAL FEATURES:
- Employee welfare programs
- Continuous facility expansion
- Professional landscaping and maintenance
- Community-focused memorial services

Always be compassionate, respectful, and professional. Provide specific information about Garden of Memories when available. For grave location requests, always redirect to the built-in tools.`
            },
            ...messages,
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();
      
      // Add assistant response with timestamp
      const assistantMessageObj = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessageObj]);
    } catch (error) {
      console.error('Error calling chatbot API:', error);
      const errorMessageObj = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble connecting right now. Please try again later or contact our staff directly for assistance.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add grave locator handler
  const startGraveLocator = () => {
    console.log('Starting grave locator mode');
    // Clear any existing reservation mode
    setReservationMode(false);
    setReservationData({ 
      step: 'process_info', 
      selectedLot: null, 
      clientName: '', 
      clientContact: '', 
      clientEmail: '', 
      paymentMethod: '', 
      lotName: '',
      reservationId: null
    });
    
    // Set grave locator mode
    setGraveLocatorMode(true);
    setGraveLocatorData({ lotName: '', lotId: '', foundLot: null });
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `🪦 **Grave Locator**\n\nPlease enter the **lot name or ID** of the grave/plot you want to find.\n\nExample: "A1", "Garden Section B2", "Plot 123"`,
      timestamp: new Date().toISOString(),
      isGraveLocator: true
    }]);
  };

  const handleGraveLocatorInput = async (input) => {
    console.log('Handling grave locator input:', input);
    const lotInput = input.trim();
    setIsLoading(true);
    const result = await checkLotAvailability(lotInput);
    setIsLoading(false);
    if (!result.found) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Sorry, I couldn't find a plot with ID or name "${lotInput}".\n\nPlease check the plot ID and try again, or type "exit" to cancel.`,
        timestamp: new Date().toISOString(),
        isGraveLocator: true
      }]);
      return;
    }
    setGraveLocatorData({ lotName: lotInput, lotId: result.lot?._id || result.lot?.id || lotInput, foundLot: result.lot });
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `✅ **Plot found!**\n\n**Lot Name/ID:** ${lotInput}\n**Status:** ${result.lot?.status || 'Available'}\n\nWould you like to **view this plot on the map with navigation**? (yes/no)`,
      timestamp: new Date().toISOString(),
      isGraveLocator: true
    }]);
  };

  const handleGraveLocatorStep = async (input) => {
    console.log('Handling grave locator step:', input, 'graveLocatorMode:', graveLocatorMode);
    const answer = input.trim().toLowerCase();
    
    // Handle exit commands
    if ([
      'exit', 'cancel', 'quit', 'stop', 'back', 'nevermind', 'never mind'
    ].some(k => answer.includes(k))) {
      setGraveLocatorMode(false);
      setGraveLocatorData({ lotName: '', lotId: '', foundLot: null });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `✅ **Grave locator cancelled.**\n\nYou can start again anytime by saying "I want to find a grave".`,
        timestamp: new Date().toISOString()
      }]);
      return;
    }
    

    // Check if we're expecting a yes/no response (lot already searched)
    if (graveLocatorData.lotName || graveLocatorData.lotId) {
      if (answer === 'yes' || answer === 'y') {
        setGraveLocatorMode(false);
        const lotIdToNavigate = graveLocatorData.lotId || graveLocatorData.lotName;
        setGraveLocatorData({ lotName: '', lotId: '', foundLot: null });
        
        // Navigate to map with state containing the lot ID
        navigate('/client/map', { 
          state: { selectedLotId: lotIdToNavigate }
        });
        return;
      } else if (answer === 'no' || answer === 'n') {
        setGraveLocatorMode(false);
        setGraveLocatorData({ lotName: '', lotId: '', foundLot: null });
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `No problem! If you need to find another grave or plot, just let me know.`,
          timestamp: new Date().toISOString(),
          isGraveLocator: true
        }]);
        return;
      } else {
        // Invalid response when we're expecting yes/no
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Please answer **yes** to view the plot on the map, or **no** to cancel.`,
          timestamp: new Date().toISOString(),
          isGraveLocator: true
        }]);
        return;
      }
    }
    
    // If no lot found yet, search for the lot
    await handleGraveLocatorInput(input);
  };

  // Update handleSendMessage to check for grave locator
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    
    // Add user message first
    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    console.log('handleSendMessage:', messageText, 'reservationMode:', reservationMode, 'graveLocatorMode:', graveLocatorMode);
    
    // Handle reservation mode FIRST (before grave locator)
    if (reservationMode) {
      console.log('Processing reservation mode input');
      // User message already added above
      
      if (reservationData.step === 'process_info' && (messageText.toLowerCase().includes('yes') || messageText.toLowerCase().includes('start'))) {
        handleReservationStep('start_booking');
        return;
      }
      
      const processed = processReservationInput(messageText);
      if (processed) return;
      
      // If not processed, handle as general question
      setReservationMode(false);
      setReservationData({ step: 'process_info', selectedLot: null, clientName: '', clientContact: '', clientEmail: '', paymentMethod: '', lotName: '' });
      
      // For fallback to AI chat, call sendMessageToOpenAI (user message already added)
      await sendMessageToOpenAI(messageText);
      return;
    }
    
    // Handle grave locator mode SECOND
    if (graveLocatorMode) {
      console.log('Processing grave locator mode input');
      await handleGraveLocatorStep(messageText);
      return;
    }
    
    // Check for grave locator keywords OR if input looks like a lot ID (ONLY if not in reservation mode)
    const triggerGraveLocator = graveLocatorKeywords.some(keyword => 
      messageText.toLowerCase().includes(keyword)
    ) || looksLikeLotId(messageText);

    if (triggerGraveLocator) {
      console.log('Triggering grave locator for:', messageText);
      // If it looks like a lot ID, start grave locator and process it immediately
      if (looksLikeLotId(messageText)) {
        setGraveLocatorMode(true);
        setGraveLocatorData({ lotName: '', lotId: '', foundLot: null });
        await handleGraveLocatorInput(messageText);
      } else {
        // Otherwise, start grave locator and ask for lot ID
        startGraveLocator();
      }
      return;
    }
    
    // Check if user wants to start reservation process (even in regular chat)
    const reservationKeywords = ['reservation', 'reserve', 'book', 'booking', 'plot', 'make a reservation'];
    const startsReservation = reservationKeywords.some(keyword => 
      messageText.toLowerCase().includes(keyword)
    );
    
    if (startsReservation) {
      console.log('Starting reservation process');
      // Start reservation process instead of sending to AI (user message already added above)
      startReservationProcess();
      return;
    }
    
    // For regular AI chat, call sendMessageToOpenAI (user message already added)
    await sendMessageToOpenAI(messageText);
  };

  // Handle quick response button clicks
  const handleQuickResponse = async (responseText) => {
    if (isLoading) return;
    
    // Add the quick response as a user message first
    const userMessage = {
      role: 'user',
      content: responseText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Check if user wants to make a reservation
    if (responseText.toLowerCase().includes('reservation')) {
      startReservationProcess();
      return;
    }
    
    // Check if user wants to find a grave
    if (responseText.toLowerCase().includes('find a grave') || responseText.toLowerCase().includes('find grave')) {
      startGraveLocator();
      return;
    }
    
    // Call AI without adding the user message again (since we already added it above)
    await sendMessageToOpenAI(responseText, true);
  };

  // Start reservation process - simplified
  const startReservationProcess = () => {
    if (!token) {
      const loginMessage = {
        role: 'assistant',
        content: '🔒 **Please log in first** to make a reservation.\n\nYou need to be logged in so that:\n• Your reservation is linked to your account\n• You can view and manage your reservations\n• We can send confirmations to your verified email\n\nPlease log in and try again! 😊',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, loginMessage]);
      return;
    }
    
    console.log('Starting reservation process - clearing grave locator mode');
    // Clear any existing grave locator mode
    setGraveLocatorMode(false);
    setGraveLocatorData({ lotName: '', lotId: '', foundLot: null });
    
    // Set reservation mode
    setReservationMode(true);
    // Pre-fill user data from the logged-in account
    setReservationData({ 
      step: 'lot_name', 
      selectedLot: null, 
      clientName: currentUser?.name || currentUser?.firstName || currentUser?.username || '', 
      clientContact: currentUser?.email || currentUser?.contact || currentUser?.phone || '', 
      clientEmail: currentUser?.email || '',
      paymentMethod: '',
      lotName: ''
    });
    
    const lotNameMessage = {
      role: 'assistant',
              content: `🏡 **Let's create your reservation, ${currentUser?.name || currentUser?.firstName || currentUser?.username || 'there'}!**

**Step 1 of 4: Plot Selection**

Please provide the **lot/plot ID** you would like to reserve.

Examples: "A1", "B2", "Garden Section C5", "Plot 123"

What plot would you like to reserve?

💡 *Type "exit" anytime to cancel the reservation process.*`,
      timestamp: new Date().toISOString(),
      isReservation: true
    };
    
    setMessages(prev => [...prev, lotNameMessage]);
  };

  // Handle reservation steps
  const handleReservationStep = async (action, data = null) => {
    if (action === 'start_booking') {
      setReservationData(prev => ({ ...prev, step: 'lot_name' }));
      
      const lotNameMessage = {
        role: 'assistant',
        content: `Great! Let's start your reservation. 🏡\n\n**Step 1 of 4: Plot Selection**\n\nPlease provide the **lot/plot name or ID** you would like to reserve.\n\nFor example:\n- "Plot A1"\n- "Garden Section B2"\n- "Memorial Area C5"\n\nWhat plot would you like to reserve?\n\n💡 *Type "exit" anytime to cancel the reservation process.*`,
        timestamp: new Date().toISOString(),
        isReservation: true
      };
      
      setMessages(prev => [...prev, lotNameMessage]);
    }
    
    if (action === 'collect_name') {
      setReservationData(prev => ({ ...prev, step: 'client_name' }));
      
      const nameMessage = {
        role: 'assistant',
        content: `Perfect! You want to reserve **${reservationData.lotName}**. ✅\n\n**Step 2 of 4: Personal Information**\n\nPlease provide your **complete full name** as it should appear on the reservation documents.\n\nExample: "Juan Carlos Dela Cruz"\n\n💡 *Type "exit" anytime to cancel the reservation process.*`,
        timestamp: new Date().toISOString(),
        isReservation: true
      };
      
      setMessages(prev => [...prev, nameMessage]);
    }
    
    if (action === 'complete_reservation') {
      setIsLoading(true);
      try {
        const userId = currentUser?.id || currentUser?._id;
        
        const requestData = {
          lotId: reservationData.lotName,
          lotName: reservationData.lotName,
          clientName: reservationData.clientName,
          clientContact: reservationData.clientContact,
          clientEmail: reservationData.clientEmail,
          paymentMethod: data?.paymentMethod || reservationData.paymentMethod,
          userId: userId,
          userToken: token
        };
        
        const response = await fetch(`${process.env.REACT_APP_API_URL}/chatbot/create-reservation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          const actualLotFound = result.reservation?.actualLotFound;
          const pendingMessage = {
            role: 'assistant',
            content: `📋 **Reservation Details Saved**\n\n**📋 Reservation Summary:**\n- **Plot**: ${reservationData.lotName}${actualLotFound ? ' ✅ (Found in system)' : ' ⚠️ (Manual verification needed)'}\n- **Name**: ${reservationData.clientName}\n- **Email**: ${reservationData.clientEmail}\n- **Contact**: ${reservationData.clientContact}\n- **Payment Method**: ${reservationData.paymentMethod}\n- **Reservation Fee**: ₱${result.reservation?.reservationFee?.toLocaleString() || '5,000'}\n- **Status**: ⚠️ **PENDING PAYMENT PROOF UPLOAD**\n\n**💳 ONLINE PAYMENT - Make Payment Now:**\n\n${reservationData.paymentMethod === 'GCash' ? `**📱 GCash Payment:**\n• Send ₱${result.reservation?.reservationFee?.toLocaleString() || '5,000'} to: 09171234567 (Maria Santos)\n• Reference: ${reservationData.lotName} - ${reservationData.clientName}\n• After payment: Take screenshot and upload below` : reservationData.paymentMethod === 'Bank Transfer' ? `**🏦 Bank Transfer:**\n• Account: BPI 1234-5678-90 (Garden of Memories)\n• Amount: ₱${result.reservation?.reservationFee?.toLocaleString() || '5,000'}\n• Reference: ${reservationData.lotName} - ${reservationData.clientName}\n• After payment: Take photo of receipt and upload below` : `**💵 Cash Payment:**\n• Visit our office: Garden of Memories, Pateros\n• Hours: Mon-Fri 9AM-5PM, Weekends 10AM-4PM\n• Amount: ₱${result.reservation?.reservationFee?.toLocaleString() || '5,000'}\n• After payment: Take photo of receipt and upload below`}\n\n⚠️ **Your reservation is NOT complete until you upload payment proof!**`,
            timestamp: new Date().toISOString(),
            isReservation: true
          };
          setMessages(prev => [...prev, pendingMessage]);
          
          // Store reservation ID for file upload
          setReservationData(prev => ({ 
            ...prev, 
            step: 'upload_proof',
            reservationId: result.reservation.id
          }));
          
          // Ask for payment proof upload
          setTimeout(() => {
            const proofMessage = {
              role: 'assistant',
              content: `📎 **Step 2: Upload Payment Proof**\n\n✅ **After making your payment**, upload your proof here:\n\n**📱 For GCash:** Screenshot showing:\n• Transaction successful\n• Amount sent\n• Reference number\n• Recipient details\n\n**🏦 For Bank Transfer:** Photo of:\n• Deposit slip or receipt\n• Transaction details\n• Amount and reference\n\n**💵 For Cash:** Photo of:\n• Official receipt from our office\n• Payment details\n\n**Accepted formats:** JPG, PNG, PDF (Max 5MB)\n\n👇 **Click the green button below to upload!** 👇`,
              timestamp: new Date().toISOString(),
              isReservation: true,
              requiresFileUpload: true
            };
            setMessages(prev => [...prev, proofMessage]);
          }, 1000);
        } else {
          const errorMessage = {
            role: 'assistant',
            content: `I apologize, but there was an issue processing your reservation: ${result.error}\n\nPlease try again or contact our staff directly for assistance.`,
            timestamp: new Date().toISOString(),
            isReservation: true
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        const errorMessage = {
          role: 'assistant',
          content: 'I\'m having trouble processing your reservation right now. Please try again later or contact our staff directly.',
          timestamp: new Date().toISOString(),
          isReservation: true
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      setIsLoading(false);
    }
  };

  // Handle file upload for payment proof
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload a JPG, PNG, or PDF file.');
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }
      
      setSelectedFile(file);
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file) => {
    if (!reservationData.reservationId) {
      alert('No reservation found. Please create a reservation first.');
      return;
    }

    setUploadingFile(true);
    
    try {
      const formData = new FormData();
      formData.append('proofImage', file);
      formData.append('reservationId', reservationData.reservationId);
      
      // If it's a temporary upload, add flag
      if (reservationData.reservationId.startsWith('temp-upload-')) {
        formData.append('isTemporary', 'true');
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/chatbot/upload-proof`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Check if email was mentioned in the response message
        const emailStatus = result.message && result.message.includes('email') 
          ? '📧 **Confirmation email sent to your address!**' 
          : '📧 **Email notification may be delayed** (check spam folder)';
        
        const successUploadMessage = {
          role: 'assistant',
          content: `🎉 **RESERVATION SUCCESSFULLY CREATED!**\n\n✅ **Payment Proof Uploaded Successfully!**\n\n📎 **File:** ${file.name}\n📅 **Uploaded:** ${new Date().toLocaleTimeString()}\n\n🎊 **Your reservation is now COMPLETE and confirmed!**\nYour payment proof has been submitted and your reservation is now complete. Our staff will review your payment and contact you within 24 hours.\n\n**Next Steps:**\n1. ✅ Payment proof submitted (COMPLETED)\n2. ⏳ Staff will verify payment within 24 hours\n3. 📞 You'll receive a confirmation call\n4. 📧 Final documentation will be emailed\n\n${emailStatus}\n\nThank you for choosing Garden of Memories Memorial Park! 🏛️✨`,
          timestamp: new Date().toISOString(),
          isReservation: true
        };
        setMessages(prev => [...prev, successUploadMessage]);
        
        // Reset reservation state
        setReservationMode(false);
        setReservationData({ 
          step: 'process_info', 
          selectedLot: null, 
          clientName: '', 
          clientContact: '', 
          clientEmail: '', 
          paymentMethod: '', 
          lotName: '',
          reservationId: null
        });
        setSelectedFile(null);
      } else {
        // Check if it's an email-related error
        const isEmailError = result.emailError || result.error?.toLowerCase().includes('email');
        
        const errorUploadMessage = {
          role: 'assistant',
          content: isEmailError 
            ? `❌ **Reservation Failed - Email Issue**\n\n${result.error}\n\n**What happened:**\n• Your payment proof was uploaded\n• But the confirmation email could not be sent\n• The reservation has been automatically cancelled\n• The lot is now available again\n\n**To fix this:**\n1. Check your email address is correct\n2. Try the reservation process again with a valid email\n\n**Need help?** Contact our staff directly.`
            : `❌ **Upload Failed**\n\nSorry, there was an error uploading your payment proof: ${result.error}\n\nPlease try again or contact our staff directly.`,
          timestamp: new Date().toISOString(),
          isReservation: true
        };
        setMessages(prev => [...prev, errorUploadMessage]);
      }
    } catch (error) {
      const errorUploadMessage = {
        role: 'assistant',
        content: `❌ **Upload Failed**\n\nThere was a network error uploading your payment proof. Please try again or contact our staff directly.`,
        timestamp: new Date().toISOString(),
        isReservation: true
      };
      setMessages(prev => [...prev, errorUploadMessage]);
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle exit from reservation process
  const exitReservationProcess = () => {
    setReservationMode(false);
    setReservationData({ 
      step: 'process_info', 
      selectedLot: null, 
      clientName: '', 
      clientContact: '', 
      clientEmail: '', 
      paymentMethod: '', 
      lotName: '',
      reservationId: null
    });
    
    const exitMessage = {
      role: 'assistant',
      content: `✅ **Reservation process cancelled.**\n\nNo worries! You can start a new reservation anytime by saying "I want to make a reservation" or asking any other questions about Garden of Memories.\n\nHow else can I help you today? 😊`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, exitMessage]);
  };

  // Process reservation inputs
  const processReservationInput = async (userInput) => {
    const input = userInput.trim();
    
    // Check for exit commands
    const exitKeywords = ['exit', 'cancel', 'quit', 'stop', 'abort', 'back', 'nevermind', 'never mind'];
    const wantsToExit = exitKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
    
    if (wantsToExit) {
      exitReservationProcess();
      return true;
    }
    
    if (reservationData.step === 'lot_name') {
      // Check lot availability before proceeding
      setIsLoading(true);
      const result = await checkLotAvailability(input);
      setIsLoading(false);
      if (!result.found) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Sorry, I couldn't find a plot with ID or name "${input}".\n\nPlease check the plot ID and try again, or type "exit" to cancel.`,
          timestamp: new Date().toISOString(),
          isReservation: true
        }]);
        return true;
      }
      if (!result.available) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ Sorry, plot **${input}** is currently **${result.status || 'unavailable'}** and cannot be reserved.\n\nPlease enter a different plot ID, or type "exit" to cancel.`,
          timestamp: new Date().toISOString(),
          isReservation: true
        }]);
        return true;
      }
      setReservationData(prev => ({ ...prev, lotName: input }));
      handleReservationStep('collect_name');
      return true;
    }
    
    if (reservationData.step === 'client_name') {
      setReservationData(prev => ({ ...prev, clientName: input }));
      const contactMessage = {
        role: 'assistant',
        content: `Thank you, **${input}**! ✅\n\n**Step 3 of 4: Contact Information**\n\nPlease provide your **email address or phone number** for important updates about your reservation.\n\nExamples:\n• Email: "juan.delacruz@email.com"\n• Phone: "09171234567"\n\n💡 *Type "exit" anytime to cancel the reservation process.*`,
        timestamp: new Date().toISOString(),
        isReservation: true
      };
      setMessages(prev => [...prev, contactMessage]);
      setReservationData(prev => ({ ...prev, step: 'client_contact' }));
      return true;
    }
    
    if (reservationData.step === 'client_contact') {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^(\+63|0)?[0-9]{10,11}$/;
      
      if (!emailRegex.test(input) && !phoneRegex.test(input)) {
        const invalidContactMessage = {
          role: 'assistant',
          content: `❌ **Invalid contact format**\n\nPlease provide a valid email address or phone number:\n\n**Valid email example:** "juan.delacruz@email.com"\n**Valid phone example:** "09171234567"\n\n💡 *Type "exit" anytime to cancel the reservation process.*`,
          timestamp: new Date().toISOString(),
          isReservation: true
        };
        setMessages(prev => [...prev, invalidContactMessage]);
        return true;
      }
      
      // Set both clientContact and clientEmail to the same value to match BookingForm behavior
      setReservationData(prev => ({ ...prev, clientContact: input, clientEmail: input }));
      const paymentMessage = {
        role: 'assistant',
        content: `Perfect! Contact saved: **${input}** ✅\n\n**Step 4 of 4: Payment Method**\n\nChoose your payment method for the **₱5,000 reservation fee**:\n\n**1. GCash** - Mobile payment\n**2. Bank Transfer** - Bank deposit\n**3. Cash** - Office payment\n\nType: **"GCash"**, **"Bank Transfer"**, or **"Cash"**\n\n💡 *Type "exit" anytime to cancel the reservation process.*`,
        timestamp: new Date().toISOString(),
        isReservation: true
      };
      setMessages(prev => [...prev, paymentMessage]);
      setReservationData(prev => ({ ...prev, step: 'payment_method' }));
      return true;
    }
    
    if (reservationData.step === 'payment_method') {
      const method = input.toLowerCase();
      if (method.includes('cash') || method.includes('gcash') || method.includes('bank')) {
        const selectedMethod = method.includes('gcash') ? 'GCash' : 
                              method.includes('bank') ? 'Bank Transfer' : 'Cash';
        
        setReservationData(prev => ({ ...prev, paymentMethod: selectedMethod }));
        handleReservationStep('complete_reservation', { paymentMethod: selectedMethod });
        return true;
      } else {
        const invalidMessage = {
          role: 'assistant',
          content: `Please choose a valid payment method: **"GCash"**, **"Bank Transfer"**, or **"Cash"**\n\n💡 *Type "exit" anytime to cancel the reservation process.*`,
          timestamp: new Date().toISOString(),
          isReservation: true
        };
        setMessages(prev => [...prev, invalidMessage]);
        return true;
      }
    }
    
    return false;
  };

  const features = [
    {
      icon: <MapIcon size={24} />,
      title: "Visit Your Loved Ones",
      description: "Easily locate and navigate to grave sites with our interactive map.",
      action: () => {
        handleNavigate('map');
        navigate('/client/map');
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
      title: "Reserve a Plot",
      description: "Browse available plots and make reservations for your future needs.",
      action: () => {
        handleBookingPill('availability');
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
                  <ClearIcon size={18} />
                </button>
                <button 
                  className="close-chat-button"
                  onClick={() => setIsChatOpen(false)}
                >
                  <CloseIcon size={20} />
                </button>
              </div>
            </div>
            
            <div className="chatbot-messages">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message ${message.role === 'user' ? 'user-message' : 'bot-message'}`}
                >
                  <div className="message-icon">
                    {message.role === 'user' ? <UserIcon size={16} /> : <BotIcon size={16} />}
                  </div>
                  <div className="message-bubble">
                    <div className="message-content">
                      {message.content}
                    </div>
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
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Response Buttons */}
            {!isLoading && messages.length <= 1 && (
              <div className="quick-responses">
                <div className="quick-responses-title">Quick questions:</div>
                <div className="quick-responses-grid">
                  {quickResponses.map((response, index) => (
                    <button
                      key={index}
                      className="quick-response-button"
                      onClick={() => handleQuickResponse(response)}
                    >
                      {response}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <form className="chatbot-input" onSubmit={handleSendMessage}>
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                style={{ display: 'none' }}
              />
              
              {/* Show file upload button when in upload mode OR when last message asks for upload */}
              {(reservationData.step === 'upload_proof' || 
                (messages.length > 0 && 
                 messages[messages.length - 1]?.role === 'assistant' && 
                 messages[messages.length - 1]?.content.toLowerCase().includes('upload') &&
                 messages[messages.length - 1]?.content.toLowerCase().includes('proof'))) && (
                <button
                  type="button"
                  className="file-upload-button"
                  onClick={() => {
                    if (!reservationData.reservationId) {
                      // If no reservation ID, create a temporary one for testing
                      setReservationData(prev => ({ 
                        ...prev, 
                        step: 'upload_proof',
                        reservationId: 'temp-upload-' + Date.now()
                      }));
                    }
                    fileInputRef.current?.click();
                  }}
                  disabled={uploadingFile}
                >
                  {uploadingFile ? (
                    <>📤 Uploading...</>
                  ) : (
                    <>📎 Upload Payment Proof</>
                  )}
                </button>
              )}
              
              <div className="chatbot-input-row">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    reservationData.step === 'upload_proof' 
                      ? "Upload your payment proof using the button above..." 
                      : "Type your message here..."
                  }
                  disabled={isLoading || reservationData.step === 'upload_proof'}
                />
                <button 
                  type="submit" 
                  disabled={!inputMessage.trim() || isLoading || reservationData.step === 'upload_proof'}
                  className="send-button"
                >
                  <SendIcon size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
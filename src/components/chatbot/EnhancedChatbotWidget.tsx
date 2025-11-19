'use client';

/**
 * Widget chatbot amélioré avec toutes les fonctionnalités avancées
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Trash2,
  History,
  BarChart3,
  Settings,
  Sparkles,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { chatbotService, Message, Conversation } from '@/lib/api/services/chatbot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { getChatbotActionExecutor } from '@/services/chatbotActionExecutor';
import MessageFeedback from './MessageFeedback';
import ConversationHistory from './ConversationHistory';
import ChatbotAnalytics from './ChatbotAnalytics';

type ViewMode = 'chat' | 'history' | 'analytics';

interface EnhancedChatbotWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedChatbotWidget({ isOpen, onClose }: EnhancedChatbotWidgetProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Suggestions par défaut
  const defaultSuggestions = [
    "Quel est mon emploi du temps aujourd'hui ?",
    "Quels cours sont disponibles ?",
    "Y a-t-il des conflits d'horaire ?",
    "Combien de salles sont disponibles ?",
  ];

  // Initialiser l'executor avec le router
  useEffect(() => {
    getChatbotActionExecutor(router);
  }, [router]);

  useEffect(() => {
    if (isOpen && viewMode === 'chat') {
      loadActiveConversation();
    }
  }, [isOpen, viewMode]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadActiveConversation = async () => {
    try {
      const conversation = await chatbotService.getActiveConversation();
      if (conversation) {
        setConversationId(conversation.id);
        setMessages(conversation.messages || []);
        setShowSuggestions(false);
      } else {
        // Nouvelle conversation
        setMessages([
          {
            id: 0,
            conversation: 0,
            sender: 'bot',
            content: "Bonjour ! 👋 Je suis l'assistant intelligent OAPET.\n\nJe peux vous aider avec :\n• Emplois du temps\n• Cours et matières\n• Salles et équipements\n• Enseignants\n• Statistiques\n• Détection de conflits\n\nPosez-moi une question ou choisissez parmi les suggestions ci-dessous !",
            timestamp: new Date().toISOString(),
          },
        ]);
        setSuggestedQuestions(defaultSuggestions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const userMessage = messageText || inputMessage.trim();

    if (!userMessage || isLoading) return;

    setInputMessage('');
    setIsLoading(true);
    setShowSuggestions(false);

    const tempUserMessage: Message = {
      id: Date.now(),
      conversation: conversationId || 0,
      sender: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await chatbotService.sendMessage({
        message: userMessage,
        conversation_id: conversationId || undefined,
      });

      setConversationId(response.conversation_id);

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        response.user_message,
        response.bot_response,
      ]);

      // Mettre à jour les suggestions si disponibles
      if (response.bot_response.context_data?.suggestions) {
        setSuggestedQuestions(response.bot_response.context_data.suggestions);
        setShowSuggestions(true);
      }

      // Exécuter les actions UI si présentes
      if (response.bot_response.attachments) {
        const executor = getChatbotActionExecutor(router);

        response.bot_response.attachments.forEach((attachment: any) => {
          if (attachment.type === 'ui_action') {
            console.log('[EnhancedChatbotWidget] Exécution action UI:', attachment.action);

            const success = executor.executeAction(attachment);

            if (success) {
              addToast({
                title: 'Action exécutée',
                description: 'L\'action a été exécutée avec succès',
              });
            } else {
              console.warn('[EnhancedChatbotWidget] Échec exécution action:', attachment.action);
            }
          }
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      addToast({
        title: 'Erreur',
        description: 'Impossible d envoyer le message. Veuillez reessayer.',
        variant: 'destructive',
      });

      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      setInputMessage(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (id: number) => {
    if (id === 0) {
      // Nouvelle conversation
      setConversationId(null);
      setMessages([]);
      setViewMode('chat');
      loadActiveConversation();
    } else {
      // Charger une conversation existante
      try {
        const conversation = await chatbotService.getConversation(id);
        setConversationId(conversation.id);
        setMessages(conversation.messages || []);
        setViewMode('chat');
        setShowSuggestions(false);
      } catch (error) {
        addToast({
          title: 'Erreur',
          description: 'Impossible de charger la conversation.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique ?')) return;

    try {
      if (conversationId) {
        await chatbotService.deleteConversation(conversationId);
      }
      setMessages([]);
      setConversationId(null);
      loadActiveConversation();
      addToast({
        title: 'Historique supprime',
        description: 'L historique a ete supprime avec succes.',
      });
    } catch (error) {
      addToast({
        title: 'Erreur',
        description: 'Impossible de supprimer l historique.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCurrentConversation = async () => {
    if (!conversationId) return;

    if (!confirm('Supprimer cette conversation ?')) return;

    try {
      await chatbotService.deleteConversation(conversationId);
      setMessages([]);
      setConversationId(null);
      loadActiveConversation();
      addToast({
        title: 'Conversation supprimee',
        description: 'La conversation a ete supprimee avec succes.',
      });
    } catch (error) {
      addToast({
        title: 'Erreur',
        description: 'Impossible de supprimer la conversation.',
        variant: 'destructive',
      });
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setViewMode('chat');
    loadActiveConversation();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'history':
        return (
          <ConversationHistory
            onSelectConversation={handleSelectConversation}
            currentConversationId={conversationId}
          />
        );
      case 'analytics':
        return <ChatbotAnalytics conversationId={conversationId || undefined} />;
      default:
        return (
          <>
            {/* Zone de messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {/* Contenu du message */}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                    {/* Timestamp */}
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'user'
                          ? 'text-white/70'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                      {message.confidence && message.sender === 'bot' && (
                        <span className="ml-2">
                          • Confiance: {Math.round(message.confidence)}%
                        </span>
                      )}
                    </p>

                    {/* Feedback pour les messages du bot */}
                    {message.sender === 'bot' && message.id > 0 && (
                      <MessageFeedback messageId={message.id} />
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loader */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white dark:bg-gray-700 rounded-2xl p-3 border border-gray-200 dark:border-gray-600">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                </motion.div>
              )}

              {/* Suggestions de questions */}
              {showSuggestions && suggestedQuestions.length > 0 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Suggestions :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(question)}
                        className="px-3 py-2 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-500 transition-all text-gray-700 dark:text-gray-300"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Posez votre question..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </form>
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.1}
          dragConstraints={{
            top: -window.innerHeight + 200,
            bottom: 0,
            left: -window.innerWidth + 200,
            right: 0
          }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="w-[450px] h-[650px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 cursor-move"
        >
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Assistant OAPET</h3>
                    <p className="text-xs text-white/80">
                      {viewMode === 'chat' && 'Conversation en cours'}
                      {viewMode === 'history' && 'Historique'}
                      {viewMode === 'analytics' && 'Analytics'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {viewMode === 'chat' && (
                    <>
                      <button
                        onClick={handleNewConversation}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        title="Nouvelle conversation"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {conversationId && (
                        <button
                          onClick={handleDeleteCurrentConversation}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                          title="Supprimer cette conversation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Fermer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Menu de navigation */}
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
                    viewMode === 'chat'
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">Chat</span>
                </button>
                <button
                  onClick={() => setViewMode('history')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
                    viewMode === 'history'
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span className="text-sm">Historique</span>
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all ${
                    viewMode === 'analytics'
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-sm">Stats</span>
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {renderContent()}
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

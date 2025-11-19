'use client';

/**
 * Widget chatbot flottant
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, ThumbsUp, ThumbsDown, Trash2, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { chatbotService, Message, Conversation } from '@/lib/api/services/chatbot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { getChatbotActionExecutor } from '@/services/chatbotActionExecutor';

export default function ChatbotWidget() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Initialiser l'executor avec le router
  useEffect(() => {
    getChatbotActionExecutor(router);
  }, [router]);

  // Charger la conversation active au montage
  useEffect(() => {
    if (isOpen) {
      loadActiveConversation();
    }
  }, [isOpen]);

  // Scroll automatique vers le bas
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
      } else {
        // Nouvelle conversation avec message de bienvenue
        setMessages([
          {
            id: 0,
            conversation: 0,
            sender: 'bot',
            content: "Bonjour ! 👋 Je suis l'assistant intelligent OAPET. Comment puis-je vous aider aujourd'hui ?",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Ajouter le message utilisateur immédiatement
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

      // Remplacer le message temporaire et ajouter la réponse
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        response.user_message,
        response.bot_response,
      ]);

      // Exécuter les actions UI si présentes
      if (response.bot_response.attachments) {
        const executor = getChatbotActionExecutor(router);

        response.bot_response.attachments.forEach((attachment: any) => {
          if (attachment.type === 'ui_action') {
            console.log('[ChatbotWidget] Exécution action UI:', attachment.action);

            const success = executor.executeAction(attachment);

            if (success) {
              addToast({
                title: 'Action exécutée',
                description: 'L\'action a été exécutée avec succès',
              });
            } else {
              console.warn('[ChatbotWidget] Échec exécution action:', attachment.action);
            }
          }
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      addToast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message. Veuillez reessayer.',
        variant: 'destructive',
      });

      // Retirer le message temporaire en cas d'erreur
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      setInputMessage(userMessage); // Restaurer le message
    } finally {
      setIsLoading(false);
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
      addToast({
        title: 'Historique supprime',
        description: 'L historique des conversations a ete supprime.',
      });
    } catch (error) {
      addToast({
        title: 'Erreur',
        description: 'Impossible de supprimer l historique.',
        variant: 'destructive',
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Bouton flottant */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Fenêtre du chatbot */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] h-[600px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Assistant OAPET</h3>
                  <p className="text-xs text-white/80">En ligne</p>
                </div>
              </div>
              <button
                onClick={handleClearHistory}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Supprimer l'historique"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

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
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
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
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
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
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Send, MapPin, Shield, Users, AlertTriangle,
  Heart, Bell, User, Map, Phone, MessageCircle,
  ThumbsUp, Eye, Lock, Clock, ChevronDown, MoreHorizontal
} from 'lucide-react';
import { NavigationProps } from '../types/navigation';

interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  zone: string;
  type: 'alert' | 'info' | 'question' | 'normal';
  reactions: { emoji: string; count: number; reacted: boolean }[];
  verified: boolean;
  isAnonymous: boolean;
  coordinates?: { lat: number; lng: number };
}

const ZONES = ['Gombe', 'Limete', 'Kasa-Vubu', 'Matete', 'Ngiri-Ngiri', 'Kalamu', 'Masina'];

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    author: 'Marie K.',
    avatar: '👩🏾',
    content: '⚠️ Attention ! Contrôle de police inattendu sur le Boulevard du 30 Juin, évitez cette route si vous êtes pressés.',
    time: 'Il y a 2 min',
    zone: 'Gombe',
    type: 'alert',
    reactions: [
      { emoji: '👍', count: 12, reacted: false },
      { emoji: '✅', count: 8, reacted: false },
      { emoji: '⚠️', count: 3, reacted: false },
    ],
    verified: true,
    isAnonymous: false,
    coordinates: { lat: -4.4259, lng: 15.2813 },
  },
  {
    id: '2',
    author: 'Anonyme',
    avatar: '🕵️',
    content: 'Route de Matadi praticable ce matin, pas d\'embouteillages signalés. Bonne circulation.',
    time: 'Il y a 5 min',
    zone: 'Kasa-Vubu',
    type: 'info',
    reactions: [
      { emoji: '👍', count: 5, reacted: false },
      { emoji: '✅', count: 9, reacted: true },
    ],
    verified: false,
    isAnonymous: true,
    coordinates: { lat: -4.405, lng: 15.295 },
  },
  {
    id: '3',
    author: 'Jean-Pierre M.',
    avatar: '👨🏿',
    content: '🚌 Bus de la TRANSCO très chargé ce matin à Limete. Si possible, préférez le taxi ou le moto.',
    time: 'Il y a 12 min',
    zone: 'Limete',
    type: 'info',
    reactions: [
      { emoji: '👍', count: 7, reacted: false },
      { emoji: '😮', count: 2, reacted: false },
    ],
    verified: true,
    isAnonymous: false,
    coordinates: { lat: -4.3959, lng: 15.3213 },
  },
  {
    id: '4',
    author: 'Grace N.',
    avatar: '👩🏿',
    content: '❓ Quelqu\'un a des infos sur l\'incident signalé près du marché central ? Ma fille doit y passer ce matin.',
    time: 'Il y a 18 min',
    zone: 'Gombe',
    type: 'question',
    reactions: [
      { emoji: '❤️', count: 4, reacted: false },
    ],
    verified: true,
    isAnonymous: false,
    coordinates: { lat: -4.4459, lng: 15.2813 },
  },
  {
    id: '5',
    author: 'Anonyme',
    avatar: '🕵️',
    content: '🔴 URGENT — Groupe de kulunas signalé avenue Victoire direction Ngiri-Ngiri. Évitez la zone jusqu\'à nouvel ordre.',
    time: 'Il y a 25 min',
    zone: 'Ngiri-Ngiri',
    type: 'alert',
    reactions: [
      { emoji: '⚠️', count: 21, reacted: false },
      { emoji: '👍', count: 15, reacted: false },
      { emoji: '✅', count: 6, reacted: false },
    ],
    verified: false,
    isAnonymous: true,
  },
];

const getTypeStyle = (type: string) => {
  switch (type) {
    case 'alert': return 'border-l-4 border-red-500';
    case 'info': return 'border-l-4 border-blue-500';
    case 'question': return 'border-l-4 border-yellow-500';
    default: return 'border-l-4 border-white/10';
  }
};

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'alert': return <span className="text-xs bg-red-600/30 text-red-300 px-2 py-0.5 rounded-full">Alerte</span>;
    case 'info': return <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">Info</span>;
    case 'question': return <span className="text-xs bg-yellow-600/30 text-yellow-300 px-2 py-0.5 rounded-full">Question</span>;
    default: return null;
  }
};

const CommunityChatScreen = ({ onNavigate }: NavigationProps) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [newMessage, setNewMessage] = useState('');
  const [selectedZone, setSelectedZone] = useState('Gombe');
  const [messageType, setMessageType] = useState<'normal' | 'alert' | 'info' | 'question'>('normal');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredMessages = messages.filter(m => selectedZone === 'Tous' || m.zone === selectedZone);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simuler un nouveau message toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      const autoMessages = [
        { content: '✅ Situation calme dans ma zone, tout va bien.', zone: 'Kalamu', author: 'Paul M.', avatar: '👨🏾', type: 'info' as const },
        { content: '⚠️ Pluie forte expected ce soir, attention aux inondations à Masina.', zone: 'Masina', author: 'Anonyme', avatar: '🕵️', type: 'alert' as const },
        { content: '🚓 Police visible sur l\'avenue, sentiment de sécurité amélioré.', zone: 'Gombe', author: 'Claire B.', avatar: '👩🏿', type: 'info' as const },
      ];
      const randomMsg = autoMessages[Math.floor(Math.random() * autoMessages.length)];
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        author: randomMsg.author,
        avatar: randomMsg.avatar,
        content: randomMsg.content,
        time: 'À l\'instant',
        zone: randomMsg.zone,
        type: randomMsg.type,
        reactions: [{ emoji: '👍', count: 0, reacted: false }],
        verified: randomMsg.author !== 'Anonyme',
        isAnonymous: randomMsg.author === 'Anonyme',
      }]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      author: isAnonymous ? 'Anonyme' : 'Vous',
      avatar: isAnonymous ? '🕵️' : '😊',
      content: newMessage,
      time: 'À l\'instant',
      zone: selectedZone,
      type: messageType,
      reactions: [
        { emoji: '👍', count: 0, reacted: false },
        { emoji: '✅', count: 0, reacted: false },
        { emoji: '⚠️', count: 0, reacted: false },
      ],
      verified: !isAnonymous,
      isAnonymous,
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  const react = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      return {
        ...m,
        reactions: m.reactions.map(r =>
          r.emoji === emoji
            ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted }
            : r
        ),
      };
    }));
  };

  const onlineCount = Math.floor(Math.random() * 40) + 80;

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate?.('enhanced-home')} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-400" />
                Chat Communautaire
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs">{onlineCount} connectés</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${isAnonymous ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400'}`}
            >
              {isAnonymous ? <Lock className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {isAnonymous ? 'Anonyme' : 'Identifié'}
            </button>
          </div>
        </div>

        {/* Filtre de zone */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['Tous', ...ZONES].map(zone => (
            <button
              key={zone}
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedZone === zone ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'
              }`}
            >
              {zone === 'Tous' ? '🌍 Tous' : `📍 ${zone}`}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence>
          {filteredMessages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index < 5 ? index * 0.05 : 0 }}
              className={`bg-white/5 rounded-2xl p-4 ${getTypeStyle(msg.type)}`}
            >
              {/* En-tête du message */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg flex-shrink-0">
                    {msg.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold text-sm">{msg.author}</span>
                      {msg.verified && <Shield className="w-3 h-3 text-blue-400" />}
                      {getTypeBadge(msg.type)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{msg.time}</span>
                      <MapPin className="w-3 h-3" />
                      <span>{msg.zone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <p className="text-slate-200 text-sm leading-relaxed mb-3">{msg.content}</p>

              {/* Réactions */}
              <div className="flex items-center gap-2 flex-wrap">
                {msg.reactions.map(r => (
                  <button
                    key={r.emoji}
                    onClick={() => react(msg.id, r.emoji)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs transition-all ${
                      r.reacted ? 'bg-blue-600/30 border border-blue-500/50' : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {r.emoji} <span className="text-slate-300">{r.count}</span>
                  </button>
                ))}
                {msg.coordinates && (
                  <button
                    onClick={() => onNavigate?.('enhanced-map')}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors ml-auto"
                  >
                    <MapPin className="w-3 h-3" /> Voir sur carte
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="bg-slate-900/95 backdrop-blur-xl border-t border-white/10 p-4 flex-shrink-0">
        {/* Type de message */}
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {([
            { value: 'normal', label: '💬 Normal' },
            { value: 'alert', label: '🚨 Alerte' },
            { value: 'info', label: 'ℹ️ Info' },
            { value: 'question', label: '❓ Question' },
          ] as { value: typeof messageType; label: string }[]).map(t => (
            <button
              key={t.value}
              onClick={() => setMessageType(t.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                messageType === t.value ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-400 hover:bg-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-blue-500/50 transition-colors">
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Message pour ${selectedZone}...`}
              rows={1}
              className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none resize-none"
              style={{ maxHeight: '80px' }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`w-11 h-11 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all ${
              newMessage.trim() ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/30' : 'bg-white/10'
            }`}
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CommunityChatScreen;

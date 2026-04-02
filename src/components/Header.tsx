import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Mail, Bell, Plane, Users, Menu, X, Loader2, Clock,
  AlertTriangle, CreditCard, UserPlus, CheckCircle, ChevronRight,
  Send, XCircle, Gift, Wallet
} from 'lucide-react';
import { StorageService } from '../utils/storage';
import {
  getPartnerNotifications, markNotificationRead, markAllNotificationsRead,
  getPartnerConversations,
} from '../api/trips';
import type { PartnerNotification, PartnerConversation } from '../api/trips';

interface HeaderProps {
  userName: string;
  userRole: string;
  greeting: string;
  subGreeting: string;
  onNavigateToVoyage?: (voyageId: string) => void;
  onToggleSidebar?: () => void;
}

interface SearchResult {
  type: 'voyage' | 'voyageur';
  id: string;
  label: string;
  sublabel: string;
  voyageId?: string;
}

// ─── Notification type config ────────────────────────────────────────────

const NOTIF_CONFIG: Record<string, { icon: React.ReactNode; bg: string }> = {
  new_booking:         { icon: <UserPlus className="w-4 h-4 text-blue-500" />,    bg: 'bg-blue-100' },
  payment_received:    { icon: <CreditCard className="w-4 h-4 text-green-500" />, bg: 'bg-green-100' },
  payment_overdue:     { icon: <AlertTriangle className="w-4 h-4 text-red-500" />,bg: 'bg-red-100' },
  payout_processed:    { icon: <Wallet className="w-4 h-4 text-green-500" />,     bg: 'bg-green-100' },
  partner_payout:      { icon: <Wallet className="w-4 h-4 text-emerald-500" />,   bg: 'bg-emerald-100' },
  booking_cancelled:   { icon: <XCircle className="w-4 h-4 text-red-500" />,      bg: 'bg-red-100' },
  invitation_accepted: { icon: <CheckCircle className="w-4 h-4 text-purple-500" />, bg: 'bg-purple-100' },
};

// ─── Time ago helper ─────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ─── Component ───────────────────────────────────────────────────────────

export const Header: React.FC<HeaderProps> = ({
  userName, userRole, greeting, subGreeting, onNavigateToVoyage, onToggleSidebar,
}) => {
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<PartnerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifsPagination, setNotifsPagination] = useState<any>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Messages / Conversations
  const [showMessages, setShowMessages] = useState(false);
  const [conversations, setConversations] = useState<PartnerConversation[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [msgUnreadTotal, setMsgUnreadTotal] = useState(0);
  const messageRef = useRef<HTMLDivElement>(null);

  // ─── Outside click ──────────────────────────────────────────────────────

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (messageRef.current && !messageRef.current.contains(e.target as Node)) setShowMessages(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ─── Search logic ───────────────────────────────────────────────────────

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const q = searchQuery.toLowerCase();
    const sr: SearchResult[] = [];

    StorageService.getVoyages().forEach((v: any) => {
      if ((v.destination || v.titre || '').toLowerCase().includes(q)) {
        sr.push({ type: 'voyage', id: v.id, label: v.destination || v.titre, sublabel: `${v.dateDebut} - ${v.prix} ${v.devise}` });
      }
    });
    StorageService.getAllVoyageurs().forEach(({ voyageur, voyageId, voyageDestination }) => {
      if (voyageur.nom.toLowerCase().includes(q)) {
        sr.push({ type: 'voyageur', id: voyageur.id, label: voyageur.nom, sublabel: `Voyage: ${voyageDestination}`, voyageId });
      }
    });
    setResults(sr.slice(0, 8));
    setShowResults(sr.length > 0);
  }, [searchQuery]);

  const handleResultClick = (r: SearchResult) => {
    if (r.type === 'voyage' && onNavigateToVoyage) onNavigateToVoyage(r.id);
    else if (r.type === 'voyageur' && r.voyageId && onNavigateToVoyage) onNavigateToVoyage(r.voyageId);
    setShowResults(false);
    setSearchQuery('');
  };

  // ─── Load unread count on mount (lightweight) ───────────────────────────

  useEffect(() => {
    getPartnerNotifications({ limit: 1 })
      .then(res => setUnreadCount(res.unreadCount))
      .catch(() => {});
  }, []);

  // ─── Notifications ─────────────────────────────────────────────────────

  const loadNotifications = useCallback(async () => {
    setNotifsLoading(true);
    try {
      const res = await getPartnerNotifications({ page: 1, limit: 20 });
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
      setNotifsPagination(res.pagination);
    } catch {
      // silent
    } finally {
      setNotifsLoading(false);
    }
  }, []);

  const handleToggleNotifs = () => {
    const next = !showNotifs;
    setShowNotifs(next);
    setShowMessages(false);
    if (next) loadNotifications();
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  // ─── Messages / Conversations ──────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    setMessagesLoading(true);
    try {
      const res = await getPartnerConversations({ page: 1, limit: 20 });
      setConversations(res.conversations);
      setMsgUnreadTotal(res.conversations.reduce((sum, c) => sum + c.unreadCount, 0));
    } catch {
      // silent
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const handleToggleMessages = () => {
    const next = !showMessages;
    setShowMessages(next);
    setShowNotifs(false);
    if (next) loadConversations();
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-3 md:py-4">
      <div className="flex items-center justify-between gap-2 md:gap-4">

        {/* Left: hamburger + greeting */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <button onClick={onToggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden shrink-0">
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 truncate">
              {greeting}, {userName}!
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5 truncate">{subGreeting}</p>
          </div>
        </div>

        {/* Center: search */}
        <div className="hidden sm:block flex-1 max-w-[10rem] sm:max-w-xs md:max-w-md mx-2 md:mx-8" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher voyages, voyageurs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            />
            {showResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-80 overflow-y-auto">
                {results.map((r, i) => (
                  <button
                    key={`${r.type}-${r.id}-${i}`}
                    onClick={() => handleResultClick(r)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.type === 'voyage' ? 'bg-primary-100 text-primary-600' : 'bg-blue-100 text-blue-600'}`}>
                      {r.type === 'voyage' ? <Plane className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                      <p className="text-xs text-gray-500 truncate">{r.sublabel}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{r.type === 'voyage' ? 'Voyage' : 'Voyageur'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: icons + profile */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">

          {/* ── Messages icon ────────────────────────────────────────── */}
          <div className="relative hidden sm:block" ref={messageRef}>
            <button
              onClick={handleToggleMessages}
              className={`p-2 rounded-lg transition-colors relative ${showMessages ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-600'}`}
              aria-label="Messages"
            >
              <Mail className="w-5 h-5" />
              {msgUnreadTotal > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {msgUnreadTotal > 9 ? '9+' : msgUnreadTotal}
                </span>
              )}
            </button>

            {showMessages && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary-500" />
                    <h3 className="font-bold text-sm text-gray-900">Messages</h3>
                    {msgUnreadTotal > 0 && (
                      <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {msgUnreadTotal}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setShowMessages(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Body */}
                <div className="max-h-96 overflow-y-auto">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Mail className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-400">Aucune conversation</p>
                      <p className="text-xs text-gray-300 mt-1">Les échanges avec vos voyageurs apparaîtront ici</p>
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <div
                        key={conv.bookingId}
                        className={`px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer ${conv.unreadCount > 0 ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                            {conv.client.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {conv.client.name}
                              </p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {conv.unreadCount > 0 && (
                                  <span className="min-w-[18px] h-[18px] px-1 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {conv.unreadCount}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400">{timeAgo(conv.lastMessage.sentAt)}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 truncate mt-0.5">{conv.tripTitle}</p>
                            <p className={`text-xs mt-1 truncate ${conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                              {conv.lastMessage.sender === 'partner' && (
                                <span className="text-primary-500 mr-1">Vous :</span>
                              )}
                              {conv.lastMessage.subject || conv.lastMessage.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] text-gray-400">{conv.client.phone}</span>
                              <span className="text-[10px] text-gray-300">•</span>
                              <span className="text-[10px] text-gray-400">{conv.totalMessages} msg</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {conversations.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-400 text-center">
                      {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Notifications icon ───────────────────────────────────── */}
          <div className="relative hidden sm:block" ref={notifRef}>
            <button
              onClick={handleToggleNotifs}
              className={`p-2 rounded-lg transition-colors relative ${showNotifs ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-600'}`}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary-500" />
                    <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setShowNotifs(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                {/* Body */}
                <div className="max-h-96 overflow-y-auto">
                  {notifsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-400">Aucune notification</p>
                      <p className="text-xs text-gray-300 mt-1">Vous serez notifié des nouvelles activités</p>
                    </div>
                  ) : (
                    notifications.map(notif => {
                      const cfg = NOTIF_CONFIG[notif.type] || NOTIF_CONFIG.new_booking;
                      return (
                        <div
                          key={notif._id}
                          onClick={() => { if (!notif.read) handleMarkRead(notif._id); }}
                          className={`px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer ${!notif.read ? 'bg-primary-50/30' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                              {cfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm truncate ${!notif.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                  {notif.title}
                                </p>
                                {!notif.read && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(notif.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    {unreadCount > 0 ? (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
                      >
                        Tout marquer comme lu
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">Tout est lu</span>
                    )}
                    {notifsPagination?.total && (
                      <span className="text-[10px] text-gray-400">{notifsPagination.total} notification{notifsPagination.total > 1 ? 's' : ''}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 ml-0.5 sm:ml-1 md:ml-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md text-sm md:text-base">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block text-right">
              <div className="text-sm font-semibold text-gray-900">{userName}</div>
              <div className="hidden sm:block text-xs text-gray-500">{userRole}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

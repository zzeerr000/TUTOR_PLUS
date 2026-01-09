import React, { useState, useEffect } from 'react';
import { Send, Search, Plus, User } from 'lucide-react';
import { api } from '../services/api';

interface MessengerProps {
  userType: 'tutor' | 'student';
}

export function Messenger({ userType }: MessengerProps) {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [conversationsData, connectionsData] = await Promise.all([
        api.getConversations().catch(() => []),
        api.getConnections().catch(() => []),
      ]);
      
      setChats(conversationsData);
      setConnections(connectionsData);
      
      // Merge conversations with connections to show all connected users
      const chatUserIds = new Set(conversationsData.map((c: any) => c.id));
      const colors = ['#1db954', '#2e77d0', '#af2896', '#e8115b', '#f59e0b'];
      const newConnections = connectionsData
        .map((conn: any, index: number) => {
          const otherUser = userType === 'tutor' ? conn.student : conn.tutor;
          if (!chatUserIds.has(otherUser.id)) {
            return {
              id: otherUser.id,
              name: otherUser.name,
              lastMessage: 'No messages yet',
              time: '',
              unread: 0,
              avatar: otherUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
              color: colors[index % colors.length],
              isNew: true,
            };
          }
          return null;
        })
        .filter(Boolean);
      
      // Ensure all chats have colors
      const chatsWithColors = conversationsData.map((chat: any, index: number) => ({
        ...chat,
        color: chat.color || colors[index % colors.length],
      }));
      
      const allChats = [...chatsWithColors, ...newConnections];
      setChats(allChats);
      
      // Auto-select first chat if available and none selected
      if (allChats.length > 0 && !selectedChat) {
        setSelectedChat(allChats[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: number) => {
    try {
      const data = await api.getMessages(otherUserId);
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      
      if (!data || !Array.isArray(data)) {
        console.warn('Invalid messages data:', data);
        setMessages([]);
        return;
      }
      
      const formattedMessages = data.map((m: any) => {
        const createdAt = m.createdAt ? new Date(m.createdAt) : new Date();
        return {
        id: m.id,
        text: m.text,
        sent: m.senderId === userId,
          time: createdAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          createdAt: createdAt.toISOString(),
        };
      });
      
      console.log('Loaded messages:', formattedMessages.length);
      setMessages(formattedMessages);
      
      try {
      await api.request(`/messages/${otherUserId}/read`, { method: 'POST' });
      } catch (readError) {
        console.warn('Failed to mark messages as read:', readError);
      }
      
      loadData(); // Refresh to update unread count and conversations
      
      // Scroll to bottom after loading
      setTimeout(() => {
        const container = document.getElementById('messages-container');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
      // If no messages exist yet, set empty array
      setMessages([]);
    }
  };

  const handleSend = async () => {
    if (message.trim() && selectedChat) {
      try {
        await api.sendMessage(selectedChat, message);
        setMessage('');
        await loadMessages(selectedChat);
        loadData(); // Refresh conversations list
        
        // Scroll to bottom after sending
        setTimeout(() => {
          const container = document.getElementById('messages-container');
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 100);
      } catch (error: any) {
        console.error('Failed to send message:', error);
        alert(error.message || 'Failed to send message. Make sure you are connected to this user.');
      }
    }
  };

  const currentChat = chats.find(c => c.id === selectedChat);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Header with New Chat Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Messages</h2>
        {connections.length > 0 && (
          <button
            onClick={() => setShowNewChatDialog(true)}
            className="px-4 py-2 bg-[#1db954] rounded-lg text-sm font-medium hover:bg-[#1ed760] transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            New Chat
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search conversations..."
          className="w-full bg-[#181818] rounded-lg pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1db954]"
        />
      </div>

      {/* Chat List */}
      <div className="space-y-2">
        {chats.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {connections.length === 0 
              ? 'No connections yet. Connect with users to start messaging.' 
              : 'No conversations yet. Start a new chat!'}
          </div>
        ) : (
          chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => setSelectedChat(chat.id)}
            className={`bg-[#181818] rounded-lg p-4 cursor-pointer transition-colors ${
              selectedChat === chat.id ? 'bg-[#282828]' : 'hover:bg-[#282828]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: chat.color || '#1db954' }}
              >
                <span>{chat.avatar}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span>{chat.name}</span>
                  {chat.time && <span className="text-xs text-gray-400">{chat.time}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm truncate ${chat.isNew ? 'text-gray-500 italic' : 'text-gray-400'}`}>
                    {chat.lastMessage}
                  </span>
                  {chat.unread > 0 && (
                    <span className="ml-2 bg-[#1db954] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          ))
        )}
      </div>

      {/* Chat View */}
      {currentChat ? (
        <div className="bg-[#181818] rounded-lg overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentChat.color || '#1db954' }}
              >
                <span className="text-sm">{currentChat.avatar}</span>
              </div>
              <div>
                <div>{currentChat.name}</div>
                <div className="text-xs text-gray-400">Active now</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto" id="messages-container" style={{ minHeight: '200px' }}>
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No messages yet. Start the conversation!</div>
            ) : (
              messages.map((msg, index) => {
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const msgDate = msg.createdAt ? new Date(msg.createdAt) : new Date();
                const prevDate = prevMsg && prevMsg.createdAt ? new Date(prevMsg.createdAt) : null;
                const showDate = !prevMsg || !prevDate || 
                  msgDate.toDateString() !== prevDate.toDateString();
                
                return (
                  <React.Fragment key={msg.id || index}>
                    {showDate && (
                      <div className="text-center text-xs text-gray-500 my-4">
                        {msgDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    )}
                    <div
                className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sent
                      ? 'bg-[#1db954] text-white'
                      : 'bg-[#282828] text-white'
                  }`}
                >
                  <div className="text-sm">{msg.text}</div>
                  <div className={`text-xs mt-1 ${msg.sent ? 'text-white/70' : 'text-gray-400'}`}>
                    {msg.time}
                  </div>
                </div>
              </div>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-[#282828] rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1db954]"
              />
              <button
                onClick={handleSend}
                className="w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center hover:bg-[#1ed760] transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-12">
          {chats.length === 0 
            ? 'No conversations yet. Start a new chat!' 
            : 'Select a conversation to start messaging'}
        </div>
      )}

      {/* New Chat Dialog */}
      {showNewChatDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[#181818] rounded-lg p-6 w-full max-w-md border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Start New Chat</h2>
              <button
                onClick={() => setShowNewChatDialog(false)}
                className="text-gray-400 hover:text-white"
              >
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {connections.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  No connected {userType === 'tutor' ? 'students' : 'tutors'} yet
                </div>
              ) : (
                connections.map((conn) => {
                  const otherUser = userType === 'tutor' ? conn.student : conn.tutor;
                  const existingChat = chats.find(c => c.id === otherUser.id && !c.isNew);
                  
                  return (
                    <div
                      key={otherUser.id}
                      onClick={() => {
                        setSelectedChat(otherUser.id);
                        setShowNewChatDialog(false);
                      }}
                      className="bg-[#282828] rounded-lg p-4 cursor-pointer hover:bg-[#333333] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#1db954] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">
                            {otherUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{otherUser.name}</div>
                          <div className="text-sm text-gray-400">
                            {existingChat ? 'Continue conversation' : 'Start new conversation'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

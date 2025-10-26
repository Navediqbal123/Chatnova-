
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { PassportPhotoGenerator } from './components/PassportPhotoGenerator';
import type { ChatSession } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'chat' | 'passport'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatIndex, setCurrentChatIndex] = useState<number>(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleResize = () => setIsSidebarOpen(!mediaQuery.matches);
    handleResize();
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('chatNovaHistory');
      if (storedHistory) {
        const parsedHistory = JSON.parse(storedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          setChatHistory(parsedHistory);
          setCurrentChatIndex(0);
        } else {
            handleNewChat();
        }
      } else {
        handleNewChat();
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
      handleNewChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chatHistory.length > 0) {
        try {
            localStorage.setItem('chatNovaHistory', JSON.stringify(chatHistory));
        } catch (error) {
            console.error("Failed to save chat history:", error);
        }
    }
  }, [chatHistory]);

  const handleNewChat = useCallback(() => {
    const newChat: ChatSession = {
      id: Date.now(),
      title: 'ChatNova AI',
      messages: [],
    };
    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatIndex(0);
    setCurrentView('chat');
  }, []);

  const updateCurrentChat = useCallback((updatedSession: ChatSession) => {
    setChatHistory(prev => {
        const newHistory = [...prev];
        if(newHistory[currentChatIndex]) {
            newHistory[currentChatIndex] = updatedSession;
        }
        return newHistory;
    });
  }, [currentChatIndex]);

  const handleSelectChat = (index: number) => {
    setCurrentChatIndex(index);
    setCurrentView('chat');
  };
  
  const currentSession = chatHistory[currentChatIndex];
  let headerTitle = 'ChatNova AI';
  if (currentView === 'passport') {
    headerTitle = 'Passport Photo Generator';
  } else if (currentSession) {
    headerTitle = currentSession.title;
  }

  return (
    <div className="flex h-screen w-full bg-[#0f0f1a] text-gray-200 font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        currentView={currentView}
        setView={setCurrentView}
        chatHistory={chatHistory}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        currentChatIndex={currentChatIndex}
      />
      <main className="flex-1 flex flex-col transition-all duration-300 overflow-hidden">
        <header className="p-4 border-b border-gray-800/50 flex items-center shrink-0">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white transition-colors mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>
            <h2 className="text-xl font-semibold text-white truncate">{headerTitle}</h2>
        </header>

        <div className="flex-1 overflow-y-auto">
            {currentView === 'chat' && currentSession && (
              <ChatView
                key={currentSession.id}
                session={currentSession}
                updateSession={updateCurrentChat}
              />
            )}
            {currentView === 'passport' && <PassportPhotoGenerator />}
        </div>
      </main>
    </div>
  );
};

export default App;

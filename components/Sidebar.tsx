import React from 'react';
import type { ChatSession } from '../types';
import { NovaIcon } from './icons/NovaIcon';
import { useTranslation } from '../hooks/useTranslation';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  currentView: 'chat' | 'passport' | 'profile';
  setView: (view: 'chat' | 'passport' | 'profile') => void;
  chatHistory: ChatSession[];
  onNewChat: () => void;
  onSelectChat: (index: number) => void;
  currentChatIndex: number;
  username: string | null;
}

const SidebarButton: React.FC<{ onClick: () => void; isActive: boolean; icon: React.ReactNode; label: string; }> = ({ onClick, isActive, icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full text-left py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-3 group px-4 ${
            isActive
                ? 'bg-purple-600/30 text-white glow-text'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
        }`}
    >
        {icon}
        <span className="whitespace-nowrap">{label}</span>
    </button>
);


const ChatHistoryItem: React.FC<{
  onClick: () => void;
  isActive: boolean;
  title: string;
}> = ({ onClick, isActive, title }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2.5 rounded-md text-xs truncate transition-colors duration-200 ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-500 hover:bg-gray-800/60 hover:text-gray-300'}`}
    >
        {title}
    </button>
);


export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  toggleSidebar,
  setView,
  currentView,
  chatHistory,
  onNewChat,
  onSelectChat,
  currentChatIndex,
  username
}) => {
    const { t } = useTranslation();

    const handleViewChange = (view: 'chat' | 'passport' | 'profile') => {
        setView(view);
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        if (isOpen && mediaQuery.matches) {
            toggleSidebar();
        }
    }
  
    const handleSelectChatAction = (index: number) => {
        onSelectChat(index);
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        if (isOpen && mediaQuery.matches) {
            toggleSidebar();
        }
    }
  
    const handleNewChatAction = () => {
        onNewChat();
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        if (isOpen && mediaQuery.matches) {
            toggleSidebar();
        }
    }
    
    return (
        <aside className={`bg-[#11111b] h-full flex flex-col border-r border-gray-800/50 shrink-0 transition-all duration-300 ease-in-out ${isOpen ? 'w-64 p-4' : 'w-0 p-0 overflow-hidden'}`}>
            <div className="flex items-center gap-2 mb-6 shrink-0">
                <NovaIcon className="w-8 h-8 text-purple-400 shrink-0" />
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 glow-text whitespace-nowrap">
                    ChatNova AI
                </h1>
            </div>

            <div className="flex flex-col gap-2 w-full shrink-0">
                <SidebarButton 
                    onClick={handleNewChatAction} 
                    isActive={currentView === 'chat'}
                    icon={<NovaIcon className="h-5 w-5 shrink-0" />}
                    label={t('chatNovaAI')}
                />
                <SidebarButton 
                    onClick={() => handleViewChange('passport')} 
                    isActive={currentView === 'passport'}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>}
                    label={t('passportPhoto')}
                />
            </div>

            <div className="mt-6 flex-1 flex flex-col overflow-y-hidden w-full">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('chatHistory')}</h2>
                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
                    {chatHistory.map((chat, index) => (
                    <ChatHistoryItem 
                        key={chat.id}
                        onClick={() => handleSelectChatAction(index)}
                        isActive={index === currentChatIndex && currentView === 'chat'}
                        title={chat.title}
                    />
                    ))}
                </div>
            </div>
      
            <div className="mt-4 pt-4 border-t border-gray-700/50 shrink-0">
                <button
                    onClick={() => handleViewChange('profile')}
                    className={`group w-full text-left p-2 rounded-lg transition-colors duration-200 flex items-center justify-between ${currentView === 'profile' ? 'bg-gray-700/50' : 'hover:bg-gray-700/50'}`}
                >
                    <div className="flex items-center gap-3 truncate">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white shrink-0">
                            {username ? username.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="text-sm font-medium text-white truncate">{username}</span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-gray-200 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </aside>
    );
};
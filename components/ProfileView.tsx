
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { LogoutIcon } from './icons/LogoutIcon';

interface ProfileViewProps {
    onLogout: () => void;
}

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'ja', name: '日本語' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'id', name: 'Bahasa Indonesia' },
    { code: 'it', name: 'Italiano' },
    { code: 'ko', name: '한국어' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({ onLogout }) => {
    const { t, language, setLanguage } = useTranslation();

    return (
        <div className="p-6 md:p-8 text-white max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 glow-text">{t('profileAndSettings')}</h2>
            
            <div className="bg-[#11111b]/80 border border-gray-800/50 rounded-lg p-6">
                <div className="mb-6">
                    <label htmlFor="language-select" className="block text-sm font-medium text-gray-400 mb-2">{t('language')}</label>
                    <select
                        id="language-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full max-w-xs bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 transition"
                    >
                        {LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-2">{t('languageChangeNote')}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-700/50">
                     <button
                        onClick={onLogout}
                        className="w-full sm:w-auto text-left py-3 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-3 group px-4 text-gray-400 bg-gray-800/50 hover:bg-red-600/20 hover:text-red-300"
                    >
                        <LogoutIcon className="h-5 w-5" />
                        <span className="whitespace-nowrap">{t('logout')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
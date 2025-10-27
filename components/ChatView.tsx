
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatSession, Message } from '../types';
import { generateChatResponse } from '../services/geminiService';
import * as googleDriveService from '../services/googleDriveService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { CameraIcon } from './icons/CameraIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SendIcon } from './icons/SendIcon';
import { Spinner } from './icons/Spinner';
import { NovaIcon } from './icons/NovaIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { FileIcon } from './icons/FileIcon';
import { CameraCaptureModal } from './CameraCaptureModal';
import { PlusIcon } from './icons/PlusIcon';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { useTranslation } from '../hooks/useTranslation';

interface ChatViewProps {
  session: ChatSession;
  updateSession: (session: ChatSession) => void;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1">
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
    </div>
);

const ChatBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xl p-4 rounded-2xl shadow-lg transition-all duration-300 ${
          isUser
            ? 'bg-indigo-600/80 rounded-br-none'
            : 'bg-gray-800/80 rounded-bl-none'
        }`}
      >
        {message.image && (
          <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-w-xs" />
        )}
        <p className="text-white whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

export const ChatView: React.FC<ChatViewProps> = ({ session, updateSession }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ base64: string; file: File } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [areGoogleApisReady, setAreGoogleApisReady] = useState(false);
  const [isPlusIconSpinning, setPlusIconSpinning] = useState(false);
  const { t } = useTranslation();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);

  const handleTranscriptChange = useCallback((transcript: string) => {
    setInput(transcript);
  }, []);
  
  const { isListening, toggleListening } = useSpeechRecognition(handleTranscriptChange);

  useEffect(() => {
    googleDriveService.loadGoogleApis(() => {
      setAreGoogleApisReady(true);
    });
  }, []);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [session.messages, isLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setIsAttachmentMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSend = async () => {
    if ((!input.trim() && !uploadedImage && !uploadedFile) || isLoading) return;

    const userMessage: Message = { role: 'user', text: input.trim() };
     if (uploadedImage) {
        userMessage.image = `data:${uploadedImage.file.type};base64,${uploadedImage.base64}`;
    }
    if (uploadedFile) {
        userMessage.text = `${input.trim()}\n(${t('attached')}: ${uploadedFile.name})`;
    }

    const updatedMessages = [...session.messages, userMessage];
    const newTitle = session.messages.length === 0 ? (input.trim().substring(0, 20) || (uploadedImage ? t('imageAnalysis') : t('fileAnalysis'))) : session.title;
    updateSession({...session, messages: updatedMessages, title: newTitle});

    let promptToSend = input.trim();
    if (uploadedFile) {
        const userQuery = input.trim() || t('analyzeContentSummary');
        promptToSend = `${t('contextFromFile', { fileName: uploadedFile.name })}\n\n${uploadedFile.content}\n\n${t('userRequest')}:\n${userQuery}`;
    }

    setInput('');
    setUploadedImage(null);
    setUploadedFile(null);
    setIsLoading(true);

    try {
      const responseText = await generateChatResponse(promptToSend, uploadedImage?.base64, uploadedImage?.file.type);
      const modelMessage: Message = { role: 'model', text: responseText };
      updateSession({...session, messages: [...updatedMessages, modelMessage], title: newTitle});
    } catch (error) {
      console.error("Failed to get response:", error);
      const errorMessage: Message = { role: 'model', text: t('errorCouldNotGetResponse') };
      updateSession({...session, messages: [...updatedMessages, errorMessage], title: newTitle});
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setUploadedImage({ base64, file });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };
  
   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setUploadedImage(null);
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setUploadedFile({ name: file.name, content });
        };
        reader.onerror = (err) => {
            console.error("Failed to read file", err);
        };
        reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleImageCapture = (imageData: { base64: string; file: File }) => {
    setUploadedFile(null);
    setUploadedImage(imageData);
  };
  
  const handleGoogleDriveClick = async () => {
    if (!areGoogleApisReady) {
        alert(t('googleDriveLoading'));
        return;
    }
    setIsAttachmentMenuOpen(false);
    try {
        const file = await googleDriveService.pickFileFromDrive();
        if (file) {
             setUploadedImage(null); // Clear image if a doc is selected
             setUploadedFile({ name: file.name, content: file.content });
        }
    } catch (error) {
        if (error) { // To ignore the null rejection on user cancel
            console.error(error);
            alert((error as Error).message);
        }
    }
};

const handleAttachmentToggle = () => {
    // If menu is open, just close it without animation.
    if (isAttachmentMenuOpen) {
      setIsAttachmentMenuOpen(false);
      return;
    }
    // If not spinning, start the spin. The menu will open on animation end.
    if (!isPlusIconSpinning) {
      setPlusIconSpinning(true);
    }
  };

  const handleSpinComplete = () => {
    setPlusIconSpinning(false); // Reset animation trigger
    setIsAttachmentMenuOpen(true); // Open menu *after* animation
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f1a]">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6">
        {session.messages.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <NovaIcon className="w-24 h-24 text-purple-400 mb-4" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 glow-text">
              {t('welcomeToChatNova')}
            </h1>
            <p className="mt-2 text-lg">{t('startConversation')}</p>
          </div>
        ) : (
          session.messages.map((msg, index) => (
            <ChatBubble key={index} message={msg} />
          ))
        )}
        {isLoading && (
            <div className="flex items-start gap-3 my-4 justify-start">
                <div className="max-w-lg p-4 rounded-2xl bg-gray-800/80 rounded-bl-none shadow-lg">
                    <TypingIndicator />
                </div>
            </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-800/50">
        {uploadedImage && (
            <div className="flex justify-end mb-3">
                <div className="bg-gray-800/50 p-2 rounded-xl relative w-fit max-w-xs shadow-lg">
                    <img
                        src={`data:${uploadedImage.file.type};base64,${uploadedImage.base64}`}
                        alt="preview"
                        className="rounded-lg max-h-40 w-auto"
                    />
                    <button
                        onClick={() => setUploadedImage(null)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        aria-label={t('removeImage')}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        )}
        {uploadedFile && (
            <div className="mb-2 bg-gray-800/50 p-2 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">{uploadedFile.name}</span>
                </div>
                <button onClick={() => setUploadedFile(null)} className="text-gray-500 hover:text-red-400" aria-label={t('removeFile')}>&times;</button>
            </div>
        )}
        <div className="flex items-center gap-3">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <input type="file" ref={docFileInputRef} onChange={handleFileUpload} accept=".txt,.md,.js,.ts,.jsx,.tsx,.html,.css,.json,.csv" className="hidden" />

            <div className="relative" ref={attachmentMenuRef}>
                 {isAttachmentMenuOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-900/80 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700/50 overflow-hidden z-10">
                        <button onClick={() => { fileInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-purple-600/20 transition-colors">
                            <PaperclipIcon />
                            <span>{t('fromGallery')}</span>
                        </button>
                         <button onClick={() => { docFileInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-purple-600/20 transition-colors">
                            <FileIcon />
                            <span>{t('attachDocument')}</span>
                        </button>
                        <button onClick={() => { setIsCameraModalOpen(true); setIsAttachmentMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-purple-600/20 transition-colors">
                            <CameraIcon />
                            <span>{t('useCamera')}</span>
                        </button>
                        <button
                            onClick={handleGoogleDriveClick}
                            disabled={!areGoogleApisReady}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-purple-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <GoogleDriveIcon />
                            <span>Google Drive</span>
                        </button>
                    </div>
                )}
                <button
                    onClick={handleAttachmentToggle}
                    className={`p-2 transition-all duration-200 rounded-full border ${
                        isAttachmentMenuOpen
                            ? 'bg-purple-500/30 text-purple-300 border-purple-400'
                            : 'text-gray-400 hover:text-white border-white/50 hover:border-white'
                    }`}
                    aria-label={t('attachFile')}
                >
                    <PlusIcon
                        className={isPlusIconSpinning ? 'animate-spin-once' : ''}
                        onAnimationEnd={isPlusIconSpinning ? handleSpinComplete : undefined}
                    />
                </button>
            </div>
           
            <div className="relative flex-1 flex items-center bg-gray-800/50 rounded-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={t('askChatNova')}
                className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none px-4 py-3"
                rows={1}
              />
               <button onClick={toggleListening} className={`p-2 mr-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-purple-400'}`} aria-label={isListening ? t('stopListening') : t('startListening')}>
                    <MicrophoneIcon isListening={isListening}/>
                </button>
            </div>

            <button onClick={handleSend} disabled={isLoading || (!input.trim() && !uploadedImage && !uploadedFile)} className="p-2 text-white bg-gradient-to-r from-purple-600 to-blue-500 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed glow-border" aria-label={t('sendMessage')}>
                 {isLoading ? <Spinner /> : <SendIcon />}
            </button>
        </div>
      </div>
       <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onImageCapture={handleImageCapture}
      />
    </div>
  );
};

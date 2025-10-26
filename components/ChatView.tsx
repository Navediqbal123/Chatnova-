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
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex-shrink-0 flex items-center justify-center p-1.5">
          <NovaIcon className="w-full h-full text-white" />
        </div>
      )}
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
        userMessage.text = `${input.trim()}\n(Attached: ${uploadedFile.name})`;
    }

    const updatedMessages = [...session.messages, userMessage];
    const newTitle = session.messages.length === 0 ? (input.trim().substring(0, 20) || (uploadedImage ? "Image Analysis" : "File Analysis")) : session.title;
    updateSession({...session, messages: updatedMessages, title: newTitle});

    let promptToSend = input.trim();
    if (uploadedFile) {
        const userQuery = input.trim() || 'Analyze the following content and provide a detailed summary.';
        promptToSend = `CONTEXT FROM UPLOADED FILE (${uploadedFile.name}):\n\n${uploadedFile.content}\n\nUSER REQUEST:\n${userQuery}`;
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
      const errorMessage: Message = { role: 'model', text: 'Error: Could not get a response.' };
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
        alert('Google Drive integration is still loading. Please wait a moment.');
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

  return (
    <div className="flex flex-col h-full bg-[#0f0f1a]">
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6">
        {session.messages.map((msg, index) => (
          <ChatBubble key={index} message={msg} />
        ))}
        {isLoading && (
            <div className="flex items-start gap-3 my-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex-shrink-0 flex items-center justify-center p-1.5">
                  <NovaIcon className="w-full h-full text-white" />
                </div>
                <div className="max-w-lg p-4 rounded-2xl bg-gray-800/80 rounded-bl-none shadow-lg">
                    <TypingIndicator />
                </div>
            </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-800/50">
        {uploadedImage && (
            <div className="mb-2 bg-gray-800/50 p-2 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src={`data:${uploadedImage.file.type};base64,${uploadedImage.base64}`} alt="preview" className="w-10 h-10 rounded object-cover" />
                    <span className="text-sm text-gray-400">{uploadedImage.file.name}</span>
                </div>
                <button onClick={() => setUploadedImage(null)} className="text-gray-500 hover:text-red-400" aria-label="Remove image">&times;</button>
            </div>
        )}
        {uploadedFile && (
            <div className="mb-2 bg-gray-800/50 p-2 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-400">{uploadedFile.name}</span>
                </div>
                <button onClick={() => setUploadedFile(null)} className="text-gray-500 hover:text-red-400" aria-label="Remove file">&times;</button>
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
                            <span>From Gallery</span>
                        </button>
                         <button onClick={() => { docFileInputRef.current?.click(); setIsAttachmentMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-purple-600/20 transition-colors">
                            <FileIcon />
                            <span>Attach Document</span>
                        </button>
                        <button onClick={() => { setIsCameraModalOpen(true); setIsAttachmentMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-300 hover:bg-purple-600/20 transition-colors">
                            <CameraIcon />
                            <span>Use Camera</span>
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
                    onClick={() => setIsAttachmentMenuOpen(prev => !prev)}
                    className={`p-2 transition-all duration-200 rounded-full border ${
                        isAttachmentMenuOpen
                            ? 'bg-purple-500/30 text-purple-300 border-purple-400'
                            : 'text-gray-400 hover:text-white border-white/50 hover:border-white'
                    }`}
                    aria-label="Attach file"
                >
                    <PlusIcon />
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
                placeholder="Ask ChatNova AI..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none px-4 py-3"
                rows={1}
              />
               <button onClick={toggleListening} className={`p-2 mr-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-purple-400'}`} aria-label={isListening ? 'Stop listening' : 'Start listening'}>
                    <MicrophoneIcon isListening={isListening}/>
                </button>
            </div>

            <button onClick={handleSend} disabled={isLoading || (!input.trim() && !uploadedImage && !uploadedFile)} className="p-2 text-white bg-gradient-to-r from-purple-600 to-blue-500 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed glow-border" aria-label="Send message">
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
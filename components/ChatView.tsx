
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatSession, Message } from '../types';
import { generateChatResponse } from '../services/geminiService';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { CameraIcon } from './icons/CameraIcon';
import { MicrophoneIcon } from './icons/MicrophoneIcon';
import { SendIcon } from './icons/SendIcon';
import { Spinner } from './icons/Spinner';
import { NovaIcon } from './icons/NovaIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { CameraCaptureModal } from './CameraCaptureModal';

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
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleTranscriptChange = useCallback((transcript: string) => {
    setInput(transcript);
  }, []);
  
  const { isListening, toggleListening } = useSpeechRecognition(handleTranscriptChange);

  useEffect(() => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  }, [session.messages, isLoading]);

  const handleSend = async () => {
    if ((!input.trim() && !uploadedImage) || isLoading) return;

    const userMessage: Message = { role: 'user', text: input.trim() };
    if (uploadedImage) {
        userMessage.image = `data:${uploadedImage.file.type};base64,${uploadedImage.base64}`;
    }

    const updatedMessages = [...session.messages, userMessage];
    const newTitle = session.messages.length === 0 ? (input.trim().substring(0, 20) || "Image Analysis") : session.title;
    updateSession({...session, messages: updatedMessages, title: newTitle});

    setInput('');
    setUploadedImage(null);
    setIsLoading(true);

    try {
      const responseText = await generateChatResponse(input.trim(), uploadedImage?.base64, uploadedImage?.file.type);
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
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setUploadedImage({ base64, file });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset file input
  };
  
  const handleImageCapture = (imageData: { base64: string; file: File }) => {
    setUploadedImage(imageData);
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
                <button onClick={() => setUploadedImage(null)} className="text-gray-500 hover:text-red-400">&times;</button>
            </div>
        )}
        <div className="relative flex items-center">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-purple-400 transition-colors">
                <PaperclipIcon />
            </button>
            <button onClick={() => setIsCameraModalOpen(true)} className="p-2 text-gray-400 hover:text-purple-400 transition-colors">
                <CameraIcon />
            </button>
            <button onClick={toggleListening} className={`p-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-purple-400'}`}>
                <MicrophoneIcon isListening={isListening}/>
            </button>
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
          <button onClick={handleSend} disabled={isLoading} className="p-2 text-white bg-gradient-to-r from-purple-600 to-blue-500 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed glow-border">
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
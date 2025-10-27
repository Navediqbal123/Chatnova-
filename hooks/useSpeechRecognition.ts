import { useState, useEffect, useRef } from 'react';
import { useTranslation } from './useTranslation';

// Fix: Add type definitions for the Web Speech API, which are not included in standard TypeScript DOM types.
// This resolves errors about 'SpeechRecognition' and 'webkitSpeechRecognition' not existing on 'window'.
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onstart: () => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

// Polyfill for browser compatibility
// Fix: Renamed to 'SpeechRecognitionAPI' to avoid shadowing the 'SpeechRecognition' interface type.
// This resolves the error "'SpeechRecognition' refers to a value, but is being used as a type here."
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

const LANG_MAP: { [key: string]: string } = {
    'en': 'en-US',
    'es': 'es-ES',
    'hi': 'hi-IN',
    'ar': 'ar-SA',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'zh': 'zh-CN',
    'pt': 'pt-BR',
    'ru': 'ru-RU',
    'ja': 'ja-JP',
    'bn': 'bn-IN',
    'id': 'id-ID',
    'it': 'it-IT',
    'ko': 'ko-KR',
};

export const useSpeechRecognition = (onTranscriptChange: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { language } = useTranslation();

  useEffect(() => {
    if (!SpeechRecognitionAPI) {
      console.error('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    // Set continuous to false. This means the recognition will stop after the user stops speaking.
    // This prevents the "doubling" of text where new speech was appended to old speech.
    // For a chat input, single utterances are the expected behavior.
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = LANG_MAP[language] || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      onTranscriptChange(transcript);
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onTranscriptChange, language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  return { isListening, toggleListening };
};

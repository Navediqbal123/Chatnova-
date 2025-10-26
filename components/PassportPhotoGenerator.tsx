import React, { useState, useRef } from 'react';
import { processPassportPhoto } from '../services/geminiService';
import { createPhotoSheet } from '../utils/imageUtils';
import { Spinner } from './icons/Spinner';

const COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light Gray', value: '#F0F0F0' },
  { name: 'Sky Blue', value: '#87CEEB' },
  { name: 'Light Blue', value: '#ADD8E6' },
  { name: 'Cream', value: '#FFFDD0' },
  { name: 'Red', value: '#FF0000' },
];

const SHEET_OPTIONS = [
  { label: '4 Photos (2x2)', photosPerRow: 2, rows: 2 },
  { label: '8 Photos (2x4)', photosPerRow: 2, rows: 4 },
  { label: '12 Photos (3x4)', photosPerRow: 3, rows: 4 },
  { label: '16 Photos (4x4)', photosPerRow: 4, rows: 4 },
  { label: '20 Photos (4x5)', photosPerRow: 4, rows: 5 },
  { label: '24 Photos (4x6)', photosPerRow: 4, rows: 6 },
  { label: '28 Photos (4x7)', photosPerRow: 4, rows: 7 },
  { label: '32 Photos (4x8)', photosPerRow: 4, rows: 8 },
  { label: '36 Photos (6x6)', photosPerRow: 6, rows: 6 },
  { label: '40 Photos (5x8)', photosPerRow: 5, rows: 8 },
];

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="text-gray-300 font-medium">{label}</span>
    <div className="relative">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className={`block w-14 h-8 rounded-full transition-all duration-300 ${checked ? 'bg-purple-600' : 'bg-gray-600'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${checked ? 'transform translate-x-6' : ''}`}></div>
    </div>
  </label>
);

export const PassportPhotoGenerator: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<{ base64: string; url: string; file: File } | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [removeBg, setRemoveBg] = useState(true);
  const [applyBgColor, setApplyBgColor] = useState(true);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [sheetConfig, setSheetConfig] = useState(SHEET_OPTIONS[1]); // Default to 8 photos

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const base64 = url.split(',')[1];
        setSourceImage({ base64, url, file });
        setProcessedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!sourceImage) return;
    setIsLoading(true);
    setError(null);
    setProcessedImage(null);

    try {
      const aiProcessedBase64 = await processPassportPhoto(sourceImage.base64, sourceImage.file.type, removeBg);
      const sheetDataUrl = await createPhotoSheet(aiProcessedBase64, { ...sheetConfig, applyBgColor, bgColor: selectedColor });
      setProcessedImage(sheetDataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `passport_photos_${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col md:flex-row bg-[#0f0f1a] md:h-full min-h-full">
      <div className="w-full md:w-96 bg-[#11111b] p-6 border-r border-gray-800/50 flex flex-col gap-6 overflow-y-auto">
        <h2 className="text-2xl font-bold text-white glow-text">Photo Settings</h2>
        
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-400">1. Photos Per Sheet</label>
          <select 
            value={sheetConfig.label}
            onChange={(e) => setSheetConfig(SHEET_OPTIONS.find(o => o.label === e.target.value) || SHEET_OPTIONS[0])}
            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 transition"
          >
            {SHEET_OPTIONS.map(opt => <option key={opt.label}>{opt.label}</option>)}
          </select>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-700/50">
           <label className="block text-sm font-medium text-gray-400">2. Background Options</label>
          <Toggle label="AI Background Removal" checked={removeBg} onChange={setRemoveBg} />
          <Toggle label="Apply Background Color" checked={applyBgColor} onChange={setApplyBgColor} />
        </div>

        {applyBgColor && (
          <div className="space-y-3 pt-4 border-t border-gray-700/50">
            <h3 className="text-gray-300 font-medium">3. Choose Color</h3>
            <div className="grid grid-cols-3 gap-3">
              {COLORS.map(color => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.value)}
                  className={`p-2 rounded-lg text-sm text-center transition-all duration-200 ${selectedColor === color.value ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-purple-500' : 'ring-1 ring-gray-600'}`}
                >
                  <div className="w-full h-8 rounded" style={{ backgroundColor: color.value }}></div>
                  <span className="mt-1.5 block text-gray-400">{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-start overflow-y-auto">
        <div className="w-full max-w-4xl flex flex-col items-center space-y-8">
            {!sourceImage ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-96 border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center text-gray-500 bg-gray-800/20 hover:border-purple-500 hover:text-purple-400 transition-all duration-300 cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="font-semibold text-lg">Click to upload your photo</p>
                    <p className="text-sm">Start by selecting an image from your device.</p>
                </div>
            ) : (
                <div className="text-center w-full">
                    <h3 className="font-semibold text-white mb-4">Your Photo</h3>
                    <div className="border-2 border-blue-400/50 rounded-xl inline-block p-2 shadow-lg bg-black/20">
                        <img src={sourceImage.url} alt="Source" className="rounded-lg max-h-[40vh] mx-auto" />
                    </div>
                     <div className="mt-4">
                        <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-lg text-white bg-gray-600 hover:bg-gray-500 transition font-semibold text-sm">
                            Change Photo
                        </button>
                    </div>
                </div>
            )}

            {(isLoading || processedImage) && sourceImage && (
                <div className="text-center w-full">
                    <h3 className="font-semibold text-white mb-2">Generated Result</h3>
                    <div className="w-full min-h-[40vh] bg-gray-800/50 rounded-xl flex items-center justify-center overflow-auto p-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center text-gray-400">
                            <Spinner />
                            <p className="mt-4 text-lg">Generating your photos...</p>
                            <p className="text-sm text-gray-500">AI is at work, this might take a moment.</p>
                        </div>
                    ) : processedImage ? (
                        <img src={processedImage} alt="Processed" className="rounded-lg shadow-2xl max-h-full max-w-full" />
                    ) : null}
                    </div>
                </div>
            )}
          
            {error && <p className="text-red-400 text-center">{error}</p>}

            <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                onClick={handleGenerate}
                disabled={!sourceImage || isLoading}
                className="px-8 py-4 rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold text-lg flex items-center gap-2 glow-border"
                >
                {isLoading && <Spinner />}
                {isLoading ? 'Generating...' : '✨ Generate Smart Photo'}
                </button>
                {processedImage && (
                <button onClick={handleDownload} className="px-6 py-3 rounded-lg text-white bg-green-600 hover:bg-green-500 transition font-semibold">Download Photo</button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
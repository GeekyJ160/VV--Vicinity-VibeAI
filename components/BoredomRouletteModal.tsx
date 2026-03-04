import React, { useState } from 'react';
import { X, Dices, MapPin, Loader2, Navigation } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface BoredomRouletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: { lat: number; lng: number } | null;
}

interface Suggestion {
  title: string;
  description: string;
  type: string;
  placeUri?: string;
}

const BoredomRouletteModal: React.FC<BoredomRouletteModalProps> = ({ isOpen, onClose, location }) => {
  const [vibe, setVibe] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSpin = async () => {
    if (!vibe.trim()) {
      setError('Please enter your current vibe!');
      return;
    }
    if (!location) {
      setError('Waiting for location...');
      return;
    }

    setLoading(true);
    setError('');
    setSuggestion(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `I am at latitude ${location.lat}, longitude ${location.lng}. My current vibe is "${vibe}". 
      Suggest a specific, real place or activity nearby that matches this vibe. 
      Respond with a JSON object containing:
      - title: The name of the place or activity.
      - description: A short, engaging description of why it fits the vibe.
      - type: A category like "Food", "Art", "Music", "Outdoors", "Chill", etc.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: location.lat,
                longitude: location.lng
              }
            }
          }
        }
      });

      // We need to parse the response. Since we can't use responseMimeType with googleMaps tool,
      // we'll try to extract JSON from the markdown response.
      const text = response.text || '';
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
      
      let parsedSuggestion: Suggestion = {
        title: 'Random Adventure',
        description: text.replace(/```json[\s\S]*?```/g, '').trim() || 'Go explore the area!',
        type: 'Adventure'
      };

      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          parsedSuggestion = { ...parsedSuggestion, ...parsed };
        } catch (e) {
          console.error('Failed to parse JSON from Gemini:', e);
        }
      }

      // Extract map URL if available
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        for (const chunk of chunks) {
          if (chunk.maps?.uri) {
            parsedSuggestion.placeUri = chunk.maps.uri;
            break;
          }
        }
      }

      setSuggestion(parsedSuggestion);
    } catch (err) {
      console.error('Error generating suggestion:', err);
      setError('Failed to generate a suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-[#141414] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5 bg-gradient-to-br from-[#e879f9]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e879f9] to-[#a855f7] flex items-center justify-center shadow-[0_0_15px_rgba(232,121,249,0.3)]">
              <Dices size={20} className="text-white" />
            </div>
            <h2 className="font-['Syne',sans-serif] font-[800] text-[20px] text-white tracking-tight">
              Boredom Roulette
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {!suggestion ? (
            <>
              <div className="flex flex-col gap-2">
                <label className="font-['DM_Sans',sans-serif] font-[600] text-[13px] text-white/70 uppercase tracking-wider">
                  What's your vibe right now?
                </label>
                <input
                  type="text"
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  placeholder="e.g., Chill, Hungry, Adventurous..."
                  className="w-full bg-white/5 border border-white/10 rounded-[16px] px-4 py-3 text-white font-['DM_Sans',sans-serif] text-[15px] placeholder:text-white/30 focus:outline-none focus:border-[#e879f9] focus:ring-1 focus:ring-[#e879f9] transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleSpin()}
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm font-['DM_Sans',sans-serif]">{error}</p>
              )}

              <button
                onClick={handleSpin}
                disabled={loading}
                className="w-full py-[14px] rounded-[16px] bg-gradient-to-r from-[#e879f9] to-[#a855f7] text-white font-['DM_Sans',sans-serif] font-[700] text-[15px] shadow-[0_4px_20px_rgba(232,121,249,0.4)] active:scale-95 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Spinning the Roulette...
                  </>
                ) : (
                  <>
                    <Dices size={18} />
                    Spin
                  </>
                )}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-5 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="px-3 py-1 rounded-full bg-[#e879f9]/20 text-[#e879f9] font-['DM_Sans',sans-serif] font-[700] text-[11px] uppercase tracking-wider">
                  {suggestion.type}
                </div>
                <h3 className="font-['Syne',sans-serif] font-[800] text-[24px] text-white leading-tight">
                  {suggestion.title}
                </h3>
                <p className="font-['DM_Sans',sans-serif] font-[400] text-[15px] text-white/70 leading-relaxed">
                  {suggestion.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                {suggestion.placeUri && (
                  <a
                    href={suggestion.placeUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-[12px] rounded-[16px] bg-white/10 text-white font-['DM_Sans',sans-serif] font-[700] text-[14px] hover:bg-white/15 active:scale-95 flex items-center justify-center gap-2 transition-all"
                  >
                    <Navigation size={16} />
                    Open in Maps
                  </a>
                )}
                <button
                  onClick={() => setSuggestion(null)}
                  className="w-full py-[12px] rounded-[16px] bg-gradient-to-r from-[#e879f9] to-[#a855f7] text-white font-['DM_Sans',sans-serif] font-[700] text-[14px] shadow-[0_4px_14px_rgba(232,121,249,0.3)] active:scale-95 flex items-center justify-center gap-2 transition-all"
                >
                  <Dices size={16} />
                  Spin Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoredomRouletteModal;

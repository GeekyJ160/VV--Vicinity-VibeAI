
import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import { supabase } from '../supabaseClient';
import { Camera, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface StoriesScreenProps {
  isDarkMode: boolean;
}

const StoriesScreen: React.FC<StoriesScreenProps> = ({ isDarkMode }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    // Get current location for nearby stories
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const { data, error } = await supabase.rpc('nearby_stories', {
        lat: latitude,
        lng: longitude,
        radius_meters: 10000
      });

      if (error) {
        console.error('Error fetching stories:', error);
        return;
      }

      setStories(data || []);
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `stories/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars') // Using existing bucket for simplicity, usually separate
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const { error: dbError } = await supabase.from('stories').insert({
      user_id: user.id,
      image_url: publicUrl,
      caption: 'New vibe! ✨'
    });

    if (dbError) {
      console.error('DB error:', dbError);
    } else {
      fetchStories();
    }

    setUploading(false);
  };

  const storyNext = () => {
    if (currentStoryIndex !== null && currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      setCurrentStoryIndex(null);
    }
  };

  const storyPrev = () => {
    if (currentStoryIndex !== null && currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 animate-in fade-in duration-500 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-black italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Nearby Stories</h2>
        <label className="cursor-pointer bg-pink-600 p-3 rounded-full shadow-lg shadow-pink-500/30 active:scale-95 transition-all">
          <Plus className="text-white" size={24} />
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {uploading && (
        <div className="mb-6 bg-pink-500/10 border border-pink-500/20 p-4 rounded-2xl flex items-center space-x-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-pink-500 border-t-transparent"></div>
          <span className="text-xs font-black uppercase tracking-widest text-pink-500">Uploading your vibe...</span>
        </div>
      )}

      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide shrink-0">
        {stories.map((s, idx) => (
          <div key={s.id} className="flex flex-col items-center shrink-0 space-y-2" onClick={() => setCurrentStoryIndex(idx)}>
            <div className={`w-20 h-20 rounded-full p-1 border-2 border-pink-500 cursor-pointer active:scale-95 transition-all`}>
              <img src={s.image_url} className="w-full h-full rounded-full object-cover" alt={s.name} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-tighter ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{s.name}</span>
          </div>
        ))}
        {stories.length === 0 && (
          <div className="text-zinc-500 text-xs italic py-4">No stories nearby yet. Be the first!</div>
        )}
      </div>

      {currentStoryIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <div className="relative w-full h-full max-w-md">
            <img src={stories[currentStoryIndex].image_url} className="w-full h-full object-cover" />
            
            <div className="absolute top-10 left-6 right-6 flex items-center space-x-3">
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white animate-[progress_5s_linear]" onAnimationEnd={storyNext}></div>
              </div>
            </div>

            <div className="absolute top-16 left-6 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-pink-500 overflow-hidden">
                <img src={stories[currentStoryIndex].image_url} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-white font-black text-sm">{stories[currentStoryIndex].name}</div>
                <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                  {Math.round(stories[currentStoryIndex].distance_meters || 0)}m away
                </div>
              </div>
            </div>

            <button onClick={() => setCurrentStoryIndex(null)} className="absolute top-16 right-6 text-white/50 hover:text-white">
              ✕
            </button>

            <div className="absolute inset-y-0 left-0 w-1/4" onClick={storyPrev}></div>
            <div className="absolute inset-y-0 right-0 w-1/4" onClick={storyNext}></div>

            <div className="absolute bottom-10 left-6 right-6 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-white text-sm font-medium">{stories[currentStoryIndex].caption}</p>
            </div>
          </div>
        </div>
      )}

      <div className={`mt-6 flex-1 rounded-3xl p-10 border text-center flex flex-col items-center justify-center transition-colors duration-300 shadow-sm ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-white border-slate-200 shadow-slate-100'}`}>
        <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mb-6">
          <Camera className="text-pink-500" size={32} />
        </div>
        <h3 className={`text-xl font-black italic ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Broadcast your vibe</h3>
        <p className={`${isDarkMode ? 'text-zinc-500' : 'text-slate-400'} text-sm mt-2 max-w-[240px] leading-relaxed`}>
          Share what's happening in your vicinity. Stories disappear after 24 hours.
        </p>
        <button 
          onClick={() => document.querySelector('input[type="file"]')?.dispatchEvent(new MouseEvent('click'))}
          className="mt-8 bg-pink-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-pink-500 transition-all text-white shadow-xl shadow-pink-500/20 active:scale-95"
        >
          POST STORY
        </button>
      </div>
    </div>
  );
};

export default StoriesScreen;

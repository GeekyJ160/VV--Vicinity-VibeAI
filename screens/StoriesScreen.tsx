
import React from 'react';

interface StoriesScreenProps {
  isDarkMode: boolean;
}

const StoriesScreen: React.FC<StoriesScreenProps> = ({ isDarkMode }) => {
  const stories = [
    { id: 1, name: 'Alex', img: 'https://picsum.photos/id/10/200/200', active: true },
    { id: 2, name: 'Jamie', img: 'https://picsum.photos/id/11/200/200', active: true },
    { id: 3, name: 'Taylor', img: 'https://picsum.photos/id/12/200/200', active: false },
    { id: 4, name: 'You', img: 'https://picsum.photos/id/13/200/200', active: false },
  ];

  return (
    <div className="p-6 animate-in fade-in duration-500">
      <h2 className={`text-2xl font-bold mb-6 italic ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Live Stories</h2>
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {stories.map(s => (
          <div key={s.id} className="flex flex-col items-center shrink-0 space-y-2">
            <div className={`w-20 h-20 rounded-full p-1 border-2 transition-colors duration-300 ${s.active ? 'border-pink-500' : isDarkMode ? 'border-zinc-700' : 'border-slate-300'}`}>
              <img src={s.img} className="w-full h-full rounded-full object-cover grayscale-[0.2]" alt={s.name} />
            </div>
            <span className={`text-xs font-bold transition-colors duration-300 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{s.name}</span>
          </div>
        ))}
      </div>
      
      <div className={`mt-10 rounded-3xl p-10 border text-center transition-colors duration-300 shadow-sm ${isDarkMode ? 'bg-zinc-800/50 border-white/5' : 'bg-white border-slate-200 shadow-slate-100'}`}>
        <div className="text-4xl mb-4">📸</div>
        <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Add to your Story</h3>
        <p className={`${isDarkMode ? 'text-zinc-500' : 'text-slate-400'} text-sm mt-2 max-w-[200px] mx-auto`}>Share your current vicinity vibe with everyone nearby for 24 hours.</p>
        <button className="mt-6 bg-pink-600 px-6 py-3 rounded-xl font-bold hover:bg-pink-500 transition-colors text-white shadow-lg shadow-pink-500/20 active:scale-95">
          OPEN CAMERA
        </button>
      </div>
    </div>
  );
};

export default StoriesScreen;


import React from 'react';

interface VibeFeedScreenProps {
  isDarkMode: boolean;
}

const VibeFeedScreen: React.FC<VibeFeedScreenProps> = ({ isDarkMode }) => {
  const events = [
    { id: 1, title: 'Pop-up Trivia Night', location: '@TheSpot', time: 'Starting in 20m', vibe: 'Games', color: 'bg-violet-600', img: 'https://picsum.photos/id/10/400/200' },
    { id: 2, title: 'Neon Jazz Session', location: 'Blue Note Lounge', time: 'Ongoing', vibe: 'Music', color: 'bg-pink-600', img: 'https://picsum.photos/id/11/400/200' },
    { id: 3, title: 'Rooftop Yoga Flow', location: 'Summit Heights', time: 'Tomorrow 7 AM', vibe: 'Wellness', color: 'bg-emerald-600', img: 'https://picsum.photos/id/12/400/200' },
  ];

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <header>
        <h2 className={`text-2xl font-bold italic ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Trending Vibes Nearby</h2>
        <p className={`${isDarkMode ? 'text-zinc-400' : 'text-slate-500'} text-sm`}>Don't miss out on what's happening right now.</p>
      </header>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className={`group relative rounded-3xl overflow-hidden border transition-all cursor-pointer shadow-lg ${isDarkMode ? 'bg-[#1E1B4B] border-white/5 hover:border-pink-500/50' : 'bg-white border-slate-200 hover:border-pink-400'}`}>
            <div className="h-32 overflow-hidden">
              <img src={event.img} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" alt={event.title} />
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{event.title}</h3>
                  <p className={`${isDarkMode ? 'text-zinc-400' : 'text-slate-500'} text-sm`}>{event.location} • <span className="text-pink-500 font-semibold">{event.time}</span></p>
                </div>
                <span className={`${event.color} px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest text-white`}>
                  {event.vibe}
                </span>
              </div>
              <div className="mt-4 flex items-center -space-x-2">
                <img src="https://picsum.photos/id/20/40/40" className="w-8 h-8 rounded-full border-2 border-[#1E1B4B]" alt="user" />
                <img src="https://picsum.photos/id/21/40/40" className="w-8 h-8 rounded-full border-2 border-[#1E1B4B]" alt="user" />
                <img src="https://picsum.photos/id/22/40/40" className="w-8 h-8 rounded-full border-2 border-[#1E1B4B]" alt="user" />
                <span className={`ml-4 text-xs font-medium ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>+12 others vibeing</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VibeFeedScreen;

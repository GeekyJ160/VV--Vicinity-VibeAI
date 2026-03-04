
import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { VibeUser, MapEvent } from '../types';
import { supabase } from '../supabaseClient';
import { MapPin, User, X, Heart, Calendar, Music, Palette, Utensils, PartyPopper, Info, Dices } from 'lucide-react';
import BoredomRouletteModal from '../components/BoredomRouletteModal';

interface MapScreenProps {
  isDarkMode: boolean;
}

const MapScreen: React.FC<MapScreenProps> = ({ isDarkMode }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [vibes, setVibes] = useState<VibeUser[]>([]);
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [selectedUser, setSelectedUser] = useState<VibeUser | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: isDarkMode 
        ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
        : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [0, 0],
      zoom: 2,
      attributionControl: false
    });

    return () => {
      map.current?.remove();
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setMyLocation({ lat: latitude, lng: longitude });
        
        if (map.current && !selectedUser && !selectedEvent) {
          map.current.flyTo({ center: [longitude, latitude], zoom: 14 });
        }

        // Update our location in Supabase
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            location: `SRID=4326;POINT(${longitude} ${latitude})`,
            updated_at: new Date().toISOString()
          });
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const fetchNearby = async () => {
      if (!myLocation) return;

      if (!supabase) {
        setVibes([
          { id: 'm1', name: 'Alex', vibe: 'Coffee & Code', lat: myLocation.lat + 0.01, lng: myLocation.lng + 0.01, avatar_url: 'https://picsum.photos/seed/alex/40/40', distance_meters: 1200, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone' },
          { id: 'm2', name: 'Sam', vibe: 'Live Music', lat: myLocation.lat - 0.01, lng: myLocation.lng - 0.01, avatar_url: 'https://picsum.photos/seed/sam/40/40', distance_meters: 800, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone' },
        ]);
        setEvents([
          { id: 'e1', title: 'Neon Nights Party', description: 'Underground electronic music event.', lat: myLocation.lat + 0.005, lng: myLocation.lng - 0.008, start_time: '2026-03-03T22:00:00Z', end_time: '2026-03-04T04:00:00Z', type: 'party', image_url: 'https://picsum.photos/seed/party/400/200', distance_meters: 600 },
          { id: 'e2', title: 'Street Art Exhibition', description: 'Local artists showcasing their latest work.', lat: myLocation.lat - 0.007, lng: myLocation.lng + 0.005, start_time: '2026-03-03T18:00:00Z', end_time: '2026-03-03T23:00:00Z', type: 'art', image_url: 'https://picsum.photos/seed/art/400/200', distance_meters: 900 }
        ]);
        return;
      }
      const { data, error } = await supabase.rpc('nearby_users', {
        lat: myLocation.lat,
        lng: myLocation.lng,
        radius_meters: 10000
      });

      if (error) {
        console.error('Error fetching nearby users:', error);
        setVibes([
          { id: 'm1', name: 'Alex', vibe: 'Coffee & Code', lat: myLocation.lat + 0.01, lng: myLocation.lng + 0.01, avatar_url: 'https://picsum.photos/seed/alex/40/40', distance_meters: 1200, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone' },
          { id: 'm2', name: 'Sam', vibe: 'Live Music', lat: myLocation.lat - 0.01, lng: myLocation.lng - 0.01, avatar_url: 'https://picsum.photos/seed/sam/40/40', distance_meters: 800, profile_privacy: 'everyone', chat_privacy: 'everyone', story_privacy: 'everyone' },
        ]);
      } else {
        setVibes(data || []);
      }

      // Mock events for now since we don't have an events table
      setEvents([
        { id: 'e1', title: 'Neon Nights Party', description: 'Underground electronic music event.', lat: myLocation.lat + 0.005, lng: myLocation.lng - 0.008, start_time: '2026-03-03T22:00:00Z', end_time: '2026-03-04T04:00:00Z', type: 'party', image_url: 'https://picsum.photos/seed/party/400/200', distance_meters: 600 },
        { id: 'e2', title: 'Street Art Exhibition', description: 'Local artists showcasing their latest work.', lat: myLocation.lat - 0.007, lng: myLocation.lng + 0.005, start_time: '2026-03-03T18:00:00Z', end_time: '2026-03-03T23:00:00Z', type: 'art', image_url: 'https://picsum.photos/seed/art/400/200', distance_meters: 900 }
      ]);
    };

    fetchNearby();
    const interval = setInterval(fetchNearby, 30000);
    return () => clearInterval(interval);
  }, [myLocation]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    vibes.forEach(v => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.width = '48px';
      el.style.height = '48px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid #e879f9';
      el.style.backgroundImage = `url(${v.avatar_url || 'https://picsum.photos/id/64/48/48'})`;
      el.style.backgroundSize = 'cover';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 0 20px rgba(232, 121, 249, 0.4)';
      el.style.transition = 'transform 0.2s ease';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new maplibregl.Marker(el)
        .setLngLat([v.lng, v.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        setSelectedEvent(null);
        setSelectedUser(v);
        map.current?.flyTo({ center: [v.lng, v.lat], zoom: 16 });
      });

      markers.current.push(marker);
    });

    // Add Event Markers
    events.forEach(e => {
      const el = document.createElement('div');
      el.className = 'event-marker';
      el.style.width = '36px';
      el.style.height = '36px';
      el.style.borderRadius = '12px';
      el.style.backgroundColor = '#141414';
      el.style.border = '2px solid #3b82f6'; // Blue for events
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = '#3b82f6';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.5)';
      el.style.transition = 'transform 0.2s ease';

      // Simple icon based on type
      let iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>'; // Calendar
      if (e.type === 'music') iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>';
      if (e.type === 'party') iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"></path><path d="M4 3h.01"></path><path d="M22 8h.01"></path><path d="M15 2h.01"></path><path d="M22 20h.01"></path><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"></path><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"></path><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"></path><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"></path></svg>';
      if (e.type === 'art') iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>';
      
      el.innerHTML = iconSvg;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      const marker = new maplibregl.Marker(el)
        .setLngLat([e.lng, e.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        setSelectedUser(null);
        setSelectedEvent(e);
        map.current?.flyTo({ center: [e.lng, e.lat], zoom: 16 });
      });

      markers.current.push(marker);
    });

    // Add self marker
    if (myLocation) {
      const selfEl = document.createElement('div');
      selfEl.className = 'self-marker';
      selfEl.style.width = '24px';
      selfEl.style.height = '24px';
      selfEl.style.borderRadius = '50%';
      selfEl.style.backgroundColor = '#22c55e';
      selfEl.style.border = '3px solid #0d0a1e';
      selfEl.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.6)';

      const selfMarker = new maplibregl.Marker(selfEl)
        .setLngLat([myLocation.lng, myLocation.lat])
        .addTo(map.current!);
      
      markers.current.push(selfMarker);
    }
  }, [vibes, events, myLocation]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'music': return <Music size={14} />;
      case 'party': return <PartyPopper size={14} />;
      case 'art': return <Palette size={14} />;
      case 'food': return <Utensils size={14} />;
      default: return <Calendar size={14} />;
    }
  };

  return (
    <div className="relative w-full h-full animate-in fade-in duration-500 pb-24">
      <div ref={mapContainer} className="w-full h-full rounded-[32px] overflow-hidden" />
      
      {/* Map Overlay Elements */}
      <div className="absolute top-5 left-5 right-5 flex justify-between items-center pointer-events-none z-10">
        <div className="bg-[#0d0a1e]/80 backdrop-blur-[16px] border border-white/10 px-[16px] py-[8px] rounded-[20px] pointer-events-auto shadow-lg flex gap-3">
          <span className="font-['Syne',sans-serif] font-[700] text-[14px] text-white flex items-center gap-1.5">
            <User size={14} className="text-[#e879f9]" />
            {vibes.length} Vibes
          </span>
          <div className="w-[1px] h-4 bg-white/20 self-center" />
          <span className="font-['Syne',sans-serif] font-[700] text-[14px] text-white flex items-center gap-1.5">
            <Calendar size={14} className="text-[#3b82f6]" />
            {events.length} Events
          </span>
        </div>
        <div className="flex flex-col gap-3 pointer-events-auto">
          <button 
            onClick={() => setIsRouletteOpen(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e879f9] to-[#a855f7] flex items-center justify-center shadow-[0_0_15px_rgba(232,121,249,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            <Dices size={20} className="text-white" />
          </button>
          <button 
            onClick={() => {
              if (myLocation && map.current) {
                map.current.flyTo({ center: [myLocation.lng, myLocation.lat], zoom: 14 });
              }
            }}
            className="w-10 h-10 rounded-full bg-[#0d0a1e]/80 backdrop-blur-[16px] border border-white/10 flex items-center justify-center shadow-lg hover:bg-white/10 transition-colors"
          >
            <MapPin size={18} className="text-[#e879f9]" />
          </button>
        </div>
      </div>

      {selectedUser && (
        <div className="absolute bottom-28 left-5 right-5 z-20 animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-[#141414]/95 backdrop-blur-[24px] border border-white/10 rounded-[24px] p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={selectedUser.avatar_url || 'https://picsum.photos/id/64/80/80'} 
                    className="w-[60px] h-[60px] rounded-full object-cover border-2 border-[#e879f9]" 
                    alt={selectedUser.name}
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#22c55e] border-2 border-[#141414]" />
                </div>
                <div>
                  <h3 className="font-['Syne',sans-serif] font-[800] text-[18px] text-white tracking-[-0.5px] leading-tight">
                    {selectedUser.name}
                  </h3>
                  <p className="font-['DM_Sans',sans-serif] font-[600] text-[12px] text-[#e879f9] mt-0.5">
                    {selectedUser.vibe}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <MapPin size={10} className="text-white/40" />
                    <span className="font-['DM_Sans',sans-serif] font-[600] text-[10px] text-white/40">
                      {Math.round(selectedUser.distance_meters || 0)}m away
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex gap-3">
              <button className="flex-1 py-[12px] rounded-[16px] bg-gradient-to-r from-[#e879f9] to-[#a855f7] text-white font-['DM_Sans',sans-serif] font-[700] text-[13px] shadow-[0_4px_14px_rgba(232,121,249,0.3)] active:scale-95 flex items-center justify-center gap-2 transition-transform border-none">
                <Heart size={16} fill="currentColor" />
                Vibe Sync
              </button>
              <button className="w-[48px] h-[48px] rounded-[16px] bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors active:scale-95">
                <User size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <div className="absolute bottom-28 left-5 right-5 z-20 animate-in slide-in-from-bottom-8 duration-300">
          <div className="bg-[#141414]/95 backdrop-blur-[24px] border border-white/10 rounded-[24px] overflow-hidden shadow-2xl flex flex-col">
            {selectedEvent.image_url && (
              <div className="h-32 w-full relative">
                <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141414] to-transparent" />
                <button 
                  onClick={() => setSelectedEvent(null)} 
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="p-5 pt-3 flex flex-col gap-3">
              {!selectedEvent.image_url && (
                <div className="flex justify-end">
                  <button 
                    onClick={() => setSelectedEvent(null)} 
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="px-2 py-1 rounded-md bg-[#3b82f6]/20 text-[#3b82f6] flex items-center gap-1 font-['DM_Sans',sans-serif] font-[700] text-[10px] uppercase tracking-wider">
                    {getEventIcon(selectedEvent.type)}
                    {selectedEvent.type}
                  </div>
                  <div className="flex items-center gap-1 text-white/40 font-['DM_Sans',sans-serif] font-[600] text-[10px]">
                    <MapPin size={10} />
                    {Math.round(selectedEvent.distance_meters || 0)}m away
                  </div>
                </div>
                <h3 className="font-['Syne',sans-serif] font-[800] text-[20px] text-white tracking-[-0.5px] leading-tight">
                  {selectedEvent.title}
                </h3>
                <p className="font-['DM_Sans',sans-serif] font-[400] text-[13px] text-white/70 mt-1 line-clamp-2">
                  {selectedEvent.description}
                </p>
              </div>
              
              <div className="flex gap-3 mt-1">
                <button className="flex-1 py-[12px] rounded-[16px] bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white font-['DM_Sans',sans-serif] font-[700] text-[13px] shadow-[0_4px_14px_rgba(59,130,246,0.3)] active:scale-95 flex items-center justify-center gap-2 transition-transform border-none">
                  <Info size={16} />
                  Event Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BoredomRouletteModal 
        isOpen={isRouletteOpen} 
        onClose={() => setIsRouletteOpen(false)} 
        location={myLocation} 
      />
    </div>
  );
};

export default MapScreen;


import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { VibeUser } from '../types';
import { supabase } from '../supabaseClient';

interface MapScreenProps {
  isDarkMode: boolean;
}

const MapScreen: React.FC<MapScreenProps> = ({ isDarkMode }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [vibes, setVibes] = useState<VibeUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<VibeUser | null>(null);
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
      zoom: 2
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

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
        
        if (map.current && !selectedUser) {
          map.current.flyTo({ center: [longitude, latitude], zoom: 14 });
        }

        // Update our location in Supabase
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

      const { data, error } = await supabase.rpc('nearby_users', {
        lat: myLocation.lat,
        lng: myLocation.lng,
        radius_meters: 10000
      });

      if (error) {
        console.error('Error fetching nearby users:', error);
        return;
      }

      setVibes(data || []);
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
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid #B44CFF';
      el.style.backgroundImage = `url(${v.avatar_url || 'https://picsum.photos/id/64/40/40'})`;
      el.style.backgroundSize = 'cover';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 0 15px rgba(180, 76, 255, 0.5)';

      const marker = new maplibregl.Marker(el)
        .setLngLat([v.lng, v.lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        setSelectedUser(v);
        map.current?.flyTo({ center: [v.lng, v.lat], zoom: 16 });
      });

      markers.current.push(marker);
    });

    // Add self marker
    if (myLocation) {
      const selfEl = document.createElement('div');
      selfEl.className = 'self-marker';
      selfEl.style.width = '20px';
      selfEl.style.height = '20px';
      selfEl.style.borderRadius = '50%';
      selfEl.style.backgroundColor = '#FF47A4';
      selfEl.style.border = '3px solid white';
      selfEl.style.boxShadow = '0 0 20px rgba(255, 71, 164, 0.8)';

      const selfMarker = new maplibregl.Marker(selfEl)
        .setLngLat([myLocation.lng, myLocation.lat])
        .addTo(map.current!);
      
      markers.current.push(selfMarker);
    }
  }, [vibes, myLocation]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {selectedUser && (
        <div className={`absolute bottom-6 left-6 right-6 p-6 backdrop-blur-xl rounded-[2.5rem] border shadow-2xl animate-in slide-in-from-bottom-8 duration-500 z-[70] ${isDarkMode ? 'bg-[#1E1B4B]/95 border-pink-500/30 text-white' : 'bg-white/95 border-slate-200 text-slate-900'}`}>
          <div className="flex items-center space-x-5">
            <img src={selectedUser.avatar_url || 'https://picsum.photos/id/64/80/80'} className="w-20 h-20 rounded-full border-4 border-pink-500 shadow-2xl" />
            <div className="flex-1">
              <h3 className="font-black text-xl italic tracking-tight">{selectedUser.name}</h3>
              <p className="text-pink-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{selectedUser.vibe}</p>
              <div className="text-[10px] font-bold opacity-60">
                📍 {Math.round(selectedUser.distance_meters || 0)}m AWAY
              </div>
            </div>
            <button onClick={() => setSelectedUser(null)} className="p-2 opacity-50 hover:opacity-100">✕</button>
          </div>
          <div className="mt-6 flex space-x-3">
            <button className="flex-[2] py-4 bg-gradient-to-r from-pink-600 to-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95">
              💜 CONNECT VIBE
            </button>
            <button className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest ${isDarkMode ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
              BIO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapScreen;

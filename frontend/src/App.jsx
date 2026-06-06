import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

// Hardcoded coordinates for Prayagraj (Mahakumbh Area) to represent our 10 Sectors
const SECTOR_COORDS = {
  1: [25.4358, 81.8463], 2: [25.4368, 81.8563], 3: [25.4258, 81.8463],
  4: [25.4288, 81.8593], 5: [25.4458, 81.8463], 6: [25.4358, 81.8663],
  7: [25.4158, 81.8463], 8: [25.4458, 81.8663], 9: [25.4258, 81.8763],
  10: [25.4358, 81.8863],
};

const API_BASE = "http://127.0.0.1:8000/api";

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [activeIncident, setActiveIncident] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch live incidents on load
  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/incidents`);
      setIncidents(res.data);
    } catch (error) {
      console.error("Error fetching incidents:", error);
    }
  };

  const handleOptimize = async (incident) => {
    setActiveIncident(incident);
    setLoading(true);
    try {
      // Trigger the FastAPI AI Engine
      const res = await axios.get(`${API_BASE}/optimize/${incident.id}`);
      setRecommendations(res.data);
    } catch (error) {
      console.error("Optimization failed:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-emerald-500 w-8 h-8" />
          <h1 className="text-xl font-bold tracking-wide">KumbhSaarthi<span className="text-emerald-500">.AI</span></h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="flex items-center gap-2 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Live
          </span>
          <span className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700">Active Incidents: {incidents.length}</span>
        </div>
      </header>

      {/* Main Dashboard Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 p-4 gap-4 overflow-hidden">

        {/* Left Column: Incident Feed */}
        <section className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden shadow-xl">
          <div className="p-4 border-b border-gray-800 flex items-center gap-2">
            <AlertTriangle className="text-amber-500 w-5 h-5" />
            <h2 className="font-semibold text-lg">Active Operational Alerts</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {incidents.length === 0 ? (
              <p className="text-gray-500 text-center mt-10">No pending incidents.</p>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => handleOptimize(inc)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${activeIncident?.id === inc.id ? 'bg-gray-800 border-emerald-500/50' : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : inc.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {inc.severity}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">Sector {inc.sector_id}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-200 mb-2">{inc.description}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Req: <span className="text-gray-300 font-semibold">{inc.required_skill}</span></span>
                    <button className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
                      Optimize <Zap className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Center/Right Column: Live Map & Dispatch */}
        <section className="lg:col-span-2 flex flex-col gap-4">

          {/* Top: Dispatch Recommendations */}
          {activeIncident && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 shadow-xl">
              <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" /> AI Dispatch Recommendations
              </h3>
              {loading ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="space-y-2"><div className="h-4 bg-gray-700 rounded"></div></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-gray-800 p-3 rounded-lg border border-gray-700 relative overflow-hidden">
                      {idx === 0 && <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">TOP MATCH</div>}
                      <h4 className="font-bold text-gray-100">{rec.volunteer.name}</h4>
                      <p className="text-xs text-gray-400 mb-2">{rec.volunteer.skills}</p>
                      <div className="flex justify-between text-xs mt-2 border-t border-gray-700 pt-2">
                        <span className="text-gray-400">Score: <span className="text-emerald-400 font-bold">{rec.match_score}</span></span>
                        <span className="text-gray-400">Sec: {rec.volunteer.current_sector_id}</span>
                      </div>
                      <button className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded transition-colors">
                        Deploy Unit
                      </button>
                    </div>
                  ))}
                  {recommendations.length === 0 && <p className="text-sm text-gray-500">No suitable volunteers found.</p>}
                </div>
              )}
            </div>
          )}

          {/* Bottom: Live Map */}
          <div className="flex-1 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden relative z-0 min-h-[400px]">
            <MapContainer center={[25.4358, 81.8463]} zoom={13} style={{ height: '100%', width: '100%' }}>
              {/* Dark mode map tiles from CartoDB */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              />
              {/* Plotting active incidents on the map */}
              {incidents.map((inc) => {
                const coords = SECTOR_COORDS[inc.sector_id] || [25.4358, 81.8463];
                const isCritical = inc.severity === 'CRITICAL';
                return (
                  <CircleMarker
                    key={inc.id}
                    center={coords}
                    radius={isCritical ? 12 : 8}
                    pathOptions={{
                      color: isCritical ? '#ef4444' : '#f59e0b',
                      fillColor: isCritical ? '#ef4444' : '#f59e0b',
                      fillOpacity: 0.6
                    }}
                  >
                    <Popup className="text-gray-900 font-sans">
                      <strong className="block mb-1">Sector {inc.sector_id} {inc.severity} Alert</strong>
                      {inc.description}
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        </section>

      </main>
    </div>
  );
}
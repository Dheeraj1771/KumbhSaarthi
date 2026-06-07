import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity, AlertTriangle, ShieldCheck, Zap, CheckCircle2, Clock, X, Users, Crosshair, UserPlus, HeartPulse, Megaphone } from 'lucide-react';

const SECTOR_COORDS = {
  1: [25.4358, 81.8463], 2: [25.4368, 81.8563], 3: [25.4258, 81.8463],
  4: [25.4288, 81.8593], 5: [25.4458, 81.8463], 6: [25.4358, 81.8663],
  7: [25.4158, 81.8463], 8: [25.4458, 81.8663], 9: [25.4258, 81.8763],
  10: [25.4358, 81.8863],
};

const API_BASE = "https://kumbhsaarthi.onrender.com/api";

const getSeverityColor = (severity) => severity === 'CRITICAL' ? '#ef4444' : severity === 'MEDIUM' ? '#f59e0b' : '#3b82f6';
const getSeverityBorderClass = (severity) => severity === 'CRITICAL' ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : severity === 'MEDIUM' ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]';
const getSeverityBgClass = (severity) => severity === 'CRITICAL' ? 'bg-red-500' : severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500';

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [activeIncident, setActiveIncident] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showVolunteers, setShowVolunteers] = useState(true);

  // Modals State
  const [showRecruitForm, setShowRecruitForm] = useState(false);
  const [newRecruit, setNewRecruit] = useState({ name: '', skills: 'Crowd Control', sector: 1 });
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [newIncident, setNewIncident] = useState({ description: '', skill: 'Crowd Control', severity: 'MEDIUM', sector: 1 });

  useEffect(() => {
    fetchIncidents();
    fetchVolunteers();
    const pollingTimer = setInterval(() => { fetchIncidents(); fetchVolunteers(); }, 10000);
    return () => clearInterval(pollingTimer);
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await axios.get(`${API_BASE}/incidents`);
      setIncidents(prev => JSON.stringify(prev) !== JSON.stringify(res.data) ? res.data : prev);
    } catch (error) { console.error(error); }
  };

  const fetchVolunteers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/volunteers`);
      setVolunteers(res.data);
    } catch (error) { console.error(error); }
  };

  const volunteerMarkers = useMemo(() => {
    return volunteers.map(vol => {
      const baseCoords = SECTOR_COORDS[vol.current_sector_id] || [25.4358, 81.8463];
      return { ...vol, coords: [baseCoords[0] + (Math.sin(vol.id * 100) * 0.008), baseCoords[1] + (Math.cos(vol.id * 100) * 0.008)] };
    });
  }, [volunteers]);

  const exhaustedCount = volunteers.filter(v => v.status === 'EXHAUSTED' || v.status === 'RESTING').length;

  const handleOptimize = async (incident) => {
    setActiveIncident(incident);
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/optimize/${incident.id}`);
      setRecommendations(res.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const handleDeploy = async (volunteer) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/deploy`, { incident_id: activeIncident.id, volunteer_id: volunteer.id });
      setIncidents(prev => prev.filter(inc => inc.id !== activeIncident.id));
      showToast(`Unit ${volunteer.name} successfully deployed to Sector ${activeIncident.sector_id}!`);
      setActiveIncident(null);
      setRecommendations([]);
      fetchVolunteers();
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const handleRecruitSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/volunteers`, { name: newRecruit.name, skills: newRecruit.skills, status: "AVAILABLE", current_sector_id: parseInt(newRecruit.sector), hours_worked: 0.0 });
      showToast(`Recruit ${newRecruit.name} added to grid.`);
      setShowRecruitForm(false);
      fetchVolunteers();
      setNewRecruit({ name: '', skills: 'Crowd Control', sector: 1 });
    } catch (error) { console.error(error); }
  };

  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/incidents`, { description: newIncident.description, required_skill: newIncident.skill, severity: newIncident.severity, sector_id: parseInt(newIncident.sector), status: "PENDING" });
      showToast(`New ${newIncident.severity} alert logged in Sector ${newIncident.sector}.`);
      setShowIncidentForm(false);
      fetchIncidents();
      setNewIncident({ description: '', skill: 'Crowd Control', severity: 'MEDIUM', sector: 1 });
    } catch (error) { console.error(error); }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans relative overflow-x-hidden">

      {/* Dynamic Style Injection to kill Leaflet's default white background canvas completely */}
      <style>{`
        .leaflet-container { background: #030712 !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 4px; }
      `}</style>

      {toast && (
        <div className="fixed top-24 right-6 z-[9999] bg-emerald-900/90 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <p className="font-medium text-sm">{toast}</p>
          <button onClick={() => setToast(null)} className="ml-2 text-emerald-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Recruitment Modal - Now Fixed, view-centered, and scrollable on small phone viewports */}
      {showRecruitForm && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><UserPlus className="text-blue-400 w-5 h-5" /> New Recruit</h3>
              <button onClick={() => setShowRecruitForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRecruitSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Full Name</label>
                <input required type="text" value={newRecruit.name} onChange={e => setNewRecruit({ ...newRecruit, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Primary Skill</label>
                <select value={newRecruit.skills} onChange={e => setNewRecruit({ ...newRecruit, skills: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option>Crowd Control</option>
                  <option>Medical Aid</option>
                  <option>Multilingual Translation</option>
                  <option>Logistics & Supply</option>
                  <option>Disaster Management</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Assign Sector (1-10)</label>
                <input required type="number" min="1" max="10" value={newRecruit.sector} onChange={e => setNewRecruit({ ...newRecruit, sector: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors mt-2">Initialize Unit</button>
            </form>
          </div>
        </div>
      )}

      {/* Incident Reporting Modal - Now Fixed, view-centered, and mobile safe */}
      {showIncidentForm && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-amber-900/50 rounded-xl p-6 w-full max-w-md shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-amber-400"><Megaphone className="w-5 h-5" /> Report Incident</h3>
              <button onClick={() => setShowIncidentForm(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleIncidentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Alert Description</label>
                <input required type="text" value={newIncident.description} onChange={e => setNewIncident({ ...newIncident, description: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" placeholder="e.g. Barricade collapse at main gate" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Required Skill</label>
                  <select value={newIncident.skill} onChange={e => setNewIncident({ ...newIncident, skill: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                    <option>Crowd Control</option>
                    <option>Medical Aid</option>
                    <option>Multilingual Translation</option>
                    <option>Logistics & Supply</option>
                    <option>Disaster Management</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Severity</label>
                  <select value={newIncident.severity} onChange={e => setNewIncident({ ...newIncident, severity: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Sector (1-10)</label>
                <input required type="number" min="1" max="10" value={newIncident.sector} onChange={e => setNewIncident({ ...newIncident, sector: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded transition-colors mt-2">Broadcast Alert</button>
            </form>
          </div>
        </div>
      )}

      {/* Header Panel - Optimized flex structure for small mobile screens */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 shadow-md gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-emerald-500 w-8 h-8" />
          <h1 className="text-xl font-bold tracking-wide">KumbhSaarthi<span className="text-emerald-500">.AI</span></h1>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium">

          <div className="flex items-center gap-4 bg-gray-800 px-4 py-1.5 rounded-full border border-gray-700 shadow-inner text-xs sm:text-sm">
            <span className="flex items-center gap-2 text-gray-300">
              Force: <span className="text-blue-400 font-bold">{volunteers.length}</span>
            </span>
            <span className="text-gray-600">|</span>
            <span className="flex items-center gap-1.5 text-gray-300">
              <HeartPulse className="w-3 h-3 text-red-400" /> Resting: <span className="text-red-400 font-bold">{exhaustedCount}</span>
            </span>
          </div>

          <button onClick={() => setShowRecruitForm(true)} className="flex items-center gap-2 bg-blue-600/20 text-blue-400 border border-blue-500/50 hover:bg-blue-600/40 px-3 py-1.5 rounded-full transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <UserPlus className="w-3.5 h-3.5" /> Recruit
          </button>

          <button onClick={() => setShowIncidentForm(true)} className="flex items-center gap-2 bg-amber-600/20 text-amber-400 border border-amber-500/50 hover:bg-amber-600/40 px-3 py-1.5 rounded-full transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <Megaphone className="w-3.5 h-3.5" /> Log Alert
          </button>
        </div>
      </header>

      {/* Main Container Grid - Responsive heights: dynamic viewport fill on desktop, natural scroll stacking on mobile */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 p-4 gap-4 h-auto lg:h-[calc(100vh-73px)] lg:overflow-hidden">

        {/* Left Side Feed Panel */}
        <section className="bg-gray-900/80 rounded-xl border border-gray-800 flex flex-col h-[450px] lg:h-full overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-500 w-5 h-5" />
              <h2 className="font-semibold text-lg">Operational Alerts</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-900/20">
            {incidents.length === 0 ? (
              <div className="text-gray-500 text-center mt-20 flex flex-col items-center gap-2">
                <ShieldCheck className="w-10 h-10 text-gray-700" />
                <p>All sectors secure. No pending incidents.</p>
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => handleOptimize(inc)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-300 border relative overflow-hidden group ${activeIncident?.id === inc.id ? `bg-gray-800 ${getSeverityBorderClass(inc.severity)} transform scale-[1.01]` : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800 hover:border-gray-500'}`}
                >
                  {activeIncident?.id === inc.id && <div className={`absolute left-0 top-0 bottom-0 w-1 ${getSeverityBgClass(inc.severity)}`}></div>}
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : inc.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                      {inc.severity}
                    </span>
                    <span className="text-xs text-gray-400 font-mono bg-gray-900 px-2 py-1 rounded">Sector {inc.sector_id}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-200 mb-3 leading-relaxed">{inc.description}</p>
                  <div className="flex justify-between items-center text-xs pt-3 border-t border-gray-700/50">
                    <span className="text-gray-400">Req: <span className="text-gray-300 font-semibold">{inc.required_skill}</span></span>
                    <span className={`font-semibold flex items-center gap-1 transition-colors ${activeIncident?.id === inc.id ? 'text-gray-200' : 'text-gray-500 group-hover:text-gray-300'}`}>
                      Optimize <Zap className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Side Map & Recommendation Column */}
        <section className="lg:col-span-2 flex flex-col gap-4 h-full">

          {activeIncident && (
            <div className="bg-gray-900/90 rounded-xl border border-gray-800 p-5 shadow-2xl backdrop-blur-sm animate-in slide-in-from-top-4 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
                  <Activity className="w-5 h-5" /> AI Dispatch Recommendations
                </h3>
                <span className="text-xs text-gray-500 font-mono">Target: Sector {activeIncident.sector_id}</span>
              </div>

              {loading ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                    <div className="space-y-2"><div className="h-10 bg-gray-700 rounded"></div></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 relative overflow-hidden flex flex-col">
                      {idx === 0 && <div className="absolute top-0 right-0 bg-emerald-500 text-gray-950 text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-sm">TOP MATCH</div>}
                      <h4 className="font-bold text-gray-100 text-lg">{rec.volunteer.name}</h4>
                      <p className="text-xs text-gray-400 mb-3 mt-1 h-8">{rec.volunteer.skills}</p>
                      <div className="flex justify-between text-xs mb-4 bg-gray-900 p-2 rounded">
                        <span className="text-gray-400">Score: <span className="text-emerald-400 font-bold text-sm">{rec.match_score}</span></span>
                        <span className="text-gray-400">Loc: Sec {rec.volunteer.current_sector_id}</span>
                      </div>
                      <button
                        onClick={() => handleDeploy(rec.volunteer)}
                        className={`w-full mt-auto text-sm font-bold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${idx === 0 ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}
                      >
                        Deploy Unit <Zap className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {recommendations.length === 0 && <p className="text-sm text-gray-500 col-span-3 text-center py-4">No suitable volunteers found in database.</p>}
                </div>
              )}
            </div>
          )}

          {/* Map Section Wrapper - Bounded strict backgrounds and dimensions */}
          <div className="flex-1 bg-gray-950 rounded-xl border border-gray-800 overflow-hidden relative z-0 min-h-[380px] lg:min-h-0 h-[450px] lg:h-full shadow-inner">
            <MapContainer center={[25.4358, 81.8463]} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CartoDB' />

              {showVolunteers && volunteerMarkers.map((vol) => {
                const recData = recommendations.find(r => r.volunteer.id === vol.id);
                const isRecommended = !!recData;
                const isIncidentActive = activeIncident !== null;
                const radius = isRecommended ? 12 : 4;
                const color = isRecommended ? '#10b981' : '#3b82f6';
                const fillColor = isRecommended ? '#34d399' : '#60a5fa';
                const fillOpacity = isRecommended ? 1.0 : (isIncidentActive ? 0.15 : (vol.status === 'EXHAUSTED' ? 0.2 : 0.8));
                const weight = isRecommended ? 3 : 1;

                return (
                  <CircleMarker key={`vol-${vol.id}`} center={vol.coords} radius={radius} pathOptions={{ color, fillColor, fillOpacity, weight }}>
                    <Popup className="text-gray-900 font-sans min-w-[160px]">
                      <div className="flex justify-between items-center mb-1 border-b pb-1">
                        <strong className="block text-sm">{vol.name}</strong>
                        {isRecommended && <Crosshair className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="text-xs space-y-1 mt-2">
                        <p><span className="font-semibold text-gray-500">Sector:</span> {vol.current_sector_id}</p>
                        <p><span className="font-semibold text-gray-500">Status:</span> <span className={`${vol.status === 'EXHAUSTED' ? 'text-red-500 font-bold' : 'text-blue-600'}`}>{vol.status}</span></p>
                        <p><span className="font-semibold text-gray-500">Skills:</span> {vol.skills}</p>
                      </div>
                      {isRecommended && (
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <p className="text-emerald-700 font-bold text-xs mb-2">AI Match Score: {recData.match_score}</p>
                          <button onClick={() => handleDeploy(vol)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase font-bold py-1.5 rounded transition-colors shadow-sm">Execute Deployment</button>
                        </div>
                      )}
                    </Popup>
                  </CircleMarker>
                );
              })}

              {incidents.map((inc) => {
                const coords = SECTOR_COORDS[inc.sector_id] || [25.4358, 81.8463];
                const isActive = activeIncident?.id === inc.id;
                const markerColor = getSeverityColor(inc.severity);
                return (
                  <CircleMarker key={`inc-${inc.id}`} center={coords} radius={isActive ? 20 : (inc.severity === 'CRITICAL' ? 10 : inc.severity === 'MEDIUM' ? 8 : 6)} pathOptions={{ color: isActive ? '#ffffff' : markerColor, fillColor: markerColor, fillOpacity: isActive ? 1.0 : 0.6, weight: isActive ? 3 : 1 }}>
                    <Popup className="text-gray-900 font-sans">
                      <strong className="block mb-1">Sector {inc.sector_id} Alert</strong>{inc.description}
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Map Legend - Shifted slightly and sized dynamically for mobile layouts */}
            <div className="absolute bottom-4 left-4 z-[400] bg-gray-900/90 border border-gray-800 p-3 rounded-lg backdrop-blur-md max-w-[260px] sm:max-w-none">
              <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-2 gap-2">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Map Legend</h4>
                <button onClick={() => setShowVolunteers(!showVolunteers)} className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${showVolunteers ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                  <Users className="w-2.5 h-2.5" /> {showVolunteers ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <div className="flex flex-col gap-1.5 text-[11px] text-gray-300">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-80"></div> Critical</div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 opacity-80"></div> Available Unit</div>
                </div>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-80"></div> Medium</div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-blue-500 opacity-80"></div> Low</div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full border border-emerald-500 bg-emerald-400"></div> AI Top Match</div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
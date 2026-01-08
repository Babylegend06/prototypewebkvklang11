import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WashingMachine, Clock, DollarSign, Wrench } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function KioskHome() {
  const [machines, setMachines] = useState([]);
  const navigate = useNavigate();

  const fetchMachines = async () => {
    try {
      const response = await axios.get(`${API}/machines`);
      setMachines(response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  useEffect(() => {
    fetchMachines();
    const interval = setInterval(fetchMachines, 2000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      available: { text: 'Tersedia', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '✓' },
      washing: { text: 'Sedang Basuh', class: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: '⏳' },
      broken: { text: 'Under Maintenance', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: '🔧' }
    };
    return badges[status] || badges.available;
  };

  const handleMachineClick = (machine) => {
    if (machine.status === 'available') {
      navigate(`/payment/${machine.machine_id}`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-slate-950 to-indigo-950/20"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)'
      }}></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <WashingMachine className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="fredoka text-6xl sm:text-7xl bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
            Smart Dobi
          </h1>
          <p className="text-slate-400 text-lg">Pilih mesin yang tersedia untuk memulakan</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {machines.map((machine, index) => {
            const badge = getStatusBadge(machine.status);
            const isAvailable = machine.status === 'available';
            const isWashing = machine.status === 'washing';
            const isBroken = machine.status === 'broken';

            return (
              <motion.div
                key={machine.machine_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleMachineClick(machine)}
                className={`
                  relative bg-slate-900/50 backdrop-blur-xl border rounded-3xl p-6 
                  transition-all duration-300
                  ${
                    isAvailable 
                      ? 'border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-500/10 cursor-pointer hover:scale-105' 
                      : isBroken
                      ? 'border-amber-500/20 opacity-60 cursor-not-allowed'
                      : 'border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                  }
                `}
                data-testid={`machine-card-${machine.machine_id}`}
              >
                {isWashing && (
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 animate-pulse"></div>
                )}
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        isAvailable ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                        isWashing ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 animate-pulse' :
                        'bg-gradient-to-br from-amber-500 to-orange-600'
                      }`}>
                        {isBroken ? (
                          <Wrench className="w-7 h-7 text-white" />
                        ) : (
                          <WashingMachine className="w-7 h-7 text-white" />
                        )}
                      </div>
                      <div>
                        <h2 className="fredoka text-2xl text-slate-100">
                          Mesin {machine.machine_id}
                        </h2>
                        <p className="text-slate-400 text-sm capitalize">{machine.machine_type}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border mb-4 ${badge.class}`} data-testid={`machine-${machine.machine_id}-status`}>
                    <span>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-t border-slate-800">
                      <div className="flex items-center gap-2 text-slate-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium text-sm">Harga</span>
                      </div>
                      <span className="fredoka text-xl text-cyan-400">RM {machine.price.toFixed(2)}</span>
                    </div>

                    {isWashing && machine.time_remaining > 0 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between py-3 border-t border-slate-800"
                      >
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium text-sm">Masa Tinggal</span>
                        </div>
                        <CountdownTimer initialSeconds={machine.time_remaining} />
                      </motion.div>
                    )}
                  </div>

                  {isAvailable && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                      data-testid={`select-machine-${machine.machine_id}-btn`}
                    >
                      Pilih Mesin Ini
                    </motion.button>
                  )}
                  
                  {isBroken && (
                    <div className="w-full mt-6 bg-amber-500/10 text-amber-400 font-semibold py-3 rounded-xl text-center border border-amber-500/20">
                      Dalam Penyelenggaraan
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10"
        >
          <a
            href="/login"
            className="text-slate-500 hover:text-cyan-400 transition-colors text-sm"
            data-testid="owner-login-link"
          >
            Owner Login
          </a>
        </motion.div>
      </div>
    </div>
  );
}

function CountdownTimer({ initialSeconds }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) return;
    
    const interval = setInterval(() => {
      setSeconds(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${String(remainingSecs).padStart(2, '0')}`;
  };

  return (
    <span className="fredoka text-xl text-cyan-400 tabular-nums">
      {formatTime(seconds)}
    </span>
  );
}
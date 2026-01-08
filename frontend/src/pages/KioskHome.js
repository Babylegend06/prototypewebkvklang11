import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WashingMachine, Clock, DollarSign } from 'lucide-react';
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
      available: { text: 'Tersedia', class: 'status-available', icon: '✓' },
      washing: { text: 'Sedang Basuh', class: 'status-washing', icon: '⏳' },
      broken: { text: 'Rosak', class: 'status-broken', icon: '✕' }
    };
    return badges[status] || badges.available;
  };

  const handleMachineClick = (machine) => {
    if (machine.status === 'available') {
      navigate(`/payment/${machine.machine_id}`);
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url('https://images.unsplash.com/photo-1643960988248-53fd45e0a3af?crop=entropy&cs=srgb&fm=jpg&q=85')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="fredoka text-5xl sm:text-6xl text-slate-800 mb-3">
            Smart Dobi
          </h1>
          <p className="text-slate-600 text-lg">Pilih mesin yang tersedia untuk memulakan</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {machines.map((machine, index) => {
            const badge = getStatusBadge(machine.status);
            const isAvailable = machine.status === 'available';

            return (
              <motion.div
                key={machine.machine_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleMachineClick(machine)}
                className={`glass-card rounded-3xl p-8 transition-all duration-300 ${
                  isAvailable ? 'cursor-pointer hover:scale-105' : 'opacity-70 cursor-not-allowed'
                }`}
                data-testid={`machine-card-${machine.machine_id}`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-cyan-500 flex items-center justify-center">
                      <WashingMachine className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="fredoka text-3xl text-slate-800">
                        Mesin {machine.machine_id}
                      </h2>
                      <p className="text-slate-500 text-sm capitalize">{machine.machine_type}</p>
                    </div>
                  </div>
                  <div className={`status-badge ${badge.class}`} data-testid={`machine-${machine.machine_id}-status`}>
                    <span>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign className="w-5 h-5" />
                      <span className="font-medium">Harga</span>
                    </div>
                    <span className="fredoka text-2xl text-cyan-600">RM {machine.price.toFixed(2)}</span>
                  </div>

                  {machine.status === 'washing' && machine.time_remaining > 0 && (
                    <div className="flex items-center justify-between py-3 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">Masa Tinggal</span>
                      </div>
                      <span className="fredoka text-xl text-amber-600">
                        {Math.floor(machine.time_remaining / 60)}:{String(machine.time_remaining % 60).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                </div>

                {isAvailable && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full mt-6 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold py-4 rounded-2xl transition-colors"
                    data-testid={`select-machine-${machine.machine_id}-btn`}
                  >
                    Pilih Mesin Ini
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <a
            href="/login"
            className="text-slate-500 hover:text-cyan-600 transition-colors text-sm"
            data-testid="owner-login-link"
          >
            Owner Login
          </a>
        </motion.div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WashingMachine, Clock, DollarSign, Wrench, Sparkles, Zap, Info, X, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function KioskHome() {
  const [machines, setMachines] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
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
    // Check if first time visitor
    const hasVisited = localStorage.getItem('smart_dobi_visited');
    if (!hasVisited) {
      setShowOnboarding(true);
      localStorage.setItem('smart_dobi_visited', 'true');
    }

    fetchMachines();
    const interval = setInterval(fetchMachines, 2000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      available: { text: 'Tersedia', class: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: <Sparkles className="w-4 h-4" /> },
      washing: { text: 'Sedang Basuh', class: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 animate-pulse', icon: <Zap className="w-4 h-4" /> },
      reserved: { text: 'Direserve', class: 'bg-purple-500/20 text-purple-400 border-purple-500/40', icon: <Clock className="w-4 h-4" /> },
      broken: { text: 'Under Maintenance', class: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: <Wrench className="w-4 h-4" /> }
    };
    return badges[status] || badges.broken;
  };

  const handleMachineClick = (machine) => {
    if (machine.status === 'available') {
      navigate(`/payment/${machine.machine_id}`);
    }
  };

  const availableCount = machines.filter(m => m.status === 'available').length;
  const workingCount = machines.filter(m => m.status === 'washing').length;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-indigo-950/30"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)'
        }}></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowOnboarding(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-2xl w-full relative"
            >
              <button
                onClick={() => setShowOnboarding(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <WashingMachine className="w-10 h-10 text-white" />
                </div>
                <h2 className="fredoka text-4xl bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Selamat Datang!
                </h2>
                <p className="text-slate-400 text-lg">Cara guna Smart Dobi sangat mudah</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4 bg-slate-800/50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 font-bold text-white">
                    1
                  </div>
                  <div>
                    <h3 className="text-slate-100 font-semibold mb-1">Pilih Mesin Tersedia</h3>
                    <p className="text-slate-400 text-sm">Mesin dengan label hijau "Tersedia" boleh dipilih</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-slate-800/50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 font-bold text-white">
                    2
                  </div>
                  <div>
                    <h3 className="text-slate-100 font-semibold mb-1">Scan QR & Bayar</h3>
                    <p className="text-slate-400 text-sm">Scan QR code dengan app banking (Demo: tekan sahkan)</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-slate-800/50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 font-bold text-white">
                    3
                  </div>
                  <div>
                    <h3 className="text-slate-100 font-semibold mb-1">LED Berkelip = Masuk Baju</h3>
                    <p className="text-slate-400 text-sm">Bila LED berkelip, pergi ke mesin dan masukkan pakaian</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-slate-800/50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 font-bold text-white">
                    4
                  </div>
                  <div>
                    <h3 className="text-slate-100 font-semibold mb-1">Tekan START di Mesin</h3>
                    <p className="text-slate-400 text-sm">Tekan button START. LED jadi solid dan mesin mula basuh</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowOnboarding(false)}
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2"
              >
                <span>Saya Faham, Mulakan!</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <WashingMachine className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="fredoka text-4xl bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Smart Dobi
                </h1>
                <p className="text-slate-500 text-sm">Self-Service Laundry System</p>
              </div>
            </motion.div>
            
            <div className="flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setShowOnboarding(true)}
                className="group px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 rounded-xl transition-all duration-300 flex items-center gap-2"
                data-testid="help-btn"
              >
                <Info className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-slate-300 group-hover:text-indigo-400 transition-colors font-medium hidden sm:inline">Panduan</span>
              </motion.button>

              <motion.a
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                href="/instructions"
                className="group px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl transition-all duration-300 flex items-center gap-2"
                data-testid="instructions-link"
              >
                <Info className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-slate-300 group-hover:text-cyan-400 transition-colors font-medium hidden sm:inline">Arahan</span>
              </motion.a>
            </div>
          </div>

          {/* Status Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Tersedia</p>
                  <p className="fredoka text-2xl text-emerald-400">{availableCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Beroperasi</p>
                  <p className="fredoka text-2xl text-cyan-400">{workingCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Harga</p>
                  <p className="fredoka text-2xl text-purple-400">RM 5</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs">Masa</p>
                  <p className="fredoka text-2xl text-indigo-400">30m</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Info Banner */}
          {availableCount === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-amber-900/20 border border-amber-500/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <p className="text-amber-200">
                  Semua mesin sedang digunakan atau dalam maintenance. Sila tunggu sebentar.
                </p>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <h2 className="text-slate-400 text-lg mb-2">Pilih mesin yang tersedia</h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <span className="text-slate-400 text-sm">Status Real-Time</span>
            </div>
          </motion.div>

          {/* Machine Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
            <AnimatePresence>
              {machines.map((machine, index) => (
                <MachineCard
                  key={machine.machine_id}
                  machine={machine}
                  index={index}
                  onSelect={handleMachineClick}
                  getStatusBadge={getStatusBadge}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Owner Login */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-center"
          >
            <a
              href="/login"
              className="group px-8 py-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl transition-all duration-300 flex items-center gap-3"
              data-testid="owner-login-link"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 group-hover:animate-pulse"></div>
              <span className="text-slate-300 group-hover:text-cyan-400 transition-colors font-medium">Owner Login</span>
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function MachineCard({ machine, index, onSelect, getStatusBadge }) {
  const badge = getStatusBadge(machine.status);
  const isAvailable = machine.status === 'available';
  const isWashing = machine.status === 'washing';
  const isBroken = machine.status === 'broken';
  const isReserved = machine.status === 'reserved';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => onSelect(machine)}
      className={`
        relative group
        bg-gradient-to-br from-slate-900/80 to-slate-900/50 
        backdrop-blur-xl border rounded-2xl p-6 
        transition-all duration-500
        ${
          isAvailable 
            ? 'border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-500/20 cursor-pointer hover:scale-105 hover:-translate-y-2' 
            : isBroken || isReserved
            ? 'border-amber-500/20 opacity-70'
            : 'border-cyan-500/30 shadow-lg shadow-cyan-500/10'
        }
      `}
      data-testid={`machine-card-${machine.machine_id}`}
    >
      {isWashing && (
        <>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 animate-pulse"></div>
          <div className="absolute -top-1 -right-1 w-20 h-20 bg-cyan-500/20 rounded-full blur-2xl"></div>
        </>
      )}
      
      {isAvailable && (
        <div className="absolute -top-1 -right-1 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-all"></div>
      )}
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isAvailable ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30' :
                isWashing ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/30' :
                'bg-gradient-to-br from-amber-500 to-orange-600'
              }`}
            >
              {isBroken || isReserved ? (
                <Wrench className="w-6 h-6 text-white" />
              ) : (
                <WashingMachine className="w-6 h-6 text-white" />
              )}
            </motion.div>
            <div>
              <h3 className="fredoka text-xl text-slate-100">
                Mesin {machine.machine_id}
              </h3>
              <p className="text-slate-500 text-xs capitalize">{machine.machine_type}</p>
            </div>
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border mb-4 ${badge.class}`} data-testid={`machine-${machine.machine_id}-status`}>
          {badge.icon}
          <span>{badge.text}</span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between py-2 border-t border-slate-800/50">
            <div className="flex items-center gap-2 text-slate-400">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium text-xs">Harga</span>
            </div>
            <span className="fredoka text-lg text-cyan-400">RM {machine.price.toFixed(2)}</span>
          </div>

          {isWashing && machine.time_remaining > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center justify-between py-2 border-t border-slate-800/50"
            >
              <div className="flex items-center gap-2 text-slate-400">
                <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
                <span className="font-medium text-xs">Masa Tinggal</span>
              </div>
              <CountdownTimer initialSeconds={machine.time_remaining} />
            </motion.div>
          )}
        </div>

        {isAvailable && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
            data-testid={`select-machine-${machine.machine_id}-btn`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              Pilih Mesin Ini
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          </motion.button>
        )}
        
        {isBroken && (
          <div className="w-full bg-amber-500/10 text-amber-400 font-semibold py-3 rounded-xl text-center border border-amber-500/30 text-sm">
            Dalam Penyelenggaraan
          </div>
        )}

        {isReserved && (
          <div className="w-full bg-purple-500/10 text-purple-400 font-semibold py-3 rounded-xl text-center border border-purple-500/30 text-sm">
            Menunggu Pembayaran
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CountdownTimer({ initialSeconds }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (seconds <= 30) return 'text-rose-400 animate-pulse';
    if (seconds <= 60) return 'text-amber-400';
    return 'text-cyan-400';
  };

  return (
    <span className={`fredoka text-lg tabular-nums ${getTimerColor()} transition-colors`}>
      {formatTime(seconds)}
    </span>
  );
}

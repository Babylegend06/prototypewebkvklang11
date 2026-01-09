import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WashingMachine, ArrowRight, Zap, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WaitingPage() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [machineStatus, setMachineStatus] = useState('waiting');
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`${API}/machines/${machineId}`);
        const machine = response.data;
        
        setMachineStatus(machine.status);
        if (machine.status === 'washing' && machine.time_remaining > 0) {
          setTimeRemaining(machine.time_remaining);
        }
      } catch (error) {
        console.error('Error checking machine:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    
    return () => clearInterval(interval);
  }, [machineId]);

  const handleGoHome = () => {
    navigate('/');
  };

  const getStepStatus = () => {
    if (machineStatus === 'washing' && timeRemaining > 0) {
      return {
        step: 3,
        title: 'Mesin Sedang Beroperasi',
        icon: <CheckCircle className="w-12 h-12" />,
        color: 'from-emerald-500 to-emerald-600'
      };
    }
    return {
      step: 2,
      title: 'Menunggu Anda Tekan START',
      icon: <Zap className="w-12 h-12\" />,
      color: 'from-amber-500 to-amber-600'
    };
  };

  const currentStep = getStepStatus();

  return (
    <div className=\"min-h-screen bg-slate-950 relative overflow-hidden\">
      <div className=\"absolute inset-0\">
        <div className=\"absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-indigo-950/30\"></div>
        <div className=\"absolute inset-0\" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)'
        }}></div>
      </div>

      <div className=\"relative z-10 container mx-auto px-4 py-8\">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className=\"text-center mb-8\"
        >
          <h1 className=\"fredoka text-5xl bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3\">
            Mesin {machineId}
          </h1>
          <p className=\"text-slate-400 text-lg\">Ikuti arahan di bawah</p>
        </motion.div>

        <div className=\"max-w-4xl mx-auto\">
          {/* Progress Steps */}
          <div className=\"flex items-center justify-center gap-4 mb-12\">
            {[1, 2, 3].map((step) => (
              <div key={step} className=\"flex items-center\">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                  step <= currentStep.step
                    ? 'bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 ${
                    step < currentStep.step ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className=\"bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 mb-8\"
          >
            <div className=\"text-center mb-8\">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: \"easeInOut\"
                }}
                className={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${currentStep.color} flex items-center justify-center shadow-lg`}
              >
                <div className=\"text-white\">
                  {currentStep.icon}
                </div>
              </motion.div>
              
              <h2 className=\"fredoka text-3xl text-slate-100 mb-3\">
                {currentStep.title}
              </h2>
            </div>

            {machineStatus === 'washing' && timeRemaining > 0 ? (
              // Machine is running
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className=\"space-y-6\"
              >
                <div className=\"flex items-center justify-center gap-4 mb-6\">
                  <Clock className=\"w-8 h-8 text-cyan-400 animate-pulse\" />
                  <div>
                    <p className=\"text-slate-400 text-sm\">Masa Tinggal:</p>
                    <p className=\"fredoka text-5xl text-cyan-400\">
                      {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                    </p>
                  </div>
                </div>

                <div className=\"bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6\">
                  <div className=\"flex items-start gap-3\">
                    <CheckCircle className=\"w-6 h-6 text-emerald-400 flex-shrink-0 mt-1\" />
                    <div className=\"text-emerald-200\">
                      <p className=\"font-semibold mb-2\">Mesin Sedang Beroperasi</p>
                      <ul className=\"space-y-1 text-sm\">
                        <li>\u2713 Basuhan akan siap dalam {Math.ceil(timeRemaining / 60)} minit</li>
                        <li>\u2713 Anda akan terima notifikasi bila hampir siap</li>
                        <li>\u2713 Sila tunggu di kawasan berhampiran</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGoHome}
                  className=\"w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-3 rounded-xl transition-all\"
                >
                  Kembali ke Homepage
                </button>
              </motion.div>
            ) : (
              // Waiting for START button
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className=\"space-y-6\"
              >
                {/* GIF/Animation */}
                <div className=\"bg-slate-800/50 rounded-2xl p-8 mb-6\">
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                    }}
                    transition={{ 
                      duration: 1.5,
                      repeat: Infinity,
                      ease: \"easeInOut\"
                    }}
                    className=\"text-center\"
                  >
                    <div className=\"w-48 h-48 mx-auto mb-4 relative\">
                      {/* Animated Washing Machine Icon */}
                      <motion.div
                        animate={{ 
                          rotate: [0, 360],
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: \"linear\"
                        }}
                        className=\"absolute inset-0 flex items-center justify-center\"
                      >
                        <div className=\"w-32 h-32 rounded-full border-8 border-cyan-500 border-t-transparent\"></div>
                      </motion.div>
                      
                      <div className=\"absolute inset-0 flex items-center justify-center\">
                        <WashingMachine className=\"w-20 h-20 text-cyan-400\" />
                      </div>
                    </div>
                    
                    <p className=\"text-slate-300 text-lg font-semibold\">
                      Mesin Siap Menerima Pakaian Anda
                    </p>
                  </motion.div>
                </div>

                {/* Instructions */}
                <div className=\"space-y-4\">
                  <div className=\"bg-amber-900/20 border border-amber-500/30 rounded-xl p-6\">
                    <div className=\"flex items-start gap-4\">
                      <div className=\"w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 font-bold text-white text-xl shadow-lg\">
                        1
                      </div>
                      <div>
                        <h3 className=\"text-amber-200 font-semibold text-lg mb-2\">
                          \ud83d\udca1 LED Berkelip = Signal Untuk Anda
                        </h3>
                        <p className=\"text-amber-200/80 text-sm\">
                          Pergi ke Mesin {machineId}. LED akan berkelip sebagai signal bahawa mesin ready untuk anda.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className=\"bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-6\">
                    <div className=\"flex items-start gap-4\">
                      <div className=\"w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0 font-bold text-white text-xl shadow-lg\">
                        2
                      </div>
                      <div>
                        <h3 className=\"text-indigo-200 font-semibold text-lg mb-2\">
                          \ud83e\uddfa Masukkan Pakaian Anda
                        </h3>
                        <p className=\"text-indigo-200/80 text-sm\">
                          Buka pintu mesin dan masukkan pakaian yang ingin dibasuh. Pastikan tidak terlalu penuh.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className=\"bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6\">
                    <div className=\"flex items-start gap-4\">
                      <div className=\"w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 font-bold text-white text-xl shadow-lg\">
                        3
                      </div>
                      <div>
                        <h3 className=\"text-emerald-200 font-semibold text-lg mb-2\">
                          \u25b6\ufe0f Tekan Button START
                        </h3>
                        <p className=\"text-emerald-200/80 text-sm\">
                          Tekan button START pada mesin. LED akan bertukar dari berkelip ke solid (tidak berkelip). Mesin akan mula beroperasi.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className=\"bg-cyan-900/20 border border-cyan-500/30 rounded-xl p-6 mt-6\">
                  <div className=\"flex items-center gap-3\">
                    <motion.div
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Zap className=\"w-6 h-6 text-cyan-400\" />
                    </motion.div>
                    <p className=\"text-cyan-200 text-sm\">
                      <strong>Tip:</strong> Bila anda tekan START, LED akan jadi solid dan mesin akan start automatically. Anda boleh pergi dan akan terima notifikasi bila hampir siap!
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoHome}
                  className=\"w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2\"
                >
                  <span>Saya Faham</span>
                  <ArrowRight className=\"w-5 h-5\" />
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

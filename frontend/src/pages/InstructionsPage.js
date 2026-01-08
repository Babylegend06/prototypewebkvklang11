import { motion } from 'framer-motion';
import { ArrowLeft, Smartphone, CreditCard, WashingMachine, Bell, CheckCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InstructionsPage() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: <WashingMachine className="w-8 h-8" />,
      title: "1. Pilih Mesin",
      description: "Pilih mesin yang menunjukkan status 'Tersedia' (hijau)",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "2. Scan & Bayar",
      description: "Scan QR code untuk bayaran (simulasi untuk demo)",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "3. Masukkan WhatsApp",
      description: "Masukkan nombor WhatsApp untuk notifikasi",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <Info className="w-8 h-8" />,
      title: "4. Tunggu LED Berkelip",
      description: "Selepas bayaran, LED pada mesin akan berkelip",
      color: "from-cyan-500 to-cyan-600"
    },
    {
      icon: <WashingMachine className="w-8 h-8" />,
      title: "5. Masukkan Baju",
      description: "Bila LED berkelip, masukkan pakaian ke dalam mesin",
      color: "from-indigo-500 to-indigo-600"
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "6. Tekan START",
      description: "Tekan button START pada mesin. LED akan jadi solid (tidak berkelip)",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "7. Terima Notifikasi",
      description: "Anda akan terima WhatsApp bila hampir siap dan bila siap",
      color: "from-green-500 to-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-indigo-950/30"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)'
        }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-8"
          data-testid="back-to-home-btn"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Kiosk</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="fredoka text-5xl bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
            Cara Guna Smart Dobi
          </h1>
          <p className="text-slate-400 text-lg">Ikuti langkah-langkah mudah ini</p>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300"
              data-testid={`instruction-step-${index + 1}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <div className="text-white">
                    {step.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="fredoka text-2xl text-slate-100 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-lg">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="max-w-4xl mx-auto mt-12 bg-gradient-to-br from-cyan-900/20 to-indigo-900/20 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8"
        >
          <h2 className="fredoka text-3xl text-cyan-400 mb-4 flex items-center gap-3">
            <Info className="w-8 h-8" />
            Nota Penting
          </h2>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 text-xl">💡</span>
              <span><strong>LED Berkelip</strong> = Signal untuk customer masuk baju & tekan START</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 text-xl">💡</span>
              <span><strong>LED Solid (tidak berkelip)</strong> = Mesin sedang basuh</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 text-xl">💡</span>
              <span><strong>LED Mati</strong> = Mesin siap / tersedia</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 text-xl">📱</span>
              <span>Anda akan terima <strong>3 WhatsApp</strong>: (1) Start, (2) Hampir siap, (3) Siap</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-cyan-400 text-xl">⏱️</span>
              <span>Masa basuh: <strong>30 minit</strong> (2 minit untuk demo)</span>
            </li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-12"
        >
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
            data-testid="start-now-btn"
          >
            Mulakan Sekarang
          </button>
        </motion.div>
      </div>
    </div>
  );
}
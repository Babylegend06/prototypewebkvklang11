import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, ArrowLeft, Check, AlertCircle, Smartphone, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PaymentPage() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [skipWhatsapp, setSkipWhatsapp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, verified
  const [showQR, setShowQR] = useState(true);

  useEffect(() => {
    const fetchMachine = async () => {
      try {
        const response = await axios.get(`${API}/machines/${machineId}`);
        setMachine(response.data);
        if (response.data.status !== 'available') {
          toast.error('Mesin tidak tersedia');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching machine:', error);
        toast.error('Ralat mendapatkan maklumat mesin');
        navigate('/');
      }
    };
    fetchMachine();
  }, [machineId, navigate]);

  const validateWhatsApp = (number) => {
    if (!number || number.trim() === '') return true; // OK if empty
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleReserveMachine = async () => {
    if (!skipWhatsapp && whatsappNumber && !validateWhatsApp(whatsappNumber)) {
      toast.error('Nombor WhatsApp tidak sah. Gunakan format: 0123456789');
      return;
    }

    setIsProcessing(true);
    try {
      await axios.post(`${API}/machines/${machineId}/start`, {
        whatsapp_number: skipWhatsapp ? null : whatsappNumber || null,
        amount: machine.price
      });

      toast.success('Mesin telah direserve!');
      setShowQR(true);
      setPaymentStatus('pending');
    } catch (error) {
      console.error('Error reserving machine:', error);
      toast.error('Ralat reserve mesin. Sila cuba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyPayment = async () => {
    setIsProcessing(true);
    try {
      await axios.post(`${API}/machines/${machineId}/verify-payment`, {
        verified: true
      });

      setPaymentStatus('verified');
      toast.success('Pembayaran berjaya disahkan!');
      
      setTimeout(() => {
        navigate(`/waiting/${machineId}`);
      }, 1500);
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Ralat sahkan pembayaran.');
      setIsProcessing(false);
    }
  };

  const handleCancelPayment = async () => {
    try {
      await axios.post(`${API}/machines/${machineId}/verify-payment`, {
        verified: false
      });
      toast.info('Pembayaran dibatalkan');
      navigate('/');
    } catch (error) {
      console.error('Error cancelling:', error);
      navigate('/');
    }
  };

  if (!machine) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Memuatkan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-slate-950 to-indigo-950/30"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)'
        }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        <button
          onClick={handleCancelPayment}
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-6"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="fredoka text-4xl bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Pembayaran Mesin {machineId}
            </h1>
            <p className="text-slate-400">Ikuti langkah di bawah</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {paymentStatus === 'pending' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-6"
              >
                {/* WhatsApp Input */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Smartphone className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-slate-100 font-semibold text-lg mb-1">
                        Nombor WhatsApp (Pilihan)
                      </h3>
                      <p className="text-slate-400 text-sm mb-4">
                        Anda akan menerima notifikasi bila mesin hampir siap dan siap. Boleh skip jika tidak mahu.
                      </p>
                      
                      {!skipWhatsapp ? (
                        <div>
                          <input
                            type="tel"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value)}
                            placeholder="Contoh: 0123456789"
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 focus:border-cyan-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                            data-testid="whatsapp-input"
                          />
                          <button
                            onClick={() => setSkipWhatsapp(true)}
                            className="mt-3 text-slate-400 hover:text-cyan-400 text-sm transition-colors"
                          >
                            Skip (Tidak perlu notifikasi)
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4">
                          <span className="text-slate-400">Tanpa notifikasi WhatsApp</span>
                          <button
                            onClick={() => setSkipWhatsapp(false)}
                            className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                          >
                            Tambah WhatsApp
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Price */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-cyan-900/20 to-indigo-900/20 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium text-lg">Jumlah Bayaran:</span>
                    <span className="fredoka text-4xl text-cyan-400">RM {machine.price.toFixed(2)}</span>
                  </div>
                </motion.div>

                {/* Reserve Button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReserveMachine}
                  disabled={isProcessing || (!skipWhatsapp && whatsappNumber && !validateWhatsApp(whatsappNumber))}
                  className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2"
                  data-testid="reserve-btn"
                >
                  {isProcessing ? (
                    <span>Memproses...</span>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Teruskan ke Pembayaran</span>
                    </>
                  )}
                </motion.button>

                {/* Disclaimer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4"
                >
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="text-sm text-amber-200/80">
                      <strong>Disclaimer:</strong> WhatsApp adalah pilihan. Anda tetap boleh menggunakan mesin tanpa memberikan nombor telefon. Notifikasi hanya dihantar jika anda berikan nombor.
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR Code Payment Section */}
          <AnimatePresence>
            {showQR && paymentStatus === 'pending' && !isProcessing && whatsappNumber !== '' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8"
              >
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-sm font-semibold mb-4">
                    <AlertCircle className="w-4 h-4" />
                    <span>Belum Bayar</span>
                  </div>
                  <h3 className="text-slate-100 text-2xl font-bold mb-2">Scan QR Code Untuk Bayar</h3>
                  <p className="text-slate-400">Gunakan app banking anda</p>
                </div>

                <div className="bg-white rounded-2xl p-8 mb-6 flex flex-col items-center">
                  <div className="w-64 h-64 bg-white rounded-xl mb-4 flex items-center justify-center border-4 border-slate-200">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SmartDobiPayment_M${machineId}_RM${machine.price}`}
                      alt="QR Code"
                      className="w-full h-full"
                      data-testid="qr-code"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <QrCode className="w-5 h-5" />
                    <span className="text-sm">Scan dengan app banking</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerifyPayment}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 flex items-center justify-center gap-2"
                    data-testid="verify-payment-btn"
                  >
                    <Check className="w-5 h-5" />
                    <span>Sahkan Pembayaran</span>
                  </motion.button>

                  <button
                    onClick={handleCancelPayment}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    data-testid="cancel-payment-btn"
                  >
                    <X className="w-5 h-5" />
                    <span>Batal</span>
                  </button>
                </div>

                <div className="mt-6 text-center text-slate-500 text-sm">
                  <p>💡 Ini adalah simulasi untuk demo.</p>
                  <p>Tekan "Sahkan Pembayaran" selepas scan QR.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
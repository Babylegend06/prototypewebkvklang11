import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, ArrowLeft, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PaymentPage() {
  const { machineId } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleApprove = async () => {
    if (!validateWhatsApp(whatsappNumber)) {
      toast.error('Nombor WhatsApp tidak sah. Gunakan format: 0123456789');
      return;
    }

    setIsProcessing(true);
    try {
      await axios.post(`${API}/machines/${machineId}/start`, {
        whatsapp_number: whatsappNumber,
        amount: machine.price
      });

      toast.success('Pembayaran berjaya! Mesin akan bermula sebentar lagi.');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error starting machine:', error);
      toast.error('Ralat memulakan mesin. Sila cuba lagi.');
      setIsProcessing(false);
    }
  };

  if (!machine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-slate-600">Memuatkan...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-cyan-600 transition-colors mb-6"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8"
        >
          <div className="text-center mb-8">
            <h1 className="fredoka text-4xl text-slate-800 mb-2">
              Pembayaran Mesin {machineId}
            </h1>
            <p className="text-slate-600">Imbas QR code untuk bayar</p>
          </div>

          <div className="bg-white rounded-2xl p-8 mb-6 flex flex-col items-center">
            <div className="w-64 h-64 bg-white rounded-xl mb-4 flex items-center justify-center border-4 border-slate-200">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SmartDobiPaymentSim"
                alt="QR Code"
                className="w-full h-full"
                data-testid="qr-code"
              />
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <QrCode className="w-5 h-5" />
              <span className="text-sm">Simulasi Pembayaran</span>
            </div>
          </div>

          <div className="bg-cyan-50 rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-medium">Jumlah Bayaran:</span>
              <span className="fredoka text-3xl text-cyan-600">RM {machine.price.toFixed(2)}</span>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-slate-700 font-medium mb-3">
              Nombor WhatsApp untuk notifikasi:
            </label>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="Contoh: 0123456789"
              className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 focus:border-cyan-500 focus:outline-none text-lg"
              data-testid="whatsapp-input"
            />
            <p className="text-slate-500 text-sm mt-2">
              Anda akan menerima notifikasi WhatsApp apabila basuhan hampir siap dan selesai.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApprove}
            disabled={isProcessing || !whatsappNumber}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-300 text-white font-semibold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
            data-testid="approve-payment-btn"
          >
            {isProcessing ? (
              <span>Memproses...</span>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Sahkan Pembayaran</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
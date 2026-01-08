import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      try {
        const hash = location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          toast.error('Session ID tidak dijumpai');
          navigate('/login');
          return;
        }

        const response = await axios.post(
          `${API}/auth/session`,
          { session_id: sessionId },
          { withCredentials: true }
        );

        toast.success(`Selamat datang, ${response.data.user.name}!`);
        navigate('/dashboard', { 
          state: { user: response.data.user },
          replace: true 
        });
      } catch (error) {
        console.error('Auth error:', error);
        toast.error('Ralat pengesahan. Sila cuba lagi.');
        navigate('/login');
      }
    };

    processSession();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-400">Memproses pengesahan...</p>
      </div>
    </div>
  );
}
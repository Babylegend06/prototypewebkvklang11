import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Activity, 
  DollarSign, 
  TrendingUp, 
  WashingMachine,
  LogOut,
  Home,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [machines, setMachines] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [userRes, statsRes, txnRes, machinesRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { withCredentials: true }),
        axios.get(`${API}/dashboard/stats`, { withCredentials: true }),
        axios.get(`${API}/transactions`, { withCredentials: true }),
        axios.get(`${API}/machines`)
      ]);
      
      setUser(userRes.data);
      setStats(statsRes.data);
      setTransactions(txnRes.data);
      setMachines(machinesRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      toast.success('Berjaya log keluar');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Ralat log keluar');
    }
  };

  const handleMachineStatusChange = async (machineId, newStatus) => {
    try {
      await axios.patch(
        `${API}/machines/${machineId}/admin-status`,
        { status: newStatus },
        { withCredentials: true }
      );
      toast.success(`Machine ${machineId} status updated to ${newStatus}`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating machine status:', error);
      toast.error('Failed to update machine status');
    }
  };

  if (!user || !stats) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Memuatkan dashboard...</p>
        </div>
      </div>
    );
  }

  const chartData = transactions.slice(0, 10).reverse().map((txn, idx) => ({
    name: `#${idx + 1}`,
    revenue: txn.amount
  }));

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={user.picture || 'https://via.placeholder.com/40'}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h2 className="text-slate-50 font-semibold">{user.name}</h2>
                <p className="text-slate-400 text-sm">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white transition-colors"
                data-testid="view-kiosk-btn"
              >
                <Home className="w-4 h-4" />
                <span>Kiosk</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="fredoka text-4xl text-slate-50 mb-2">Owner Dashboard</h1>
          <p className="text-slate-400">Pantau operasi dan pendapatan real-time</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Mesin Aktif"
            value={stats.active_machines}
            icon={<WashingMachine className="w-6 h-6" />}
            color="indigo"
            testId="stat-active-machines"
          />
          <StatCard
            title="Jumlah Pendapatan"
            value={`RM ${stats.total_revenue.toFixed(2)}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="emerald"
            testId="stat-total-revenue"
          />
          <StatCard
            title="Jumlah Kitaran"
            value={stats.total_cycles}
            icon={<Activity className="w-6 h-6" />}
            color="cyan"
            testId="stat-total-cycles"
          />
          <StatCard
            title="Hari Ini"
            value={`RM ${stats.today_revenue.toFixed(2)}`}
            subtitle={`${stats.today_cycles} kitaran`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="amber"
            testId="stat-today-revenue"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h3 className="text-slate-50 font-semibold text-lg">Trend Pendapatan</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
          >
            <h3 className="text-slate-50 font-semibold text-lg mb-4">Status Mesin</h3>
            <div className="space-y-3">
              {machines.map((machine) => (
                <div
                  key={machine.machine_id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                  data-testid={`dashboard-machine-${machine.machine_id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="fredoka text-white">{machine.machine_id}</span>
                    </div>
                    <div>
                      <p className="text-slate-300 font-medium">Mesin {machine.machine_id}</p>
                      <p className="text-slate-500 text-sm capitalize">{machine.machine_type}</p>
                    </div>
                  </div>
                  <div>
                    {machine.status === 'available' && (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
                        Tersedia
                      </span>
                    )}
                    {machine.status === 'washing' && (
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">
                        Sedang Basuh
                      </span>
                    )}
                    {machine.status === 'broken' && (
                      <span className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-sm">
                        Rosak
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
        >
          <h3 className="text-slate-50 font-semibold text-lg mb-4">Transaksi Terkini</h3>
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="transactions-table">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">ID Transaksi</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Mesin</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Jumlah</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">WhatsApp</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Masa</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 10).map((txn) => (
                  <tr key={txn.transaction_id} className="border-b border-slate-800/50">
                    <td className="py-3 px-4">
                      <span className="jetbrains text-slate-300 text-sm">{txn.transaction_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300">Mesin {txn.machine_id}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-400 font-semibold">RM {txn.amount.toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="jetbrains text-slate-400 text-sm">{txn.whatsapp_number}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-400 text-sm">
                        {new Date(txn.timestamp).toLocaleString('ms-MY')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                Tiada transaksi lagi
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon, color, testId }) {
  const colors = {
    indigo: 'from-indigo-600 to-indigo-500',
    emerald: 'from-emerald-600 to-emerald-500',
    cyan: 'from-cyan-600 to-cyan-500',
    amber: 'from-amber-600 to-amber-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
      data-testid={testId}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <h3 className="text-slate-400 text-sm mb-1">{title}</h3>
      <p className="fredoka text-2xl text-slate-50">{value}</p>
      {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
    </motion.div>
  );
}
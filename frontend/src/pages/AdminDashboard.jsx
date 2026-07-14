import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
const COLORS = ['#3b82f6', '#eab308', '#10b981', '#a855f7'];
import { 
  BarChart3, 
  Users, 
  FileCheck, 
  DollarSign, 
  ClipboardCheck, 
  Check, 
  X as XIcon, 
  Search,
  Download,
  Shield,
  Activity,
  Award,
  Clock,
  LogOut
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  
  // Analytics State
  const [analytics, setAnalytics] = useState({
    total_applications: 0,
    total_revenue: 0,
    status_counts: [],
    type_counts: [],
    monthly_trend: [],
    monthly_revenue: [],
    revenue_by_type: [],
    appointment_status_counts: [],
    expert_workloads: [],
    avg_processing_days: 0
  });

  // Users State
  const [usersList, setUsersList] = useState([]);
  
  // Active queue
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  // Search filters
  const [searchUser, setSearchUser] = useState('');
  const [searchApp, setSearchApp] = useState('');

  // official actions
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAnalytics();
    fetchUsers();
    fetchApplicationsQueue();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error("Failed to load analytics", err);
    }
  };

    const fetchUsers = async () => {
      try {
        const res = await axios.get('/admin/users');
        setUsersList(res.data);
      } catch (err) {
        console.error("Failed to load users list", err);
      }
    };

    const handleApproveUser = async (userId) => {
      try {
        await axios.patch(`/admin/users/${userId}/approve`);
        setSuccess('Staff account approved successfully.');
        fetchUsers(); // Refresh the list
      } catch (err) {
        alert('Failed to approve user.');
      }
    };

  const fetchApplicationsQueue = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/applications', { params: { status: 'all', per_page: 100 } });
      // Handle both paginated { data: [...] } and plain array responses
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setApplications(list.filter(app => app.status !== 'draft'));
    } catch (err) {
      console.error("Failed to load applications list", err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (statusVal, message) => {
    if (!remarks.trim()) {
      alert('Please specify official audit remarks for this action.');
      return;
    }
    try {
      await axios.patch(`/applications/${selectedApp.id}/status`, {
        status: statusVal,
        remarks: remarks
      });
      setSuccess(message);
      setRemarks('');
      setSelectedApp(null);
      fetchAnalytics();
      fetchApplicationsQueue();
    } catch (err) {
      alert('Action failed.');
    }
  };

  // Simulated digital certificate generation
  const handleDownloadCertificate = (app) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 1. Draw borders
    doc.setDrawColor(234, 179, 8); // Gold border
    doc.setLineWidth(1);
    doc.rect(10, 10, 190, 277);
    
    doc.setDrawColor(15, 23, 42); // Inner Slate border
    doc.setLineWidth(0.5);
    doc.rect(12, 12, 186, 273);

    // 2. Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text("GOVERNMENT OF INDIA", 105, 35, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text("OFFICE OF THE INTELLECTUAL PROPERTY FACILITATION CENTRE", 105, 42, { align: "center" });
    
    // Gold Divider line
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.75);
    doc.line(30, 48, 180, 48);

    // 3. Certificate Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(2, 132, 199); // Sky blue
    doc.text("CERTIFICATE OF REGISTRATION", 105, 62, { align: "center" });

    // 4. Legal Subtext
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text("This is to certify that the intellectual property described below has been officially", 105, 74, { align: "center" });
    doc.text("registered and granted legal protection under the provisions of the IPFC Act, India.", 105, 79, { align: "center" });

    // 5. Details Card Box
    doc.setFillColor(248, 250, 252); // Light gray background
    doc.setDrawColor(226, 232, 240); // Slate-200 border
    doc.rect(20, 88, 170, 110, 'FD');

    // Details Grid Layout
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    
    // Left Label column
    doc.text("Registration / Patent ID:", 25, 100);
    doc.text("Application Number:", 25, 112);
    doc.text("IP Category Type:", 25, 124);
    doc.text("IP Title:", 25, 136);
    doc.text("Applicant / Owner:", 25, 158);
    doc.text("Official Date of Grant:", 25, 170);
    doc.text("Filing Expiry Date:", 25, 182);

    // Right Value column
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);

    // Registration ID in bold blue
    doc.setFont("helvetica", "bold");
    doc.setTextColor(2, 132, 199);
    doc.text(app.registration_id || "AWAITING-GRANT", 75, 100);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(app.application_number || "N/A", 75, 112);
    doc.text((app.type || "N/A").toUpperCase(), 75, 124);

    // Handle multi-line title wrapping
    const titleText = app.title || "N/A";
    const wrappedTitle = doc.splitTextToSize(titleText, 105);
    doc.text(wrappedTitle, 75, 136);

    doc.text(app.applicant?.full_name || "N/A", 75, 158);
    doc.text(app.granted_at ? new Date(app.granted_at).toLocaleDateString() : new Date().toLocaleDateString(), 75, 170);
    doc.text(app.expiry_date ? new Date(app.expiry_date).toLocaleDateString() : "N/A", 75, 182);

    // 6. Gold Seal
    doc.setFillColor(234, 179, 8); // Gold
    doc.circle(45, 232, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("GOVERNMENT", 45, 230, { align: "center" });
    doc.text("OF INDIA", 45, 233, { align: "center" });
    doc.text("IPFC SEAL", 45, 236, { align: "center" });

    // 7. Signature stamp
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text("Digitally Signed & Certified by", 150, 226, { align: "center" });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(2, 132, 199);
    doc.text("Controller General of IPFC", 150, 232, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("IPFCMS/GOV/IN-SECURE-KEY", 150, 238, { align: "center" });

    // 8. Footer disclaimer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("This document is generated automatically under legislative compliance guidelines. Valid without physical signature.", 105, 275, { align: "center" });

    // 9. Save PDF
    doc.save(`IPFC_Certificate_${app.application_number}.pdf`);
  };

  const filteredUsers = (usersList || []).filter(u => (u.name?.toLowerCase() || '').includes(searchUser.toLowerCase()) || (u.email?.toLowerCase() || '').includes(searchUser.toLowerCase()));
  const filteredApps = applications.filter(a => (a.title?.toLowerCase() || '').includes(searchApp.toLowerCase()) || (a.application_number?.toLowerCase() || '').includes(searchApp.toLowerCase()));

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0f172a] text-slate-100">
      <div className="bg-orbs"></div>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto z-10 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto w-full animate-fade-in space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <div>
              <span className="text-xs font-mono font-bold text-primary-400 uppercase tracking-widest">Administrative Control</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">IPFCMS Executive Console</h1>
              <p className="text-slate-400 mt-1">Monitor filings, audit payments, configure system settings and issue certificates.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold text-red-400 uppercase flex items-center gap-2">
                <Shield className="w-4 h-4" /> Admin: {user?.name}
              </div>
              <button 
                onClick={logout} 
                className="p-2 bg-slate-800 hover:bg-red-500/10 border border-white/5 rounded-xl text-slate-400 hover:text-red-400 transition-colors" 
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl font-medium">
              {success}
            </div>
          )}

          {/* Stats Analytics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard icon={Users} label="Total Users" value={usersList.length} color="blue" />
            <StatCard icon={ClipboardCheck} label="Queue Length" value={applications.length} color="yellow" />
            <StatCard icon={Award} label="Approved Filings" value={applications.filter(a => a.status === 'Approved').length} color="green" />
            <StatCard icon={DollarSign} label="Revenue" value={`₹ ${parseFloat(analytics.total_revenue || 0).toLocaleString('en-IN')}`} color="red" />
            <StatCard icon={Clock} label="Approval Speed" value={`${analytics.avg_processing_days || 0} Days`} color="blue" />
          </div>

          {/* User management + charts grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* User List Table */}
            <div className="xl:col-span-2 glass-card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-400" /> Platform Registered Members
                </h3>
                <div className="relative max-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="input-field pl-9 text-xs py-1.5"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 text-xs uppercase font-bold tracking-wider">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Role Privilege</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Joined Date</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-white/5 text-xs">
                    {filteredUsers.map(userItem => (
                      <tr key={userItem.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 font-bold text-white">{userItem.name}</td>
                        <td className="py-3 font-mono">{userItem.email}</td>
                        <td className="py-3 uppercase font-bold">
                          <span className={`px-2 py-0.5 rounded text-[9px] ${
                            userItem.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            userItem.role === 'staff' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                            'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>{userItem.role}</span>
                        </td>
                        <td className="py-3">
                          {userItem.is_approved ? (
                            <span className="text-green-400 text-[10px] font-bold uppercase flex items-center gap-1"><Check className="w-3 h-3" /> Approved</span>
                          ) : (
                            <span className="text-yellow-400 text-[10px] font-bold uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-500">{new Date(userItem.created_at).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          {(!userItem.is_approved && (userItem.role === 'staff' || userItem.role === 'expert')) && (
                            <button 
                              onClick={() => handleApproveUser(userItem.id)}
                              className="bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-bold py-1 px-3 rounded-lg"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Application Category analytics & Revenue Split */}
            <div className="space-y-6">
              <div className="glass-card">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary-400" /> Filing Types Distribution
                </h3>
                <div className="space-y-4">
                  <ProgressItem label="Patents Filed" count={applications.filter(a => a.type === 'patent').length} total={applications.length} color="blue" />
                  <ProgressItem label="Trademarks Filed" count={applications.filter(a => a.type === 'trademark').length} total={applications.length} color="yellow" />
                  <ProgressItem label="Copyrights Filed" count={applications.filter(a => a.type === 'copyright').length} total={applications.length} color="green" />
                  <ProgressItem label="Industrial Designs Filed" count={applications.filter(a => a.type === 'design').length} total={applications.length} color="purple" />
                </div>
              </div>

              {/* Revenue Split Chart */}
              {analytics.revenue_by_type && analytics.revenue_by_type.length > 0 && (
                <div className="glass-card">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary-400" /> Revenue Split by IP Type
                  </h3>
                  <div className="h-[180px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.revenue_by_type}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="total"
                          nameKey="type"
                        >
                          {analytics.revenue_by_type.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${parseFloat(value).toLocaleString('en-IN')}`} contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around text-[10px] text-slate-400 pt-2 border-t border-white/5">
                    {analytics.revenue_by_type.map((entry, index) => (
                      <div key={entry.type} className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="capitalize">{entry.type}: ₹{parseFloat(entry.total).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Visual Analytics Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Monthly Trends */}
            <div className="glass-card">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-400" /> Monthly Submissions & Trend
              </h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...(analytics.monthly_trend || [])].reverse()}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Filings Count" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Expert workloads */}
            <div className="glass-card">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-400" /> Expert Consultation Workloads
              </h3>
              <div className="h-[280px]">
                {(!analytics.expert_workloads || analytics.expert_workloads.length === 0) ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                    No active expert consultation workload records.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.expert_workloads}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                      <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} name="Active Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Active Audit Filings Queue */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Filings Queue */}
            <div className="xl:col-span-1 glass-card">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Filing Verification Queue</h3>
                <input 
                  type="text" 
                  placeholder="Search filings..." 
                  value={searchApp}
                  onChange={(e) => setSearchApp(e.target.value)}
                  className="input-field max-w-[150px] text-xs py-1.5 pl-3"
                />
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredApps.map(app => (
                  <div 
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`p-4 rounded-2xl border cursor-pointer hover:border-primary-500/20 transition-all ${selectedApp?.id === app.id ? 'border-primary-500/40 bg-primary-500/5' : 'border-white/5 bg-slate-900/20'}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono text-slate-400">{app.application_number}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                        app.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        app.status === 'Approved by Staff' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse' :
                        app.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>{app.status === 'Approved by Staff' ? 'Awaiting Gov Approval' : app.status}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-2 truncate">{app.title}</h4>
                    <div className="flex justify-between mt-3 text-[10px] text-slate-500">
                      <span className="uppercase font-bold">{app.type}</span>
                      <span>₹ {app.payment_amount} Paid</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details & Actions Pane */}
            <div className="xl:col-span-2">
              {selectedApp ? (
                <div className="glass-card p-6 space-y-6 animate-slide-up">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono text-primary-400">{selectedApp.application_number}</span>
                      <h3 className="text-2xl font-bold text-white mt-1">{selectedApp.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">Filed by: {selectedApp.applicant?.full_name || 'Owner'}</p>
                    </div>
                    <span className="bg-slate-800 border border-white/5 px-3 py-1 rounded text-xs font-bold text-slate-300 uppercase">
                      {selectedApp.type}
                    </span>
                  </div>

                  <div className="space-y-4 bg-slate-900/50 p-5 rounded-2xl border border-white/5 text-xs text-slate-300">
                    <h4 className="text-sm font-bold text-white pb-2 border-b border-white/5 uppercase">Executive Particulars</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><span className="text-slate-500">Filing Status:</span> <span className="font-bold text-white">{selectedApp.status === 'Approved by Staff' ? 'Awaiting Gov Approval' : selectedApp.status}</span></div>
                      <div><span className="text-slate-500">Statutory payment:</span> {selectedApp.payment_status} (₹ {selectedApp.payment_amount})</div>
                      <div><span className="text-slate-500">Applicant type:</span> {selectedApp.applicant?.applicant_type}</div>
                      <div><span className="text-slate-500">Nationality:</span> {selectedApp.applicant?.nationality}</div>
                    </div>

                    {selectedApp.registration_id && (
                      <div className="border-t border-white/5 pt-4 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-slate-500 block">Registration ID:</span>
                          <span className="font-mono text-green-400 font-bold">{selectedApp.registration_id}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Granted On:</span>
                          <span className="text-white font-bold">{new Date(selectedApp.granted_at).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Expiry Date:</span>
                          <span className="text-white font-bold">{new Date(selectedApp.expiry_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <h4 className="text-sm font-bold text-white">Execute Final Executive Ruling</h4>
                    <textarea 
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="input-field text-xs min-h-[80px]"
                      placeholder="Specify executive ruling details, approval certificates, or rejection remarks..."
                    ></textarea>

                    <div className="flex justify-between items-center pt-2">
                      {selectedApp.status === 'Approved' ? (
                        <button 
                          onClick={() => handleDownloadCertificate(selectedApp)}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-xl text-xs flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Download Digital Certificate
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Certificate generated after official approval</span>
                      )}

                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleAction('Rejected', 'Application status updated to Rejected.')}
                          className="border border-red-500/20 hover:bg-red-500/10 text-red-400 font-bold py-2 px-6 rounded-xl text-xs"
                        >
                          Reject Filing
                        </button>
                        <button 
                          onClick={() => handleAction('Approved', 'Application status updated to Approved.')}
                          className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-2 px-6 rounded-xl text-xs"
                        >
                          Approve & Issue Certificate
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="glass-card h-[400px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10">
                  <ClipboardCheck className="w-12 h-12 mb-3 text-slate-600" />
                  <p className="text-sm">Select an active filing from the left queue to execute executive review rulings</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'text-blue-400 bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20',
    yellow: 'text-yellow-400 bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20',
    green: 'text-green-400 bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20',
    red: 'text-red-400 bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20',
  };
  return (
    <div className="glass-card flex items-center gap-5">
      <div className={`p-4 rounded-2xl ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-slate-400 text-xs font-medium">{label}</p>
        <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
      </div>
    </div>
  );
};

const ProgressItem = ({ label, count, total, color }) => {
  const progressPercent = total > 0 ? (count / total) * 100 : 0;
  const colors = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };
  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex justify-between font-semibold">
        <span className="text-slate-400">{label}</span>
        <span className="text-white">{count} ({Math.round(progressPercent)}%)</span>
      </div>
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div className={`h-full ${colors[color]}`} style={{ width: `${progressPercent}%` }}></div>
      </div>
    </div>
  );
};

export default AdminDashboard;

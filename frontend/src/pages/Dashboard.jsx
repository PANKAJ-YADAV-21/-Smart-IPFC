import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Bell,
  Settings,
  CreditCard,
  MessageSquare,
  Search,
  Calendar,
  Send,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  DollarSign,
  ArrowLeft,
  Loader2,
  Award
} from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // App States
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, attention: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search and Detail state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);

  // Document upload state
  const [docCategory, setDocCategory] = useState('Technical Specification');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Appointment state
  const [appointments, setAppointments] = useState([]);
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [apptType, setApptType] = useState('online');
  const [apptNotes, setApptNotes] = useState('');

  // Payment state
  const [payments, setPayments] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentAppId, setPaymentAppId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('5000');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [checkoutApp, setCheckoutApp] = useState(null);

  const getAppStatutoryFee = (app) => {
    if (!app) return 0;
    switch (app.type) {
      case 'patent': return 15000;
      case 'trademark': return 5000;
      case 'copyright': return 3000;
      default: return 8000; // design
    }
  };

  const handlePaymentSuccess = () => {
    setCheckoutApp(null);
    setSuccess('Payment successfully completed!');
    fetchPayments();
    fetchApplications();
    if (selectedApp) {
      axios.get(`/applications/${selectedApp.id}`).then(res => {
        setSelectedApp(res.data);
      }).catch(err => console.error(err));
    }
  };

  // Chat/Messages state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);

  // Load resources
  useEffect(() => {
    fetchApplications();
    fetchAppointments();
    fetchPayments();
    fetchChatMessages();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await axios.delete('/notifications');
      fetchNotifications();
    } catch (err) {
      console.error("Failed to clear notifications", err);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/applications');
      // Handle both paginated { data: [...] } and plain array responses
      const apps = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setApplications(apps);

      setStats({
        total: apps.length,
        pending: apps.filter(a => ['draft', 'submitted', 'In Review'].includes(a.status)).length,
        approved: apps.filter(a => a.status === 'Approved').length,
        attention: apps.filter(a => a.status === 'Corrections Requested').length,
      });
    } catch (err) {
      console.error("Failed to fetch applications", err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error("Failed to fetch appointments", err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await axios.get('/payments');
      setPayments(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to fetch payments", err);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const res = await axios.get('/chat');
      setChatMessages(res.data);
    } catch (err) {
      console.error("Failed to fetch chat messages", err);
    }
  };

  // Submit new appointment
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('/appointments', {
        appointment_date: apptDate,
        type: apptType,
        notes: apptNotes
      });
      setSuccess('Appointment booked successfully!');
      setApptDate('');
      setApptNotes('');
      setShowApptModal(false);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    }
  };

  // Cancel Appointment
  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await axios.delete(`/appointments/${id}`);
      setSuccess('Appointment cancelled successfully.');
      fetchAppointments();
    } catch (err) {
      setError('Failed to cancel appointment.');
    }
  };

  // Document upload
  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert('Please select a file to upload');
    setUploadingDoc(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', docCategory);
    if (selectedApp) {
      formData.append('ip_application_id', selectedApp.id);
    }

    try {
      await axios.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Document uploaded successfully!');
      setSelectedFile(null);
      // Reload application details to reflect new document
      if (selectedApp) {
        const updatedApp = await axios.get(`/applications/${selectedApp.id}`);
        setSelectedApp(updatedApp.data);
      }
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Download Document
  const handleDownloadDoc = (id, filename) => {
    axios({
      url: `/documents/${id}/download`,
      method: 'GET',
      responseType: 'blob',
    }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
    }).catch(() => {
      alert('Could not download document.');
    });
  };

  // Delete Document
  const handleDeleteDoc = async (id) => {
    if (!window.confirm('Delete this document permanently?')) return;
    try {
      await axios.delete(`/documents/${id}`);
      setSuccess('Document deleted.');
      if (selectedApp) {
        const updatedApp = await axios.get(`/applications/${selectedApp.id}`);
        setSelectedApp(updatedApp.data);
      }
      fetchApplications();
    } catch (err) {
      setError('Failed to delete document.');
    }
  };

  // Submit payment
  const handleMakePayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('/payments', {
        ip_application_id: paymentAppId,
        amount: paymentAmount,
        payment_method: paymentMethod
      });
      setSuccess('Payment successfully completed!');
      setShowPayModal(false);
      fetchPayments();
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment initiation failed.');
    }
  };

  // Submit chat message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    try {
      const res = await axios.post('/chat', {
        message: newMessage,
        ip_application_id: selectedApp ? selectedApp.id : null
      });
      setChatMessages([...chatMessages, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSendingMsg(false);
    }
  };

  // Filter application list
  const filteredApps = applications.filter(app => {
    const matchesSearch = (app.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (app.application_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-500/10 text-red-400 border-red-500/20',
      expert: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      staff: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      client: 'bg-green-500/10 text-green-400 border-green-500/20'
    };
    return styles[role] || styles.client;
  };

  const navItems = [
    { key: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { key: 'applications', icon: FileText, label: 'Applications' },
    { key: 'appointments', icon: Calendar, label: 'Appointments' },
    { key: 'messages', icon: MessageSquare, label: 'Messages' },
    { key: 'payments', icon: CreditCard, label: 'Payments' },
    { key: 'notifications', icon: Bell, label: 'Notifications' },
    { key: 'profile', icon: UserIcon, label: 'My Profile' },
  ];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0f172a]">
      <div className="bg-orbs"></div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 m-4 rounded-3xl glass border border-white/10 shadow-2xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'} transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:relative lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-white">IP</div>
            <span className="text-xl font-bold text-white tracking-tight">IPFCMS</span>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); setSelectedApp(null); }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 group ${activeTab === item.key ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-[inset_0_0_15px_rgba(2,132,199,0.1)]' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === item.key ? 'text-primary-400' : 'group-hover:text-primary-400 group-hover:scale-110'}`} />
                <span className="font-medium">{item.label}</span>
                {item.key === 'notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto z-10">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40 backdrop-blur-md bg-[#0f172a]/60 border-b border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 text-slate-400 hover:text-white">
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <h2 className="text-lg font-semibold text-white">Welcome, {user?.name}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getRoleBadge(user?.role)}`}>
              {user?.role}
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300">
              <UserIcon className="w-6 h-6" />
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page Content */}
        <div className="w-full px-6 lg:px-10 py-8 space-y-8 animate-fade-in">
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl font-medium flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={FileText} label="Total Applications" value={stats.total} color="blue" />
                <StatCard icon={Clock} label="Pending Review" value={stats.pending} color="yellow" />
                <StatCard icon={CheckCircle} label="Approved" value={stats.approved} color="green" />
                <StatCard icon={AlertCircle} label="Requires Attention" value={stats.attention} color="red" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Applications list */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="glass-card">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Recent Applications</h3>
                      <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard/applications/new')} className="btn-primary text-sm py-1.5 px-4 rounded-lg">
                          + New Application
                        </button>
                        <button onClick={() => setActiveTab('applications')} className="text-primary-400 text-sm hover:underline">View All</button>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-400 text-sm">
                            <th className="pb-3 font-medium">Application ID</th>
                            <th className="pb-3 font-medium">Type</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Last Updated</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-300 divide-y divide-white/5">
                          {applications.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="py-8 text-center text-slate-500">
                                No applications found. Click "New Application" to get started.
                              </td>
                            </tr>
                          ) : (
                            (applications?.data || applications || []).slice(0, 5).map(app => (
                              <tr key={app.id} onClick={() => { setSelectedApp(app); setActiveTab('applications'); }} className="hover:bg-white/[0.02] cursor-pointer transition-colors duration-200">
                                <td className="py-4 font-mono text-sm font-medium text-slate-300">{app.application_number}</td>
                                <td className="py-4 font-medium text-white">{app.type?.toUpperCase() || '—'}</td>
                                <td className="py-4">
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${app.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                      app.status === 'Approved by Staff' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse' :
                                        ['draft', 'submitted', 'Pending Review', 'In Review'].includes(app.status) ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                    }`}>
                                    {app.status === 'Approved by Staff' ? 'Approved by Staff - Admin / Gov Approval Pending' : app.status}
                                  </span>
                                </td>
                                <td className="py-4 text-sm text-slate-500">{new Date(app.updated_at).toLocaleDateString()}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-6">
                  <div className="glass-card">
                    <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
                    <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                      <TimelineItem title="Application Created" desc="Submitted new copyright form." time="2 hours ago" active />
                      <TimelineItem title="Gmail Verified" desc="Email address successfully activated." time="3 hours ago" />
                      <TimelineItem title="Joined Platform" desc="Account successfully registered." time="1 day ago" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              {!selectedApp ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <h3 className="text-2xl font-bold text-white">Your Applications</h3>
                    <button onClick={() => navigate('/dashboard/applications/new')} className="btn-primary">
                      + New Application
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search by ID or title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-11"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="input-field max-w-[200px]"
                    >
                      <option value="all">All Statuses</option>
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="In Review">In Review</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </div>

                  <div className="glass-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/5 text-slate-400 text-sm">
                            <th className="pb-3 font-medium">Application ID</th>
                            <th className="pb-3 font-medium">Title</th>
                            <th className="pb-3 font-medium">Type</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-300 divide-y divide-white/5">
                          {filteredApps.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="py-8 text-center text-slate-500">
                                No applications found matching filters.
                              </td>
                            </tr>
                          ) : (
                            filteredApps.map(app => (
                              <tr key={app.id} className="hover:bg-white/[0.01]">
                                <td className="py-4 font-mono text-sm font-medium text-slate-300">{app.application_number}</td>
                                <td className="py-4 font-bold text-white">{app.title}</td>
                                <td className="py-4 font-medium text-slate-400 uppercase">{app.type || '—'}</td>
                                <td className="py-4">
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${app.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                      app.status === 'Approved by Staff' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse' :
                                        ['draft', 'submitted', 'Pending Review', 'In Review'].includes(app.status) ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                          'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                    }`}>
                                    {app.status === 'Approved by Staff' ? 'Approved by Staff - Admin / Gov Approval Pending' : app.status}
                                  </span>
                                </td>
                                <td className="py-4">
                                  <button
                                    onClick={async () => {
                                      setLoading(true);
                                      try {
                                        const details = await axios.get(`/applications/${app.id}`);
                                        setSelectedApp(details.data);
                                      } catch (err) {
                                        setError('Failed to fetch details.');
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                    className="text-primary-400 hover:underline font-semibold"
                                  >
                                    Manage
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                // Application Detail Subview
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-white flex items-center gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back to List
                    </button>
                    <div className="flex gap-3">
                      {(selectedApp.status === 'draft' || selectedApp.status === 'Corrections Requested') && (
                        <button
                          onClick={() => navigate(`/dashboard/applications/edit/${selectedApp.id}`)}
                          className="bg-primary-600 hover:bg-primary-500 text-white font-bold py-2 px-6 rounded-xl text-sm transition-colors"
                        >
                          Resume / Edit Application
                        </button>
                      )}
                      {selectedApp.status === 'draft' && (
                        <button
                          onClick={async () => {
                            if (!window.confirm('Submit this application for official review?')) return;
                            try {
                              await axios.patch(`/applications/${selectedApp.id}/status`, { status: 'submitted', remarks: 'User submitted for review' });
                              setSuccess('Application submitted successfully!');
                              setSelectedApp(null);
                              fetchApplications();
                            } catch (err) {
                              setError('Failed to submit application.');
                            }
                          }}
                          className="btn-primary py-2 px-6"
                        >
                          Submit for Review
                        </button>
                      )}
                      {selectedApp.payment_status !== 'paid' && (
                        <button
                          onClick={() => { setCheckoutApp(selectedApp); }}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 cursor-pointer"
                        >
                          <DollarSign className="w-4 h-4" /> Pay Fees
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* General Info */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="glass-card">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="text-xs font-mono font-bold text-primary-400 uppercase tracking-widest">{selectedApp.application_number}</span>
                            <h4 className="text-2xl font-bold text-white mt-1">{selectedApp.title}</h4>
                          </div>
                          <span className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-sm uppercase text-slate-300 font-bold">{selectedApp.type}</span>
                        </div>

                        <p className="text-slate-300 leading-relaxed mb-6">{selectedApp.description || 'No description provided.'}</p>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5 text-sm">
                          <div>
                            <span className="text-slate-500 block">Status</span>
                            <span className="text-white font-bold uppercase mt-1 inline-block">
                              {selectedApp.status === 'Approved by Staff' ? 'Approved by Staff - Admin / Gov Approval Pending' : selectedApp.status}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Payment Status</span>
                            <span className={`font-bold uppercase mt-1 inline-block ${selectedApp.payment_status === 'paid' ? 'text-green-400' : 'text-red-400'}`}>
                              {selectedApp.payment_status || 'unpaid'}
                            </span>
                          </div>
                        </div>

                        {selectedApp.registration_id && (
                          <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl space-y-4 mt-6">
                            <div className="flex items-center gap-3 border-b border-green-500/10 pb-2">
                              <div className="p-2 rounded-lg bg-green-500/20 text-green-400 animate-bounce">
                                <Award className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-white uppercase tracking-wider">Official Intellectual Property Granted</h5>
                                <p className="text-xs text-slate-400">Your patent/IP protection has been officially registered and verified by Government of India.</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="text-slate-400 block font-medium">Registration / Patent ID</span>
                                <span className="font-mono text-green-400 font-extrabold text-sm tracking-wide mt-1 block">{selectedApp.registration_id}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium">Official Date of Grant</span>
                                <span className="text-white font-bold mt-1 block">{new Date(selectedApp.granted_at).toLocaleDateString()}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block font-medium">Filing Expiry Date</span>
                                <span className="text-white font-bold mt-1 block">{new Date(selectedApp.expiry_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex justify-end pt-2 border-t border-green-500/10">
                              <button
                                onClick={() => {
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
                                  doc.text(selectedApp.registration_id || "AWAITING-GRANT", 75, 100);

                                  doc.setFont("helvetica", "normal");
                                  doc.setTextColor(15, 23, 42);
                                  doc.text(selectedApp.application_number || "N/A", 75, 112);
                                  doc.text((selectedApp.type || "N/A").toUpperCase(), 75, 124);

                                  // Handle multi-line title wrapping
                                  const titleText = selectedApp.title || "N/A";
                                  const wrappedTitle = doc.splitTextToSize(titleText, 105);
                                  doc.text(wrappedTitle, 75, 136);

                                  doc.text(selectedApp.applicant?.full_name || "N/A", 75, 158);
                                  doc.text(selectedApp.granted_at ? new Date(selectedApp.granted_at).toLocaleDateString() : new Date().toLocaleDateString(), 75, 170);
                                  doc.text(selectedApp.expiry_date ? new Date(selectedApp.expiry_date).toLocaleDateString() : "N/A", 75, 182);

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
                                  doc.save(`IPFC_Certificate_${selectedApp.application_number}.pdf`);
                                }}
                                className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
                              >
                                <Download className="w-4 h-4" /> Download Official Certificate
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Documents Section */}
                      <div className="glass-card">
                        <h4 className="text-xl font-bold text-white mb-6">Documents & Attachments</h4>

                        <div className="space-y-4 mb-6">
                          {(!selectedApp.documents || selectedApp.documents.length === 0) ? (
                            <p className="text-slate-500 text-sm">No documents uploaded for this application yet.</p>
                          ) : (
                            selectedApp.documents.map(doc => (
                              <div key={doc.id} className="flex justify-between items-center p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-6 h-6 text-primary-400" />
                                  <div>
                                    <p className="text-sm font-bold text-white">{doc.file_name}</p>
                                    <p className="text-xs text-slate-500">{doc.category} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => handleDownloadDoc(doc.id, doc.file_name)} className="p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg">
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteDoc(doc.id)} className="p-2 hover:bg-white/5 text-red-500 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* File Upload Form */}
                        <form onSubmit={handleDocUpload} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-4">
                          <h5 className="text-sm font-bold text-white">Upload New Document</h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs text-slate-400">Category</label>
                              <select
                                value={docCategory}
                                onChange={(e) => setDocCategory(e.target.value)}
                                className="input-field text-xs py-2"
                              >
                                <option value="Identity Proof" className="bg-slate-900">Identity Proof</option>
                                <option value="Legal Document" className="bg-slate-900">Legal Document</option>
                                <option value="Technical Specification" className="bg-slate-900">Technical Specification</option>
                                <option value="Prior Art Search" className="bg-slate-900">Prior Art Search</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs text-slate-400">Select File</label>
                              <input
                                type="file"
                                onChange={(e) => setSelectedFile(e.target.files[0])}
                                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-500/10 file:text-primary-400 file:cursor-pointer hover:file:bg-primary-500/20"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={uploadingDoc || !selectedFile}
                            className="btn-primary w-full text-xs flex items-center justify-center gap-2 py-2"
                          >
                            {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            Upload File
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Timeline workflow history */}
                    <div className="space-y-6">
                      <div className="glass-card">
                        <h4 className="text-xl font-bold text-white mb-6">Workflow History</h4>
                        <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                          {(!selectedApp.workflow_history || selectedApp.workflow_history.length === 0) ? (
                            <TimelineItem title="Draft Mode" desc="Application currently in draft state." time="Just now" active />
                          ) : (
                            selectedApp.workflow_history.map((hist, idx) => (
                              <TimelineItem
                                key={hist.id}
                                title={`Status: ${hist.to_status}`}
                                desc={hist.remarks || 'No remarks provided.'}
                                time={new Date(hist.created_at).toLocaleDateString()}
                                active={idx === 0}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">Expert Consultations</h3>
                <button onClick={() => setShowApptModal(true)} className="btn-primary">
                  + Book Consultation
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appointments.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-slate-500">
                    No appointments booked yet. Click "Book Consultation" to schedule one!
                  </div>
                ) : (
                  appointments.map(appt => (
                    <div key={appt.id} className="glass-card border border-white/10 hover:border-white/20 transition-all space-y-4">
                      <div className="flex justify-between items-start">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${appt.status === 'approved' || appt.status === 'scheduled' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            appt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                              appt.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                appt.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                          {appt.status}
                        </span>
                        <span className="text-xs text-slate-400 uppercase font-bold">{appt.type}</span>
                      </div>

                      <div>
                        <p className="text-lg font-bold text-white">{new Date(appt.appointment_date).toLocaleString()}</p>
                        <p className="text-xs text-slate-500 mt-1">Reviewer: {appt.expert ? appt.expert.name : 'Awaiting Assignment'}</p>
                      </div>

                      {appt.notes && (
                        <p className="text-sm text-slate-300 line-clamp-3 bg-white/[0.01] p-3 rounded-lg border border-white/5">
                          {appt.notes}
                        </p>
                      )}

                      {appt.status === 'rejected' && appt.rejection_reason && (
                        <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-lg text-xs">
                          <span className="text-red-400 font-bold block mb-1">Rejection Reason:</span>
                          <span className="text-slate-300">{appt.rejection_reason}</span>
                        </div>
                      )}

                      {appt.meeting_link && (appt.status === 'approved' || appt.status === 'scheduled') && (
                        <a
                          href={appt.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full btn-primary text-xs py-2 flex items-center justify-center gap-2"
                        >
                          Join Meeting (Simulated)
                        </a>
                      )}

                      {(appt.status === 'pending' || appt.status === 'approved' || appt.status === 'scheduled') && (
                        <button
                          onClick={() => handleCancelAppointment(appt.id)}
                          className="w-full border border-red-500/20 hover:bg-red-500/10 text-red-400 text-xs font-bold py-2 rounded-xl"
                        >
                          Cancel Appointment
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* BOOK APPOINTMENT MODAL */}
              {showApptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                  <div className="glass-card max-w-md w-full p-6 space-y-6 relative border border-white/15 animate-slide-up">
                    <button onClick={() => setShowApptModal(false)} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>

                    <h4 className="text-xl font-bold text-white">Book Expert Consultation</h4>

                    <div className="bg-primary-500/10 border border-primary-500/20 p-4 rounded-xl space-y-1">
                      <p className="text-xs font-bold text-primary-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-pulse" /> Official Consult Hours
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Appointments can only be scheduled from **Monday to Friday** between **9:00 AM and 4:00 PM**.
                      </p>
                    </div>

                    <form onSubmit={handleBookAppointment} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Appointment Date & Time</label>
                        <input
                          type="datetime-local"
                          value={apptDate}
                          onChange={(e) => setApptDate(e.target.value)}
                          className="input-field cursor-pointer"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Meeting Mode</label>
                        <select
                          value={apptType}
                          onChange={(e) => setApptType(e.target.value)}
                          className="input-field cursor-pointer"
                        >
                          <option value="online" className="bg-slate-900">Online Google Meet</option>
                          <option value="offline" className="bg-slate-900">In-Person Office</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Consultation Notes / Subject</label>
                        <textarea
                          value={apptNotes}
                          onChange={(e) => setApptNotes(e.target.value)}
                          className="input-field min-h-[100px]"
                          placeholder="Briefly describe the IP subject you want to discuss..."
                        ></textarea>
                      </div>

                      <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                        Schedule Consultation
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: MESSAGES */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">Support Chat</h3>

              <div className="glass-card flex flex-col h-[580px] border border-white/10">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                  <div>
                    <h4 className="text-sm font-bold text-white">IPFCMS Help Center</h4>
                    <p className="text-xs text-slate-400">Our staff usually replies within a few minutes.</p>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm mt-10">
                      Send a message to start chatting with our Review Staff and Legal Experts!
                    </div>
                  ) : (
                    chatMessages.map(msg => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-none' :
                              'bg-slate-800 text-slate-300 rounded-tl-none border border-white/5'
                            }`}>
                            <p className="font-bold text-xs mb-1 opacity-70">{msg.sender ? msg.sender.name : 'User'}</p>
                            <p>{msg.message}</p>
                            <p className="text-[9px] text-right mt-1 opacity-50">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Send Footer */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your message here..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="input-field flex-1"
                  />
                  <button type="submit" disabled={sendingMsg} className="btn-primary px-5 flex items-center justify-center gap-2">
                    {sendingMsg ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">Payment Invoices</h3>
                <button onClick={() => { setPaymentAppId(''); setShowPayModal(true); }} className="btn-primary">
                  Make a Payment
                </button>
              </div>

              <div className="glass-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-400 text-sm">
                        <th className="pb-3 font-medium">Invoice ID</th>
                        <th className="pb-3 font-medium">Application</th>
                        <th className="pb-3 font-medium">Amount</th>
                        <th className="pb-3 font-medium">Method</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300 divide-y divide-white/5">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-slate-500">
                            No payment transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        payments.map(pay => (
                          <tr key={pay.id} className="hover:bg-white/[0.01]">
                            <td className="py-4 font-mono text-sm font-medium text-slate-300">{pay.transaction_id}</td>
                            <td className="py-4 font-bold text-white">{pay.ip_application ? pay.ip_application.title : 'General Consultation'}</td>
                            <td className="py-4 text-green-400 font-bold">₹ {pay.amount}</td>
                            <td className="py-4 text-slate-400 text-sm font-medium uppercase">{(pay.payment_method || 'card').replace('_', ' ')}</td>
                            <td className="py-4">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-green-500/10 text-green-400 border border-green-500/20">
                                {pay.status}
                              </span>
                            </td>
                            <td className="py-4 text-sm text-slate-500">{new Date(pay.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PAYMENT SIMULATION MODAL */}
              {showPayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                  <div className="glass-card max-w-md w-full p-6 space-y-6 relative border border-white/15 animate-slide-up">
                    <button onClick={() => setShowPayModal(false)} className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>

                    <h4 className="text-xl font-bold text-white">Select Application for Payment</h4>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const chosen = applications.find(a => a.id === parseInt(paymentAppId));
                      if (chosen) {
                        setCheckoutApp(chosen);
                        setShowPayModal(false);
                      }
                    }} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Select IP Application</label>
                        <select
                          value={paymentAppId}
                          onChange={(e) => setPaymentAppId(e.target.value)}
                          className="input-field cursor-pointer"
                          required
                        >
                          <option value="" className="bg-slate-900">Select Application</option>
                          {applications.filter(a => a.payment_status !== 'paid').map(app => (
                            <option key={app.id} value={app.id} className="bg-slate-900">
                              {app.title} ({app.application_number})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                        Proceed to Secure Checkout
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">Your Alerts</h3>
                {notifications.length > 0 && (
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await axios.post('/notifications/read-all');
                          fetchNotifications();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-all cursor-pointer bg-primary-500/10 px-3 py-1.5 rounded-lg border border-primary-500/20"
                    >
                      Mark all as read
                    </button>
                    <button
                      onClick={handleClearAllNotifications}
                      className="text-xs font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="glass-card h-[200px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10">
                    <Bell className="w-10 h-10 mb-2 text-slate-600 animate-bounce" />
                    <p className="text-sm">You have no new alerts or notifications at this time.</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`glass-card flex items-start gap-4 border transition-all p-5 relative overflow-hidden ${!notif.is_read ? 'border-primary-500/30 bg-primary-500/5 shadow-[0_0_15px_rgba(2,132,199,0.05)]' : 'border-white/10 hover:border-white/20'
                        }`}
                    >
                      {!notif.is_read && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary-500 animate-pulse"></div>
                      )}
                      <div className={`p-3 rounded-xl ${notif.type === 'alert' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          notif.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                        }`}>
                        {notif.type === 'alert' ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-base font-bold text-white flex items-center gap-2">
                              {notif.title}
                              {!notif.is_read && (
                                <span className="bg-primary-500 text-white text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">New</span>
                              )}
                            </h4>
                            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">{new Date(notif.created_at).toLocaleString()}</span>
                          </div>
                          {!notif.is_read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="text-[10px] font-bold text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md border border-white/5 cursor-pointer animate-fade-in"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">{notif.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-2xl font-bold text-white">Your IPFCMS Profile</h3>

              <div className="glass-card p-8 border border-white/10 shadow-2xl space-y-6 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 shadow-xl">
                    <UserIcon className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-extrabold text-white">{user?.name}</h4>
                    <span className="text-xs text-primary-400 font-mono font-bold mt-1 inline-block uppercase tracking-wider">{user?.role} ACCOUNT</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/5 text-sm text-left">
                  <div>
                    <span className="text-slate-500 block font-medium">Email Address</span>
                    <span className="text-white font-bold block mt-1">{user?.email}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block font-medium">Role Privilege</span>
                    <span className="text-white font-bold block mt-1 uppercase">{user?.role}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block font-medium">Email Status</span>
                    <span className="text-green-400 font-bold block mt-1">Verified / Active</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block font-medium">Joined Date</span>
                    <span className="text-white font-bold block mt-1">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {checkoutApp && (
        <CheckoutModal
          isOpen={!!checkoutApp}
          onClose={() => setCheckoutApp(null)}
          applicationId={checkoutApp.id}
          applicationTitle={checkoutApp.title}
          amount={getAppStatutoryFee(checkoutApp)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue: 'text-blue-400 bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]',
    yellow: 'text-yellow-400 bg-gradient-to-br from-yellow-500/20 to-yellow-600/5 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]',
    green: 'text-green-400 bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]',
    red: 'text-red-400 bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
  };
  return (
    <div className="glass-card flex items-center gap-5 group cursor-pointer">
      <div className={`p-4 rounded-2xl ${colors[color]} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium tracking-wide">{label}</p>
        <p className="text-3xl font-extrabold text-white mt-1">{value}</p>
      </div>
    </div>
  );
};

const TimelineItem = ({ title, desc, time, active }) => (
  <div className="pl-8 relative group">
    <div className={`absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full border-4 border-[#0f172a] shadow-lg transition-transform duration-300 group-hover:scale-110 ${active ? 'bg-primary-500 shadow-primary-500/50 animate-pulse-glow' : 'bg-slate-700'}`}></div>
    <h4 className="text-sm font-bold text-white tracking-wide">{title}</h4>
    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{desc}</p>
    <p className="text-[11px] text-primary-400/80 mt-2 font-semibold uppercase tracking-wider">{time}</p>
  </div>
);

export default Dashboard;

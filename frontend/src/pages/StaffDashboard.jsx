import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  MessageSquare, 
  Send,
  Loader2,
  X,
  User as UserIcon,
  ChevronRight,
  ClipboardList,
  Calendar,
  LogOut,
  Paperclip
} from 'lucide-react';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  
  // Action States
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState('filings'); // filings, appointments, messages
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [apptLoading, setApptLoading] = useState(false);

  // Chat / Messages States
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatFile, setChatFile] = useState(null);

  useEffect(() => {
    fetchSubmittedApplications();
  }, []);

  useEffect(() => {
    let interval;
    if (activeTab === 'appointments') {
      fetchAppointments();
    } else if (activeTab === 'messages') {
      fetchChatMessages();
      // Mark read when entering tab or switching clients
      axios.post('/chat/read-all').catch(err => console.error(err));

      interval = setInterval(() => {
        axios.get('/chat').then(res => {
          setChatMessages(Array.isArray(res.data) ? res.data : []);
        }).catch(err => console.error("Polling messages failed", err));
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [activeTab, selectedClient]);

  const fetchChatMessages = async () => {
    setChatLoading(true);
    try {
      const res = await axios.get('/chat');
      setChatMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load chat messages", err);
    } finally {
      setChatLoading(false);
    }
  };

  // Download Chat Attachment File
  const handleDownloadChatAttachment = (id, filename) => {
    axios({
      url: `/chat/attachments/${id}`,
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
      alert('Could not download attachment.');
    });
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !chatFile) || !selectedClient) return;

    setSendingMsg(true);
    try {
      let data;
      let headers = {};
      if (chatFile) {
        data = new FormData();
        if (newMessage.trim()) data.append('message', newMessage);
        data.append('file', chatFile);
        data.append('receiver_id', selectedClient.id);
        headers['Content-Type'] = 'multipart/form-data';
      } else {
        data = {
          message: newMessage,
          receiver_id: selectedClient.id
        };
      }

      const res = await axios.post('/chat', data, { headers });
      setChatMessages(prev => [...prev, res.data]);
      setNewMessage('');
      setChatFile(null);
    } catch (err) {
      console.error("Failed to send reply", err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setSendingMsg(false);
    }
  };

  // Group messages by client (any user with role !== 'admin' && role !== 'staff' && role !== 'expert')
  const getClientThreads = () => {
    const clients = {};
    chatMessages.forEach(msg => {
      const sender = msg.sender;
      const receiver = msg.receiver;

      if (sender && sender.role === 'client') {
        const unreadCount = chatMessages.filter(m => m.sender_id === sender.id && m.receiver_id === user.id && !m.is_read).length;
        clients[sender.id] = {
          id: sender.id,
          name: sender.name,
          email: sender.email,
          lastMessage: msg.message,
          lastTime: msg.created_at,
          unreadCount: unreadCount
        };
      }
      if (receiver && receiver.role === 'client') {
        const unreadCount = chatMessages.filter(m => m.sender_id === receiver.id && m.receiver_id === user.id && !m.is_read).length;
        clients[receiver.id] = {
          id: receiver.id,
          name: receiver.name,
          email: receiver.email,
          lastMessage: msg.message,
          lastTime: msg.created_at,
          unreadCount: unreadCount
        };
      }
    });
    return Object.values(clients).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
  };

  const getSelectedClientMessages = () => {
    if (!selectedClient) return [];
    return chatMessages.filter(msg => 
      (msg.sender_id === selectedClient.id) || 
      (msg.receiver_id === selectedClient.id)
    );
  };

  const fetchSubmittedApplications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/applications', { params: { status: 'all', per_page: 100 } });
      // Handle both paginated { data: [...] } and plain array responses
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      // Staff reviews all except "draft"
      setApplications(list.filter(app => app.status !== 'draft'));
    } catch (err) {
      console.error("Failed to load queue", err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (statusVal, message) => {
    if (!remarks.trim()) {
      alert('Please specify review comments / remarks for this action.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await axios.patch(`/applications/${selectedApp.id}/status`, {
        status: statusVal,
        remarks: remarks
      });
      setSuccess(message);
      setRemarks('');
      setSelectedApp(null);
      fetchSubmittedApplications();
    } catch (err) {
      setError('Failed to update workflow state.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const fetchAppointments = async () => {
    setApptLoading(true);
    try {
      const res = await axios.get('/appointments');
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load appointments", err);
      setAppointments([]);
    } finally {
      setApptLoading(false);
    }
  };

  const handleApptAction = async (apptId, statusVal) => {
    if (statusVal === 'rejected' && !rejectionReason.trim()) {
      alert('Please specify a rejection reason.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.patch(`/appointments/${apptId}/status`, {
        status: statusVal,
        rejection_reason: statusVal === 'rejected' ? rejectionReason : null
      });
      setSuccess(`Appointment ${statusVal} successfully!`);
      setRejectionReason('');
      setSelectedAppt(res.data.appointment || res.data);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update appointment.');
    } finally {
      setIsSubmitting(false);
    }
  };
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

  // Filters
  const filteredApps = applications.filter(app => {
    return (app.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
           (app.application_number?.toLowerCase() || '').includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0f172a] text-slate-100">
      <div className="bg-orbs"></div>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto z-10 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto w-full animate-fade-in space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <div>
              <span className="text-xs font-mono font-bold text-primary-400 uppercase tracking-widest">Official Portal</span>
              <h1 className="text-3xl font-extrabold text-white mt-1">Staff Verification Desk</h1>
              <p className="text-slate-400 mt-1">Verify submitted IP claims, audit drawings, and process correction flows.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary-500/10 border border-primary-500/20 px-4 py-2 rounded-xl text-xs font-bold text-primary-400 uppercase">
                Staff Desk: {user?.name}
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

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Tab Navigation Menu */}
          <div className="flex gap-4 border-b border-white/5 pb-4">
            <button 
              onClick={() => setActiveTab('filings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeTab === 'filings' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <ClipboardList className="w-4 h-4" /> Filing Verification Queue
            </button>
            <button 
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeTab === 'appointments' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <Calendar className="w-4 h-4" /> Consultation Appointments Desk
            </button>
            <button 
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeTab === 'messages' ? 'bg-primary-500/10 text-primary-400 border-primary-500/20' : 'border-transparent text-slate-400 hover:text-white'}`}
            >
              <MessageSquare className="w-4 h-4" /> Support Message Center
            </button>
          </div>

          {/* Conditional tab rendering */}
          {activeTab === 'filings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* List queue */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary-400" /> Pending Work List
                </h3>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Search by ID or title..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-9 text-xs py-2"
                  />
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-slate-500 text-xs">Loading queue...</div>
                  ) : filteredApps.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">No pending applications in your queue.</div>
                  ) : (
                    filteredApps.map(app => (
                      <div 
                        key={app.id} 
                        onClick={() => setSelectedApp(app)}
                        className={`glass-card p-4 border cursor-pointer hover:border-primary-500/30 transition-all ${selectedApp?.id === app.id ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/5'}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{app.application_number}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            app.status === 'Approved' ? 'bg-green-500/10 text-green-400' :
                            app.status === 'Corrections Requested' ? 'bg-red-500/10 text-red-400' :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>{app.status}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-2 truncate">{app.title}</h4>
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-500">
                          <span className="uppercase font-bold">{app.type}</span>
                          <span>{new Date(app.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Detail audit pane */}
              <div className="lg:col-span-2 space-y-6">
                {selectedApp ? (
                  <div className="glass-card p-6 lg:p-8 space-y-6 animate-fade-in border border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold text-primary-400 uppercase tracking-widest">{selectedApp.application_number}</span>
                        <h3 className="text-2xl font-bold text-white mt-1">{selectedApp.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">Submitted by: {selectedApp.user?.name} ({selectedApp.user?.email})</p>
                      </div>
                      <span className="bg-slate-800 px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold text-slate-300 uppercase">
                        {selectedApp.type}
                      </span>
                    </div>

                    {/* Applicant Details */}
                    {selectedApp.applicant && (
                      <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                        <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wide">Applicant Contact & Identity</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-300">
                          <div><span className="text-slate-500 block">Full Name / Entity:</span> <span className="font-medium text-white">{selectedApp.applicant.full_name || 'N/A'}</span></div>
                          <div><span className="text-slate-500 block">Applicant Type:</span> <span className="font-medium text-white uppercase">{selectedApp.applicant.applicant_type || 'N/A'}</span></div>
                          <div><span className="text-slate-500 block">Nationality / Country:</span> <span className="font-medium text-white">{selectedApp.applicant.nationality || 'N/A'}</span></div>
                          <div><span className="text-slate-500 block">Email Address:</span> <span className="font-medium text-white">{selectedApp.applicant.email || 'N/A'}</span></div>
                          <div><span className="text-slate-500 block">Phone Number:</span> <span className="font-medium text-white">{selectedApp.applicant.phone_number || 'N/A'}</span></div>
                          <div className="lg:col-span-1"><span className="text-slate-500 block">Full Address:</span> <span className="font-medium text-white">{selectedApp.applicant.address || 'N/A'}, {selectedApp.applicant.city || ''}, {selectedApp.applicant.state || ''} {selectedApp.applicant.postal_code || ''}</span></div>
                        </div>
                      </div>
                    )}

                    {/* Summary particulars of IP */}
                    <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-white/5">
                      <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wide">IP Particulars & Specifications</h4>
                      
                      {/* Patent audit fields */}
                      {selectedApp.type === 'patent' && selectedApp.patent && (
                        <div className="space-y-4 text-xs text-slate-300">
                          <div className="grid grid-cols-2 gap-4 font-medium">
                            <div><span className="text-slate-500">Patent Type:</span> {selectedApp.patent.patent_type}</div>
                            <div><span className="text-slate-500">Technical Category:</span> {selectedApp.patent.technical_category}</div>
                            <div><span className="text-slate-500">Filing Category:</span> {selectedApp.patent.filing_type}</div>
                            <div><span className="text-slate-500">Tech Domain:</span> {selectedApp.patent.technical_domain}</div>
                          </div>
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-slate-500 block font-bold">Abstract Summary:</span>
                            <p className="mt-1 bg-slate-950/20 p-2 rounded border border-white/5">{selectedApp.patent.abstract || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-bold">Background & Problem Statement:</span>
                            <p className="mt-1 bg-slate-950/20 p-2 rounded border border-white/5">{selectedApp.patent.background || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-bold">Novelty Particulars:</span>
                            <p className="mt-1 bg-slate-950/20 p-2 rounded border border-white/5">{selectedApp.patent.novelty || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-slate-500 block font-bold">Independent Claims:</span>
                            <p className="mt-1 bg-slate-950/20 p-2 rounded border border-white/5 font-mono">{selectedApp.patent.independent_claims || 'N/A'}</p>
                          </div>
                        </div>
                      )}

                      {/* Trademark audit fields */}
                      {selectedApp.type === 'trademark' && selectedApp.trademark && (
                        <div className="space-y-4 text-xs text-slate-300">
                          <div className="grid grid-cols-2 gap-4 font-medium">
                            <div><span className="text-slate-500">Trademark Type:</span> {selectedApp.trademark.trademark_type}</div>
                            <div><span className="text-slate-500">Industry:</span> {selectedApp.trademark.industry_category}</div>
                            <div><span className="text-slate-500">Goods Class:</span> {selectedApp.trademark.goods_category}</div>
                            <div><span className="text-slate-500">First Use Date:</span> {selectedApp.trademark.first_use_date || 'N/A'}</div>
                          </div>
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-slate-500 block font-bold">Brand Description:</span>
                            <p className="mt-1 bg-slate-950/20 p-2 rounded border border-white/5">{selectedApp.trademark.brand_description || 'N/A'}</p>
                          </div>
                        </div>
                      )}

                      {/* Copyright audit fields */}
                      {selectedApp.type === 'copyright' && selectedApp.copyright && (
                        <div className="space-y-4 text-xs text-slate-300">
                          <div className="grid grid-cols-3 gap-4 font-medium">
                            <div><span className="text-slate-500">Work Category:</span> {selectedApp.copyright.work_type}</div>
                            <div><span className="text-slate-500">Creation Date:</span> {selectedApp.copyright.creation_date}</div>
                            <div><span className="text-slate-500">Owner Name:</span> {selectedApp.copyright.owner_name}</div>
                          </div>
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-slate-500 block font-bold">Work Description:</span>
                            <p className="mt-1 bg-slate-950/20 p-2 rounded border border-white/5">{selectedApp.copyright.description || 'N/A'}</p>
                          </div>
                        </div>
                      )}

                      {/* Design audit fields */}
                      {selectedApp.type === 'design' && selectedApp.industrial_design && (
                        <div className="space-y-4 text-xs text-slate-300">
                          <div className="grid grid-cols-3 gap-4 font-medium">
                            <div><span className="text-slate-500">Category:</span> {selectedApp.industrial_design.product_category}</div>
                            <div><span className="text-slate-500">Industry:</span> {selectedApp.industrial_design.industry_sector}</div>
                            <div><span className="text-slate-500">Class:</span> {selectedApp.industrial_design.design_category}</div>
                          </div>
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-slate-500 block font-bold">Shape & Pattern Details:</span>
                            <p className="mt-1 bg-slate-950/20 p-2 rounded border border-white/5">{selectedApp.industrial_design.shape_details || 'N/A'}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Document and drawings verifications */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wide">Submitted Document Gallery</h4>
                      {(!selectedApp.documents || selectedApp.documents.length === 0) ? (
                        <p className="text-xs text-slate-500 italic">No attachments submitted for this IP application.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedApp.documents.map(doc => (
                            <div key={doc.id} className="flex justify-between items-center p-3 rounded-xl bg-[#0f172a]/60 border border-white/5">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-primary-400" />
                                <div>
                                  <p className="text-xs font-bold text-white truncate max-w-[150px]">{doc.file_name}</p>
                                  <p className="text-[9px] text-slate-500">{doc.category}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleDownloadDoc(doc.id, doc.file_name)}
                                className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Staff Audit comments & official action panel */}
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <h4 className="text-sm font-bold text-white">Review Desk Action Panel</h4>
                      <div className="bg-primary-500/10 border border-primary-500/20 p-5 rounded-xl text-center space-y-4">
                        <p className="text-sm text-slate-300">A detailed step-by-step verification is required to approve or request corrections on individual fields and documents.</p>
                        <button 
                          onClick={() => navigate(`/staff/review/${selectedApp.id}`)}
                          className="btn-primary flex items-center justify-center gap-2 py-3 px-8 mx-auto"
                        >
                          <ClipboardList className="w-5 h-5" /> Start Detailed Review
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="glass-card h-[400px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10">
                    <ClipboardList className="w-12 h-12 mb-3 text-slate-600" />
                    <p className="text-sm">Select an active submitted filing from the left panel to begin verification</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              
              {/* List queue */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-400" /> Consultation Bookings
                </h3>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {apptLoading && appointments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading bookings...
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="glass-card p-6 text-center text-slate-500 text-xs border border-dashed border-white/5">
                      No consultation bookings found.
                    </div>
                  ) : (
                    appointments.map(appt => (
                      <div 
                        key={appt.id} 
                        onClick={() => { setSelectedAppt(appt); setRejectionReason(''); }}
                        className={`glass-card p-4 border cursor-pointer hover:border-primary-500/30 transition-all ${selectedAppt?.id === appt.id ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/5'}`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                            appt.status === 'approved' || appt.status === 'scheduled' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                            appt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse' : 
                            appt.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>{appt.status}</span>
                          <span className="text-[9px] uppercase font-bold text-slate-400">{appt.type}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-2">{new Date(appt.appointment_date).toLocaleString()}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">Client: {appt.client?.name || 'Owner'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Appointment Actions Pane */}
              <div className="lg:col-span-2 space-y-6 animate-fade-in">
                {selectedAppt ? (
                  <div className="glass-card p-6 lg:p-8 space-y-6 border border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold text-primary-400 uppercase tracking-widest">Appointment ID: #{selectedAppt.id}</span>
                        <h3 className="text-2xl font-bold text-white mt-1">{new Date(selectedAppt.appointment_date).toLocaleString()}</h3>
                        <p className="text-xs text-slate-400 mt-1">Client: {selectedAppt.client?.name} ({selectedAppt.client?.email})</p>
                      </div>
                      <span className="bg-slate-800 px-3 py-1.5 rounded-xl border border-white/5 text-xs font-bold text-slate-300 uppercase">
                        {selectedAppt.type}
                      </span>
                    </div>

                    <div className="space-y-4 bg-slate-900/40 p-5 rounded-2xl border border-white/5 text-xs text-slate-300">
                      <h4 className="text-sm font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wide">Details & Subject</h4>
                      <p className="whitespace-pre-wrap leading-relaxed">{selectedAppt.notes || 'No description notes provided.'}</p>
                    </div>

                    {selectedAppt.status === 'rejected' && selectedAppt.rejection_reason && (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs space-y-1">
                        <span className="text-red-400 font-bold block uppercase tracking-wider">Rejection Reason Specified:</span>
                        <p className="text-slate-300">{selectedAppt.rejection_reason}</p>
                      </div>
                    )}

                    {selectedAppt.meeting_link && (selectedAppt.status === 'approved' || selectedAppt.status === 'scheduled') && (
                      <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl text-xs space-y-2">
                        <span className="text-green-400 font-bold block uppercase tracking-wider">Google Meet Meeting Link:</span>
                        <a href={selectedAppt.meeting_link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline font-mono">{selectedAppt.meeting_link}</a>
                      </div>
                    )}

                    {(selectedAppt.status === 'pending' || selectedAppt.status === 'scheduled') && (
                      <div className="space-y-4 pt-6 border-t border-white/5">
                        <h4 className="text-sm font-bold text-white">Approve / Reject Action Panel</h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Rejection Reason (Required only if rejecting)</label>
                            <textarea 
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="input-field min-h-[80px] text-xs focus:ring-red-500/50"
                              placeholder="Enter details on why the appointment is rejected or slot rescheduled..."
                            ></textarea>
                          </div>

                          <div className="flex justify-end gap-4 pt-2">
                            <button 
                              onClick={() => handleApptAction(selectedAppt.id, 'rejected')}
                              disabled={isSubmitting}
                              className="border border-red-500/20 hover:bg-red-500/10 text-red-400 text-xs font-bold py-2 px-6 rounded-xl transition-all cursor-pointer"
                            >
                              Reject Appointment
                            </button>
                            <button 
                              onClick={() => handleApptAction(selectedAppt.id, 'approved')}
                              disabled={isSubmitting}
                              className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-2 px-6 rounded-xl transition-all cursor-pointer"
                            >
                              Approve Appointment
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="glass-card h-[400px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10">
                    <Calendar className="w-12 h-12 mb-3 text-slate-600" />
                    <p className="text-sm">Select a booked appointment from the left panel to review & take action</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              {/* Left sidebar: list of clients */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-400" /> Support Chats Inbox
                </h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {chatLoading && chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading inbox...
                    </div>
                  ) : getClientThreads().length === 0 ? (
                    <div className="glass-card p-6 text-center text-slate-500 text-xs border border-dashed border-white/5">
                      No active client chat logs found.
                    </div>
                  ) : (
                    getClientThreads().map(client => (
                      <div 
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`glass-card p-4 border cursor-pointer hover:border-primary-500/30 transition-all ${
                          selectedClient?.id === client.id ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-xs text-primary-400">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs font-bold text-white truncate">{client.name}</h4>
                              {client.unreadCount > 0 && (
                                <span className="bg-red-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                                  {client.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">{client.email}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-1 italic">"{client.lastMessage}"</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right side: selected chat conversation */}
              <div className="lg:col-span-2 space-y-6">
                {selectedClient ? (
                  <div className="glass-card p-6 lg:p-8 flex flex-col h-[580px] border border-white/10 relative overflow-hidden">
                    {/* Active chat header */}
                    <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{selectedClient.name}</h3>
                        <p className="text-[10px] text-slate-400">{selectedClient.email} • Support Thread</p>
                      </div>
                      <span className="bg-primary-500/10 border border-primary-500/20 text-[10px] font-bold text-primary-400 px-3 py-1 rounded-full uppercase">
                        Active conversation
                      </span>
                    </div>

                    {/* Message logs area */}
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
                      {getSelectedClientMessages().map(msg => {
                        const isFromClient = msg.sender?.role === 'client';
                        return (
                          <div 
                            key={msg.id}
                            className={`flex flex-col max-w-[75%] ${isFromClient ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                          >
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                              isFromClient 
                                ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-white/5' 
                                : 'bg-primary-600 text-white rounded-tr-none shadow-[0_4px_12px_rgba(2,132,199,0.2)]'
                            }`}>
                              {msg.message}
                              {msg.attachment_path && (
                                <div className="space-y-1 mt-2">
                                  <ChatAttachmentPreview msg={msg} />
                                  <button 
                                    type="button"
                                    onClick={() => handleDownloadChatAttachment(msg.id, msg.attachment_path.split('/').pop())}
                                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-2 py-1 rounded w-fit"
                                  >
                                    <Download className="w-3 h-3" /> Download
                                  </button>
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-500 mt-1 font-medium">
                              {isFromClient ? msg.sender?.name : `${msg.sender?.name || 'Support'} (Staff)`} • {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* File Attachment Chip */}
                    {chatFile && (
                      <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between text-xs bg-slate-900/40">
                        <div className="flex items-center gap-2 text-slate-300">
                          <FileText className="w-4 h-4 text-primary-400" />
                          <span className="font-medium truncate max-w-xs">{chatFile.name} ({(chatFile.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button type="button" onClick={() => setChatFile(null)} className="p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Text field reply form */}
                    <form onSubmit={handleSendReply} className="mt-auto pt-4 border-t border-white/5 flex gap-3 items-center">
                      <label className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-white/5 cursor-pointer transition-colors shrink-0">
                        <Paperclip className="w-4 h-4" />
                        <input 
                          type="file" 
                          onChange={(e) => setChatFile(e.target.files[0])} 
                          className="hidden" 
                        />
                      </label>
                      <input 
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Reply to ${selectedClient.name}...`}
                        className="input-field py-2 text-xs flex-1"
                        disabled={sendingMsg}
                      />
                      <button 
                        type="submit"
                        disabled={sendingMsg || (!newMessage.trim() && !chatFile)}
                        className="btn-primary py-2 px-5 text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {sendingMsg ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Send
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="glass-card h-[580px] flex flex-col items-center justify-center text-slate-500 border border-dashed border-white/10">
                    <MessageSquare className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
                    <h3 className="text-sm font-bold text-white">No conversation selected</h3>
                    <p className="text-xs mt-1 max-w-xs text-center leading-relaxed">Select a client's support chat from the left panel to review message logs and post replies.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

const ChatAttachmentPreview = ({ msg }) => {
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const isImage = msg.attachment_path.match(/\.(jpeg|jpg|gif|png)$/i);

  useEffect(() => {
    if (isImage) {
      setLoading(true);
      axios({
        url: `/chat/attachments/${msg.id}`,
        method: 'GET',
        responseType: 'blob'
      }).then(response => {
        const url = window.URL.createObjectURL(response.data);
        setImgUrl(url);
      }).catch(err => {
        console.error("Failed to load attachment image", err);
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [msg.id, isImage]);

  if (isImage) {
    if (loading) return <div className="text-[10px] text-slate-400">Loading preview...</div>;
    if (imgUrl) return <img src={imgUrl} alt="Attachment" className="max-w-[200px] max-h-[150px] rounded-lg mt-2 cursor-pointer border border-white/10 hover:opacity-90" onClick={() => window.open(imgUrl)} />;
    return <div className="text-[10px] text-red-400">Preview failed</div>;
  }

  return (
    <div className="flex items-center gap-2 mt-2 p-2 bg-slate-900/60 border border-white/5 rounded-lg max-w-[250px]">
      <FileText className="w-4 h-4 text-primary-400" />
      <span className="text-[10px] font-bold text-slate-300 truncate flex-1 font-mono">
        {msg.attachment_path.split('/').pop()}
      </span>
    </div>
  );
};

export default StaffDashboard;

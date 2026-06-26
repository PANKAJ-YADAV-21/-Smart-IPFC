import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Save, CheckCircle2, AlertCircle, Loader2, FileText, Check, X } from 'lucide-react';

const StaffReviewWizard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appData, setAppData] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [feedbacks, setFeedbacks] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const res = await axios.get(`/applications/${id}`);
      setAppData(res.data);
      if (res.data.field_feedbacks) {
        setFeedbacks(res.data.field_feedbacks);
      }
    } catch (err) {
      setError('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (fieldPath, status, remarks = '') => {
    setFeedbacks(prev => ({
      ...prev,
      [fieldPath]: { status, remarks }
    }));
  };

  const submitReview = async () => {
    setIsSubmitting(true);
    try {
      await axios.post(`/applications/${id}/review`, {
        field_feedbacks: feedbacks
      });
      setSuccess('Review submitted successfully!');
      setTimeout(() => navigate('/staff/dashboard'), 2000);
    } catch (err) {
      setError('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadDoc = (docId, filename) => {
    axios({
      url: `/documents/${docId}/download`,
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

  if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading Application Data...</div>;
  if (!appData) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Application not found</div>;

  const ipType = appData.type;
  
  // Define Steps based on IP Type
  const stepConfigs = {
    patent: [
      { title: 'Basic Info', fields: [ { label: 'Title', path: 'title' }, { label: 'Description', path: 'description' }, { label: 'Patent Type', path: 'patent.patent_type' }, { label: 'Tech Category', path: 'patent.technical_category' } ] },
      { title: 'Applicant', fields: [ { label: 'Full Name', path: 'applicant.full_name' }, { label: 'Type', path: 'applicant.applicant_type' }, { label: 'Nationality', path: 'applicant.nationality' }, { label: 'Email', path: 'applicant.email' }, { label: 'Address', path: 'applicant.address' } ] },
      { title: 'Inventor', fields: [ { label: 'Inventor Name', path: 'patent.inventor_name' }, { label: 'Contribution', path: 'patent.contribution_details' } ] },
      { title: 'Invention Specs', fields: [ { label: 'Abstract', path: 'patent.abstract' }, { label: 'Background', path: 'patent.background' }, { label: 'Detailed Desc', path: 'patent.detailed_description' } ] },
      { title: 'Claims', fields: [ { label: 'Independent Claims', path: 'patent.independent_claims' }, { label: 'Dependent Claims', path: 'patent.dependent_claims' } ] },
      { title: 'Documents', isDocStep: true }
    ],
    trademark: [
      { title: 'Basic Info', fields: [ { label: 'Title', path: 'title' }, { label: 'Description', path: 'description' }, { label: 'Trademark Type', path: 'trademark.trademark_type' }, { label: 'Industry', path: 'trademark.industry_category' } ] },
      { title: 'Applicant', fields: [ { label: 'Full Name', path: 'applicant.full_name' }, { label: 'Type', path: 'applicant.applicant_type' } ] },
      { title: 'Brand Specs', fields: [ { label: 'Brand Description', path: 'trademark.brand_description' }, { label: 'Meaning/Slogan', path: 'trademark.trademark_meaning' } ] },
      { title: 'Documents', isDocStep: true }
    ],
    copyright: [
      { title: 'Basic Info', fields: [ { label: 'Title', path: 'title' }, { label: 'Work Type', path: 'copyright.work_type' } ] },
      { title: 'Applicant', fields: [ { label: 'Full Name', path: 'applicant.full_name' }, { label: 'Email', path: 'applicant.email' } ] },
      { title: 'Copyright Specs', fields: [ { label: 'Description', path: 'copyright.description' }, { label: 'Owner Name', path: 'copyright.owner_name' } ] },
      { title: 'Documents', isDocStep: true }
    ],
    design: [
      { title: 'Basic Info', fields: [ { label: 'Title', path: 'title' }, { label: 'Product Category', path: 'industrialDesign.product_category' } ] },
      { title: 'Applicant', fields: [ { label: 'Full Name', path: 'applicant.full_name' } ] },
      { title: 'Design Specs', fields: [ { label: 'Shape Details', path: 'industrialDesign.shape_details' }, { label: 'Material Details', path: 'industrialDesign.material_details' } ] },
      { title: 'Documents', isDocStep: true }
    ]
  };

  const steps = stepConfigs[ipType] || stepConfigs.patent;
  const currentStepData = steps[currentStep - 1];

  const getValue = (path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], appData) || 'N/A';
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 p-6 lg:p-10 flex flex-col">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <button onClick={() => navigate('/staff/dashboard')} className="text-slate-400 hover:text-white flex items-center gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold">Review: {appData.application_number}</h1>
            <p className="text-sm text-slate-400">{appData.title} ({ipType.toUpperCase()})</p>
          </div>
          <div className="text-right">
            <span className="bg-primary-500/10 text-primary-400 px-3 py-1 rounded-lg text-xs font-bold border border-primary-500/20">
              Step {currentStep} of {steps.length}
            </span>
          </div>
        </div>

        {success && <div className="bg-green-500/10 text-green-400 p-4 rounded-xl flex items-center gap-2 border border-green-500/20"><CheckCircle2 className="w-5 h-5"/> {success}</div>}
        {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-xl flex items-center gap-2 border border-red-500/20"><AlertCircle className="w-5 h-5"/> {error}</div>}

        {/* Wizard Body */}
        <div className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex-1">
          <h2 className="text-xl font-bold mb-6 pb-2 border-b border-white/5">{currentStepData.title}</h2>

          {!currentStepData.isDocStep ? (
            <div className="space-y-8">
              {currentStepData.fields.map((field, idx) => {
                const fb = feedbacks[field.path] || {};
                return (
                  <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                    <div className="mb-3">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{field.label}</p>
                      <p className="text-white mt-1 whitespace-pre-wrap">{getValue(field.path)}</p>
                    </div>
                    
                    {/* Feedback Action */}
                    <div className="border-t border-white/5 pt-3 mt-3 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleFeedback(field.path, 'approved')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${fb.status === 'approved' ? 'bg-green-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button 
                          onClick={() => handleFeedback(field.path, 'rejected')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${fb.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                          <X className="w-3 h-3" /> Reject
                        </button>
                      </div>
                      
                      {fb.status === 'rejected' && (
                        <input 
                          type="text" 
                          placeholder="Provide a reason for rejection..." 
                          value={fb.remarks || ''}
                          onChange={(e) => handleFeedback(field.path, 'rejected', e.target.value)}
                          className="flex-1 bg-slate-900 border border-red-500/30 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500 w-full"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {appData.documents && appData.documents.length > 0 ? (
                appData.documents.map(doc => {
                  const path = `document.${doc.id}`;
                  const fb = feedbacks[path] || {};
                  return (
                    <div key={doc.id} className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-primary-400" />
                        <div>
                          <p className="text-sm font-bold text-white">{doc.category}</p>
                          <p className="text-xs text-slate-400">{doc.file_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <div className="flex gap-2 self-end">
                          <button onClick={() => handleDownloadDoc(doc.id, doc.file_name)} className="px-3 py-1 text-xs bg-slate-700 rounded-lg">View</button>
                          <button onClick={() => handleFeedback(path, 'approved')} className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${fb.status === 'approved' ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300'}`}><Check className="w-3 h-3"/> Approve</button>
                          <button onClick={() => handleFeedback(path, 'rejected')} className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${fb.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}><X className="w-3 h-3"/> Reject</button>
                        </div>
                        {fb.status === 'rejected' && (
                          <input type="text" placeholder="Reason..." value={fb.remarks || ''} onChange={(e) => handleFeedback(path, 'rejected', e.target.value)} className="bg-slate-900 border border-red-500/30 rounded-lg px-3 py-1 text-xs w-full mt-2" />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-400">No documents uploaded.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between mt-4">
          <button 
            onClick={() => setCurrentStep(prev => prev - 1)} 
            disabled={currentStep === 1}
            className="px-6 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
          >
            Previous
          </button>
          
          {currentStep < steps.length ? (
            <button 
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={submitReview}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-500 text-white px-8 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Submit Complete Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffReviewWizard;

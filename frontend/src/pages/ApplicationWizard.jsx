import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Upload, 
  CheckCircle2, 
  FileText, 
  Image as ImageIcon, 
  DollarSign, 
  Loader2, 
  Lock, 
  AlertCircle,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import CheckoutModal from '../components/CheckoutModal';

const ApplicationWizard = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Edit existing application ID, if any
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handlePaymentSuccess = async (payment) => {
    setIsCheckoutOpen(false);
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const targetStatus = appStatus === 'Corrections Requested' ? 'Pending Review' : 'submitted';
      await axios.patch(`/applications/${appId}/status`, {
        status: targetStatus,
        remarks: appStatus === 'Corrections Requested' 
          ? 'Corrections resubmitted by applicant.' 
          : 'Filing successfully completed via applicant multi-step wizard'
      });

      setSuccess(appStatus === 'Corrections Requested' 
        ? 'Corrections successfully resubmitted!' 
        : 'CONGRATULATIONS! Your IP application is successfully filed!'
      );
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Payment recorded, but final status transition failed. Please contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Main App State
  const [ipType, setIpType] = useState('patent'); // patent, trademark, copyright, design
  const [appId, setAppId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [feedbacks, setFeedbacks] = useState({});
  const [appStatus, setAppStatus] = useState('draft');

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    description: '',
    patent_type: 'provisional',
    technical_category: 'Software',
    filing_type: 'ordinary',
    technical_domain: 'Information Technology',
    trademark_type: 'wordmark',
    industry_category: 'Technology',
    goods_category: 'Class 9',
    work_type: 'software',
    product_category: 'Electronics',
    industry_sector: 'Consumer Hardware',
    design_category: 'Class 14'
  });

  // Step 2: Applicant details
  const [applicant, setApplicant] = useState({
    full_name: '',
    company_name: '',
    applicant_type: 'individual',
    nationality: 'Indian',
    address: '',
    email: '',
    phone_number: ''
  });

  // Patent Specific Inventor (Step 3 for Patent)
  const [patentDetails, setPatentDetails] = useState({
    inventor_name: '',
    inventor_nationality: 'Indian',
    inventor_address: '',
    inventor_email: '',
    contribution_details: '',
    abstract: '',
    background: '',
    problem_statement: '',
    limitations: '',
    detailed_description: '',
    novelty: '',
    advantages: '',
    applicability: '',
    independent_claims: '',
    dependent_claims: ''
  });

  // Trademark Details (Step 3 for Trademark)
  const [trademarkDetails, setTrademarkDetails] = useState({
    brand_description: '',
    trademark_meaning: '',
    usage_purpose: '',
    first_use_date: '',
  });

  // Copyright Details (Step 3 for Copyright)
  const [copyrightDetails, setCopyrightDetails] = useState({
    description: '',
    creation_date: '',
    publication_date: '',
    owner_name: '',
  });

  // Design Details (Step 3 for Design)
  const [designDetails, setDesignDetails] = useState({
    description: '',
    shape_details: '',
    pattern_details: '',
    ornamentation_details: '',
    material_details: '',
  });

  // Legal declarations (Step 8/6)
  const [declarations, setDeclarations] = useState({
    declaration_of_inventorship: false,
    ownership_declaration: false,
    undertaking: false
  });

  // Payments (Step 10/7)
  const [paymentData, setPaymentData] = useState({
    payment_method: 'credit_card',
    card_number: '4111 2222 3333 4444',
    expiry: '12/28',
    cvv: '123'
  });

  // List of uploaded documents for this application
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docCategory, setDocCategory] = useState('');
  const [uploading, setUploading] = useState(false);

  // Eager load if editing existing
  useEffect(() => {
    if (id) {
      loadApplication(id);
    }
  }, [id]);

  const loadApplication = async (appId) => {
    setLoading(true);
    try {
      const res = await axios.get(`/applications/${appId}`);
      const data = res.data;
      setAppId(data.id);
      setIpType(data.type);
      setAppStatus(data.status);
      setBasicInfo({
        title: data.title || '',
        description: data.description || '',
        patent_type: data.patent?.patent_type || 'provisional',
        technical_category: data.patent?.technical_category || 'Software',
        filing_type: data.patent?.filing_type || 'ordinary',
        technical_domain: data.patent?.technical_domain || 'Information Technology',
        trademark_type: data.trademark?.trademark_type || 'wordmark',
        industry_category: data.trademark?.industry_category || 'Technology',
        goods_category: data.trademark?.goods_category || 'Class 9',
        work_type: data.copyright?.work_type || 'software',
        product_category: data.industrial_design?.product_category || 'Electronics',
        industry_sector: data.industrial_design?.industry_sector || 'Consumer Hardware',
        design_category: data.industrial_design?.design_category || 'Class 14'
      });

      if (data.applicant) {
        setApplicant({
          full_name: data.applicant.full_name || '',
          company_name: data.applicant.company_name || '',
          applicant_type: data.applicant.applicant_type || 'individual',
          nationality: data.applicant.nationality || 'Indian',
          address: data.applicant.address || '',
          email: data.applicant.email || '',
          phone_number: data.applicant.phone_number || ''
        });
      }

      if (data.patent) {
        setPatentDetails({
          inventor_name: data.patent.inventor_name || '',
          inventor_nationality: data.patent.inventor_nationality || 'Indian',
          inventor_address: data.patent.inventor_address || '',
          inventor_email: data.patent.inventor_email || '',
          contribution_details: data.patent.contribution_details || '',
          abstract: data.patent.abstract || '',
          background: data.patent.background || '',
          problem_statement: data.patent.problem_statement || '',
          limitations: data.patent.limitations || '',
          detailed_description: data.patent.detailed_description || '',
          novelty: data.patent.novelty || '',
          advantages: data.patent.advantages || '',
          applicability: data.patent.applicability || '',
          independent_claims: data.patent.independent_claims || '',
          dependent_claims: data.patent.dependent_claims || ''
        });
      }

      if (data.trademark) {
        setTrademarkDetails({
          brand_description: data.trademark.brand_description || '',
          trademark_meaning: data.trademark.trademark_meaning || '',
          usage_purpose: data.trademark.usage_purpose || '',
          first_use_date: data.trademark.first_use_date || '',
        });
      }

      if (data.copyright) {
        setCopyrightDetails({
          description: data.copyright.description || '',
          creation_date: data.copyright.creation_date || '',
          publication_date: data.copyright.publication_date || '',
          owner_name: data.copyright.owner_name || '',
        });
      }

      if (data.industrial_design) {
        setDesignDetails({
          description: data.industrial_design.description || '',
          shape_details: data.industrial_design.shape_details || '',
          pattern_details: data.industrial_design.pattern_details || '',
          ornamentation_details: data.industrial_design.ornamentation_details || '',
          material_details: data.industrial_design.material_details || '',
        });
      }

      setUploadedDocs(data.documents || []);
      if (data.field_feedbacks) {
        setFeedbacks(data.field_feedbacks);
      }
    } catch (err) {
      setError('Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  // Determine dynamic total steps based on IP Type
  const totalSteps = ipType === 'patent' ? 10 : 7;

  // Setup list of dynamic step headers
  const getStepHeader = () => {
    if (ipType === 'patent') {
      return [
        'Basic Info', 'Applicant Details', 'Inventor Details', 'Invention Specifications', 
        'Claims List', 'Technical Documents', 'Drawings/Diagrams', 'Legal Declarations', 
        'Supporting Images', 'Payment & Submit'
      ];
    } else if (ipType === 'trademark') {
      return [
        'Basic Info', 'Applicant Details', 'Brand Specifications', 'Logo & Assets', 
        'Business Proofs', 'Legal Declarations', 'Payment & Submit'
      ];
    } else if (ipType === 'copyright') {
      return [
        'Basic Info', 'Applicant/Author Details', 'Copyright Specifications', 'Work Source Files', 
        'Screenshots/Proofs', 'Legal Declarations', 'Payment & Submit'
      ];
    } else { // Industrial Design
      return [
        'Basic Info', 'Applicant Details', 'Design Specifications', 'Sketches & CAD', 
        'Product Catalogs', 'Legal Declarations', 'Payment & Submit'
      ];
    }
  };

  const stepHeaders = getStepHeader();

  // Save current step data to DB transactionally
  const saveProgress = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Base Application record initialization
      if (!appId) {
        const res = await axios.post('/applications', {
          type: ipType,
          title: basicInfo.title,
          description: basicInfo.description
        });
        setAppId(res.data.id);
        setUploadedDocs(res.data.documents || []);
        setSuccess('Application draft initiated successfully!');
        return res.data.id;
      }

      // Update state for details
      const payload = {
        title: basicInfo.title,
        description: basicInfo.description,
        applicant: applicant
      };

      if (ipType === 'patent') {
        payload.patent = {
          patent_type: basicInfo.patent_type,
          technical_category: basicInfo.technical_category,
          filing_type: basicInfo.filing_type,
          technical_domain: basicInfo.technical_domain,
          ...patentDetails
        };
      } else if (ipType === 'trademark') {
        payload.trademark = {
          trademark_type: basicInfo.trademark_type,
          industry_category: basicInfo.industry_category,
          goods_category: basicInfo.goods_category,
          ...trademarkDetails
        };
      } else if (ipType === 'copyright') {
        payload.copyright = {
          work_type: basicInfo.work_type,
          ...copyrightDetails
        };
      } else if (ipType === 'design') {
        payload.design = {
          product_category: basicInfo.product_category,
          industry_sector: basicInfo.industry_sector,
          design_category: basicInfo.design_category,
          ...designDetails
        };
      }

      const updateRes = await axios.put(`/applications/${appId}`, payload);
      setSuccess('Draft progress saved successfully!');
      return appId;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save progress.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigations
  const handleNext = async () => {
    if (currentStep === 1 && !basicInfo.title.trim()) {
      setError('Please provide a Title for your Intellectual Property');
      return;
    }

    const savedId = await saveProgress();
    if (savedId) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
      setSuccess('');
    }
  };

  // Document Uploads for wizard
  const handleUploadDoc = async (overrideCategory) => {
    const category = (typeof overrideCategory === 'string' ? overrideCategory : null) || docCategory;
    if (!selectedFile) { alert('Please select a file to upload'); return; }
    if (!category) { alert('Please select a document category'); return; }
    if (!appId) { alert('Please complete Step 1 first to create the application draft.'); return; }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', category);
    formData.append('ip_application_id', appId);

    try {
      const res = await axios.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Document successfully uploaded & attached!');
      setUploadedDocs(prev => [...prev, res.data]);
      setSelectedFile(null);
    } catch (err) {
      setError('Failed to upload selected document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document permanently?')) return;
    try {
      await axios.delete(`/documents/${docId}`);
      setUploadedDocs(uploadedDocs.filter(d => d.id !== docId));
      setSuccess('Document removed successfully.');
    } catch (err) {
      setError('Failed to delete document.');
    }
  };

  // Final submit & payment simulation
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      if (appStatus !== 'Corrections Requested') {
        // 1. Post simulated payment
        const feeAmount = ipType === 'patent' ? 15000 : ipType === 'trademark' ? 5000 : ipType === 'copyright' ? 3000 : 8000;
        await axios.post('/payments', {
          ip_application_id: appId,
          amount: feeAmount,
          payment_method: paymentData.payment_method
        });
      }

      // 2. Transition workflow status to "submitted" or "Pending Review"
      const targetStatus = appStatus === 'Corrections Requested' ? 'Pending Review' : 'submitted';
      await axios.patch(`/applications/${appId}/status`, {
        status: targetStatus,
        remarks: appStatus === 'Corrections Requested' 
          ? 'Corrections resubmitted by applicant.' 
          : 'Filing successfully completed via applicant multi-step wizard'
      });

      setSuccess(appStatus === 'Corrections Requested' 
        ? 'Corrections successfully resubmitted!' 
        : 'CONGRATULATIONS! Your IP application is successfully filed!'
      );
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError('Final filing or status transition failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const isFieldDisabled = (path) => {
    if (appStatus !== 'Corrections Requested') return false;
    return feedbacks[path]?.status !== 'rejected';
  };

  const isCategoryApproved = (category) => {
    if (appStatus !== 'Corrections Requested') return false;
    return uploadedDocs.some(doc => {
      if (doc.category !== category) return false;
      const fb = feedbacks && feedbacks['document.' + doc.id];
      return fb?.status === 'approved';
    });
  };

  const getFieldClass = (path) => {
    let classes = 'input-field ';
    if (appStatus === 'Corrections Requested') {
      if (feedbacks[path]?.status === 'rejected') classes += ' border-red-500 focus:border-red-500';
      else if (feedbacks[path]?.status === 'approved') classes += ' opacity-50 bg-slate-900/50 cursor-not-allowed';
    }
    return classes;
  };

  const renderFeedback = (path) => {
    const fb = feedbacks[path];
    if (fb && fb.status === 'rejected') {
      return (
        <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span><strong>Staff Note:</strong> {fb.remarks}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0f172a] text-slate-100">
      <div className="bg-orbs"></div>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto z-10 p-6 lg:p-10">
        <div className="max-w-5xl mx-auto w-full animate-fade-in space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors">
                <ArrowLeft className="w-5 h-5" /> Back to Dashboard
              </button>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">IP Registration Portal</h1>
              <p className="text-slate-400 mt-1">Submit your Patent, Trademark, Copyright, or Design filings securely.</p>
            </div>
            
            {appId && (
              <span className="bg-slate-800 border border-white/5 px-4 py-2 rounded-xl text-xs font-mono text-primary-400">
                Application: #{appId}
              </span>
            )}
          </div>

          {/* Stepper Progress Bar */}
          <div className="glass-card p-6">
            <div className="flex justify-between text-xs text-slate-400 font-semibold mb-3">
              <span>Step {currentStep} of {totalSteps}: <strong className="text-white">{stepHeaders[currentStep - 1]}</strong></span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl font-medium flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Content Wizard Body */}
          <div className="glass-card shadow-2xl p-6 lg:p-8">
            
            {/* STEP 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Step 1 — Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">IP Category Select</label>
                    <select 
                      disabled={!!appId}
                      value={ipType} 
                      onChange={(e) => setIpType(e.target.value)}
                      className="input-field cursor-pointer"
                    >
                      <option value="patent" className="bg-slate-900">Patent Registration</option>
                      <option value="trademark" className="bg-slate-900">Trademark Registration</option>
                      <option value="copyright" className="bg-slate-900">Copyright Registration</option>
                      <option value="design" className="bg-slate-900">Industrial Design Registration</option>
                    </select>
                    {appId && <p className="text-xs text-slate-500 italic">Category is locked after draft initiation</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Title / Brand Name of IP</label>
                    <input 
                      type="text" 
                      value={basicInfo.title} disabled={isFieldDisabled('title')} className={getFieldClass('title')} onChange={(e) => setBasicInfo({ ...basicInfo, title: e.target.value })} />
{renderFeedback('title')}<label className="text-sm font-medium text-slate-300">Abstract Summary / Description</label>
                  <textarea 
                    value={basicInfo.description} disabled={isFieldDisabled('description')} className={getFieldClass('description')} onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}></textarea>
{renderFeedback('description')}
                </div>
              </div>

                {/* Patent specific basics */}
                {ipType === 'patent' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Patent Type</label>
                      <select value={basicInfo.patent_type} disabled={isFieldDisabled('patent_type')} className={getFieldClass('patent_type')} onChange={(e) => setBasicInfo({ ...basicInfo, patent_type: e.target.value })}><option value="provisional" className="bg-slate-900">Provisional Specification</option>
                        <option value="complete" className="bg-slate-900">Complete Specification</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Technical Category</label>
                      <input type="text" value={basicInfo.technical_category} disabled={isFieldDisabled('technical_category')} className={getFieldClass('technical_category')} onChange={(e) => setBasicInfo({ ...basicInfo, technical_category: e.target.value })} />
{renderFeedback('technical_category')}</div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Filing Type</label>
                      <input type="text" value={basicInfo.filing_type} disabled={isFieldDisabled('filing_type')} className={getFieldClass('filing_type')} onChange={(e) => setBasicInfo({ ...basicInfo, filing_type: e.target.value })} />
                      {renderFeedback('filing_type')}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Technical Domain</label>
                      <input type="text" value={basicInfo.technical_domain} disabled={isFieldDisabled('technical_domain')} className={getFieldClass('technical_domain')} onChange={(e) => setBasicInfo({ ...basicInfo, technical_domain: e.target.value })} />
{renderFeedback('technical_domain')}</div>
                  </div>
                )}

                {/* Trademark basics */}
                {ipType === 'trademark' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Trademark Type</label>
                      <select value={basicInfo.trademark_type} disabled={isFieldDisabled('trademark_type')} className={getFieldClass('trademark_type')} onChange={(e) => setBasicInfo({ ...basicInfo, trademark_type: e.target.value })}><option value="wordmark" className="bg-slate-900">Wordmark</option>
                        <option value="device" className="bg-slate-900">Device/Logo mark</option>
                        <option value="slogan" className="bg-slate-900">Slogan/Tagline</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Industry Category</label>
                      <input type="text" value={basicInfo.industry_category} disabled={isFieldDisabled('industry_category')} className={getFieldClass('industry_category')} onChange={(e) => setBasicInfo({ ...basicInfo, industry_category: e.target.value })} />
{renderFeedback('industry_category')}</div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Goods/Services Category Class</label>
                      <input type="text" value={basicInfo.goods_category} disabled={isFieldDisabled('goods_category')} className={getFieldClass('goods_category')} onChange={(e) => setBasicInfo({ ...basicInfo, goods_category: e.target.value })} />
{renderFeedback('goods_category')}</div>
                  </div>
                )}

                {/* Copyright basics */}
                {ipType === 'copyright' && (
                  <div className="space-y-2 pt-4">
                    <label className="text-xs text-slate-400">Type of Literary/Artistic Work</label>
                    <select value={basicInfo.work_type} disabled={isFieldDisabled('work_type')} className={getFieldClass('work_type')} onChange={(e) => setBasicInfo({ ...basicInfo, work_type: e.target.value })}><option value="software" className="bg-slate-900">Software / Source Code</option>
                      <option value="music" className="bg-slate-900">Musical Score / Audio</option>
                      <option value="book" className="bg-slate-900">Book / Manuscript</option>
                      <option value="video" className="bg-slate-900">Cinematographic / Video</option>
                      <option value="artwork" className="bg-slate-900">Artistic Drawing</option>
                      <option value="photograph" className="bg-slate-900">Photograph</option>
                      <option value="research_paper" className="bg-slate-900">Research Paper</option>
                    </select>
                  </div>
                )}

                {/* Design basics */}
                {ipType === 'design' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Product Category</label>
                      <input type="text" value={basicInfo.product_category} disabled={isFieldDisabled('product_category')} className={getFieldClass('product_category')} onChange={(e) => setBasicInfo({ ...basicInfo, product_category: e.target.value })} />
{renderFeedback('product_category')}</div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Industry Sector</label>
                      <input type="text" value={basicInfo.industry_sector} disabled={isFieldDisabled('industry_sector')} className={getFieldClass('industry_sector')} onChange={(e) => setBasicInfo({ ...basicInfo, industry_sector: e.target.value })} />
{renderFeedback('industry_sector')}</div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Design Class Category</label>
                      <input type="text" value={basicInfo.design_category} disabled={isFieldDisabled('design_category')} className={getFieldClass('design_category')} onChange={(e) => setBasicInfo({ ...basicInfo, design_category: e.target.value })} />
{renderFeedback('design_category')}</div>
                  </div>
                )}

              </div>
            )}

            {/* STEP 2: Applicant details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Step 2 — Applicant Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Applicant Full Name</label>
                    <input 
                      type="text" 
                      value={applicant.full_name} disabled={isFieldDisabled('applicant.full_name')} className={getFieldClass('applicant.full_name')} onChange={(e) => setApplicant({ ...applicant, full_name: e.target.value })} />
{renderFeedback('applicant.full_name')}<label className="text-sm font-medium text-slate-300">Organization / Company Name</label>
                    <input 
                      type="text" 
                      value={applicant.company_name} disabled={isFieldDisabled('applicant.company_name')} className={getFieldClass('applicant.company_name')} onChange={(e) => setApplicant({ ...applicant, company_name: e.target.value })} />
{renderFeedback('applicant.company_name')}</div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Applicant Category Type</label>
                    <select 
                      value={applicant.applicant_type} disabled={isFieldDisabled('applicant.applicant_type')} className={getFieldClass('applicant.applicant_type')} onChange={(e) => setApplicant({ ...applicant, applicant_type: e.target.value })}><option value="individual" className="bg-slate-900">Individual/Natural Person</option>
                      <option value="startup" className="bg-slate-900">Startup</option>
                      <option value="MSME" className="bg-slate-900">MSME</option>
                      <option value="corporate" className="bg-slate-900">Large Corporate</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Nationality</label>
                    <input 
                      type="text" 
                      value={applicant.nationality} disabled={isFieldDisabled('applicant.nationality')} className={getFieldClass('applicant.nationality')} onChange={(e) => setApplicant({ ...applicant, nationality: e.target.value })} />
{renderFeedback('applicant.nationality')}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Full Postal Address</label>
                  <textarea 
                    value={applicant.address} disabled={isFieldDisabled('applicant.address')} className={getFieldClass('applicant.address')} onChange={(e) => setApplicant({ ...applicant, address: e.target.value })} />
{renderFeedback('applicant.address')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Contact Email</label>
                    <input 
                      type="email" 
                      value={applicant.email} disabled={isFieldDisabled('applicant.email')} className={getFieldClass('applicant.email')} onChange={(e) => setApplicant({ ...applicant, email: e.target.value })} />
{renderFeedback('applicant.email')}</div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Phone Number</label>
                    <input 
                      type="text" 
                      value={applicant.phone_number} disabled={isFieldDisabled('applicant.phone_number')} className={getFieldClass('applicant.phone_number')} onChange={(e) => setApplicant({ ...applicant, phone_number: e.target.value })} />
{renderFeedback('applicant.phone_number')}</div>
                </div>

                {/* Document Attachments for Applicant */}
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-sm font-bold text-white">Upload Applicant Identification Proofs</h4>
                  <p className="text-xs text-slate-400">Supported formats: PDF, PNG, JPG. Max 10MB.</p>
                  
                  <div className="flex flex-wrap gap-4 items-center">
                    <select 
                      value={docCategory} 
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="input-field max-w-[200px] text-xs py-2"
                    >
                      <option value="">Select Document Category</option>
                      <option value="Identity proof" className="bg-slate-900">Identity proof</option>
                      <option value="Address proof" className="bg-slate-900">Address proof</option>
                      <option value="Business registration certificate" className="bg-slate-900">Business registration certificate</option>
                    </select>

                    <input 
                      type="file" 
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-500/10 file:text-primary-400 file:cursor-pointer"
                    />

                    <button 
                      onClick={() => handleUploadDoc()}
                      disabled={uploading}
                      className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
                    </button>
                  </div>

                  <FileList documents={uploadedDocs} onDelete={handleDeleteDoc} feedbacks={feedbacks} appStatus={appStatus} />
                </div>

              </div>
            )}

            {/* STEP 3: Patent Inventor (If Patent) or Specific details */}
            {currentStep === 3 && ipType === 'patent' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Step 3 — Inventor Details</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Inventor Full Name</label>
                    <input 
                      type="text" 
                      value={patentDetails.inventor_name} disabled={isFieldDisabled('patent.inventor_name')} className={getFieldClass('patent.inventor_name')} onChange={(e) => setPatentDetails({ ...patentDetails, inventor_name: e.target.value })} />
{renderFeedback('patent.inventor_name')}</div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Inventor Nationality</label>
                    <input 
                      type="text" 
                      value={patentDetails.inventor_nationality} disabled={isFieldDisabled('patent.inventor_nationality')} className={getFieldClass('patent.inventor_nationality')} onChange={(e) => setPatentDetails({ ...patentDetails, inventor_nationality: e.target.value })} />
{renderFeedback('patent.inventor_nationality')}</div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-300">Address</label>
                    <input 
                      type="text" 
                      value={patentDetails.inventor_address} disabled={isFieldDisabled('patent.inventor_address')} className={getFieldClass('patent.inventor_address')} onChange={(e) => setPatentDetails({ ...patentDetails, inventor_address: e.target.value })} />
{renderFeedback('patent.inventor_address')}</div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Email</label>
                    <input 
                      type="email" 
                      value={patentDetails.inventor_email} disabled={isFieldDisabled('patent.inventor_email')} className={getFieldClass('patent.inventor_email')} onChange={(e) => setPatentDetails({ ...patentDetails, inventor_email: e.target.value })} />
{renderFeedback('patent.inventor_email')}</div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Contribution Details / Percent</label>
                    <input 
                      type="text" 
                      value={patentDetails.contribution_details} disabled={isFieldDisabled('patent.contribution_details')} className={getFieldClass('patent.contribution_details')} onChange={(e) => setPatentDetails({ ...patentDetails, contribution_details: e.target.value })} />
{renderFeedback('patent.contribution_details')}</div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-sm font-bold text-white">Upload Inventor Identification Declarations</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <select 
                      value={docCategory} 
                      onChange={(e) => setDocCategory(e.target.value)}
                      className="input-field max-w-[200px] text-xs py-2"
                    >
                      <option value="">Select Category</option>
                      <option value="Inventor declaration" className="bg-slate-900">Inventor declaration</option>
                      <option value="ID proof" className="bg-slate-900">ID proof</option>
                      <option value="Assignment agreement" className="bg-slate-900">Assignment agreement</option>
                    </select>

                    <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-xs" />
                    <button onClick={() => handleUploadDoc()} disabled={uploading} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload</button>
                  </div>
                  <FileList documents={uploadedDocs} onDelete={handleDeleteDoc} feedbacks={feedbacks} appStatus={appStatus} />
                </div>
              </div>
            )}

            {/* STEP 4: Patent Invention details (If Patent) */}
            {currentStep === 4 && ipType === 'patent' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Step 4 — Patent & Invention Details</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Abstract Summary of Invention</label>
                    <textarea value={patentDetails.abstract} disabled={isFieldDisabled('patent.abstract')} className={getFieldClass('patent.abstract')} onChange={(e) => setPatentDetails({ ...patentDetails, abstract: e.target.value })}></textarea>
{renderFeedback('patent.abstract')}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Background of Invention</label>
                    <textarea value={patentDetails.background} disabled={isFieldDisabled('patent.background')} className={getFieldClass('patent.background')} onChange={(e) => setPatentDetails({ ...patentDetails, background: e.target.value })}></textarea>
{renderFeedback('patent.background')}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Problem Statement</label>
                    <textarea value={patentDetails.problem_statement} disabled={isFieldDisabled('patent.problem_statement')} className={getFieldClass('patent.problem_statement')} onChange={(e) => setPatentDetails({ ...patentDetails, problem_statement: e.target.value })}></textarea>
{renderFeedback('patent.problem_statement')}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Existing Solution Limitations</label>
                    <textarea value={patentDetails.limitations} disabled={isFieldDisabled('patent.limitations')} className={getFieldClass('patent.limitations')} onChange={(e) => setPatentDetails({ ...patentDetails, limitations: e.target.value })}></textarea>
{renderFeedback('patent.limitations')}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Detailed Description of Invention</label>
                    <textarea value={patentDetails.detailed_description} disabled={isFieldDisabled('patent.detailed_description')} className={getFieldClass('patent.detailed_description')} onChange={(e) => setPatentDetails({ ...patentDetails, detailed_description: e.target.value })}></textarea>
{renderFeedback('patent.detailed_description')}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Novelty Description</label>
                      <textarea value={patentDetails.novelty} disabled={isFieldDisabled('patent.novelty')} className={getFieldClass('patent.novelty')} onChange={(e) => setPatentDetails({ ...patentDetails, novelty: e.target.value })}></textarea>
{renderFeedback('patent.novelty')}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Advantages</label>
                      <textarea value={patentDetails.advantages} disabled={isFieldDisabled('patent.advantages')} className={getFieldClass('patent.advantages')} onChange={(e) => setPatentDetails({ ...patentDetails, advantages: e.target.value })}></textarea>
{renderFeedback('patent.advantages')}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400">Industrial Applicability</label>
                      <textarea value={patentDetails.applicability} disabled={isFieldDisabled('patent.applicability')} className={getFieldClass('patent.applicability')} onChange={(e) => setPatentDetails({ ...patentDetails, applicability: e.target.value })}></textarea>
{renderFeedback('patent.applicability')}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-sm font-bold text-white">Upload Detailed Technical Specification Write-ups</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="input-field max-w-[200px] text-xs py-2">
                      <option value="">Select Category</option>
                      <option value="Technical write-up">Technical write-up</option>
                      <option value="Research explanation">Research explanation</option>
                      <option value="Innovation summary">Innovation summary</option>
                    </select>
                    <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-xs" />
                    <button onClick={() => handleUploadDoc()} disabled={uploading} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload</button>
                  </div>
                  <FileList documents={uploadedDocs} onDelete={handleDeleteDoc} feedbacks={feedbacks} appStatus={appStatus} />
                </div>
              </div>
            )}

            {/* STEP 5: Patent Claims (If Patent) */}
            {currentStep === 5 && ipType === 'patent' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Step 5 — Patent Claims</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Independent Claims</label>
                    <textarea 
                      value={patentDetails.independent_claims} disabled={isFieldDisabled('patent.independent_claims')} className={getFieldClass('patent.independent_claims')} onChange={(e) => setPatentDetails({ ...patentDetails, independent_claims: e.target.value })}></textarea>
{renderFeedback('patent.independent_claims')}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Dependent Claims</label>
                    <textarea 
                      value={patentDetails.dependent_claims} disabled={isFieldDisabled('patent.dependent_claims')} className={getFieldClass('patent.dependent_claims')} onChange={(e) => setPatentDetails({ ...patentDetails, dependent_claims: e.target.value })}></textarea>
{renderFeedback('patent.dependent_claims')}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-sm font-bold text-white">Upload Claims Document Sheet</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className="text-xs text-slate-400">Claims Document Sheet PDF:</span>
                    <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-xs" />
                    <button onClick={() => handleUploadDoc('Claims document')} disabled={uploading} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload</button>
                  </div>
                  <FileList documents={uploadedDocs} onDelete={handleDeleteDoc} feedbacks={feedbacks} appStatus={appStatus} />
                </div>
              </div>
            )}

            {/* STEP 6: Patent Technical Specs OR Trademark details */}
            {currentStep === 6 && ipType === 'patent' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Step 6 — Technical Specification Documents</h3>
                <p className="text-xs text-slate-400">Please attach comprehensive architectural blueprints, algorithms, research specs or test logs.</p>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="input-field max-w-[200px] text-xs py-2">
                    <option value="">Select Technical Type</option>
                    <option value="Technical specification">Technical specification</option>
                    <option value="Architecture documents">Architecture documents</option>
                    <option value="Algorithm explanation">Algorithm explanation</option>
                    <option value="Research papers">Research papers</option>
                    <option value="Testing reports">Testing reports</option>
                    <option value="Prototype details">Prototype details</option>
                  </select>
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-xs" />
                  <button onClick={() => handleUploadDoc()} disabled={uploading} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload</button>
                </div>
                <FileList documents={uploadedDocs} onDelete={handleDeleteDoc} feedbacks={feedbacks} appStatus={appStatus} />
              </div>
            )}

            {/* STEP 3 (NON-PATENT): Brand Specifications Details */}
            {currentStep === 3 && ipType !== 'patent' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Step 3 — Specifications & Details</h3>

                {ipType === 'trademark' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Brand Description</label>
                      <textarea value={trademarkDetails.brand_description} disabled={isFieldDisabled('trademark.brand_description')} className={getFieldClass('trademark.brand_description')} onChange={(e) => setTrademarkDetails({ ...trademarkDetails, brand_description: e.target.value })}></textarea>
{renderFeedback('trademark.brand_description')}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Trademark Slogan/Meaning</label>
                        <input type="text" value={trademarkDetails.trademark_meaning} disabled={isFieldDisabled('trademark.trademark_meaning')} className={getFieldClass('trademark.trademark_meaning')} onChange={(e) => setTrademarkDetails({ ...trademarkDetails, trademark_meaning: e.target.value })} />
{renderFeedback('trademark.trademark_meaning')}</div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">First Usage Date (If applicable)</label>
                        <input type="date" value={trademarkDetails.first_use_date} disabled={isFieldDisabled('trademark.first_use_date')} className={getFieldClass('trademark.first_use_date')} onChange={(e) => setTrademarkDetails({ ...trademarkDetails, first_use_date: e.target.value })} />
{renderFeedback('trademark.first_use_date')}</div>
                    </div>
                  </div>
                )}

                {ipType === 'copyright' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Description of Creative Work</label>
                      <textarea value={copyrightDetails.description} disabled={isFieldDisabled('copyright.description')} className={getFieldClass('copyright.description')} onChange={(e) => setCopyrightDetails({ ...copyrightDetails, description: e.target.value })}></textarea>
{renderFeedback('copyright.description')}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Creation Date</label>
                        <input type="date" value={copyrightDetails.creation_date} disabled={isFieldDisabled('copyright.creation_date')} className={getFieldClass('copyright.creation_date')} onChange={(e) => setCopyrightDetails({ ...copyrightDetails, creation_date: e.target.value })} />
{renderFeedback('copyright.creation_date')}</div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Publication Date</label>
                        <input type="date" value={copyrightDetails.publication_date} disabled={isFieldDisabled('copyright.publication_date')} className={getFieldClass('copyright.publication_date')} onChange={(e) => setCopyrightDetails({ ...copyrightDetails, publication_date: e.target.value })} />
{renderFeedback('copyright.publication_date')}</div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Owner Name</label>
                        <input type="text" value={copyrightDetails.owner_name} disabled={isFieldDisabled('copyright.owner_name')} className={getFieldClass('copyright.owner_name')} onChange={(e) => setCopyrightDetails({ ...copyrightDetails, owner_name: e.target.value })} />
{renderFeedback('copyright.owner_name')}</div>
                    </div>
                  </div>
                )}

                {ipType === 'design' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Design Appearance & Shape Details</label>
                      <textarea value={designDetails.shape_details} disabled={isFieldDisabled('industrialDesign.shape_details')} className={getFieldClass('industrialDesign.shape_details')} onChange={(e) => setDesignDetails({ ...designDetails, shape_details: e.target.value })} />
{renderFeedback('industrialDesign.shape_details')}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Pattern & Ornamentation Details</label>
                        <input type="text" value={designDetails.pattern_details} disabled={isFieldDisabled('industrialDesign.pattern_details')} className={getFieldClass('industrialDesign.pattern_details')} onChange={(e) => setDesignDetails({ ...designDetails, pattern_details: e.target.value })} />
{renderFeedback('industrialDesign.pattern_details')}</div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Material & Construction Specifications</label>
                        <input type="text" value={designDetails.material_details} disabled={isFieldDisabled('industrialDesign.material_details')} className={getFieldClass('industrialDesign.material_details')} onChange={(e) => setDesignDetails({ ...designDetails, material_details: e.target.value })} />
{renderFeedback('industrialDesign.material_details')}</div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* STEP 4 (NON-PATENT): Logo / Source Code / Drawings upload */}
            {currentStep === 4 && ipType !== 'patent' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Step 4 — Core Brand Assets / Files</h3>
                <p className="text-xs text-slate-400">Please attach original logo images, software manuscripts, or design sketch diagrams.</p>

                <div className="flex flex-wrap gap-4 items-center">
                  <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="input-field max-w-[200px] text-xs py-2">
                    <option value="">Select File Type</option>
                    {ipType === 'trademark' && <option value="Logo image">Logo image</option>}
                    {ipType === 'trademark' && <option value="Brand image">Brand image</option>}
                    {ipType === 'copyright' && <option value="Source code">Source code</option>}
                    {ipType === 'copyright' && <option value="PDF manuscripts">PDF manuscripts</option>}
                    {ipType === 'design' && <option value="Product images">Product images</option>}
                    {ipType === 'design' && <option value="3D renders">3D renders</option>}
                    {ipType === 'design' && <option value="Design sketches">Design sketches</option>}
                  </select>
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-xs" />
                  <button onClick={() => handleUploadDoc()} disabled={uploading} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload</button>
                </div>
                <FileList documents={uploadedDocs} onDelete={handleDeleteDoc} feedbacks={feedbacks} appStatus={appStatus} />
              </div>
            )}

            {/* STEP 5 (NON-PATENT): Business / Screenshots upload */}
            {currentStep === 5 && ipType !== 'patent' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Step 5 — Business Proofs & Supporting Files</h3>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="input-field max-w-[200px] text-xs py-2">
                    <option value="">Select Type</option>
                    {ipType === 'trademark' && <option value="Trademark usage proof">Trademark usage proof</option>}
                    {ipType === 'trademark' && <option value="Website screenshots">Website screenshots</option>}
                    {ipType === 'copyright' && <option value="Screenshots">Screenshots</option>}
                    {ipType === 'copyright' && <option value="Publishing proof">Publishing proof</option>}
                    {ipType === 'design' && <option value="Prototype images">Prototype images</option>}
                    {ipType === 'design' && <option value="Product catalog">Product catalog</option>}
                  </select>
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-xs" />
                  <button onClick={() => handleUploadDoc()} disabled={uploading} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload</button>
                </div>
                <FileList documents={uploadedDocs} onDelete={handleDeleteDoc} feedbacks={feedbacks} appStatus={appStatus} />
              </div>
            )}

            {/* STEP 7: Patent Drawings */}
            {currentStep === 7 && ipType === 'patent' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Step 7 — Drawings & Diagrams</h3>
                <p className="text-xs text-slate-400">Attach mechanical drawings, flowcharts, UML diagrams or neural model workflow graphs.</p>

                <div className="flex flex-wrap gap-4 items-center">
                  <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="input-field max-w-[200px] text-xs py-2">
                    <option value="">Select Drawing Type</option>
                    <option value="Flowcharts">Flowcharts</option>
                    <option value="UML diagrams">UML diagrams</option>
                    <option value="Circuit diagrams">Circuit diagrams</option>
                    <option value="Mechanical diagrams">Mechanical diagrams</option>
                    <option value="Architecture diagrams">Architecture diagrams</option>
                  </select>
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-xs" />
                  <button onClick={() => handleUploadDoc()} disabled={uploading} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload</button>
                </div>
                <FileList documents={uploadedDocs} onDelete={handleDeleteDoc} feedbacks={feedbacks} appStatus={appStatus} />
              </div>
            )}

            {/* STEP 8: Patent Legal Documents OR STEP 6 Non-Patent Legal */}
            {((currentStep === 8 && ipType === 'patent') || (currentStep === 6 && ipType !== 'patent')) && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Legal Declarations & Certificates</h3>
                
                <div className="space-y-4 bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="inventor_decl"
                      checked={declarations.declaration_of_inventorship}
                      onChange={(e) => setDeclarations({ ...declarations, declaration_of_inventorship: e.target.checked })}
                      className="w-5 h-5 mt-0.5 rounded cursor-pointer accent-primary-500" 
                    />
                    <label htmlFor="inventor_decl" className="text-sm text-slate-300 cursor-pointer">
                      I declare under penalty of perjury that I am the sole inventor/author/designer of this intellectual property.
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="owner_decl"
                      checked={declarations.ownership_declaration}
                      onChange={(e) => setDeclarations({ ...declarations, ownership_declaration: e.target.checked })}
                      className="w-5 h-5 mt-0.5 rounded cursor-pointer accent-primary-500" 
                    />
                    <label htmlFor="owner_decl" className="text-sm text-slate-300 cursor-pointer">
                      I declare that all corporate assignment agreements or Power of Attorneys are executed correctly.
                    </label>
                  </div>

                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="undertaking_decl"
                      checked={declarations.undertaking}
                      onChange={(e) => setDeclarations({ ...declarations, undertaking: e.target.checked })}
                      className="w-5 h-5 mt-0.5 rounded cursor-pointer accent-primary-500" 
                    />
                    <label htmlFor="undertaking_decl" className="text-sm text-slate-300 cursor-pointer">
                      I understand that false declarations will lead to application cancellation and statutory penalties.
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-4">
                  <h4 className="text-sm font-bold text-white">Upload Signed Legal Certificates</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="input-field max-w-[200px] text-xs py-2">
                      <option value="">Select Document Type</option>
                      <option value="Declaration of inventorship">Declaration of inventorship</option>
                      <option value="Ownership declaration">Ownership declaration</option>
                      <option value="Assignment agreement">Assignment agreement</option>
                      <option value="Power of attorney">Power of attorney</option>
                    </select>
                    <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-xs" />
                    <button onClick={() => handleUploadDoc()} disabled={uploading} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload</button>
                  </div>
                  <FileList documents={uploadedDocs} onDelete={handleDeleteDoc} feedbacks={feedbacks} appStatus={appStatus} />
                </div>
              </div>
            )}

            {/* STEP 9: Patent Supporting Documents */}
            {currentStep === 9 && ipType === 'patent' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Step 9 — Patent Supporting Documents</h3>
                <p className="text-xs text-slate-400">Attach prototype images, lab testing results, research logs, or product photos.</p>

                <div className="flex flex-wrap gap-4 items-center">
                  <select value={docCategory} onChange={(e) => setDocCategory(e.target.value)} className="input-field max-w-[200px] text-xs py-2">
                    <option value="">Select Supporting Type</option>
                    <option value="Prototype images">Prototype images</option>
                    <option value="Product photos">Product photos</option>
                    <option value="Lab reports">Lab reports</option>
                    <option value="Research certificates">Research certificates</option>
                  </select>
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="text-xs" />
                  <button onClick={() => handleUploadDoc()} disabled={uploading} className="btn-primary text-xs py-2 px-4 flex items-center gap-2">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload</button>
                </div>
                <FileList documents={uploadedDocs} onDelete={handleDeleteDoc} feedbacks={feedbacks} appStatus={appStatus} />
              </div>
            )}

            {/* FINAL STEP: Payment & Final Submission */}
            {((currentStep === 10 && ipType === 'patent') || (currentStep === 7 && ipType !== 'patent')) && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white border-b border-white/5 pb-3">Final Step — Payment & Submission</h3>

                {appStatus === 'Corrections Requested' ? (
                  <div className="glass-card p-8 text-center max-w-xl mx-auto space-y-6">
                    <div className="bg-primary-500/10 border border-primary-500/20 text-primary-400 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-bold text-white">Corrections Verification</h4>
                      <p className="text-sm text-slate-400">
                        The statutory filing fee for this {ipType} has already been paid and verified. 
                        No additional payments or billing information details are required.
                      </p>
                    </div>
                    <form onSubmit={handleFinalSubmit} className="pt-4">
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                        Resubmit Corrections for Review
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Fee Summary */}
                    <div className="space-y-4 bg-slate-800/40 p-6 rounded-2xl border border-white/5">
                      <h4 className="text-base font-bold text-white">Application Filing Fee Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Filing Type:</span>
                          <span className="text-white uppercase font-bold">{ipType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Applicant:</span>
                          <span className="text-white">{applicant.full_name || 'Individual Applicant'}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-white/5 text-lg font-bold">
                          <span className="text-white">Total Statutory Fee:</span>
                          <span className="text-green-400">₹ {ipType === 'patent' ? '15,000' : ipType === 'trademark' ? '5,000' : ipType === 'copyright' ? '3,000' : '8,000'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Payment Form */}
                    <div className="space-y-6 flex flex-col justify-between h-full bg-slate-800/40 p-6 rounded-2xl border border-white/5">
                      <div>
                        <h4 className="text-base font-bold text-white mb-2">Proceed with Registration Payment</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          To successfully submit your IP filing to the Intellectual Property Facilitation Centre, you need to pay the official government statutory fee.
                        </p>
                        <div className="mt-4 p-4 bg-emerald-950/15 border border-emerald-900/30 rounded-xl flex gap-3 text-left">
                          <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-xs font-bold text-slate-200">Sandbox Test Environment Enabled</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              No real bank accounts are charged. You can simulate full card verification and bank-level OTP workflow.
                            </p>
                          </div>
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => setIsCheckoutOpen(true)}
                        className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 cursor-pointer text-white font-bold"
                      >
                        <Lock className="w-4 h-4" />
                        Proceed to Secure Checkout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stepper Footer Controls */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
              <button 
                onClick={handlePrev} 
                disabled={currentStep === 1}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white border border-transparent hover:border-white/10 transition-colors disabled:opacity-20"
              >
                Previous Step
              </button>

              {((currentStep === 10 && ipType === 'patent') || (currentStep === 7 && ipType !== 'patent')) ? (
                <span className="text-xs text-slate-500 font-mono italic">Final submission step</span>
              ) : (
                <button 
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-2 px-8 py-2.5"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next Step <ArrowRight className="w-5 h-5" /></>}
                </button>
              )}
            </div>

          </div>
        </div>
      </main>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        applicationId={appId}
        applicationTitle={basicInfo.title}
        amount={ipType === 'patent' ? 15000 : ipType === 'trademark' ? 5000 : ipType === 'copyright' ? 3000 : 8000}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

const FileList = ({ documents, onDelete, feedbacks, appStatus }) => {
  if (!documents || documents.length === 0) return null;
  return (
    <div className="space-y-2 mt-4">
      <h5 className="text-xs font-bold text-slate-300">Attached Documents for this phase:</h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {documents.map(doc => {
          const fb = feedbacks && feedbacks['document.' + doc.id];
          const isApproved = fb?.status === 'approved';
          const isRejected = fb?.status === 'rejected';
          
          let cardClasses = "p-4 rounded-xl transition-all border flex flex-col justify-between ";
          if (isRejected) {
            cardClasses += "border-red-500/30 bg-red-500/5 shadow-lg shadow-red-500/5";
          } else if (isApproved) {
            cardClasses += "border-green-500/20 bg-green-500/5";
          } else {
            cardClasses += "border-white/5 bg-white/[0.02]";
          }

          return (
            <div key={doc.id} className={cardClasses}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <FileText className={isRejected ? "w-6 h-6 text-red-400" : isApproved ? "w-6 h-6 text-green-400" : "w-6 h-6 text-primary-400"} />
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[200px]">{doc.file_name}</p>
                    <p className="text-[10px] text-slate-500">{doc.category} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                
                {/* Delete button only active if NOT approved or if rejected */}
                {(!isApproved || isRejected) && (
                  <button 
                    onClick={() => onDelete(doc.id)} 
                    className="px-2.5 py-1 text-[10px] bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg font-bold transition-all"
                  >
                    Delete
                  </button>
                )}
              </div>

              {isRejected && (
                <div className="mt-3 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div>
                    <strong>Staff Note:</strong> {fb.remarks || 'Please resubmit this document.'}
                    <div className="font-semibold text-white mt-1">Please delete this file and upload a corrected version.</div>
                  </div>
                </div>
              )}

              {isApproved && (
                <div className="mt-2.5 text-[10px] text-green-400 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved by reviewer
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationWizard;

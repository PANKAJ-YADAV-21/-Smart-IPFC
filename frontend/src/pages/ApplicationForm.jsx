import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Save, ArrowLeft, Loader2 } from 'lucide-react';

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'patent',
    title: '',
    description: '',
    inventor_details: '',
    category: '',
    brand_name: '',
    work_type: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await axios.post('/applications', formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-[#0f172a]">
      <div className="bg-orbs"></div>
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto z-10 p-6 lg:p-10">
        <div className="max-w-4xl mx-auto w-full animate-fade-in">
          
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white">New IP Application</h1>
            <p className="text-slate-400 mt-2">Submit a new intellectual property application for verification.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 font-medium">
              {error}
            </div>
          )}

          <div className="glass-card shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 ml-1">Application Type</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleChange}
                  className="input-field cursor-pointer"
                  required
                >
                  <option value="patent" className="bg-slate-900">Patent</option>
                  <option value="trademark" className="bg-slate-900">Trademark</option>
                  <option value="copyright" className="bg-slate-900">Copyright</option>
                  <option value="design" className="bg-slate-900">Industrial Design</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 ml-1">Title / Name of IP</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange}
                  className="input-field"
                  placeholder="E.g., Smart Grid Distribution Logic"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 ml-1">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange}
                  className="input-field min-h-[120px] resize-y"
                  placeholder="Provide a detailed description of the intellectual property..."
                ></textarea>
              </div>

              {/* Dynamic Fields based on Type */}
              {formData.type === 'patent' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 ml-1">Inventor Details</label>
                    <input type="text" name="inventor_details" value={formData.inventor_details} onChange={handleChange} className="input-field" placeholder="Full names of inventors" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 ml-1">Technical Category</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} className="input-field" placeholder="e.g., Software, Mechanical" />
                  </div>
                </div>
              )}

              {formData.type === 'trademark' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 ml-1">Brand Name</label>
                    <input type="text" name="brand_name" value={formData.brand_name} onChange={handleChange} className="input-field" placeholder="Exact brand name or slogan" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-300 ml-1">Business Category</label>
                    <input type="text" name="category" value={formData.category} onChange={handleChange} className="input-field" placeholder="e.g., Electronics, Food & Beverage" />
                  </div>
                </div>
              )}

              {formData.type === 'copyright' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-300 ml-1">Type of Work</label>
                    <input type="text" name="work_type" value={formData.work_type} onChange={handleChange} className="input-field" placeholder="e.g., Literary, Musical, Artistic, Software Code" />
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-white/5 flex justify-end gap-4">
                <button 
                  type="button" 
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-2 px-8"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Submit Application
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ApplicationForm;

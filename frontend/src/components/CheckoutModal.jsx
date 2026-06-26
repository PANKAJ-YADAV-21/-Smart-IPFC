import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Lock, ShieldCheck, AlertCircle, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const CheckoutModal = ({ isOpen, onClose, applicationId, applicationTitle, amount, onSuccess }) => {
  if (!isOpen) return null;

  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: ''
  });
  const [focusedField, setFocusedField] = useState('');
  const [paymentStep, setPaymentStep] = useState('form'); // form | processing | otp | success | failed
  const [processingMsg, setProcessingMsg] = useState('');
  const [otp, setOtp] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [apiError, setApiError] = useState('');

  // Brand detection
  const getCardBrand = (num) => {
    const cleanNum = num.replace(/\s+/g, '');
    if (/^4/.test(cleanNum)) return 'visa';
    if (/^5[1-5]/.test(cleanNum)) return 'mastercard';
    if (/^3[47]/.test(cleanNum)) return 'amex';
    if (/^6(?:011|5)/.test(cleanNum)) return 'discover';
    if (/^6521/.test(cleanNum)) return 'rupay';
    return 'credit_card';
  };

  // Card input formatters
  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    // Add spaces every 4 characters
    const formatted = value.match(/.{1,4}/g)?.join(' ') || '';
    setCardData({ ...cardData, number: formatted });
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardData({ ...cardData, expiry: value });
  };

  const handleCvvChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 3) value = value.slice(0, 3);
    setCardData({ ...cardData, cvv: value });
  };

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (paymentStep === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [paymentStep, countdown]);

  // Initiate Payment
  const initiatePayment = async (e) => {
    e.preventDefault();
    if (cardData.number.replace(/\s/g, '').length !== 16) {
      alert('Please enter a valid 16-digit card number.');
      return;
    }
    if (!cardData.name.trim()) {
      alert('Please enter the cardholder name.');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      alert('Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (cardData.cvv.length !== 3) {
      alert('Please enter a valid 3-digit CVV.');
      return;
    }

    setPaymentStep('processing');
    setApiError('');

    try {
      // Step 1: Connecting
      setProcessingMsg('Connecting to secure banking gateway...');
      await new Promise(r => setTimeout(r, 1200));

      // Step 2: Create payment on backend (will return a transaction/payment record in 'pending' state)
      setProcessingMsg('Creating payment session...');
      const response = await axios.post('/payments', {
        ip_application_id: applicationId,
        amount: amount,
        payment_method: 'card'
      });

      const { payment } = response.data;
      setPaymentRecord(payment);

      // Step 3: Simulating bank authorization
      setProcessingMsg('Authorizing transactions with card network...');
      await new Promise(r => setTimeout(r, 1500));

      // Step 4: Generating OTP
      setProcessingMsg('Sending one-time passcode to registered mobile...');
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setSentOtp(generatedOtp);
      setCountdown(60);
      
      // Simulate receipt of OTP text message via modern UI notification alert
      setTimeout(() => {
        alert(`[SANDBOX GATEWAY] SMS OTP simulation received:\n\nUse code "${generatedOtp}" to authorize transaction of ₹${amount}.`);
      }, 500);

      await new Promise(r => setTimeout(r, 800));
      setPaymentStep('otp');

    } catch (err) {
      console.error(err);
      setApiError(err.response?.data?.message || 'Payment initiation failed. Please try again.');
      setPaymentStep('failed');
    }
  };

  // Confirm Payment
  const confirmPayment = async (status = 'completed') => {
    if (status === 'completed' && otp !== sentOtp) {
      setOtpError('Invalid OTP. Please check the notification or try again.');
      return;
    }

    setPaymentStep('processing');
    setProcessingMsg(status === 'completed' ? 'Verifying OTP & securing funds...' : 'Declining transaction...');
    
    try {
      await new Promise(r => setTimeout(r, 1800));
      
      const response = await axios.post(`/payments/${paymentRecord.id}/confirm`, {
        otp: otp,
        status: status
      });

      if (status === 'completed') {
        setPaymentStep('success');
        setTimeout(() => {
          onSuccess(response.data.payment);
        }, 1500);
      } else {
        setPaymentStep('failed');
      }
    } catch (err) {
      console.error(err);
      setApiError(err.response?.data?.message || 'Failed to complete transaction.');
      setPaymentStep('failed');
    }
  };

  const handleResendOtp = () => {
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setSentOtp(generatedOtp);
    setCountdown(60);
    setOtp('');
    setOtpError('');
    alert(`[SANDBOX GATEWAY] SMS OTP simulation resent:\n\nUse code "${generatedOtp}" to authorize transaction of ₹${amount}.`);
  };

  const resetForm = () => {
    setCardData({ number: '', name: '', expiry: '', cvv: '' });
    setPaymentStep('form');
    setOtp('');
    setOtpError('');
    setApiError('');
  };

  const cardBrand = getCardBrand(cardData.number);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-black border border-emerald-900/60 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-950 bg-emerald-950/20">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold tracking-wide text-slate-200">SECURE CHECKOUT</span>
          </div>
          {paymentStep !== 'processing' && paymentStep !== 'success' && (
            <button onClick={onClose} className="p-1 hover:bg-emerald-950/50 rounded-lg text-slate-400 hover:text-white transition-all">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* Main Info */}
          <div className="mb-6 text-center">
            <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Filing Statutory Fee</h3>
            <p className="text-sm font-semibold text-slate-200 truncate max-w-xs mx-auto mb-1">{applicationTitle}</p>
            <p className="text-2xl font-extrabold text-emerald-400">₹{parseFloat(amount).toLocaleString('en-IN')}</p>
          </div>

          {/* Form Step */}
          {paymentStep === 'form' && (
            <form onSubmit={initiatePayment} className="space-y-5">
              
              {/* Credit Card Graphic container */}
              <div className="card-perspective mx-auto mb-6 max-w-[320px]">
                <div className={`card-inner ${focusedField === 'cvv' ? 'flipped' : ''}`}>
                  
                  {/* Card Front */}
                  <div className="card-front bg-gradient-to-br from-emerald-800 via-teal-950 to-slate-900 border border-emerald-700/30 p-5 flex flex-col justify-between text-left text-white shadow-lg">
                    <div className="flex justify-between items-start">
                      <div className="w-10 h-8 bg-amber-400/80 rounded-md overflow-hidden relative opacity-90 shadow-sm">
                        <div className="absolute inset-x-2 top-2 bottom-2 border border-slate-950/20 flex divide-x divide-slate-950/20">
                          <div className="flex-1"></div>
                          <div className="flex-1"></div>
                        </div>
                      </div>
                      <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">{cardBrand}</span>
                    </div>
                    <div>
                      <div className="text-lg font-mono tracking-widest mb-4">
                        {cardData.number || '•••• •••• •••• ••••'}
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Cardholder</div>
                          <div className="text-xs font-semibold uppercase tracking-wider truncate max-w-[170px]">
                            {cardData.name || 'FULL NAME'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Expires</div>
                          <div className="text-xs font-mono font-semibold">
                            {cardData.expiry || 'MM/YY'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Back */}
                  <div className="card-back bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-800 border border-emerald-700/30 text-white shadow-lg py-5 flex flex-col justify-between">
                    <div className="w-full h-10 bg-slate-950"></div>
                    <div className="px-5">
                      <div className="text-[10px] text-right text-slate-400 uppercase tracking-wider mb-1">Security Code (CVV)</div>
                      <div className="flex items-center justify-end">
                        <div className="w-full h-8 bg-slate-200 text-slate-900 font-mono text-right pr-3 flex items-center justify-end rounded-l text-sm italic font-bold">
                          ••••
                        </div>
                        <div className="w-12 h-8 bg-amber-400 text-slate-950 flex items-center justify-center font-mono font-bold text-sm rounded-r shadow-inner">
                          {cardData.cvv || '•••'}
                        </div>
                      </div>
                    </div>
                    <div className="px-5 text-[8px] text-slate-400 text-center">
                      This is a secure local simulation credit card for demo environments.
                    </div>
                  </div>

                </div>
              </div>

              {/* Input fields */}
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardData.number}
                    onChange={handleCardNumberChange}
                    onFocus={() => setFocusedField('number')}
                    onBlur={() => setFocusedField('')}
                    placeholder="4111 2222 3333 4444"
                    className="input-field py-2 text-sm font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardData.name}
                    onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField('')}
                    placeholder="JOHN DOE"
                    className="input-field py-2 text-sm uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={cardData.expiry}
                      onChange={handleExpiryChange}
                      onFocus={() => setFocusedField('expiry')}
                      onBlur={() => setFocusedField('')}
                      placeholder="MM/YY"
                      className="input-field py-2 text-sm font-mono text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardData.cvv}
                      onChange={handleCvvChange}
                      onFocus={() => setFocusedField('cvv')}
                      onBlur={() => setFocusedField('')}
                      placeholder="•••"
                      maxLength="3"
                      className="input-field py-2 text-sm font-mono text-center"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Pay Button */}
              <button
                type="submit"
                className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-white" />
                <span>Pay ₹{parseFloat(amount).toLocaleString('en-IN')}</span>
              </button>
            </form>
          )}

          {/* Processing Step */}
          {paymentStep === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
              <div className="text-center">
                <h4 className="font-semibold text-slate-200">Processing Payment</h4>
                <p className="text-xs text-slate-400 mt-1.5 animate-pulse">{processingMsg}</p>
              </div>
            </div>
          )}

          {/* OTP Verification Step */}
          {paymentStep === 'otp' && (
            <div className="space-y-6 py-2">
              <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl flex gap-3 text-left">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Two-Factor Authentication</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    A verification code has been sent to your simulated mobile number ending in •••• 9999.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 text-center">Enter One-Time Passcode (OTP)</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setOtpError('');
                  }}
                  placeholder="••••"
                  className="w-32 mx-auto input-field py-3 text-center text-xl font-bold font-mono tracking-widest block"
                  maxLength="4"
                />
                {otpError && (
                  <p className="text-xs text-red-400 mt-2 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {otpError}
                  </p>
                )}
              </div>

              <div className="text-center text-xs text-slate-500">
                {countdown > 0 ? (
                  <span>Resend code in {countdown}s</span>
                ) : (
                  <button onClick={handleResendOtp} className="text-emerald-400 font-medium hover:underline flex items-center justify-center gap-1 mx-auto">
                    <RefreshCw className="w-3 h-3" /> Resend OTP
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <button
                  onClick={() => confirmPayment('failed')}
                  className="py-2.5 px-4 rounded-xl border border-red-900/40 text-red-400 hover:bg-red-950/20 text-sm font-semibold transition-all"
                >
                  Simulate Failure
                </button>
                <button
                  onClick={() => confirmPayment('completed')}
                  disabled={otp.length !== 4}
                  className="btn-primary py-2.5 rounded-xl font-bold text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verify & Pay
                </button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {paymentStep === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-bold text-slate-100">Payment Successful</h4>
                <p className="text-xs text-slate-400 mt-1">Receipt reference: {paymentRecord?.transaction_id}</p>
                <p className="text-xs text-emerald-400 mt-2 font-medium">Redirecting you to dashboard...</p>
              </div>
            </div>
          )}

          {/* Failed Step */}
          {paymentStep === 'failed' && (
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center shadow-lg">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-bold text-slate-100 font-mono">Payment Declined</h4>
                <p className="text-xs text-red-400/80 mt-1.5 max-w-xs mx-auto">
                  {apiError || 'The transaction was simulated as failed. No funds were debited.'}
                </p>
              </div>
              <div className="pt-4 flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-emerald-900/50 hover:bg-emerald-950/20 text-sm font-semibold text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 btn-primary py-2.5 rounded-xl font-bold text-sm"
                >
                  Retry Payment
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-emerald-950/50 bg-emerald-950/5 flex justify-between items-center text-[10px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            256-bit SSL Encryption
          </span>
          <span>Powered by Sandbox Pay</span>
        </div>

      </div>
    </div>
  );
};

export default CheckoutModal;

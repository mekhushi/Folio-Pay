import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Send, Activity, Box, Sparkles, Receipt, ChevronDown, Plus, LayoutGrid, Clock, User, Shield, LogOut, ArrowLeft } from 'lucide-react';
import { useCustomCursor } from './hooks/useCustomCursor';
import AiThoughtStudio from './components/AiThoughtStudio';
import ReceiptFlip from './components/ReceiptFlip';
import ReceiptDrawer from './components/ReceiptDrawer';
import LandingPage from './components/LandingPage';
import ProfilePage from './components/ProfilePage';

const API_BASE = "http://localhost:8000/api";

function App() {
  const cursorRef = useCustomCursor();
  
  // Workspace Session States
  const [workspaceId, setWorkspaceId] = useState(sessionStorage.getItem('workspaceId') || '');
  const [treasuryKey, setTreasuryKey] = useState(sessionStorage.getItem('treasuryKey') || '');
  const [workspaceAddress, setWorkspaceAddress] = useState(sessionStorage.getItem('workspaceAddress') || '');
  const [workspaceMode, setWorkspaceMode] = useState(sessionStorage.getItem('workspaceMode') || 'simulation');
  const [userRole, setUserRole] = useState(sessionStorage.getItem('userRole') || 'employee');
  const [userName, setUserName] = useState(sessionStorage.getItem('userName') || '');

  const [currentView, setCurrentView] = useState(sessionStorage.getItem('workspaceId') ? 'app' : 'landing');
  const [activeTab, setActiveTab] = useState('audit'); // audit | ledger | activity | profile | send
  const [balances, setBalances] = useState({ eth: 0, usdc: 0, mode: 'loading' });
  const [ledger, setLedger] = useState([]);
  
  // Form State
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState('Software');
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Manual Send State
  const [sendRecipient, setSendRecipient] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendVendor, setSendVendor] = useState('');
  const [sendCategory, setSendCategory] = useState('Software');
  
  // AI/Stream State
  const [logs, setLogs] = useState([]);
  const [approvedTx, setApprovedTx] = useState(null);
  const [showFlip, setShowFlip] = useState(false);
  
  // Drawer State
  const [selectedTx, setSelectedTx] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Agent Config State
  const [rules, setRules] = useState({
      max_claim_limit: 500,
      monthly_budget: 2000,
      llm_engine: 'gemini-1.5-flash',
      api_keys: { gemini: '' },
      allowed_categories: [],
      company_name: 'Folio Pay Inc.'
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const laserRef = useRef(null);

  // Flow Coordination: Scroll to top when switching views
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    if (workspaceId) {
        fetchBalances();
        fetchLedger();
        fetchRules();
    }
  }, [workspaceId]);

  const getHeaders = () => {
    const headers = { 'X-Workspace-Id': workspaceId };
    if (treasuryKey) {
        headers['X-Treasury-Key'] = treasuryKey;
    }
    return headers;
  };

  const fetchBalances = async () => {
    if (!workspaceId) return;
    try {
        const res = await fetch(`${API_BASE}/treasury/balance`, {
            headers: getHeaders()
        });
        const data = await res.json();
        setBalances(data);
    } catch(e) { console.error(e) }
  };

  const fetchLedger = async () => {
    if (!workspaceId) return;
    try {
        const res = await fetch(`${API_BASE}/ledger`, {
            headers: getHeaders()
        });
        const data = await res.json();
        setLedger(data);
    } catch(e) { console.error(e) }
  };

  const fetchRules = async () => {
    if (!workspaceId) return;
    try {
        const res = await fetch(`${API_BASE}/rules`, {
            headers: getHeaders()
        });
        const data = await res.json();
        setRules({
            max_claim_limit: data.max_claim_limit ?? 500,
            monthly_budget: data.monthly_budget ?? 2000,
            llm_engine: data.llm_engine ?? 'gemini-1.5-flash',
            api_keys: data.api_keys ?? { gemini: '' },
            allowed_categories: data.allowed_categories ?? [],
            company_name: data.company_name ?? 'Folio Pay Inc.'
        });
    } catch(e) { console.error(e) }
  };

  const saveConfig = async (updatedRules) => {
    setIsSavingConfig(true);
    try {
        const res = await fetch(`${API_BASE}/rules/update`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getHeaders()
            },
            body: JSON.stringify(updatedRules)
        });
        const data = await res.json();
        if (data.status === 'success') {
            setRules(data.rules);
        }
    } catch(e) { console.error(e) }
    finally { setIsSavingConfig(false); }
  };

  const handleSignIn = (wsId, wsKey, wsAddress, wsMode, wsRules, wsBalances, role, empName) => {
    sessionStorage.setItem('workspaceId', wsId);
    sessionStorage.setItem('treasuryKey', wsKey || '');
    sessionStorage.setItem('workspaceAddress', wsAddress || '');
    sessionStorage.setItem('workspaceMode', wsMode || 'simulation');
    sessionStorage.setItem('userRole', role || 'employee');
    sessionStorage.setItem('userName', empName || '');
    
    setWorkspaceId(wsId);
    setTreasuryKey(wsKey || '');
    setWorkspaceAddress(wsAddress || '');
    setWorkspaceMode(wsMode || 'simulation');
    setUserRole(role || 'employee');
    setUserName(empName || '');
    
    if (role === 'manager') {
        setActiveTab('send');
    } else {
        setActiveTab('audit');
    }
    
    if (wsRules) setRules(wsRules);
    if (wsBalances) setBalances(wsBalances);
    setCurrentView('app');
  };

  const handleSignOut = () => {
    sessionStorage.clear();
    setWorkspaceId('');
    setTreasuryKey('');
    setWorkspaceAddress('');
    setWorkspaceMode('simulation');
    setUserRole('employee');
    setUserName('');
    setBalances({ eth: 0, usdc: 0, mode: 'loading' });
    setLedger([]);
    setRecipient('');
    setFile(null);
    setPreviewUrl(null);
    setLogs([]);
    setApprovedTx(null);
    setSendRecipient('');
    setSendAmount('');
    setSendVendor('');
    setSendCategory('Software');
    setActiveTab('audit');
    setCurrentView('landing');
  };

  useEffect(() => {
    if (userRole === 'employee' && (activeTab === 'profile' || activeTab === 'send')) {
        setActiveTab('audit');
    } else if (userRole === 'manager' && activeTab === 'audit') {
        setActiveTab('send');
    }
  }, [userRole, activeTab]);

  const handleApproveClaim = async (txId) => {
    if (userRole !== 'manager') return;
    try {
        const res = await fetch(`${API_BASE}/claim/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getHeaders()
            },
            body: JSON.stringify({ tx_id: txId })
        });
        const data = await res.json();
        if (data.status === 'success') {
            fetchBalances();
            fetchLedger();
        } else {
            alert(data.message || 'Approval failed');
        }
    } catch (e) {
        console.error(e);
    }
  };

  const handleRejectClaim = async (txId) => {
    if (userRole !== 'manager') return;
    try {
        const res = await fetch(`${API_BASE}/claim/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getHeaders()
            },
            body: JSON.stringify({ tx_id: txId })
        });
        const data = await res.json();
        if (data.status === 'success') {
            fetchBalances();
            fetchLedger();
        } else {
            alert(data.message || 'Rejection failed');
        }
    } catch (e) {
        console.error(e);
    }
  };

  const submitManualSend = async (manualRecipient, manualAmount, manualVendor, manualCategory) => {
    if (!manualRecipient || !manualAmount || !manualVendor) return;
    setIsScanning(true);
    setLogs(["System: Initiating secure manual submission stream..."]);
    setActiveTab('audit');
    
    try {
        const formData = new FormData();
        formData.append('recipient', manualRecipient);
        formData.append('category', manualCategory);
        formData.append('amount', manualAmount);
        formData.append('vendor', manualVendor);

        const res = await fetch(`${API_BASE}/claim/stream`, {
            method: 'POST',
            headers: getHeaders(),
            body: formData
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let loop = true;
        
        while (loop) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim() !== '');
            
            for(let line of lines) {
                if (line.startsWith("FINISH_RECORD|")) {
                    const txStr = line.split("FINISH_RECORD|")[1];
                    const txData = JSON.parse(txStr);
                    setApprovedTx(txData);
                    setShowFlip(true);
                    
                    setSendRecipient('');
                    setSendAmount('');
                    setSendVendor('');
                    setSendCategory('Software');
                    
                    fetchBalances();
                    fetchLedger();
                    loop = false;
                } else {
                    setLogs(prev => [...prev, line]);
                }
            }
        }
    } catch (e) {
        setLogs(prev => [...prev, `System: Error - ${e.message}`]);
    } finally {
        setIsScanning(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    if (f) {
        setFile(f);
        setPreviewUrl(URL.createObjectURL(f));
    }
  };

  const submitClaim = async () => {
    if (!file || !recipient) return;
    setIsScanning(true);
    setLogs(["System: Initiating secure upload connection..."]);
    
    if(laserRef.current) {
        const tl = gsap.timeline({ repeat: -1, yoyo: true });
        tl.to(laserRef.current, { top: '100%', duration: 1.5, ease: "power1.inOut" });
    }

    try {
        const formData = new FormData();
        formData.append('receipt', file);
        formData.append('recipient', recipient);
        formData.append('category', category);

        const res = await fetch(`${API_BASE}/claim/stream`, {
            method: 'POST',
            headers: getHeaders(),
            body: formData
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let loop = true;
        
        while (loop) {
            const { value, done } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(l => l.trim() !== '');
            
            for(let line of lines) {
                if (line.startsWith("FINISH_RECORD|")) {
                    const txStr = line.split("FINISH_RECORD|")[1];
                    const txData = JSON.parse(txStr);
                    setApprovedTx(txData);
                    setShowFlip(true);
                    fetchBalances();
                    fetchLedger();
                    loop = false;
                } else {
                    setLogs(prev => [...prev, line]);
                }
            }
        }
    } catch (e) {
        setLogs(prev => [...prev, `System: Error - ${e.message}`]);
    } finally {
        setIsScanning(false);
        if(laserRef.current) {
            gsap.killTweensOf(laserRef.current);
            gsap.set(laserRef.current, { top: 0 });
        }
    }
  };

  const pageVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  const tabs = [
      { id: 'send', icon: Send, label: 'Send' },
      { id: 'audit', icon: Receipt, label: 'Audit' },
      { id: 'ledger', icon: LayoutGrid, label: 'Ledger' },
      { id: 'activity', icon: Clock, label: 'Activity' },
      { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-folio-bg folio-glow relative text-zinc-300 font-outfit overflow-hidden">
      <AnimatePresence mode="wait">
          {currentView === 'landing' ? (
              <LandingPage key="landing" onEnter={handleSignIn} />
          ) : (
              <motion.div 
                  key="app"
                  variants={pageVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative z-10 min-h-screen flex flex-col items-center"
              >
                  {/* Top Header */}
                  <div className="w-full max-w-5xl px-6 py-8 flex justify-between items-center mb-4">
                      {/* Logo and Back Button */}
                      <div className="flex items-center gap-4">
                          <button 
                              onClick={handleSignOut}
                              className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
                              title="Sign out & go back to home screen"
                          >
                              <ArrowLeft size={14} /> Back
                          </button>
                          <div className="flex items-center gap-3">
                               <img src="/logo.png" className="w-8 h-8 object-contain invert brightness-200" alt="Folio Pay Logo" />
                              <h1 className="text-xl font-space font-bold tracking-widest text-folio-brand">
                                  FOLIO<br/><span className="text-[10px] tracking-[0.3em] font-normal text-folio-brand-muted leading-none block -mt-1">PAY</span>
                              </h1>
                          </div>
                      </div>

                      {/* Network / Wallet Dropdown & Disconnect */}
                      <div className="flex items-center gap-3">
                          <button className="bg-folio-card border border-folio-border text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2 hover:bg-slate-800 transition-colors">
                              <div className="w-3 h-3 bg-blue-500 rounded-full" /> Base Sepolia <span className="text-slate-400 text-xs ml-1">(ETH)</span> <ChevronDown size={14} className="text-slate-400" />
                          </button>
                          <button 
                              onClick={handleSignOut}
                              className="bg-red-500/10 border border-red-500/20 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 p-2.5 rounded-lg transition-all"
                              title="Disconnect Session"
                          >
                              <LogOut size={20} />
                          </button>
                      </div>
                  </div>

                  {/* Main Central Wallet Container */}
                  <div className="w-full max-w-[600px] flex flex-col items-center px-4">
                      
                      {/* Navigation Tabs (Square Buttons) */}
                      <div className="flex justify-center gap-3 mb-8 w-full overflow-x-auto hide-scrollbar py-2">
                          {tabs.filter(tab => {
                              if (userRole === 'manager') {
                                  return tab.id !== 'audit';
                              } else {
                                  return tab.id !== 'send' && tab.id !== 'profile';
                              }
                          }).map((tab) => {
                              const isActive = activeTab === tab.id;
                              const Icon = tab.icon;
                              return (
                                  <button
                                      key={tab.id}
                                      onClick={() => setActiveTab(tab.id)}
                                      className={`flex flex-col items-center justify-center gap-2 w-20 h-20 rounded-xl transition-all duration-300 ${isActive ? 'bg-folio-brand text-folio-bg' : 'bg-folio-card border border-folio-border text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                  >
                                      <Icon size={20} className={isActive ? 'text-folio-bg' : ''} />
                                      <span className="text-xs font-medium font-outfit">{tab.label}</span>
                                  </button>
                              )
                          })}
                      </div>

                      {/* Top Message Box */}
                      <div className="w-full bg-folio-accent/10 border border-folio-border rounded-lg py-4 mb-8 px-6 flex justify-between items-center text-folio-accent font-medium text-sm">
                          <span>Autonomous treasury powered by Agentic AI</span>
                          <span className="font-mono text-[11px] opacity-90 border-l border-folio-accent/30 pl-4 whitespace-nowrap flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${userRole === 'manager' ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}`} />
                              {userRole === 'manager' ? 'MANAGER PORTAL' : `EMPLOYEE: ${userName || 'Employee'}`}
                          </span>
                      </div>

                      {/* Tab Content */}
                      <div className="w-full">
                          <AnimatePresence mode="wait">
                              {activeTab === 'audit' && (
                                  <motion.div 
                                      key="audit"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="space-y-6"
                                  >
                                      {/* Upload Field */}
                                      <div>
                                          <h3 className="text-white font-medium mb-3">Upload Receipt</h3>
                                          <div 
                                              onDragOver={(e) => e.preventDefault()}
                                              onDrop={handleFileDrop}
                                              className="w-full h-32 bg-folio-card border border-folio-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-slate-600 transition-colors relative overflow-hidden"
                                          >
                                              {!previewUrl ? (
                                                  <>
                                                      <Upload size={24} className="text-slate-400 mb-2" />
                                                      <span className="text-sm text-slate-400 font-medium">Click or drag image</span>
                                                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileDrop} />
                                                  </>
                                              ) : (
                                                  <div className="relative w-full h-full">
                                                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-80" />
                                                      {isScanning && (
                                                          <div ref={laserRef} className="absolute left-0 w-full h-[2px] bg-folio-accent shadow-[0_0_15px_#0ea5e9] z-10" />
                                                      )}
                                                      <button onClick={() => {setPreviewUrl(null); setFile(null);}} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded text-white hover:bg-black"><span className="text-xs">✕</span></button>
                                                  </div>
                                              )}
                                          </div>
                                      </div>

                                      {/* Recipient Field */}
                                      <div>
                                          <h3 className="text-white font-medium mb-3">Pay To</h3>
                                          <div className="relative">
                                              <input 
                                                  type="text" 
                                                  value={recipient}
                                                  onChange={e => setRecipient(e.target.value)}
                                                  className="w-full bg-folio-card border border-folio-border rounded-lg px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-folio-brand transition-colors font-mono"
                                                  placeholder="0x... or @upi"
                                              />
                                          </div>
                                      </div>

                                      {/* Category Dropdown */}
                                      <div>
                                          <h3 className="text-white font-medium mb-3">Category</h3>
                                          <div className="relative">
                                              <select 
                                                  value={category}
                                                  onChange={e => setCategory(e.target.value)}
                                                  className="w-full bg-folio-card border border-folio-border rounded-lg px-4 py-4 text-white appearance-none focus:outline-none focus:border-folio-brand transition-colors"
                                              >
                                                  <option>Software</option>
                                                  <option>Travel</option>
                                                  <option>Hardware</option>
                                                  <option>Meals</option>
                                              </select>
                                              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                          </div>
                                      </div>

                                      {/* Massive Submit Button */}
                                      <button 
                                          onClick={submitClaim}
                                          disabled={isScanning || !file || !recipient}
                                          className={`w-full py-4 rounded-lg font-space font-bold text-lg tracking-wide transition-all mt-4 ${isScanning ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-folio-brand hover:bg-folio-brand/90 text-folio-bg'}`}
                                      >
                                          {isScanning ? 'AUDITING...' : 'GENERATE PAYOUT'}
                                      </button>
                                  </motion.div>
                              )}

                              {activeTab === 'ledger' && (
                                  <motion.div 
                                      key="ledger"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="space-y-4 max-h-[500px] overflow-y-auto pr-1"
                                  >
                                      {ledger.length === 0 ? (
                                          <div className="text-center py-12 text-slate-500">No historic ledger activity.</div>
                                      ) : (
                                          ledger.map((tx, idx) => (
                                              <div 
                                                key={idx} 
                                                onClick={() => { setSelectedTx(tx); setIsDrawerOpen(true); }}
                                                className="w-full bg-folio-card border border-folio-border rounded-xl p-4 hover:border-slate-550 transition-colors cursor-pointer group flex flex-col gap-3"
                                              >
                                                  <div className="flex items-center justify-between">
                                                      <div className="flex items-center gap-4">
                                                          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-folio-brand">
                                                              <Activity size={18} />
                                                          </div>
                                                          <div>
                                                              <h4 className="text-white font-medium group-hover:text-folio-accent transition-colors">{tx.vendor}</h4>
                                                              <p className="text-xs text-slate-400 font-mono mt-1">{tx.recipient}</p>
                                                          </div>
                                                      </div>
                                                      <div className="text-right">
                                                          <h4 className="text-white font-medium">${tx.amount_usd}</h4>
                                                          <p className={`text-xs mt-1 font-bold uppercase ${tx.status === 'APPROVED' ? 'text-emerald-400' : tx.status === 'PENDING_REVIEW' ? 'text-amber-400' : tx.status === 'REJECTED' ? 'text-red-400' : 'text-slate-500'}`}>
                                                              {tx.status}
                                                          </p>
                                                      </div>
                                                  </div>
                                                  
                                                  {tx.status === 'PENDING_REVIEW' && userRole === 'manager' && (
                                                      <div className="flex gap-2.5 pt-3 border-t border-slate-800/85" onClick={e => e.stopPropagation()}>
                                                          <button 
                                                              onClick={() => handleApproveClaim(tx.tx_id)}
                                                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md transition-colors"
                                                          >
                                                              Approve
                                                          </button>
                                                          <button 
                                                              onClick={() => handleRejectClaim(tx.tx_id)}
                                                              className="flex-1 py-1.5 bg-red-650/10 hover:bg-red-650/20 text-red-500 border border-red-500/20 hover:border-red-500/40 font-bold text-xs rounded-md transition-colors"
                                                          >
                                                              Reject
                                                          </button>
                                                      </div>
                                                  )}
                                              </div>
                                          ))
                                      )}
                                  </motion.div>
                              )}

                              {activeTab === 'profile' && (
                                  <motion.div 
                                      key="profile"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="w-full"
                                  >
                                      <ProfilePage 
                                          rules={rules}
                                          balances={balances}
                                          ledger={ledger}
                                          saveConfig={saveConfig}
                                          isSavingConfig={isSavingConfig}
                                          workspaceId={workspaceId}
                                          handleSignOut={handleSignOut}
                                      />
                                  </motion.div>
                              )}

                              {activeTab === 'send' && (
                                  <motion.div 
                                      key="send"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="space-y-6"
                                  >
                                      {/* Merchant / Vendor Name */}
                                      <div>
                                          <h3 className="text-white font-medium mb-3">Merchant / Vendor Name</h3>
                                          <input 
                                              type="text" 
                                              value={sendVendor}
                                              onChange={e => setSendVendor(e.target.value)}
                                              className="w-full bg-folio-card border border-folio-border rounded-lg px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-folio-brand transition-colors"
                                              placeholder="e.g. Vercel Inc."
                                          />
                                      </div>

                                      {/* Amount (USD) */}
                                      <div>
                                          <h3 className="text-white font-medium mb-3">Amount (USD)</h3>
                                          <input 
                                              type="number" 
                                              value={sendAmount}
                                              onChange={e => setSendAmount(e.target.value)}
                                              className="w-full bg-folio-card border border-folio-border rounded-lg px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-folio-brand transition-colors font-mono"
                                              placeholder="e.g. 45.00"
                                          />
                                      </div>

                                      {/* Pay To (Recipient) */}
                                      <div>
                                          <h3 className="text-white font-medium mb-3">Pay To</h3>
                                          <input 
                                              type="text" 
                                              value={sendRecipient}
                                              onChange={e => setSendRecipient(e.target.value)}
                                              className="w-full bg-folio-card border border-folio-border rounded-lg px-4 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-folio-brand transition-colors font-mono"
                                              placeholder="0x... or @upi"
                                          />
                                      </div>

                                      {/* Category */}
                                      <div>
                                          <h3 className="text-white font-medium mb-3">Category</h3>
                                          <div className="relative">
                                              <select 
                                                  value={sendCategory}
                                                  onChange={e => setSendCategory(e.target.value)}
                                                  className="w-full bg-folio-card border border-folio-border rounded-lg px-4 py-4 text-white appearance-none focus:outline-none focus:border-folio-brand transition-colors"
                                              >
                                                  <option>Software</option>
                                                  <option>Travel</option>
                                                  <option>Hardware</option>
                                                  <option>Meals</option>
                                                  <option>Office Supplies</option>
                                                  <option>Cloud Infrastructure</option>
                                              </select>
                                              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                          </div>
                                      </div>

                                      {/* Send Request Button */}
                                      <button 
                                          onClick={() => submitManualSend(sendRecipient, sendAmount, sendVendor, sendCategory)}
                                          disabled={isScanning || !sendRecipient || !sendAmount || !sendVendor}
                                          className={`w-full py-4 rounded-lg font-space font-bold text-lg tracking-wide transition-all mt-4 ${isScanning ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-folio-brand hover:bg-folio-brand/90 text-folio-bg'}`}
                                      >
                                          {isScanning ? 'PROCESSING STREAM...' : 'SEND PAYMENT'}
                                      </button>
                                  </motion.div>
                              )}

                              {activeTab === 'activity' && (
                                  <motion.div 
                                      key="activity"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="space-y-6 max-h-[500px] overflow-y-auto pr-2 relative"
                                  >
                                      {ledger.length === 0 ? (
                                          <div className="text-center py-12 text-slate-500">No recent activity.</div>
                                      ) : (
                                          <div className="relative border-l border-slate-800 ml-4 pl-6 space-y-6">
                                              {ledger.map((tx, idx) => {
                                                  const isApproved = tx.status === 'APPROVED';
                                                  const isPending = tx.status === 'PENDING_REVIEW';
                                                  const isRejected = tx.status === 'REJECTED';
                                                  
                                                  let dotColor = "bg-slate-700";
                                                  let shadowColor = "";
                                                  let textColor = "text-slate-400";
                                                  
                                                  if (isApproved) {
                                                      dotColor = "bg-emerald-500";
                                                      shadowColor = "shadow-[0_0_10px_#10b981]";
                                                      textColor = "text-emerald-400";
                                                  } else if (isPending) {
                                                      dotColor = "bg-amber-500";
                                                      shadowColor = "shadow-[0_0_10px_#f59e0b]";
                                                      textColor = "text-amber-400";
                                                  } else if (isRejected) {
                                                      dotColor = "bg-red-500";
                                                      shadowColor = "shadow-[0_0_10px_#ef4444]";
                                                      textColor = "text-red-400";
                                                  }
                                                  
                                                  return (
                                                      <div key={idx} className="relative group">
                                                          {/* Timeline Dot */}
                                                          <div className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full ${dotColor} ${shadowColor} border-4 border-folio-bg z-10 transition-all duration-300`} />
                                                          
                                                          {/* Timeline Item Content Card */}
                                                          <div className="bg-folio-card border border-folio-border rounded-xl p-4 hover:border-slate-700 transition-colors">
                                                              <div className="flex justify-between items-start">
                                                                  <div>
                                                                      <span className="text-[10px] font-mono text-slate-550">{tx.timestamp}</span>
                                                                      <h4 className="text-sm font-semibold text-white mt-0.5">{tx.vendor}</h4>
                                                                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{tx.recipient}</p>
                                                                  </div>
                                                                  <div className="text-right">
                                                                      <span className="text-sm font-bold text-white">${tx.amount_usd}</span>
                                                                      <div className={`text-[10px] font-bold uppercase mt-1 ${textColor}`}>
                                                                          {tx.status}
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                              
                                                              <div className="mt-3 pt-2.5 border-t border-slate-800/60 text-xs text-slate-400 font-outfit leading-relaxed">
                                                                  {isApproved && `Autonomous check passed. Settle transaction hash: ${tx.tx_hash_or_ref || 'N/A'}`}
                                                                  {isPending && `Verification limit exceeded. Sent to manager approval queue.`}
                                                                  {isRejected && `Policy rejection. Failed rules check.`}
                                                              </div>
                                                          </div>
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      )}
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                      {/* Bottom AI Panels (Like NLP Copilot / Dashboard) */}
                      {(activeTab === 'audit' || (activeTab === 'send' && userRole === 'manager')) ? (
                        <div className={`w-full grid gap-4 mt-12 ${userRole === 'manager' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                            <div className="bg-folio-card border border-folio-border rounded-xl p-5 relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-4 text-sm font-medium text-white">
                                    <Sparkles size={16} className="text-folio-accent" /> AI Agent Activity
                                </div>
                                <div className="h-32 text-xs font-mono text-slate-400 overflow-y-auto hide-scrollbar">
                                    {logs.length > 0 ? logs.map((l, i) => (
                                        <div key={i} className="mb-2 opacity-80 leading-relaxed">{l}</div>
                                    )) : (
                                        <div className="text-slate-650 italic">Awaiting input...</div>
                                    )}
                                </div>
                            </div>
                            
                            {userRole === 'manager' ? (
                                <div className="bg-folio-card border border-folio-border rounded-xl p-5">
                                    <div className="flex justify-between items-center mb-4 text-sm font-medium text-white">
                                        <span className="flex items-center gap-2"><Activity size={16} className="text-folio-accent" /> Treasury Stats</span>
                                        <button onClick={fetchBalances} className="text-xs text-slate-500 hover:text-white">Refresh</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-folio-bg border border-folio-border rounded-lg p-3 flex flex-col justify-center items-center h-20">
                                            <p className="text-xs text-slate-400 mb-1">USDC Vault</p>
                                            <p className="text-lg font-medium text-white">${balances.usdc.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-folio-bg border border-folio-border rounded-lg p-3 flex flex-col justify-center items-center h-20">
                                            <p className="text-xs text-slate-400 mb-1">Network ETH</p>
                                            <p className="text-lg font-medium text-white">{balances.eth.toFixed(4)}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                      ) : null}
                      
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Overlays */}
      {showFlip && approvedTx && (
        <ReceiptFlip transaction={approvedTx} onClose={() => setShowFlip(false)} />
      )}
      <ReceiptDrawer 
          isOpen={isDrawerOpen} 
          transaction={selectedTx} 
          onClose={() => setIsDrawerOpen(false)} 
          userRole={userRole}
          onApprove={handleApproveClaim}
          onReject={handleRejectClaim}
      />
    </div>
  );
}

export default App;

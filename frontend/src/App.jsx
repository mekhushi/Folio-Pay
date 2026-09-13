import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, Send, Activity, Box, Sparkles, Receipt, ChevronDown, Plus, 
  LayoutGrid, Clock, User, Shield, LogOut, ArrowLeft, Download,
  ShieldAlert, CheckCircle2, Sliders, AlertTriangle, Check, X, FileText
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('audit'); // audit | ledger | activity | profile | send | approvals
  const [balances, setBalances] = useState({ eth: 0, usdc: 0, mode: 'loading' });
  const [ledger, setLedger] = useState([]);
  const [ledgerFilter, setLedgerFilter] = useState('all'); // all | pending | approved
  const [auditError, setAuditError] = useState(null);
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
  
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
        setActiveTab('approvals');
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
    if (userRole === 'employee' && (activeTab === 'profile' || activeTab === 'send' || activeTab === 'approvals')) {
        setActiveTab('audit');
    } else if (userRole === 'manager' && activeTab === 'audit') {
        setActiveTab('approvals');
    }
  }, [userRole, activeTab]);

  const exportLedgerToCSV = () => {
    if (!ledger || ledger.length === 0) return;
    const headers = ["Transaction ID", "Date", "Vendor", "Category", "Recipient", "Amount USD", "Status", "Reference / Hash", "Explorer Link"];
    const rows = ledger.map(tx => [
      `"${tx.tx_id || ''}"`,
      `"${tx.timestamp || ''}"`,
      `"${tx.vendor || ''}"`,
      `"${tx.category || ''}"`,
      `"${tx.recipient || ''}"`,
      tx.amount_usd || 0,
      `"${tx.status || ''}"`,
      `"${tx.tx_hash_or_ref || ''}"`,
      `"${tx.explorer_link || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `folio_pay_ledger_${workspaceId || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            if (data.transaction) {
                setApprovedTx(data.transaction);
                setShowFlip(true);
            }
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
    setAuditError(null);
    setLogs(["System: Initiating secure manual submission stream..."]);
    
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
                    setAuditError(null);
                    
                    setSendRecipient('');
                    setSendAmount('');
                    setSendVendor('');
                    setSendCategory('Software');
                    
                    fetchBalances();
                    fetchLedger();
                    loop = false;
                } else if (line.startsWith("AUDIT_FAILED|")) {
                    const failStr = line.split("AUDIT_FAILED|")[1];
                    try {
                        const failData = JSON.parse(failStr);
                        setAuditError(failData.reason || "Payout request failed governance policies.");
                    } catch(err) {
                        setAuditError("Payout request was rejected by compliance auditor.");
                    }
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
        setAuditError(null);
    }
  };

  const submitClaim = async () => {
    if (!file || !recipient) return;
    setIsScanning(true);
    setAuditError(null);
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
                    setAuditError(null);
                    fetchBalances();
                    fetchLedger();
                    loop = false;
                } else if (line.startsWith("AUDIT_FAILED|")) {
                    const failStr = line.split("AUDIT_FAILED|")[1];
                    try {
                        const failData = JSON.parse(failStr);
                        setAuditError(failData.reason || "Expense claim failed governance checks.");
                    } catch(err) {
                        setAuditError("Expense claim was rejected by compliance auditor.");
                    }
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

  const pendingClaims = ledger.filter(tx => tx.status === 'PENDING_REVIEW');
  const approvedClaims = ledger.filter(tx => tx.status === 'APPROVED');
  const totalSpentThisMonth = approvedClaims.reduce((sum, tx) => sum + (Number(tx.amount_usd) || 0), 0);
  const budgetBurnPercent = rules.monthly_budget > 0 
      ? Math.min(100, Math.round((totalSpentThisMonth / rules.monthly_budget) * 100)) 
      : 0;

  const managerTabs = [
      { id: 'approvals', icon: ShieldAlert, label: 'Approvals', badge: pendingClaims.length },
      { id: 'send', icon: Send, label: 'Direct Payout' },
      { id: 'ledger', icon: LayoutGrid, label: 'Ledger' },
      { id: 'activity', icon: Clock, label: 'Audit Trail' },
      { id: 'profile', icon: Sliders, label: 'Governance' },
  ];

  const employeeTabs = [
      { id: 'audit', icon: Receipt, label: 'Claim Expense' },
      { id: 'ledger', icon: LayoutGrid, label: 'My Claims' },
      { id: 'activity', icon: Sparkles, label: 'AI Auditor' },
  ];

  const currentTabs = userRole === 'manager' ? managerTabs : employeeTabs;

  const displayedLedger = ledger.filter(tx => {
      if (userRole === 'manager') {
          if (ledgerFilter === 'pending') return tx.status === 'PENDING_REVIEW';
          if (ledgerFilter === 'approved') return tx.status === 'APPROVED';
          if (ledgerFilter === 'rejected') return tx.status === 'REJECTED';
      }
      return true;
  });

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
                      <div className="flex items-center gap-3 relative">
                          {/* Role Switcher Pill */}
                          <div className="flex items-center bg-slate-950/80 border border-slate-800 p-1 rounded-full text-xs font-mono">
                              <button 
                                  onClick={() => {
                                      setUserRole('manager');
                                      sessionStorage.setItem('userRole', 'manager');
                                      setActiveTab('approvals');
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${userRole === 'manager' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(34,211,238,0.2)]' : 'text-slate-400 hover:text-white'}`}
                                  title="Switch to Executive Manager Portal"
                              >
                                  <span className={`w-1.5 h-1.5 rounded-full ${userRole === 'manager' ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                                  Manager
                              </button>
                              <button 
                                  onClick={() => {
                                      setUserRole('employee');
                                      sessionStorage.setItem('userRole', 'employee');
                                      setActiveTab('audit');
                                  }}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${userRole === 'employee' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold shadow-[0_0_10px_rgba(251,191,36,0.2)]' : 'text-slate-400 hover:text-white'}`}
                                  title="Switch to Employee Expense Hub"
                              >
                                  <span className={`w-1.5 h-1.5 rounded-full ${userRole === 'employee' ? 'bg-amber-400' : 'bg-slate-600'}`} />
                                  Employee
                              </button>
                          </div>

                          <div className="relative">
                              <button 
                                  onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
                                  className="bg-folio-card border border-folio-border text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2 hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                  <div className="w-3 h-3 bg-blue-500 rounded-full" /> Base Sepolia <span className="text-slate-400 text-xs ml-1">(ETH)</span> <ChevronDown size={14} className={`text-slate-400 transition-transform ${isNetworkDropdownOpen ? 'rotate-180' : ''}`} />
                              </button>

                              {isNetworkDropdownOpen && (
                                  <div className="absolute right-0 mt-2 w-56 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs font-mono">
                                      <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold">Connected Network</div>
                                      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-blue-500/10 text-white font-medium">
                                          <div className="flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                                              <span>Base Sepolia</span>
                                          </div>
                                          <span className="text-[10px] text-emerald-400 font-bold">Active</span>
                                      </div>
                                      <div className="px-3 py-2 text-slate-500 flex items-center justify-between opacity-60">
                                          <div className="flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-slate-600" />
                                              <span>Base Mainnet</span>
                                          </div>
                                          <span className="text-[9px]">Live Soon</span>
                                      </div>
                                      <div className="px-3 py-2 text-slate-500 flex items-center justify-between opacity-60">
                                          <div className="flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-slate-600" />
                                              <span>Arbitrum Sepolia</span>
                                          </div>
                                          <span className="text-[9px]">Testnet</span>
                                      </div>
                                  </div>
                              )}
                          </div>
                          <button 
                              onClick={handleSignOut}
                              className="bg-red-500/10 border border-red-500/20 text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 p-2.5 rounded-lg transition-all"
                              title="Disconnect Session"
                          >
                              <LogOut size={20} />
                          </button>
                      </div>
                  </div>

                  {/* Main Central Wallet / Executive Container */}
                  <div className={`w-full ${userRole === 'manager' ? 'max-w-4xl' : 'max-w-[620px]'} flex flex-col items-center px-4 transition-all duration-300`}>
                      
                      {/* Executive Header & Stats for Manager OR Allowance Banner for Employee */}
                      {userRole === 'manager' ? (
                        <div className="w-full mb-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                            <div>
                              <h2 className="text-xl font-space font-bold text-white">
                                {rules.company_name || 'Corporate Treasury'} Vault
                              </h2>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
                                Workspace: <span className="text-white font-semibold">{workspaceId || 'Default'}</span>
                              </span>
                            </div>
                          </div>

                          {/* 3 Executive Metric Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                            {/* Card 1: Vault Balances */}
                            <div className="bg-folio-card border border-folio-border rounded-xl p-4.5 flex flex-col justify-between">
                              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                                <span>TREASURY RESERVE</span>
                                <span className="flex items-center gap-1.5 text-emerald-400 text-[10px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                                </span>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-white font-space tracking-tight">
                                  ${balances.usdc ? balances.usdc.toFixed(2) : '0.00'} <span className="text-xs font-normal text-slate-400 font-mono">USDC</span>
                                </div>
                                <div className="text-xs text-slate-400 font-mono mt-1 flex items-center justify-between">
                                  <span>Gas: {balances.eth ? balances.eth.toFixed(4) : '0.0000'} ETH</span>
                                  <button onClick={fetchBalances} className="text-folio-brand hover:underline text-[10px]">Refresh</button>
                                </div>
                              </div>
                            </div>

                            {/* Card 2: Monthly Budget Burn */}
                            <div className="bg-folio-card border border-folio-border rounded-xl p-4.5 flex flex-col justify-between">
                              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                                <span>BUDGET BURN</span>
                                <span className={`text-[11px] font-bold ${budgetBurnPercent > 85 ? 'text-rose-400' : 'text-folio-brand'}`}>
                                  {budgetBurnPercent}% Used
                                </span>
                              </div>
                              <div>
                                <div className="flex items-baseline justify-between text-sm mb-1.5">
                                  <span className="text-lg font-bold text-white font-space">${totalSpentThisMonth.toFixed(2)}</span>
                                  <span className="text-xs text-slate-400 font-mono">Limit: ${rules.monthly_budget || 2000}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${budgetBurnPercent > 85 ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-folio-brand shadow-[0_0_10px_#22d3ee]'}`}
                                    style={{ width: `${budgetBurnPercent}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Card 3: Action Required / Approvals */}
                            <div 
                              onClick={() => setActiveTab('approvals')}
                              className={`border rounded-xl p-4.5 cursor-pointer transition-all flex flex-col justify-between ${
                                pendingClaims.length > 0 
                                  ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                                  : 'bg-folio-card border-folio-border hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
                                <span>PENDING ACTIONS</span>
                                <ShieldAlert size={16} className={pendingClaims.length > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-500'} />
                              </div>
                              <div>
                                <div className="flex items-baseline justify-between">
                                  <div className="text-2xl font-bold text-white font-space">
                                    {pendingClaims.length} <span className="text-xs font-normal text-slate-400 font-outfit">claim{pendingClaims.length === 1 ? '' : 's'}</span>
                                  </div>
                                  <span className="text-xs text-folio-brand hover:underline font-mono">Review &rarr;</span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                  {pendingClaims.length > 0 ? 'Awaiting executive sign-off' : 'All claims processed'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Employee Allowance & Policy Card */
                        <div className="w-full mb-6 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-folio-border rounded-xl p-5 shadow-lg">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Employee Expense Hub</span>
                              </div>
                              <h2 className="text-lg font-bold text-white mt-1">
                                Welcome, <span className="text-folio-brand">{userName || 'Team Member'}</span>
                              </h2>
                              <p className="text-xs text-slate-400 mt-0.5">Submit business receipts for automated audit and instant treasury reimbursement.</p>
                            </div>
                            <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono">
                              <div className="text-right">
                                <div className="text-[10px] text-slate-500 uppercase">Auto-Settle Cap</div>
                                <div className="text-emerald-400 font-bold">&le; $50.00</div>
                              </div>
                              <div className="w-px h-6 bg-slate-800" />
                              <div>
                                <div className="text-[10px] text-slate-500 uppercase">Policy Limit</div>
                                <div className="text-folio-brand font-bold">${rules.max_claim_limit || 500}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation Tabs (Distinct for Manager vs Employee) */}
                      <div className="flex justify-center gap-3 mb-6 w-full overflow-x-auto hide-scrollbar py-2">
                          {currentTabs.map((tab) => {
                              const isActive = activeTab === tab.id;
                              const Icon = tab.icon;
                              return (
                                  <button
                                      key={tab.id}
                                      onClick={() => setActiveTab(tab.id)}
                                      className={`relative flex flex-col items-center justify-center gap-2 w-24 h-20 rounded-xl transition-all duration-300 cursor-pointer ${isActive ? 'bg-folio-brand text-folio-bg shadow-[0_0_15px_rgba(34,211,238,0.25)]' : 'bg-folio-card border border-folio-border text-slate-400 hover:text-white hover:bg-slate-800'}`}
                                  >
                                      {tab.badge > 0 && (
                                          <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-black animate-pulse shadow-sm">
                                              {tab.badge}
                                          </span>
                                      )}
                                      <Icon size={20} className={isActive ? 'text-folio-bg' : ''} />
                                      <span className="text-xs font-medium font-outfit whitespace-nowrap">{tab.label}</span>
                                  </button>
                              )
                          })}
                      </div>

                      {/* Status Banner */}
                      <div className="w-full bg-folio-accent/10 border border-folio-border rounded-lg py-3 mb-6 px-5 flex justify-between items-center text-folio-accent font-medium text-xs sm:text-sm">
                          <span>Autonomous treasury powered by Agentic AI</span>
                          <span className="font-mono text-[11px] opacity-90 border-l border-folio-accent/30 pl-4 whitespace-nowrap flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${userRole === 'manager' ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'}`} />
                              {userRole === 'manager' ? 'ROLE: EXECUTIVE MANAGER' : `ROLE: EMPLOYEE (${userName || 'MEMBER'})`}
                          </span>
                      </div>

                      {/* Tab Content */}
                      <div className="w-full">
                          <AnimatePresence mode="wait">
                              {/* Manager Approvals Review Queue Tab */}
                              {activeTab === 'approvals' && (
                                  <motion.div 
                                      key="approvals"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="space-y-4 w-full"
                                  >
                                      <div className="flex items-center justify-between px-1 pb-1">
                                          <div>
                                              <h3 className="text-white font-medium text-base">Manager Review Queue</h3>
                                              <p className="text-xs text-slate-400">Claims exceeding autonomous limits awaiting executive sign-off</p>
                                          </div>
                                          <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                              {pendingClaims.length} Pending
                                          </span>
                                      </div>

                                      {pendingClaims.length === 0 ? (
                                          <div className="text-center py-16 bg-folio-card border border-folio-border rounded-xl p-8 flex flex-col items-center justify-center">
                                              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                                                  <CheckCircle2 size={28} />
                                              </div>
                                              <h4 className="text-white font-medium text-lg">All Claims Processed</h4>
                                              <p className="text-sm text-slate-400 mt-1 max-w-sm">No claims are currently awaiting manual approval. The AI Agent automatically settles compliant claims below policy limits.</p>
                                          </div>
                                      ) : (
                                          <div className="space-y-3">
                                              {pendingClaims.map((tx, idx) => (
                                                  <div 
                                                      key={idx}
                                                      className="w-full bg-folio-card border border-amber-500/30 rounded-xl p-5 hover:border-amber-500/50 transition-all flex flex-col gap-4 shadow-sm"
                                                  >
                                                      <div className="flex items-start justify-between">
                                                          <div className="flex items-start gap-4">
                                                              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0">
                                                                  <Receipt size={22} />
                                                              </div>
                                                              <div>
                                                                  <div className="flex items-center gap-2">
                                                                      <h4 className="text-white font-semibold text-base">{tx.vendor || 'Unknown Vendor'}</h4>
                                                                      <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                                                          {tx.category || 'General'}
                                                                      </span>
                                                                  </div>
                                                                  <p className="text-xs text-slate-400 font-mono mt-1">Recipient: <span className="text-slate-300">{tx.recipient}</span></p>
                                                                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">{tx.timestamp}</p>
                                                              </div>
                                                          </div>
                                                          <div className="text-right">
                                                              <div className="text-xl font-bold text-white font-space">${tx.amount_usd}</div>
                                                              <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                                                  Needs Sign-off
                                                              </span>
                                                          </div>
                                                      </div>

                                                      {tx.receipt_image && (
                                                          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between">
                                                              <div className="flex items-center gap-3">
                                                                  <img 
                                                                      src={tx.receipt_image.startsWith('/') ? `http://localhost:8000${tx.receipt_image}` : tx.receipt_image} 
                                                                      alt="Receipt" 
                                                                      className="w-10 h-10 object-cover rounded border border-slate-700" 
                                                                  />
                                                                  <div>
                                                                      <span className="text-xs text-white font-medium block">Receipt Attached</span>
                                                                      <span className="text-[10px] text-slate-400 font-mono">Audited by AI Agent</span>
                                                                  </div>
                                                              </div>
                                                              <button 
                                                                  onClick={() => { setSelectedTx(tx); setIsDrawerOpen(true); }}
                                                                  className="text-xs text-folio-brand hover:underline font-mono cursor-pointer"
                                                              >
                                                                  View Full Receipt &rarr;
                                                              </button>
                                                          </div>
                                                      )}

                                                      <div className="flex gap-3 pt-2 border-t border-slate-800/70">
                                                          <button 
                                                              onClick={() => handleApproveClaim(tx.tx_id)}
                                                              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] cursor-pointer"
                                                          >
                                                              <Check size={14} /> Approve & Settle
                                                          </button>
                                                          <button 
                                                              onClick={() => handleRejectClaim(tx.tx_id)}
                                                              className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                                                          >
                                                              <X size={14} /> Reject Claim
                                                          </button>
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      )}
                                  </motion.div>
                              )}

                              {activeTab === 'audit' && (
                                  <motion.div 
                                      key="audit"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="space-y-6 w-full max-w-xl mx-auto"
                                  >
                                      {auditError && (
                                          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex justify-between items-center font-outfit">
                                              <span><strong className="font-bold">Audit Rejected:</strong> {auditError}</span>
                                              <button onClick={() => setAuditError(null)} className="text-red-400 hover:text-white ml-3 text-xs font-mono">✕</button>
                                          </div>
                                      )}

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
                                          className={`w-full py-4 rounded-lg font-space font-bold text-lg tracking-wide transition-all mt-4 cursor-pointer ${isScanning ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-folio-brand hover:bg-folio-brand/90 text-folio-bg'}`}
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
                                      className="space-y-4 max-h-[550px] overflow-y-auto pr-1 w-full"
                                  >
                                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1 pb-1">
                                          <div className="flex items-center gap-2">
                                              <span className="text-xs text-slate-400 font-mono">
                                                  {userRole === 'manager' ? 'Enterprise Ledger' : 'My Expense Ledger'}: {displayedLedger.length} items
                                              </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                              {userRole === 'manager' && (
                                                  <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
                                                      <button 
                                                          onClick={() => setLedgerFilter('all')}
                                                          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${ledgerFilter === 'all' ? 'bg-folio-brand text-folio-bg font-bold' : 'text-slate-400 hover:text-white'}`}
                                                      >
                                                          All ({ledger.length})
                                                      </button>
                                                      <button 
                                                          onClick={() => setLedgerFilter('pending')}
                                                          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${ledgerFilter === 'pending' ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                                                      >
                                                          Pending ({pendingClaims.length})
                                                      </button>
                                                      <button 
                                                          onClick={() => setLedgerFilter('approved')}
                                                          className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${ledgerFilter === 'approved' ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                                                      >
                                                          Approved ({approvedClaims.length})
                                                      </button>
                                                  </div>
                                              )}
                                              {ledger.length > 0 && (
                                                  <button 
                                                      onClick={exportLedgerToCSV}
                                                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-slate-700 px-3 py-1 rounded-lg transition-colors font-mono cursor-pointer"
                                                      title="Export Ledger as CSV"
                                                  >
                                                      <Download size={12} /> Export CSV
                                                  </button>
                                              )}
                                          </div>
                                      </div>

                                      {displayedLedger.length === 0 ? (
                                          <div className="text-center py-12 text-slate-500 bg-folio-card border border-folio-border rounded-xl">
                                              No matching transactions found.
                                          </div>
                                      ) : (
                                          displayedLedger.map((tx, idx) => (
                                              <div 
                                                key={idx} 
                                                onClick={() => { setSelectedTx(tx); setIsDrawerOpen(true); }}
                                                className="w-full bg-folio-card border border-folio-border rounded-xl p-4 hover:border-slate-600 transition-colors cursor-pointer group flex flex-col gap-3"
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
                                                          <h4 className="text-white font-medium font-space">${tx.amount_usd}</h4>
                                                          <p className={`text-xs mt-1 font-bold uppercase ${tx.status === 'APPROVED' ? 'text-emerald-400' : tx.status === 'PENDING_REVIEW' ? 'text-amber-400' : tx.status === 'REJECTED' ? 'text-red-400' : 'text-slate-500'}`}>
                                                              {tx.status}
                                                          </p>
                                                      </div>
                                                  </div>
                                                  
                                                  {tx.status === 'PENDING_REVIEW' && userRole === 'manager' && (
                                                      <div className="flex gap-2.5 pt-3 border-t border-slate-800/85" onClick={e => e.stopPropagation()}>
                                                          <button 
                                                              onClick={() => handleApproveClaim(tx.tx_id)}
                                                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-md transition-colors cursor-pointer"
                                                          >
                                                              Approve
                                                          </button>
                                                          <button 
                                                              onClick={() => handleRejectClaim(tx.tx_id)}
                                                              className="flex-1 py-1.5 bg-red-650/10 hover:bg-red-650/20 text-red-500 border border-red-500/20 hover:border-red-500/40 font-bold text-xs rounded-md transition-colors cursor-pointer"
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
                                      className="w-full max-w-xl mx-auto space-y-6"
                                  >
                                      {auditError && (
                                          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-xs flex justify-between items-center font-outfit">
                                              <span><strong className="font-bold">Payout Rejected:</strong> {auditError}</span>
                                              <button onClick={() => setAuditError(null)} className="text-red-400 hover:text-white ml-3 text-xs font-mono">✕</button>
                                          </div>
                                      )}

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
                                          className={`w-full py-4 rounded-lg font-space font-bold text-lg tracking-wide transition-all mt-4 cursor-pointer ${isScanning ? 'bg-slate-800 text-slate-500 cursor-wait' : 'bg-folio-brand hover:bg-folio-brand/90 text-folio-bg'}`}
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
                                      className="space-y-6 max-h-[500px] overflow-y-auto pr-2 relative w-full"
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
                                                                      <span className="text-sm font-bold text-white font-space">${tx.amount_usd}</span>
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
                      {(activeTab === 'audit' || (activeTab === 'send' && userRole === 'manager') || activeTab === 'approvals') ? (
                        <div className={`w-full grid gap-4 mt-12 ${userRole === 'manager' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                            <div className="bg-folio-card border border-folio-border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2 text-sm font-medium text-white">
                                    <span className="flex items-center gap-2"><Sparkles size={16} className="text-folio-accent" /> AI Agent Activity</span>
                                    {logs.length > 0 && (
                                        <button onClick={() => setLogs([])} className="text-[10px] text-slate-500 hover:text-white font-mono cursor-pointer">Clear</button>
                                    )}
                                </div>
                                <AiThoughtStudio logs={logs} className="h-32" />
                            </div>
                            
                            {userRole === 'manager' ? (
                                <div className="bg-folio-card border border-folio-border rounded-xl p-5">
                                    <div className="flex justify-between items-center mb-4 text-sm font-medium text-white">
                                        <span className="flex items-center gap-2"><Activity size={16} className="text-folio-accent" /> Treasury Quick Stats</span>
                                        <button onClick={fetchBalances} className="text-xs text-slate-500 hover:text-white cursor-pointer">Refresh</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-folio-bg border border-folio-border rounded-lg p-3 flex flex-col justify-center items-center h-20">
                                            <p className="text-xs text-slate-400 mb-1">USDC Vault</p>
                                            <p className="text-lg font-medium text-white font-space">${balances.usdc.toFixed(2)}</p>
                                        </div>
                                        <div className="bg-folio-bg border border-folio-border rounded-lg p-3 flex flex-col justify-center items-center h-20">
                                            <p className="text-xs text-slate-400 mb-1">Network ETH</p>
                                            <p className="text-lg font-medium text-white font-space">{balances.eth.toFixed(4)}</p>
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

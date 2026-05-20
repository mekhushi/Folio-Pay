import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Send, Activity, Box, Sparkles, Receipt, ChevronDown, Plus, LayoutGrid, Clock, User } from 'lucide-react';
import { useCustomCursor } from './hooks/useCustomCursor';
import AiThoughtStudio from './components/AiThoughtStudio';
import ReceiptFlip from './components/ReceiptFlip';
import ReceiptDrawer from './components/ReceiptDrawer';
import LandingPage from './components/LandingPage';

const API_BASE = "http://localhost:8000/api";

function App() {
  const cursorRef = useCustomCursor();
  const [currentView, setCurrentView] = useState('landing');
  const [activeTab, setActiveTab] = useState('audit'); // audit | ledger | activity | profile
  const [balances, setBalances] = useState({ eth: 0, usdc: 0, mode: 'loading' });
  const [ledger, setLedger] = useState([]);
  
  // Form State
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState('Software');
  const [file, setFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // AI/Stream State
  const [logs, setLogs] = useState([]);
  const [approvedTx, setApprovedTx] = useState(null);
  const [showFlip, setShowFlip] = useState(false);
  
  // Drawer State
  const [selectedTx, setSelectedTx] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const laserRef = useRef(null);

  // Flow Coordination: Scroll to top when switching views
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    fetchBalances();
    fetchLedger();
  }, []);

  const fetchBalances = async () => {
    try {
        const res = await fetch(`${API_BASE}/treasury/balance`);
        const data = await res.json();
        setBalances(data);
    } catch(e) { console.error(e) }
  };

  const fetchLedger = async () => {
    try {
        const res = await fetch(`${API_BASE}/ledger`);
        const data = await res.json();
        setLedger(data);
    } catch(e) { console.error(e) }
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
              <LandingPage key="landing" onEnter={() => setCurrentView('app')} />
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
                      {/* Logo */}
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-folio-brand flex items-center justify-center">
                              <div className="w-4 h-4 bg-folio-brand rounded-full" />
                          </div>
                          <h1 className="text-xl font-space font-bold tracking-widest text-folio-brand">
                              FOLIO<br/><span className="text-[10px] tracking-[0.3em] font-normal text-folio-brand-muted leading-none block -mt-1">PAY</span>
                          </h1>
                      </div>

                      {/* Network / Wallet Dropdown */}
                      <div className="flex items-center gap-3">
                          <button className="bg-folio-card border border-folio-border text-white text-sm font-medium px-4 py-2 rounded-full flex items-center gap-2 hover:bg-slate-800 transition-colors">
                              <div className="w-3 h-3 bg-blue-500 rounded-full" /> Base Sepolia <span className="text-slate-400 text-xs ml-1">(ETH)</span> <ChevronDown size={14} className="text-slate-400" />
                          </button>
                          <button className="bg-folio-brand text-folio-bg p-2 rounded-lg hover:opacity-90 transition-opacity">
                              <LayoutGrid size={20} />
                          </button>
                      </div>
                  </div>

                  {/* Main Central Wallet Container */}
                  <div className="w-full max-w-[600px] flex flex-col items-center px-4">
                      
                      {/* Navigation Tabs (Square Buttons) */}
                      <div className="flex justify-center gap-3 mb-8 w-full overflow-x-auto hide-scrollbar py-2">
                          {tabs.map((tab) => {
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
                      <div className="w-full bg-folio-accent/10 border border-folio-accent/20 rounded-lg py-4 mb-8 text-center text-folio-accent font-medium text-sm">
                          Autonomous treasury powered by Agentic AI
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
                                      className="space-y-4"
                                  >
                                      {ledger.length === 0 ? (
                                          <div className="text-center py-12 text-slate-500">No historic ledger activity.</div>
                                      ) : (
                                          ledger.map((tx, idx) => (
                                              <div 
                                                key={idx} 
                                                onClick={() => { setSelectedTx(tx); setIsDrawerOpen(true); }}
                                                className="w-full bg-folio-card border border-folio-border rounded-lg p-4 flex items-center justify-between hover:border-slate-500 transition-colors cursor-pointer group"
                                              >
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
                                                      <p className={`text-xs mt-1 ${tx.status === 'APPROVED' ? 'text-emerald-500' : 'text-slate-500'}`}>{tx.status}</p>
                                                  </div>
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
                                      className="space-y-6"
                                  >
                                      {/* Workspace Profile */}
                                      <div className="bg-folio-card border border-folio-border rounded-xl p-6 relative overflow-hidden">
                                          <div className="absolute top-0 right-0 w-32 h-32 bg-folio-brand rounded-full blur-[80px] opacity-10 pointer-events-none" />
                                          <div className="flex items-center gap-4 mb-6 relative z-10">
                                              <div className="w-16 h-16 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-full flex items-center justify-center text-white text-xl font-bold shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                                                  FP
                                              </div>
                                              <div>
                                                  <h3 className="text-xl font-bold text-white font-space tracking-wide">Folio Pay Inc.</h3>
                                                  <p className="text-sm text-slate-400 font-mono">Workspace ID: wrk_9921a</p>
                                              </div>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-4 relative z-10">
                                              <div className="bg-[#050505] rounded-lg p-4 border border-slate-800">
                                                  <span className="text-xs text-slate-500 block mb-1">Treasury Wallet</span>
                                                  <span className="text-sm text-folio-brand font-mono">0x8F9a...3a2B</span>
                                              </div>
                                              <div className="bg-[#050505] rounded-lg p-4 border border-slate-800">
                                                  <span className="text-xs text-slate-500 block mb-1">Network</span>
                                                  <span className="text-sm text-emerald-400 font-mono">Base Sepolia</span>
                                              </div>
                                          </div>
                                      </div>

                                      {/* Agent Settings */}
                                      <div className="bg-folio-card border border-folio-border rounded-xl p-6">
                                          <h4 className="text-white font-medium mb-6 flex items-center gap-2"><Sparkles size={16} className="text-folio-brand" /> Agentic Configuration</h4>
                                          
                                          <div className="space-y-5">
                                              <div className="flex justify-between items-center border-b border-slate-800/50 pb-5">
                                                  <div>
                                                      <span className="text-sm text-white block mb-0.5">LLM Engine</span>
                                                      <span className="text-xs text-slate-500">The model powering receipt OCR & decisions.</span>
                                                  </div>
                                                  <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded">Gemini 1.5 Flash</span>
                                              </div>
                                              
                                              <div className="flex justify-between items-center border-b border-slate-800/50 pb-5">
                                                  <div>
                                                      <span className="text-sm text-white block mb-0.5">Auto-Approval Threshold</span>
                                                      <span className="text-xs text-slate-500">Claims below this amount skip manual review.</span>
                                                  </div>
                                                  <span className="text-sm font-mono text-emerald-400">$500.00</span>
                                              </div>

                                              <div className="flex justify-between items-center pt-1">
                                                  <div>
                                                      <span className="text-sm text-white block mb-0.5">API Keys</span>
                                                      <span className="text-xs text-slate-500">Manage Gemini and Web3 RPC keys.</span>
                                                  </div>
                                                  <button className="text-xs font-medium text-folio-brand hover:text-white transition-colors">Manage Keys &rarr;</button>
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <button className="w-full py-4 rounded-lg font-space font-bold text-sm tracking-widest uppercase transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20">
                                          Sign Out
                                      </button>
                                  </motion.div>
                              )}

                              {['send', 'activity'].includes(activeTab) && (
                                  <motion.div
                                      key={activeTab}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="w-full h-64 bg-folio-card border border-folio-border border-dashed rounded-xl flex flex-col items-center justify-center text-slate-500"
                                  >
                                      <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-folio-brand border border-slate-800 shadow-inner">
                                          <Sparkles size={20} />
                                      </div>
                                      <h3 className="text-white font-medium text-lg mb-2 capitalize">{activeTab} Module</h3>
                                      <p className="text-sm font-mono opacity-60">Agentic integration currently in training.</p>
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>

                      {/* Bottom AI Panels (Like NLP Copilot / Dashboard) */}
                      {activeTab === 'audit' && (
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
                            <div className="bg-folio-card border border-folio-border rounded-xl p-5 relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-4 text-sm font-medium text-white">
                                    <Sparkles size={16} className="text-folio-accent" /> AI Agent Activity
                                </div>
                                <div className="h-32 text-xs font-mono text-slate-400 overflow-y-auto hide-scrollbar">
                                    {logs.length > 0 ? logs.map((l, i) => (
                                        <div key={i} className="mb-2 opacity-80 leading-relaxed">{l}</div>
                                    )) : (
                                        <div className="text-slate-600 italic">Awaiting input...</div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-folio-card border border-folio-border rounded-xl p-5">
                                <div className="flex justify-between items-center mb-4 text-sm font-medium text-white">
                                    <span className="flex items-center gap-2"><Activity size={16} className="text-folio-accent" /> Treasury Stats</span>
                                    <button className="text-xs text-slate-500 hover:text-white">Refresh</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-folio-bg border border-folio-border rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-1">USDC Vault</p>
                                        <p className="text-lg font-medium text-white">${balances.usdc.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-folio-bg border border-folio-border rounded-lg p-3">
                                        <p className="text-xs text-slate-400 mb-1">Network ETH</p>
                                        <p className="text-lg font-medium text-white">{balances.eth.toFixed(4)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                      )}
                      
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Overlays */}
      {showFlip && approvedTx && (
        <ReceiptFlip transaction={approvedTx} onClose={() => setShowFlip(false)} />
      )}
      <ReceiptDrawer isOpen={isDrawerOpen} transaction={selectedTx} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}

export default App;

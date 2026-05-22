import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, Shield, Coins, LogOut, Eye, EyeOff, 
    Copy, Check, Plus, X, Edit2, Settings, Terminal, Box 
} from 'lucide-react';

export default function ProfilePage({ 
    rules, 
    balances, 
    ledger, 
    saveConfig, 
    isSavingConfig,
    workspaceId,
    handleSignOut
}) {
    const [copiedId, setCopiedId] = useState(false);
    const [copiedWallet, setCopiedWallet] = useState(false);
    
    // Config states
    const [showApiKey, setShowApiKey] = useState(false);
    const [tempApiKey, setTempApiKey] = useState(rules.api_keys?.gemini || '');
    
    const [editingThreshold, setEditingThreshold] = useState(false);
    const [thresholdInput, setThresholdInput] = useState(rules.max_claim_limit?.toString() || '500');

    const [editingAutoApproveThreshold, setEditingAutoApproveThreshold] = useState(false);
    const [autoApproveThresholdInput, setAutoApproveThresholdInput] = useState(rules.auto_approve_threshold?.toString() || '50');

    const [editingBudget, setEditingBudget] = useState(false);
    const [budgetInput, setBudgetInput] = useState(rules.monthly_budget?.toString() || '2000');

    const [editingHeaderName, setEditingHeaderName] = useState(false);
    const [headerNameInput, setHeaderNameInput] = useState(rules.company_name || 'Folio Pay Inc.');

    const [editingSettingsName, setEditingSettingsName] = useState(false);
    const [settingsNameInput, setSettingsNameInput] = useState(rules.company_name || 'Folio Pay Inc.');

    const [newCategoryInput, setNewCategoryInput] = useState('');

    const walletAddress = balances.treasury_address || '0x8F9a4891b2c453A2Bc28c89735d46CcA56363a2B';
    const displayAddress = walletAddress.length > 10 
        ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` 
        : walletAddress;

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'id') {
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        } else {
            setCopiedWallet(true);
            setTimeout(() => setCopiedWallet(false), 2000);
        }
    };

    // Calculations
    const approvedTxs = ledger.filter(tx => tx.status === 'APPROVED');
    const totalSpentThisMonth = approvedTxs.reduce((sum, tx) => sum + (tx.amount_usd || 0), 0);
    const budgetLimit = rules.monthly_budget || 2000;
    const budgetProgress = Math.min((totalSpentThisMonth / budgetLimit) * 100, 100);

    const handleSaveThreshold = () => {
        const val = parseFloat(thresholdInput) || 0;
        saveConfig({ ...rules, max_claim_limit: val });
        setEditingThreshold(false);
    };

    const handleSaveBudget = () => {
        const val = parseFloat(budgetInput) || 0;
        saveConfig({ ...rules, monthly_budget: val });
        setEditingBudget(false);
    };

    const handleSaveApiKey = () => {
        saveConfig({
            ...rules,
            api_keys: { ...rules.api_keys, gemini: tempApiKey }
        });
    };

    const handleStartEditHeaderName = () => {
        setHeaderNameInput(rules.company_name || 'Folio Pay Inc.');
        setEditingHeaderName(true);
    };

    const handleSaveHeaderName = () => {
        const val = headerNameInput.trim() || 'Folio Pay Inc.';
        saveConfig({ ...rules, company_name: val });
        setEditingHeaderName(false);
    };

    const handleStartEditSettingsName = () => {
        setSettingsNameInput(rules.company_name || 'Folio Pay Inc.');
        setEditingSettingsName(true);
    };

    const handleSaveSettingsName = () => {
        const val = settingsNameInput.trim() || 'Folio Pay Inc.';
        saveConfig({ ...rules, company_name: val });
        setEditingSettingsName(false);
    };

    const handleAddCategory = (e) => {
        e.preventDefault();
        const cat = newCategoryInput.trim();
        if (!cat) return;
        
        const categories = [...(rules.allowed_categories || [])];
        if (!categories.includes(cat)) {
            categories.push(cat);
            saveConfig({ ...rules, allowed_categories: categories });
        }
        setNewCategoryInput('');
    };

    const handleRemoveCategory = (catToRemove) => {
        const categories = (rules.allowed_categories || []).filter(c => c !== catToRemove);
        saveConfig({ ...rules, allowed_categories: categories });
    };

    return (
        <div className="space-y-6 w-full pb-16 text-zinc-300">
            {/* Glassmorphic Workspace Profile Card */}
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-folio-brand rounded-full blur-[90px] opacity-10 pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-folio-accent rounded-full blur-[70px] opacity-10 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div>
                            <div className="flex items-center gap-3">
                                {editingHeaderName ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="text"
                                            value={headerNameInput}
                                            onChange={(e) => setHeaderNameInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleSaveHeaderName();
                                                if (e.key === 'Escape') setEditingHeaderName(false);
                                            }}
                                            className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-sm font-space text-white focus:outline-none"
                                            placeholder="Company Name"
                                            autoFocus
                                        />
                                        <button 
                                            onClick={handleSaveHeaderName}
                                            className="text-[10px] bg-folio-brand text-folio-bg font-bold px-2 py-0.5 rounded"
                                        >
                                            Save
                                        </button>
                                        <button 
                                            onClick={() => setEditingHeaderName(false)}
                                            className="text-[10px] bg-slate-800 text-white font-bold px-2 py-0.5 rounded"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group/title">
                                        <h3 
                                            onClick={handleStartEditHeaderName}
                                            className="text-2xl font-bold text-white font-space tracking-wide cursor-pointer hover:text-folio-brand transition-colors"
                                            title="Click to edit company name"
                                        >
                                            {rules.company_name || 'Folio Pay Inc.'}
                                        </h3>
                                        <button 
                                            onClick={handleStartEditHeaderName}
                                            className="text-slate-500 hover:text-white opacity-60 group-hover/title:opacity-100 transition-all p-1"
                                            title="Edit Company Name"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                                <span>ID: {workspaceId || 'wrk_9921a'}</span>
                                <button 
                                    onClick={() => handleCopy(workspaceId || 'wrk_9921a', 'id')}
                                    className="hover:text-white transition-colors p-0.5"
                                    title="Copy Workspace ID"
                                >
                                    {copiedId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-950/40 border border-slate-800/80 px-4 py-2.5 rounded-xl backdrop-blur-md">
                        <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Network</span>
                            <span className="text-sm font-mono text-emerald-400 font-medium">Base Sepolia</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bento Grid: Treasury Wallet & Budget Policy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Treasury Wallet Card */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700/50 transition-colors shadow-lg">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-white font-medium font-space flex items-center gap-2 text-sm tracking-wide">
                                <Coins size={18} className="text-folio-brand" /> Treasury Wallet
                            </h4>
                            <button 
                                onClick={() => handleCopy(walletAddress, 'wallet')}
                                className="text-slate-500 hover:text-white transition-colors p-1"
                                title="Copy Wallet Address"
                            >
                                {copiedWallet ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                        </div>
                        <div className="bg-[#050505] p-3 rounded-lg border border-slate-800 font-mono text-xs text-folio-brand break-all select-all flex items-center justify-between">
                            <span>{displayAddress}</span>
                            <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">Sepolia</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/60">
                        <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-800/40">
                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">USDC Balance</span>
                            <span className="text-lg font-bold text-white">${balances.usdc.toFixed(2)}</span>
                        </div>
                        <div className="bg-slate-950/30 p-3 rounded-lg border border-slate-800/40">
                            <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Network ETH</span>
                            <span className="text-lg font-bold text-white">{balances.eth.toFixed(4)}</span>
                        </div>
                    </div>
                </div>

                {/* Budget Limit Card */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700/50 transition-colors shadow-lg">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-white font-medium font-space flex items-center gap-2 text-sm tracking-wide">
                                <Shield size={18} className="text-folio-accent" /> Monthly Budget Policy
                            </h4>
                            {editingBudget ? (
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number"
                                        value={budgetInput}
                                        onChange={(e) => setBudgetInput(e.target.value)}
                                        className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono text-white text-right focus:outline-none"
                                        placeholder="2000"
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleSaveBudget}
                                        className="text-[10px] bg-folio-brand text-folio-bg font-bold px-2 py-0.5 rounded"
                                    >
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setEditingBudget(true)}
                                    className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <Edit2 size={12} /> Adjust Limit
                                </button>
                            )}
                        </div>
                        
                        <div className="flex items-end justify-between mb-2">
                            <div>
                                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Spent this month</span>
                                <span className="text-2xl font-bold text-white">${totalSpentThisMonth.toFixed(2)}</span>
                            </div>
                            <span className="text-xs font-mono text-slate-400">
                                Limit: <span className="text-white">${budgetLimit.toFixed(2)}</span>
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden mt-3">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${budgetProgress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="bg-gradient-to-r from-[#0ea5e9] to-[#0284c7] h-full rounded-full shadow-[0_0_10px_rgba(14,165,233,0.3)] relative"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[shimmer_2s_linear_infinite]" />
                            </motion.div>
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-slate-400">
                        {budgetProgress >= 90 ? (
                            <span className="text-red-400 font-medium">Warning: Approaching budget limit.</span>
                        ) : (
                            <span>Agent has auto-approved {approvedTxs.length} payout(s) this month.</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Agent Configuration & Key Management */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-800/80">
                    <Settings size={20} className="text-folio-brand" />
                    <h4 className="text-white font-semibold font-space tracking-wide">Agent Governance Settings</h4>
                </div>

                <div className="space-y-6">
                    {/* Row 0: Company Name */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-800/30 pb-5">
                        <div className="max-w-md">
                            <span className="text-sm font-medium text-white flex items-center gap-2">
                                <Box size={14} className="text-folio-brand" /> Workspace Company Name
                            </span>
                            <span className="text-xs text-slate-500 block mt-0.5">
                                Set the name of the company/organization for this workspace.
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {editingSettingsName ? (
                                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                                    <input 
                                        type="text"
                                        value={settingsNameInput}
                                        onChange={(e) => setSettingsNameInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveSettingsName();
                                            if (e.key === 'Escape') setEditingSettingsName(false);
                                        }}
                                        className="bg-transparent w-44 font-mono text-sm text-white focus:outline-none"
                                        placeholder="Folio Pay Inc."
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleSaveSettingsName}
                                        className="text-xs bg-folio-brand text-folio-bg font-bold px-2.5 py-1 rounded-md"
                                    >
                                        Save
                                    </button>
                                    <button 
                                        onClick={() => setEditingSettingsName(false)}
                                        className="text-xs bg-slate-850 text-white font-bold px-2 py-1 rounded-md"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    onClick={handleStartEditSettingsName}
                                    className="flex items-center gap-3 bg-slate-950/40 hover:bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-lg cursor-pointer transition-colors"
                                >
                                    <span className="text-sm font-mono text-white font-bold">{rules.company_name || 'Folio Pay Inc.'}</span>
                                    <span className="text-[10px] bg-slate-850 text-slate-400 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                                        <Edit2 size={10} /> Edit
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 1: LLM Engine */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-800/30 pb-5">
                        <div className="max-w-md">
                            <span className="text-sm font-medium text-white flex items-center gap-2">
                                <Sparkles size={14} className="text-folio-brand" /> LLM Decision Engine
                            </span>
                            <span className="text-xs text-slate-500 block mt-0.5">
                                Select the LLM model used to process OCR invoices, categorize, and execute policy decisions.
                            </span>
                        </div>
                        <select 
                            value={rules.llm_engine} 
                            onChange={(e) => saveConfig({ ...rules, llm_engine: e.target.value })}
                            disabled={isSavingConfig}
                            className="bg-slate-950 text-xs font-mono text-slate-300 px-4 py-2 rounded-lg border border-slate-800 outline-none focus:border-folio-brand cursor-pointer hover:bg-slate-900 transition-colors"
                        >
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Default)</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Thorough)</option>
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen)</option>
                        </select>
                    </div>

                    {/* Row 2: Max Single Claim Limit */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-800/30 pb-5">
                        <div className="max-w-md">
                            <span className="text-sm font-medium text-white flex items-center gap-2">
                                <Shield size={14} className="text-folio-brand" /> Max Single Claim Limit
                            </span>
                            <span className="text-xs text-slate-500 block mt-0.5">
                                The absolute maximum amount allowed for a single claim. Claims exceeding this limit are auto-rejected.
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {editingThreshold ? (
                                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                                    <span className="text-sm text-slate-500 font-mono">$</span>
                                    <input 
                                        type="number"
                                        value={thresholdInput}
                                        onChange={(e) => setThresholdInput(e.target.value)}
                                        className="bg-transparent w-20 font-mono text-sm text-white focus:outline-none"
                                        placeholder="500"
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleSaveThreshold}
                                        className="text-xs bg-folio-brand text-folio-bg font-bold px-2.5 py-1 rounded-md"
                                    >
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => setEditingThreshold(true)}
                                    className="flex items-center gap-3 bg-slate-950/40 hover:bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-lg cursor-pointer transition-colors"
                                >
                                    <span className="text-sm font-mono text-emerald-400 font-bold">${parseFloat(rules.max_claim_limit || 0).toFixed(2)}</span>
                                    <span className="text-[10px] bg-slate-850 text-slate-400 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                                        <Edit2 size={10} /> Edit
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 2.5: Auto-Approval Threshold */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-b border-slate-800/30 pb-5">
                        <div className="max-w-md">
                            <span className="text-sm font-medium text-white flex items-center gap-2">
                                <Shield size={14} className="text-folio-accent" /> Auto-Approval Threshold
                            </span>
                            <span className="text-xs text-slate-500 block mt-0.5">
                                Claims below this threshold will bypass manual manager approval and settle immediately.
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {editingAutoApproveThreshold ? (
                                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                                    <span className="text-sm text-slate-500 font-mono">$</span>
                                    <input 
                                        type="number"
                                        value={autoApproveThresholdInput}
                                        onChange={(e) => setAutoApproveThresholdInput(e.target.value)}
                                        className="bg-transparent w-20 font-mono text-sm text-white focus:outline-none"
                                        placeholder="50"
                                        autoFocus
                                    />
                                    <button 
                                        onClick={() => {
                                            const val = parseFloat(autoApproveThresholdInput) || 0;
                                            saveConfig({ ...rules, auto_approve_threshold: val });
                                            setEditingAutoApproveThreshold(false);
                                        }}
                                        className="text-xs bg-folio-brand text-folio-bg font-bold px-2.5 py-1 rounded-md"
                                    >
                                        Save
                                    </button>
                                </div>
                            ) : (
                                <div 
                                    onClick={() => setEditingAutoApproveThreshold(true)}
                                    className="flex items-center gap-3 bg-slate-950/40 hover:bg-slate-900/60 border border-slate-850 px-4 py-2 rounded-lg cursor-pointer transition-colors"
                                >
                                    <span className="text-sm font-mono text-[#0ea5e9] font-bold">${parseFloat(rules.auto_approve_threshold || 50).toFixed(2)}</span>
                                    <span className="text-[10px] bg-slate-850 text-slate-400 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                                        <Edit2 size={10} /> Edit
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Row 3: API Key */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 py-2 border-b border-slate-800/30 pb-5">
                        <div className="max-w-md">
                            <span className="text-sm font-medium text-white flex items-center gap-2">
                                <Terminal size={14} className="text-slate-400" /> Gemini LLM API Key
                            </span>
                            <span className="text-xs text-slate-500 block mt-0.5">
                                Set your personal Gemini API key. If left blank, the server will default to simulated pipeline.
                            </span>
                        </div>
                        <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 w-full md:w-80">
                                <input 
                                    type={showApiKey ? "text" : "password"} 
                                    value={tempApiKey}
                                    onChange={(e) => setTempApiKey(e.target.value)}
                                    placeholder={rules.api_keys?.gemini ? "••••••••••••••••" : "AIzaSy..."}
                                    className="bg-transparent flex-1 font-mono text-xs text-white placeholder-slate-600 focus:outline-none"
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                            <button 
                                onClick={handleSaveApiKey}
                                disabled={isSavingConfig}
                                className="text-xs bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-1.5 rounded-lg border border-slate-700 transition-colors"
                            >
                                {isSavingConfig ? 'Saving...' : 'Apply Key'}
                            </button>
                        </div>
                    </div>

                    {/* Row 4: Allowed Categories Manager */}
                    <div className="py-2">
                        <div>
                            <span className="text-sm font-medium text-white block">Allowed Expense Categories</span>
                            <span className="text-xs text-slate-500 block mt-0.5">
                                Only receipts matching these categories will be approved. Other categories will be automatically auto-rejected.
                            </span>
                        </div>

                        {/* Category list */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <AnimatePresence>
                                {(rules.allowed_categories || []).map((cat) => (
                                    <motion.span 
                                        key={cat}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="flex items-center gap-1.5 bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20 text-xs px-3 py-1 rounded-full font-medium"
                                    >
                                        {cat}
                                        <button 
                                            onClick={() => handleRemoveCategory(cat)}
                                            className="hover:bg-[#0ea5e9]/20 rounded-full p-0.5 transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    </motion.span>
                                ))}
                            </AnimatePresence>

                            {/* Add Category Form */}
                            <form onSubmit={handleAddCategory} className="flex items-center gap-1.5">
                                <input 
                                    type="text" 
                                    value={newCategoryInput}
                                    onChange={(e) => setNewCategoryInput(e.target.value)}
                                    placeholder="Add Category..."
                                    className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs px-3 py-1 rounded-full text-white placeholder-slate-600 focus:outline-none focus:border-folio-brand transition-colors w-28"
                                />
                                <button 
                                    type="submit"
                                    className="bg-[#0ea5e9] text-folio-bg p-1 rounded-full hover:bg-[#0ea5e9]/90 transition-colors"
                                >
                                    <Plus size={10} className="font-extrabold text-slate-950" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2">
                <button 
                    onClick={handleSignOut}
                    className="w-full py-4 rounded-xl font-space font-bold text-sm tracking-widest uppercase transition-all bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40"
                >
                    Disconnect Session
                </button>
            </div>
        </div>
    );
}

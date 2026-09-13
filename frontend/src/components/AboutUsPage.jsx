import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { 
    ArrowUpRight, ArrowLeft, Shield, Zap, 
    Cpu, Layers, Receipt, Sparkles, Check, X, FileSpreadsheet,
    Building2, Activity, Database, CheckCircle2, Lock, Clock, DollarSign
} from 'lucide-react';

export default function AboutUsPage({ isOpen, onClose, onLaunchApp, onOpenDocs }) {
    const pageRef = useRef(null);
    const heroTitleRef = useRef(null);
    const counter1Ref = useRef(null);
    const counter2Ref = useRef(null);
    const counter3Ref = useRef(null);
    const counter4Ref = useRef(null);
    const [activeStep, setActiveStep] = useState(0);

    // Pause Lenis and listen for Escape key
    useEffect(() => {
        if (isOpen) {
            window.__lenis?.stop();
        }
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.__lenis?.start();
        };
    }, [isOpen]);

    // GSAP Master Timeline & Entrance
    useGSAP(() => {
        if (!isOpen) return;

        if (pageRef.current) {
            pageRef.current.scrollTop = 0;
        }

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        // 1. Page Fade-in & Slide
        tl.fromTo(
            pageRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.35, clearProps: 'transform' }
        );

        // 2. Hero Headline Stagger Reveal
        const words = heroTitleRef.current?.querySelectorAll('.hero-line');
        if (words && words.length > 0) {
            tl.fromTo(
                words,
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
                '-=0.2'
            );
        }

        // 3. Live Animated Counters
        const counters = [
            { ref: counter1Ref, target: 14.8, prefix: '$', suffix: 'M+', decimals: 1 },
            { ref: counter2Ref, target: 2.4, prefix: '', suffix: 's', decimals: 1 },
            { ref: counter3Ref, target: 100, prefix: '', suffix: '%', decimals: 0 },
            { ref: counter4Ref, target: 24, prefix: '', suffix: '/7', decimals: 0 }
        ];

        counters.forEach(c => {
            if (!c.ref.current) return;
            const obj = { val: 0 };
            gsap.to(obj, {
                val: c.target,
                duration: 1.6,
                ease: 'power2.out',
                delay: 0.2,
                onUpdate: () => {
                    if (c.ref.current) {
                        c.ref.current.textContent = `${c.prefix}${obj.val.toFixed(c.decimals)}${c.suffix}`;
                    }
                }
            });
        });

        // 4. Stagger cards reveal
        const cards = pageRef.current?.querySelectorAll('.gsap-card');
        if (cards && cards.length > 0) {
            tl.fromTo(
                cards,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, stagger: 0.08, duration: 0.5, ease: 'power2.out' },
                '-=0.3'
            );
        }

    }, { scope: pageRef, dependencies: [isOpen] });

    // Interactive 3D Card Tilt with GSAP
    const handleCardMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(card, {
            rotateY: x * 0.03,
            rotateX: -y * 0.03,
            transformPerspective: 800,
            duration: 0.25,
            ease: 'power1.out'
        });
    };

    const handleCardMouseLeave = (e) => {
        gsap.to(e.currentTarget, {
            rotateY: 0,
            rotateX: 0,
            duration: 0.4,
            ease: 'power2.out'
        });
    };

    // Smooth GSAP Close Animation
    const handleClose = () => {
        if (!pageRef.current) {
            onClose();
            return;
        }

        gsap.to(pageRef.current, {
            opacity: 0,
            y: 30,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: onClose
        });
    };

    const pipelineSteps = [
        {
            title: "Document Ingestion",
            subtitle: "Receipt or Invoice Capture",
            desc: "Employees upload a photo of a physical receipt or digital invoice PDF. Google Gemini 1.5 Vision parses merchant information, dates, line items, and total amounts in less than a second.",
            detail: "Automatic OCR extraction with zero manual data entry required."
        },
        {
            title: "Policy Verification",
            subtitle: "Automated Rules & Compliance",
            desc: "The system checks the claim against company spending policies: per-claim limits, category restrictions, and monthly budgets. Safe claims under threshold are approved automatically.",
            detail: "Deterministic rules ensure fair and consistent compliance without bias."
        },
        {
            title: "Instant Settlement",
            subtitle: "Direct Account Payout",
            desc: "Approved reimbursements are paid out immediately from the corporate treasury vault via Base Sepolia USDC or instant domestic transfer directly to the employee.",
            detail: "No 30-day reimbursement cycles. Payouts complete in seconds."
        }
    ];

    if (!isOpen) return null;

    return (
        <div 
            ref={pageRef}
            data-lenis-prevent="true"
            data-lenis-prevent-wheel="true"
            data-lenis-prevent-touch="true"
            className="fixed inset-0 z-50 overflow-y-auto hide-scrollbar bg-[#050508] text-white selection:bg-cyan-500/30 font-outfit overscroll-contain"
            style={{ 
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}
        >
            {/* Soft Ambient Background Lighting */}
            <div className="fixed top-0 left-1/3 w-[50vw] h-[35vh] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none z-0" />
            <div className="fixed bottom-10 right-1/4 w-[40vw] h-[35vh] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none z-0" />

            {/* TOP NAVIGATION BAR */}
            <header className="sticky top-0 w-full z-40 bg-[#050508]/90 backdrop-blur-md border-b border-slate-800/80 px-6 sm:px-12 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleClose}
                        className="group flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-300 hover:text-white transition-colors bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-lg cursor-pointer"
                    >
                        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span>Back</span>
                    </button>
                    <span className="text-xs font-mono text-slate-400">About Folio Pay</span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { handleClose(); onLaunchApp(); }}
                        className="bg-folio-brand text-folio-bg px-4 py-2 rounded-lg text-xs font-space font-bold uppercase tracking-wider hover:bg-white transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                        Launch App
                        <ArrowUpRight size={13} />
                    </button>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 flex items-center justify-center transition-all cursor-pointer text-sm"
                        title="Close (Esc)"
                    >
                        <X size={15} />
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT WRAPPER */}
            <main className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 pt-14 pb-28 space-y-24">

                {/* 1. HERO SECTION */}
                <section className="space-y-8">
                    <div ref={heroTitleRef} className="space-y-3">
                        <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                            Autonomous Corporate Treasury
                        </span>
                        <h1 className="hero-line text-4xl sm:text-6xl md:text-7xl font-space font-bold text-white tracking-tight leading-tight">
                            Instant Expense Settlement, Powered by Multimodal AI.
                        </h1>
                    </div>

                    <p className="text-lg sm:text-xl text-slate-300 max-w-3xl leading-relaxed font-light">
                        Folio Pay automates corporate expense management from receipt capture to treasury disbursement. We eliminate paperwork, manual spreadsheet auditing, and weeks-long reimbursement lag.
                    </p>

                    {/* Stat Cards (Animated with GSAP) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                        <div className="gsap-card p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                            <span className="text-xs font-mono text-slate-400 uppercase">Settled Volume</span>
                            <div ref={counter1Ref} className="text-3xl font-space font-bold text-cyan-400 mt-2">$0.0M</div>
                            <span className="text-xs text-slate-500 mt-1">Autonomous payouts</span>
                        </div>

                        <div className="gsap-card p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                            <span className="text-xs font-mono text-slate-400 uppercase">Audit Time</span>
                            <div ref={counter2Ref} className="text-3xl font-space font-bold text-emerald-400 mt-2">0.0s</div>
                            <span className="text-xs text-slate-500 mt-1">OCR to verification</span>
                        </div>

                        <div className="gsap-card p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                            <span className="text-xs font-mono text-slate-400 uppercase">Policy Accuracy</span>
                            <div ref={counter3Ref} className="text-3xl font-space font-bold text-white mt-2">0%</div>
                            <span className="text-xs text-slate-500 mt-1">Consistent evaluation</span>
                        </div>

                        <div className="gsap-card p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                            <span className="text-xs font-mono text-slate-400 uppercase">Availability</span>
                            <div ref={counter4Ref} className="text-3xl font-space font-bold text-amber-400 mt-2">0/7</div>
                            <span className="text-xs text-slate-500 mt-1">Continuous operation</span>
                        </div>
                    </div>
                </section>

                {/* 2. SECTION: WHO WE ARE */}
                <section className="space-y-8">
                    <div className="border-b border-slate-800 pb-4">
                        <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                            Who We Are
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-space font-bold text-white mt-1">
                            Building the Future of Corporate Finance
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4 text-slate-300 leading-relaxed text-sm sm:text-base font-light">
                            <p>
                                Traditional corporate expense management is fundamentally broken. Employees spend their personal money for company needs and then wait weeks for manual approval and payroll reimbursement.
                            </p>
                            <p>
                                Finance departments spend countless hours reviewing credit card receipts, cross-checking company spending policies, and chasing managers for sign-offs.
                            </p>
                            <p className="text-white font-normal">
                                Folio Pay was created to solve this by combining frontier multimodal computer vision with programmable treasury vaults. We believe corporate expenses should be settled the moment they occur.
                            </p>
                        </div>

                        {/* 3 Core Pillars with GSAP 3D Hover Tilt */}
                        <div className="space-y-3">
                            {[
                                {
                                    icon: Zap,
                                    title: "Zero Bureaucracy",
                                    desc: "Claims under policy thresholds are verified and paid automatically, eliminating unnecessary approval queues."
                                },
                                {
                                    icon: Cpu,
                                    title: "Multimodal AI Perception",
                                    desc: "Gemini 1.5 Vision accurately reads restaurant bills, software invoices, and taxi slips in any format."
                                },
                                {
                                    icon: Shield,
                                    title: "Secure Treasury Control",
                                    desc: "Finance managers maintain strict authority over spending rules, category caps, and team budget allocations."
                                }
                            ].map((pillar, i) => {
                                const Icon = pillar.icon;
                                return (
                                    <div
                                        key={i}
                                        onMouseMove={handleCardMouseMove}
                                        onMouseLeave={handleCardMouseLeave}
                                        className="gsap-card p-5 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-start gap-4 cursor-pointer"
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                                            <Icon size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-space font-semibold text-white">{pillar.title}</h4>
                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{pillar.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* 3. SECTION: WHAT WE DO */}
                <section className="space-y-8">
                    <div className="border-b border-slate-800 pb-4">
                        <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                            What We Do
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-space font-bold text-white mt-1">
                            The 3-Step Autonomous Settlement Flow
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {pipelineSteps.map((step, index) => (
                            <div
                                key={index}
                                onClick={() => setActiveStep(index)}
                                className={`gsap-card p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                    activeStep === index 
                                        ? 'bg-slate-900 border-cyan-500/60 shadow-[0_0_25px_rgba(14,165,233,0.15)]' 
                                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                                            activeStep === index ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            0{index + 1}
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-400">Step {index + 1}</span>
                                    </div>
                                    <h3 className="text-lg font-space font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">{step.desc}</p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-cyan-400 font-mono">
                                    {step.detail}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. SECTION: SERVICES PROVIDED */}
                <section className="space-y-8">
                    <div className="border-b border-slate-800 pb-4">
                        <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                            Services Provided
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-space font-bold text-white mt-1">
                            Enterprise Capabilities & Modules
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            {
                                icon: Receipt,
                                title: "Autonomous Expense Reimbursement",
                                desc: "A simple portal for team members to drag and drop receipts, preview extracted data, and receive instant reimbursement straight to their wallet without manual claims."
                            },
                            {
                                icon: Building2,
                                title: "Treasury & Vault Control",
                                desc: "Unified dashboard for finance managers to set spending limits, review high-value claims, fund liquid reserves, and issue direct contractor payments."
                            },
                            {
                                icon: Layers,
                                title: "AI Thought Studio & Audit Trail",
                                desc: "Full visibility into every AI decision. Controllers can inspect how models read the receipt, which policies were checked, and why a claim was approved or flagged."
                            },
                            {
                                icon: FileSpreadsheet,
                                title: "On-Chain Ledger & CSV Export",
                                desc: "Every transaction is permanently recorded with transaction hashes and vendor metadata. One-click CSV export ready for QuickBooks, Xero, and corporate tax accounting."
                            }
                        ].map((srv, i) => {
                            const Icon = srv.icon;
                            return (
                                <div
                                    key={i}
                                    onMouseMove={handleCardMouseMove}
                                    onMouseLeave={handleCardMouseLeave}
                                    className="gsap-card p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group cursor-pointer"
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <div>
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center mb-4 group-hover:bg-cyan-500/10 transition-colors">
                                            <Icon size={20} />
                                        </div>
                                        <h3 className="text-lg font-space font-semibold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                                            {srv.title}
                                        </h3>
                                        <p className="text-xs text-slate-400 leading-relaxed font-light">
                                            {srv.desc}
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-cyan-400 transition-colors">
                                        <span>Learn more</span>
                                        <ArrowUpRight size={14} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* 5. CALL TO ACTION */}
                <section className="p-8 sm:p-12 rounded-3xl bg-slate-900/70 border border-slate-800 text-center flex flex-col items-center justify-center space-y-5">
                    <h3 className="text-2xl sm:text-4xl font-space font-bold text-white">
                        Automate Your Corporate Treasury Today
                    </h3>
                    <p className="text-sm text-slate-400 max-w-lg leading-relaxed font-light">
                        Deploy Folio Pay in a simulated environment or connect your corporate wallet to experience autonomous instant settlements.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                            onClick={() => { handleClose(); onLaunchApp(); }}
                            className="bg-folio-brand hover:bg-white text-folio-bg font-space font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg cursor-pointer flex items-center gap-2"
                        >
                            Launch App
                            <ArrowUpRight size={14} />
                        </button>
                        <button
                            onClick={() => { handleClose(); onOpenDocs(); }}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-space text-xs px-5 py-3 rounded-xl transition-all cursor-pointer"
                        >
                            View Docs
                        </button>
                    </div>
                </section>

                {/* CLEAN FOOTER */}
                <footer className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-4">
                    <span>Folio Pay Autonomous Treasury</span>
                    <button 
                        onClick={handleClose} 
                        className="hover:text-white transition-colors cursor-pointer"
                    >
                        Close & Return to Home
                    </button>
                </footer>

            </main>
        </div>
    );
}

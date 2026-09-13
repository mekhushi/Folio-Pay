
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
    ArrowUpRight, BookOpen, Info, Shield, Zap, CheckCircle2, 
    Building2, Cpu, FileSpreadsheet, ArrowRight, Layers, Receipt, Sparkles, Check, X
} from 'lucide-react';
import MuseumSection from './MuseumSection';
import AboutUsPage from './AboutUsPage';
import { useSmoothScroll } from '../hooks/useSmoothScroll';

gsap.registerPlugin(ScrollTrigger);

export default function LandingPage({ onEnter }) {
    useSmoothScroll();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [startRain, setStartRain] = useState(false);
    const [sweepNow, setSweepNow] = useState(false);
    const [startShove, setStartShove] = useState(false);
    const containerRef = useRef(null);
    const rainStartedRef = useRef(false);
    const shoveStartedRef = useRef(false);

    // Modals
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [showAboutModal, setShowAboutModal] = useState(false);

    // Lock background scroll and pause Lenis when menu or modals are open
    useEffect(() => {
        if (isMenuOpen || showConnectModal || showDocsModal || showAboutModal) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            window.__lenis?.stop();
        } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            window.__lenis?.start();
        }
        return () => {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
            window.__lenis?.start();
        };
    }, [isMenuOpen, showConnectModal, showDocsModal, showAboutModal]);

    // Handle Escape key to close menu/modals
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsMenuOpen(false);
                setShowConnectModal(false);
                setShowDocsModal(false);
                setShowAboutModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const [connectTab, setConnectTab] = useState('manager'); // 'manager' | 'employee'
    const [wsIdInput, setWsIdInput] = useState('');
    const [privateKeyInput, setPrivateKeyInput] = useState('');
    const [geminiKeyInput, setGeminiKeyInput] = useState('');
    const [employeeNameInput, setEmployeeNameInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        const wsId = wsIdInput.trim();
        if (!wsId) {
            setErrorMsg('Workspace ID is required');
            return;
        }

        setLoading(true);
        try {
            const body = {
                workspace_id: wsId,
                role: connectTab,
                private_key: connectTab === 'manager' ? privateKeyInput.trim() || null : null,
                gemini_key: connectTab === 'manager' ? geminiKeyInput.trim() || null : null
            };

            const res = await fetch("http://localhost:8000/api/auth/login", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.status === 'error') {
                setErrorMsg(data.message || 'Login failed');
            } else {
                onEnter(
                    data.workspace_id,
                    connectTab === 'manager' ? privateKeyInput.trim() : '',
                    data.address,
                    data.mode,
                    data.rules,
                    data.balances,
                    connectTab,
                    connectTab === 'employee' ? employeeNameInput.trim() || 'Employee' : ''
                );
            }
        } catch (err) {
            console.error(err);
            setErrorMsg('Could not connect to backend server. Ensure the backend is running on port 8000.');
        } finally {
            setLoading(false);
        }
    };

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {

            // 1. Massive Horizontal Typography Scroll
            gsap.to(".massive-text", {
                xPercent: -50,
                ease: "none",
                scrollTrigger: {
                    trigger: ".hero-section",
                    start: "top top",
                    end: "bottom top",
                    scrub: 1
                }
            });

            // 2. Parallax Floating Elements
            gsap.utils.toArray('.parallax-item').forEach(item => {
                const speed = item.dataset.speed || 1;
                gsap.to(item, {
                    yPercent: -50 * speed,
                    ease: "none",
                    scrollTrigger: {
                        trigger: item.parentNode,
                        start: "top bottom",
                        end: "bottom top",
                        scrub: true
                    }
                });
            });

            // 3. Stacking Sticky Sections
            const panels = gsap.utils.toArray('.stack-panel');
            panels.forEach((panel, i) => {
                ScrollTrigger.create({
                    trigger: panel,
                    start: "top top",
                    pin: true,
                    pinSpacing: false,
                    end: "bottom top", // Let it unpin when the next panel reaches the top
                });
            });

            // 5. Box/Element Clip Reveals
            gsap.utils.toArray('.box-reveal').forEach(box => {
                gsap.fromTo(box,
                    { clipPath: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)" },
                    {
                        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: box, // trigger based on the element entering viewport
                            start: "top 90%",
                            end: "center 40%",
                            scrub: 1
                        }
                    }
                );
            });

            // 6. Partner Logos Stagger Reveal
            gsap.from('.partner-logo', {
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.12,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: ".integrated-section",
                    start: "top bottom+=100", // Triggers as soon as it starts entering the screen
                    toggleActions: "play none none reverse"
                }
            });

            // 4. Clip Path Reveal (Final CTA)
            ScrollTrigger.create({
                trigger: ".final-cta-section",
                start: "top top",
                pin: true,
                pinSpacing: true, // creates the scroll space naturally
                end: "+=150%", // user scrolls 1.5x screen height to reveal
                animation: gsap.fromTo(".final-cta-inner",
                    { clipPath: "circle(0% at 50% 50%)" },
                    { clipPath: "circle(150% at 50% 50%)", ease: "power2.inOut" }
                ),
                scrub: 1,
                onUpdate: (self) => {
                    // Only start the rain when the user has revealed at least 70% of the blue screen!
                    if (self.progress > 0.7 && !rainStartedRef.current) {
                        rainStartedRef.current = true;
                        setStartRain(true);
                        setTimeout(() => {
                            setSweepNow(true);
                        }, 6200);
                    }
                }
            });

            // 7. Shove Trigger (Panel 2 - Auto Audit)
            ScrollTrigger.create({
                trigger: ".audit-panel",
                start: "top center",
                onEnter: () => {
                    if (!shoveStartedRef.current) {
                        shoveStartedRef.current = true;
                        setStartShove(true);
                    }
                }
            });

            // Refresh ScrollTrigger to recalculate all start/end positions after pins are initialized
            ScrollTrigger.refresh();

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="bg-folio-bg text-white font-outfit overflow-x-hidden selection:bg-folio-accent/30 relative">

            {/* Navigation - Minimalist & Asymmetrical */}
            <div className="fixed top-0 w-full p-8 lg:p-12 flex justify-between items-start z-40 pointer-events-none mix-blend-difference">
                <div className="w-1/3 flex items-center gap-4 pointer-events-auto">
                    <img src="/logo.png" className="w-8 h-8 object-contain transition-transform hover:rotate-12 duration-300 invert brightness-200" alt="Folio Pay Logo" />

                    <h1 className="text-xl font-space font-bold tracking-widest text-white">
                        FOLIO<br /><span className="text-[10px] tracking-[0.3em] font-normal text-white/70 leading-none block -mt-1">PAY</span>
                    </h1>
                </div>

                <div className="w-1/3 flex justify-center pointer-events-none">
                    {/* Center is now empty to maintain the 3-column asymmetrical grid */}
                </div>

                <div className="w-1/3 flex justify-end pointer-events-auto">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-sm font-space font-medium tracking-widest uppercase hover:opacity-70 transition-opacity"
                    >
                        {isMenuOpen ? 'Close [x]' : 'Menu [+]'}
                    </button>
                </div>
            </div>

            {/* HERO SECTION: Off-Axis Typography */}
            <section className="hero-section relative h-[150vh] bg-folio-bg pt-40">
                <div className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden">

                    {/* Asymmetrical Top Content */}
                    <div className="w-full max-w-7xl mx-auto px-12 grid grid-cols-12 gap-8 mb-20 z-10">
                        <div className="col-span-12 md:col-span-7 flex flex-col items-start gap-10">
                            <p className="text-xl md:text-3xl font-light leading-tight text-slate-300">
                                The era of manual treasury management is over. We build autonomous AI agents that settle Web3 payments instantly.
                            </p>
                            <button
                                onClick={() => setShowConnectModal(true)}
                                className="group flex items-center gap-6 bg-folio-brand text-folio-bg pl-8 pr-2 py-2 rounded-full font-space font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_30px_rgba(14,165,233,0.2)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] mt-4"
                            >
                                Get Started
                                <div className="w-12 h-12 bg-folio-bg rounded-full flex items-center justify-center text-folio-brand group-hover:bg-slate-100 transition-colors">
                                    <ArrowUpRight size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Massive Scrolling Text */}
                    <div className="whitespace-nowrap pl-4 md:pl-12 w-full">
                        <h1 className="massive-text text-[25vw] leading-none font-space font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-300 to-slate-800 uppercase inline-block">
                            FOLIO PAY — AUTONOMOUS
                        </h1>
                    </div>

                    {/* Overlapping Absolute Elements: Minimalist Premium Receipt */}
                    <div className="parallax-item absolute top-[35%] right-[8%] lg:right-[15%] w-72 z-20" data-speed="1.5">

                        {/* Background Receipt 2 */}
                        <motion.div
                            initial={{ y: -800, opacity: 0, rotate: -40, x: 80, scale: 0.85 }}
                            animate={{ y: -30, opacity: 0.3, rotate: 12, x: 60, scale: 0.85 }}
                            transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.1 }}
                            className="absolute w-full h-72 border border-slate-800 bg-[#0a0a0c] p-6 shadow-2xl blur-[2px] rounded-sm pointer-events-none"
                        >
                            <div className="h-4 w-1/3 bg-slate-800 rounded mb-6 mx-auto" />
                            <div className="h-2 w-full bg-slate-800 rounded mb-3" />
                            <div className="h-2 w-5/6 bg-slate-800 rounded mb-3" />
                            <div className="h-2 w-full bg-slate-800 rounded mb-10" />
                            <div className="h-8 w-1/2 bg-slate-800 rounded ml-auto" />
                        </motion.div>

                        {/* Background Receipt 1 */}
                        <motion.div
                            initial={{ y: -600, opacity: 0, rotate: 30, x: -60, scale: 0.9 }}
                            animate={{ y: 40, opacity: 0.5, rotate: -18, x: -40, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.3 }}
                            className="absolute w-full h-80 border border-slate-800 bg-[#0a0a0c] p-6 shadow-2xl blur-[1px] rounded-sm pointer-events-none"
                        >
                            <div className="h-4 w-1/2 bg-slate-800 rounded mb-6 mx-auto" />
                            <div className="h-2 w-full bg-slate-800 rounded mb-3" />
                            <div className="h-2 w-3/4 bg-slate-800 rounded mb-3" />
                            <div className="h-2 w-full bg-slate-800 rounded mb-10" />
                            <div className="h-8 w-1/2 bg-slate-800 rounded ml-auto" />
                        </motion.div>

                        {/* Main Receipt */}
                        <motion.div
                            initial={{ y: -900, opacity: 0, rotate: 45, scale: 1.5 }}
                            animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 150,
                                damping: 12,
                                mass: 1.5,
                                delay: 0.6
                            }}
                            className="w-full relative border border-slate-800 bg-[#0a0a0c] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.7)]"
                        >
                            {/* Glassmorphic Scotch Tape */}
                            <motion.div
                                initial={{ y: -40, opacity: 0, rotate: -15, scale: 1.3 }}
                                animate={{ y: 0, opacity: 1, rotate: -4, scale: 1 }}
                                transition={{ delay: 1.1, type: "spring", stiffness: 200, damping: 15 }}
                                className="absolute -top-5 left-1/2 -translate-x-1/2 w-28 h-7 bg-white/10 backdrop-blur-[6px] border border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.3)] z-30 pointer-events-none"
                                style={{
                                    boxShadow: 'inset 0 0 12px rgba(255,255,255,0.08)'
                                }}
                            />

                            {/* Receipt Header */}
                            <div className="flex flex-col items-center mb-6 border-b border-slate-800 pb-4">
                                <div className="w-8 h-8 rounded-full border border-folio-brand flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                                    <div className="w-3 h-3 bg-folio-brand rounded-full" />
                                </div>
                                <span className="font-space font-bold tracking-widest text-white">FOLIO_PAY</span>
                                <span className="font-mono text-[10px] text-slate-500 mt-1">TX_REC_0x99A</span>

                                {/* CSS Barcode */}
                                <div className="flex gap-[2px] mt-3 opacity-60">
                                    {[1, 3, 1, 2, 1, 4, 1, 1, 2, 1, 3, 1].map((w, i) => (
                                        <div key={i} className="h-6 bg-slate-500" style={{ width: `${w * 2}px` }} />
                                    ))}
                                </div>
                            </div>

                            {/* Receipt Items (Staggered Animation) */}
                            <div className="font-mono text-xs text-slate-400 space-y-3 mb-6">
                                {[
                                    { name: 'Vercel Pro', price: '$20.00' },
                                    { name: 'GitHub Copilot', price: '$10.00' },
                                    { name: 'Network Fee', price: '$0.02', dim: true }
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.0 + (i * 0.2), duration: 0.5 }}
                                        className={`flex justify-between ${item.dim ? 'text-slate-600' : ''}`}
                                    >
                                        <span>{item.name}</span><span>{item.price}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Receipt Total */}
                            <div className="border-t border-dashed border-slate-700 pt-4 flex justify-between items-end relative">
                                <span className="font-mono text-xs text-slate-500 uppercase">Total Settled</span>
                                <span className="font-space font-bold text-2xl text-white">$30.02</span>

                                {/* Verified Stamp */}
                                <motion.div
                                    initial={{ scale: 5, opacity: 0, rotate: 15, y: -50 }}
                                    animate={{ scale: 1, opacity: 1, rotate: -10, y: 0 }}
                                    transition={{
                                        delay: 2.0,
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 15,
                                        mass: 1.5
                                    }}
                                    className="absolute -top-6 left-2 border-2 border-emerald-500 text-emerald-500 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest bg-[#0a0a0c]/80 backdrop-blur-sm shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                >
                                    Verified
                                </motion.div>
                            </div>

                            {/* Jagged Bottom Edge (CSS trick) */}
                            <div className="absolute -bottom-2 left-0 w-full h-4 bg-[radial-gradient(circle,transparent,transparent_50%,#0a0a0c_50%,#0a0a0c_100%)] bg-[length:10px_10px] bg-bottom" style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }} />

                            {/* Subtle floating animation wrapper */}
                            <motion.div
                                animate={{ y: [-5, 5, -5] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                className="absolute inset-0 border border-folio-brand/20 pointer-events-none"
                            />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* STACKING SECTIONS: Breaking the grid */}
            <div className="relative z-10">

                {/* Panel 1 */}
                <section className="stack-panel h-screen w-full bg-[#0a0a0c] flex items-center border-t border-slate-900">
                    <div className="max-w-7xl w-full mx-auto px-12 grid grid-cols-12">
                        <div className="col-span-12 md:col-span-6 flex flex-col justify-center h-full">
                            <span className="text-folio-brand font-mono text-sm tracking-widest uppercase mb-6 block">01 — Input</span>
                            <h2 className="text-6xl md:text-8xl font-space font-bold tracking-tighter mb-8 leading-[0.9]">
                                Drop any <br /> document.
                            </h2>
                            <p className="text-xl text-slate-400 font-light max-w-md">No templates required. Our AI parses unstructured receipts, invoices, and Slack messages instantly.</p>
                        </div>
                        {/* Abstract Parallax Art (Filled & High Fidelity) */}
                        <div className="col-span-12 md:col-span-6 relative h-full hidden md:block">
                            {/* Box 1: Unstructured Document (Invoice) */}
                            <div className="box-reveal parallax-item absolute top-1/4 left-0 w-64 bg-[#0a0a0c] rounded-2xl border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden p-1 z-10" data-speed="0.8">
                                <div className="bg-[#111115] w-full h-full rounded-xl p-5 relative overflow-hidden border border-slate-800/50">
                                    {/* subtle grid background */}
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px]" />

                                    <div className="flex justify-between items-center mb-6 relative z-10 border-b border-slate-800 pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 shadow-inner">
                                                <span className="text-[9px] font-space font-bold text-white tracking-wider">PDF</span>
                                            </div>
                                            <div>
                                                <p className="font-mono text-[11px] text-slate-300 font-medium">invoice_uber.pdf</p>
                                                <p className="font-mono text-[9px] text-slate-500">45.2 KB • Encrypted</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* High-Fidelity Skeleton */}
                                    <div className="space-y-4 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800/80" />
                                            <div className="space-y-2 flex-1">
                                                <div className="w-full h-2.5 bg-slate-800 rounded" />
                                                <div className="w-2/3 h-2.5 bg-slate-800 rounded" />
                                            </div>
                                        </div>
                                        <div className="w-full h-px bg-slate-800/50 my-2" />
                                        <div className="space-y-2">
                                            <div className="flex justify-between"><div className="w-1/3 h-2 bg-slate-800 rounded" /><div className="w-1/4 h-2 bg-slate-700 rounded" /></div>
                                            <div className="flex justify-between"><div className="w-1/2 h-2 bg-slate-800 rounded" /><div className="w-1/5 h-2 bg-slate-700 rounded" /></div>
                                            <div className="flex justify-between"><div className="w-1/4 h-2 bg-slate-800 rounded" /><div className="w-1/3 h-2 bg-slate-700 rounded" /></div>
                                        </div>
                                    </div>

                                    {/* Premium Scanning Line */}
                                    <motion.div
                                        animate={{ y: [-20, 200, -20] }}
                                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                        className="absolute left-0 top-0 w-full z-20 pointer-events-none"
                                    >
                                        <div className="w-full h-[2px] bg-folio-brand shadow-[0_0_15px_#0ea5e9,0_0_5px_#ffffff]" />
                                        <div className="w-full h-16 bg-gradient-to-b from-folio-brand/20 to-transparent" />
                                    </motion.div>
                                </div>
                            </div>

                            {/* Box 2: Structured JSON Data */}
                            <div className="box-reveal parallax-item absolute top-[40%] right-0 w-[340px] bg-[#050505] rounded-2xl border border-slate-800 shadow-[0_30px_60px_rgba(0,0,0,0.7)] backdrop-blur-3xl z-20 overflow-hidden" data-speed="1.3">
                                {/* IDE Header */}
                                <div className="bg-[#111115] border-b border-slate-800 px-4 py-2.5 flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-500/20" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-500/20" />
                                    </div>
                                    <div className="flex-1 flex justify-center">
                                        <span className="font-mono text-[10px] text-slate-400 bg-slate-800/50 px-3 py-1 rounded-md border border-slate-700/50">parsed_output.json</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                    </div>
                                </div>

                                {/* IDE Content */}
                                <div className="p-6 font-mono text-xs leading-[1.7]">
                                    <div className="text-slate-500">
                                        <span className="text-slate-400">{'{'}</span><br />
                                        <div className="pl-4 border-l border-slate-800/50 ml-1 mt-1 mb-1">
                                            <span className="text-folio-brand">"id"</span>: <span className="text-amber-300">"tx_78291a"</span>,<br />
                                            <span className="text-folio-brand">"vendor"</span>: <span className="text-emerald-300">"Uber Technologies"</span>,<br />
                                            <span className="text-folio-brand">"amount_usd"</span>: <span className="text-purple-400">45.50</span>,<br />
                                            <span className="text-folio-brand">"category"</span>: <span className="text-emerald-300">"Travel"</span>,<br />
                                            <span className="text-folio-brand">"confidence_score"</span>: <span className="text-purple-400">0.998</span>,<br />
                                            <span className="text-folio-brand">"wallet_match"</span>: <span className="text-blue-400">true</span><br />
                                        </div>
                                        <span className="text-slate-400">{'}'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Panel 2 */}
                <section className="stack-panel audit-panel h-screen w-full bg-[#111115] flex items-center border-t border-slate-800">
                    <div className="max-w-7xl w-full mx-auto px-12 grid grid-cols-12">
                        {/* Swapped order for asymmetry */}
                        <div className="col-span-12 md:col-span-6 relative h-full hidden md:block">
                            <div className="parallax-item absolute top-1/4 right-20 w-[400px] h-[500px] bg-slate-950 rounded-full blur-[100px] opacity-50 pointer-events-none" data-speed="0.5"></div>

                            {/* High-Fidelity Audit Log Window */}
                            <div className="box-reveal parallax-item absolute top-1/3 left-0 w-96 bg-[#0a0a0c] border border-slate-800 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.6)] z-10 overflow-hidden" data-speed="1.4">
                                {/* Window Header */}
                                <div className="bg-[#111115] border-b border-slate-800 px-4 py-3 flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                                    </div>
                                    <span className="font-mono text-[10px] text-slate-500">folio-agent-core / run.sh</span>
                                    <div className="w-4" /> {/* Spacer */}
                                </div>

                                {/* Log Content */}
                                <div className="p-5 font-mono text-[11px] leading-relaxed">
                                    <div className="flex gap-4 mb-2">
                                        <span className="text-slate-600 select-none">12:00:01</span>
                                        <span className="text-folio-brand">[SYSTEM]</span>
                                        <span className="text-slate-300">Agent initialized. Loading context...</span>
                                    </div>
                                    <div className="flex gap-4 mb-2">
                                        <span className="text-slate-600 select-none">12:00:02</span>
                                        <span className="text-purple-400">[VISION]</span>
                                        <span className="text-slate-300">Parsed 4 items from receipt_09.pdf</span>
                                    </div>
                                    <div className="flex gap-4 mb-2 opacity-60">
                                        <span className="text-slate-600 select-none">12:00:03</span>
                                        <span className="text-slate-500">[SEARCH]</span>
                                        <span className="text-slate-400">Verifying merchant 'Stripe Inc' on web...</span>
                                    </div>
                                    <div className="flex gap-4 mb-2">
                                        <span className="text-slate-600 select-none">12:00:04</span>
                                        <span className="text-emerald-400">[POLICY]</span>
                                        <span className="text-slate-300">Merchant verified. Category: Software.</span>
                                    </div>
                                    <div className="flex gap-4 mb-4">
                                        <span className="text-slate-600 select-none">12:00:05</span>
                                        <span className="text-emerald-400">[POLICY]</span>
                                        <span className="text-slate-300">Budget check passed ($50.00 &lt; $500 limit).</span>
                                    </div>

                                    <div className="border-t border-dashed border-slate-800 pt-4 flex gap-4">
                                        <span className="text-slate-600 select-none">12:00:06</span>
                                        <span className="text-folio-accent bg-folio-accent/10 px-1 rounded">[ACTION]</span>
                                        <span className="text-white font-medium">Status: APPROVED. Ready for settlement.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Shoving Animation Card (Overlaps terminal on bottom-right with 3D Parallax offset) */}
                            <div className="box-reveal parallax-item absolute top-[45%] left-[210px] w-[350px] h-[210px] bg-[#0a0a0c]/90 backdrop-blur-md border border-slate-800 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.7)] z-20 p-4 flex flex-col justify-between overflow-hidden" data-speed="1.2">
                                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                                    <span className="font-mono text-[9px] text-[#0ea5e9] tracking-wider font-extrabold">PIPELINE EXECUTION</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="font-mono text-[8px] text-slate-500">AUTO-AUDIT</span>
                                    </div>
                                </div>

                                {/* Track Container (Absolute sandbox for characters - fixed width and height to prevent collapse) */}
                                <div className="relative w-full h-36 bg-slate-950/70 rounded-lg mt-3 border border-slate-900 overflow-hidden flex items-center">
                                    {/* Flow line representing pipeline */}
                                    <div className="absolute inset-x-0 h-[1px] bg-slate-800/60 top-1/2 left-0" />

                                    {/* AI Robot (Glowing Cyan Hover Mech - Absolute positioned at left: 20px) */}
                                    <motion.div
                                        animate={startShove ? {
                                            x: ["0px", "-15px", "125px"],
                                            y: ["0px", "-6px", "0px"],
                                            rotate: [0, -12, 10]
                                        } : {
                                            x: "0px",
                                            y: "0px",
                                            rotate: 0
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            times: [0, 0.4, 1],
                                            ease: "easeInOut"
                                        }}
                                        style={{ willChange: "transform" }}
                                        className="absolute left-[20px] z-10 flex items-center justify-center select-none w-14 h-24 mt-2"
                                    >
                                        <svg viewBox="0 0 50 80" className="w-full h-full text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                                            {/* Hover Base/Jets */}
                                            <ellipse cx="25" cy="74" rx="8" ry="2.5" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-pulse" />
                                            <path d="M19 62 L25 71 L31 62 Z" fill="currentColor" opacity="0.8" />

                                            {/* Torso/Chassis */}
                                            <rect x="14" y="28" width="22" height="26" rx="5" fill="currentColor" />
                                            {/* Glowing core reactor */}
                                            <circle cx="25" cy="41" r="4.5" fill="#22d3ee" className="animate-ping" />
                                            <circle cx="25" cy="41" r="3" fill="#ffffff" />

                                            {/* Shoving Mech Arm (extended forward!) */}
                                            <path d="M26 35 L48 35 L48 42" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                                            {/* Left Arm */}
                                            <path d="M14 35 L6 38 L4 44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />

                                            {/* Robot Head */}
                                            <rect x="16" y="12" width="18" height="13" rx="3.5" fill="currentColor" />
                                            {/* Glowing cyan visor */}
                                            <rect x="19" y="15" width="12" height="3.5" rx="0.8" fill="#22d3ee" />
                                            {/* Antenna */}
                                            <line x1="25" y1="12" x2="25" y2="6" stroke="currentColor" strokeWidth="1.5" />
                                            <circle cx="25" cy="5" r="1.5" fill="#22d3ee" />
                                        </svg>
                                    </motion.div>

                                    {/* Human character (Highly Visible Bright Slate Stick Figure - Absolute positioned at left: 200px) */}
                                    <motion.div
                                        animate={startShove ? {
                                            x: ["0px", "0px", "160px"],
                                            y: ["0px", "0px", "-45px", "120px"],
                                            opacity: [1, 1, 0.5, 0],
                                            rotate: [0, 0, 180, 360],
                                            scale: [1, 1, 0.7, 0]
                                        } : {
                                            x: "0px",
                                            y: "0px",
                                            opacity: 1,
                                            rotate: 0,
                                            scale: 1
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            times: [0, 0.4, 0.6, 1],
                                            ease: "easeInOut"
                                        }}
                                        style={{ willChange: "transform, opacity" }}
                                        className="absolute left-[200px] z-10 flex flex-col items-center justify-center select-none w-12 h-24 mt-2"
                                    >
                                        <svg viewBox="0 0 45 80" className="w-full h-full text-slate-200 drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)]">
                                            {/* Head */}
                                            <circle cx="22.5" cy="14" r="7" fill="currentColor" />
                                            {/* Torso */}
                                            <line x1="22.5" y1="21" x2="22.5" y2="48" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                                            {/* Scared/Defending Arms raised in panic */}
                                            <path d="M11 27 C15 23, 18 25, 22.5 23 C27 25, 30 23, 34 27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                                            {/* Standing Legs */}
                                            <line x1="22.5" y1="48" x2="16.5" y2="73" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                            <line x1="22.5" y1="48" x2="28.5" y2="73" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                        <span className="text-[8px] text-slate-300 font-extrabold tracking-widest mt-1">HUMAN</span>
                                    </motion.div>

                                    {/* Stablecoin (Glowing Gold Coin) being cleared - Absolute positioned */}
                                    <motion.div
                                        animate={startShove ? {
                                            x: ["0px", "0px", "145px"],
                                            opacity: [1, 1, 0]
                                        } : {
                                            x: "0px",
                                            opacity: 1
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            times: [0, 0.4, 0.8],
                                            ease: "easeInOut"
                                        }}
                                        style={{ willChange: "transform, opacity" }}
                                        className="absolute left-[180px] top-[24px] w-6 h-6 rounded-full bg-amber-500 border border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)] z-20 flex items-center justify-center text-white font-extrabold text-[10px] select-none"
                                    >
                                        $
                                    </motion.div>

                                    {/* PUSH/SHOVE text pops up on impact! - Absolute positioned */}
                                    <motion.div
                                        animate={startShove ? {
                                            scale: [0, 0, 1.4, 0],
                                            opacity: [0, 0, 1, 0],
                                            y: [10, 10, -25, -25]
                                        } : {
                                            scale: 0,
                                            opacity: 0,
                                            y: 10
                                        }}
                                        transition={{
                                            duration: 1.5,
                                            times: [0, 0.4, 0.45, 1],
                                            ease: "easeInOut"
                                        }}
                                        style={{ willChange: "transform, opacity" }}
                                        className="absolute left-[140px] top-[15px] font-black text-amber-500 tracking-widest text-[9px] bg-slate-900 border border-amber-500/40 px-2 py-0.5 rounded shadow-lg z-30 select-none"
                                    >
                                        SHOVE!
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-12 md:col-span-6 flex flex-col justify-center h-full items-end text-right">
                            <span className="text-folio-brand font-mono text-sm tracking-widest uppercase mb-6 block">02 — Audit</span>
                            <h2 className="text-6xl md:text-8xl font-space font-bold tracking-tighter mb-8 leading-[0.9]">
                                Zero human <br /> validation.
                            </h2>
                            <p className="text-xl text-slate-400 font-light max-w-md">Agents perform zero-knowledge audits, verifying vendors against the web and checking corporate budgets dynamically.</p>
                        </div>
                    </div>
                </section>

                {/* Panel 3 */}
                <section className="stack-panel h-screen w-full bg-[#d4d4d8] flex items-center text-[#09090b] border-t border-slate-300">
                    <div className="max-w-7xl w-full mx-auto px-12 grid grid-cols-12 relative">
                        <div className="col-span-12 md:col-span-7 flex flex-col justify-center h-full z-10">
                            <span className="text-slate-500 font-mono text-sm tracking-widest uppercase mb-6 block">03 — Settle</span>
                            <h2 className="text-6xl md:text-8xl font-space font-black tracking-tighter mb-8 leading-[0.9] text-[#09090b]">
                                Instant Web3 <br /> Payouts.
                            </h2>
                            <p className="text-2xl text-slate-600 font-medium max-w-xl">Approved claims trigger immediate stablecoin execution on Base Sepolia. Sub-second latency. Gasless abstraction.</p>
                        </div>
                        {/* Visual for the right side (High Fidelity Premium Token) */}
                        <div className="col-span-12 md:col-span-5 hidden md:flex items-center justify-center relative">
                            {/* Soft ambient glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.6)_0%,_transparent_60%)]" />

                            {/* Premium 3D-like Token */}
                            <motion.div
                                animate={{ y: [-10, 10, -10], rotateY: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                                className="box-reveal relative w-72 h-72 flex items-center justify-center"
                            >
                                {/* Outer sleek ring */}
                                <div className="absolute inset-0 rounded-full border-[1.5px] border-[#09090b]/10 shadow-[inset_0_0_30px_rgba(0,0,0,0.05)]" />
                                <div className="absolute inset-4 rounded-full border-[1.5px] border-[#09090b]/5" />

                                {/* Inner heavy token */}
                                <div className="w-40 h-40 bg-[#09090b] rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,transparent_50%)]" />
                                    <span className="font-space font-black text-6xl text-white tracking-tighter relative z-10">USDC</span>
                                </div>

                                {/* Orbiting accent */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                    className="absolute inset-0"
                                >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-folio-brand rounded-full shadow-[0_0_15px_#0ea5e9]" />
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </section>
                {/* Supported Coins Marquee */}
                <section className="relative w-full bg-[#050505] py-32 border-t border-slate-900 overflow-hidden flex flex-col items-center">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.03)_0%,transparent_70%)] pointer-events-none" />
                    <h3 className="text-3xl md:text-4xl font-space font-medium text-slate-300 mb-16 tracking-wide relative z-10">
                        Supported Coins
                    </h3>

                    {/* Marquee Track */}
                    <div className="w-full flex overflow-hidden relative max-w-[100vw]">
                        {/* Fade edges */}
                        <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-[#050505] to-transparent z-20" />
                        <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-[#050505] to-transparent z-20" />

                        <div className="flex w-max animate-marquee gap-6 px-3 hover:pause">
                            {/* Duplicate the array twice to ensure seamless infinite scroll */}
                            {[...Array(2)].map((_, arrayIndex) => (
                                <React.Fragment key={arrayIndex}>
                                    {[
                                        { name: 'ZCHF', bg: 'bg-[#333b4d]', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-slate-300"><path d="M14 6l-4 8H7l5-10 2 2zM4 14l3-6 4 8H2l2-2zM16 10l5 10h-7l-2-4 4-6z" /></svg> },
                                        { name: 'TGBP', bg: 'bg-[#0f172a]', icon: <span className="text-2xl font-serif text-[#3b82f6] font-bold">£</span> },
                                        { name: 'IDRX', bg: 'bg-[#2563eb]', icon: <span className="text-2xl font-black text-white">X</span> },
                                        { name: 'USDC', bg: 'bg-[#3b82f6]', icon: <span className="text-2xl font-bold text-white">$</span> },
                                        { name: 'USDT', bg: 'bg-[#10b981]', icon: <span className="text-2xl font-bold text-white">₮</span> },
                                        { name: 'USDS', bg: 'bg-[#f59e0b]', icon: <span className="text-2xl font-bold text-white">S</span> },
                                        { name: 'EURC', bg: 'bg-[#2563eb]', icon: <span className="text-2xl font-bold text-white">€</span> },
                                        { name: 'CADC', bg: 'bg-transparent border-2 border-[#ef4444]', icon: <span className="text-lg font-bold text-[#ef4444]">CAD</span> }
                                    ].map((coin, i) => (
                                        <div key={`${arrayIndex}-${i}`} className="w-40 h-40 bg-[#0a0a0c] border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-slate-600 transition-colors shadow-lg shrink-0">
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shadow-inner ${coin.bg}`}>
                                                {coin.icon}
                                            </div>
                                            <span className="font-mono text-sm text-slate-400 tracking-widest">{coin.name}</span>
                                        </div>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Integrated With Section */}
                <section className="integrated-section relative w-full bg-[#050505] pb-32 pt-10 flex flex-col items-center z-10">
                    <h3 className="text-2xl md:text-4xl font-space font-light text-slate-300 mb-20 tracking-wider">
                        Integrated <span className="text-[#0ea5e9]">with</span>
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-16 md:gap-x-32 gap-y-20 max-w-5xl mx-auto px-8 opacity-80">
                        {[
                            { name: 'Etherlink', fallback: 'Etherlink' },
                            { name: 'Pimlico', fallback: 'PIMLICO' },
                            { name: 'Base', fallback: 'Base' },
                            { name: 'IDRX API', fallback: '(X)' },
                            { name: 'QRIS', fallback: 'QRIS' },
                            { name: 'Privy', fallback: 'Privy' }
                        ].map((partner, i) => (
                            <div key={i} className="partner-logo flex flex-col items-center gap-6 group cursor-default">
                                <div className="h-12 flex items-center justify-center grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                                    <img
                                        src={`/partners/${partner.name.toLowerCase().replace(' ', '-')}.png`}
                                        alt={`${partner.name} logo`}
                                        className="max-h-full max-w-[120px] object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div className="hidden items-center justify-center font-space font-bold tracking-widest text-xl text-slate-200" style={{ display: 'none' }}>
                                        {partner.fallback}
                                    </div>
                                </div>
                                <span className="font-outfit text-sm text-slate-500 group-hover:text-slate-300 transition-colors">
                                    {partner.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Injected Horizontal Museum Section */}
                <MuseumSection />

                {/* Final CTA with Clip Path Reveal */}
                <section className="final-cta-section relative h-screen w-full bg-[#050505] border-t border-slate-900 overflow-hidden z-20">
                    {/* Default Dark State */}
                    <div className="absolute inset-0 flex items-center justify-center flex-col text-center z-0">
                        <span className="text-slate-700 font-mono text-sm tracking-widest uppercase mb-6 block">End of line</span>
                        <h2 className="text-5xl md:text-8xl font-space font-black tracking-tighter mb-8 text-slate-800">
                            Initiate Sequence.
                        </h2>
                    </div>

                    {/* Deep Blue Reveal State */}
                    <div
                        className="final-cta-inner absolute inset-0 bg-[#0369a1] flex flex-col items-center justify-center text-white z-10"
                        style={{ clipPath: 'circle(0% at 50% 50%)' }}
                    >
                        {/* Falling & Crumpling Receipts Confetti Background */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                            {startRain && Array.from({ length: 22 }).map((_, i) => {
                                const left = `${(i * 4.5) % 90 + 5}%`;
                                const delay = i * 0.22;
                                const duration = 2.5 + (i % 4) * 0.7; // 2.5s to 5.3s fall time
                                const rotateStart = (i * 60) % 360;
                                const rotateEnd = rotateStart + 360 + (i * 45) % 180;
                                const scale = 0.45 + (i % 3) * 0.12;

                                return (
                                    <motion.div
                                        key={i}
                                        initial={{
                                            y: -250,
                                            x: 0,
                                            opacity: 0,
                                            rotate: rotateStart,
                                            scale: scale,
                                            borderRadius: "2px",
                                            width: "135px",
                                            height: "200px",
                                            backgroundColor: "#f8fafc"
                                        }}
                                        animate={sweepNow ? {
                                            // Realistic Parabolic Hop-and-Drop: gets swept up slightly (66vh) and falls back down (94vh) off-screen!
                                            x: ["0px", "45vw", "95vw"],
                                            y: ["88vh", "66vh", "94vh"],
                                            scale: [scale, scale * 1.05, scale * 0.75], // pops up slightly, then lands/shrinks
                                            rotate: [rotateEnd, rotateEnd + 45, rotateEnd + 90 + (i * 15) % 45], // gentle flutter rotation
                                            opacity: [0.95, 0.95, 0]
                                        } : (startRain ? {
                                            // Realistic bounce & drop on ground
                                            y: ["-250px", "60vh", "88vh", "85vh", "88vh"],
                                            x: [0, (i % 2 === 0 ? 30 : -30), (i % 2 === 0 ? 60 : -60), (i % 2 === 0 ? 80 : -80), (i % 2 === 0 ? 95 : -95)], // exactly 5 keyframes matched!
                                            opacity: [0, 0.95, 0.95, 0.95, 0.95], // Piles up clearly on the floor

                                            // Flat paper drop (stays clean, rectangular, and bright off-white)
                                            scale: [scale, scale, scale, scale, scale],
                                            borderRadius: ["2px", "2px", "2px", "2px", "2px"],
                                            rotate: [rotateStart, rotateEnd - 20, rotateEnd, rotateEnd + 5, rotateEnd],
                                            backgroundColor: ["#f8fafc", "#f8fafc", "#f8fafc", "#f8fafc", "#f8fafc"]
                                        } : {})}
                                        transition={sweepNow ? {
                                            // Staggered exit delay matches the broom path exactly as it moves left-to-right!
                                            delay: (parseFloat(left) / 100) * 1.6,
                                            duration: 1.2, // slightly longer for graceful soaring
                                            ease: "easeOut"
                                        } : {
                                            duration: duration,
                                            delay: delay,
                                            ease: "easeOut"
                                        }}
                                        className="absolute border border-slate-200 shadow-2xl flex flex-col gap-1.5 p-3 text-slate-800 text-left font-mono select-none overflow-hidden"
                                        style={{ left: left, willChange: "transform, opacity, border-radius, background-color" }}
                                    >
                                        {/* Jagged Receipt Border simulation at top/bottom */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent" />

                                        {/* Receipt Content Header */}
                                        <div className="flex justify-between items-center border-b border-dashed border-slate-300 pb-1.5 text-[9px] font-black">
                                            <span>FOLIO PAY</span>
                                            <span className="text-[7px] text-slate-400 font-bold">#0x99A</span>
                                        </div>

                                        {/* Receipt Body Items */}
                                        <div className="flex flex-col gap-1 text-[8px] font-bold text-slate-500 mt-1">
                                            <div className="flex justify-between">
                                                <span>GAS FEE</span>
                                                <span className="text-slate-800">$0.02</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>SETTLED</span>
                                                <span className="text-slate-800">$30.02</span>
                                            </div>
                                        </div>

                                        {/* Barcode & Total Block */}
                                        <div className="border-t border-dashed border-slate-300 pt-1.5 mt-auto flex flex-col gap-1.5">
                                            {/* Barcode representation */}
                                            <div className="flex items-center justify-between h-4 pr-1 pl-1 bg-white border border-slate-100">
                                                <div className="w-1 h-full bg-slate-900" />
                                                <div className="w-0.5 h-full bg-slate-900" />
                                                <div className="w-1.5 h-full bg-slate-900" />
                                                <div className="w-0.5 h-full bg-slate-900" />
                                                <div className="w-2 h-full bg-slate-900" />
                                                <div className="w-0.5 h-full bg-slate-900" />
                                                <div className="w-1 h-full bg-slate-900" />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* The Cybernetic Laser Sweeper (High-End Color-Matched Broom) */}
                            {sweepNow && (
                                <motion.div
                                    initial={{ x: "-200px", y: "70vh", rotate: -25 }}
                                    animate={{
                                        x: ["-200px", "110vw"],
                                        rotate: [-25, -15, -35, -15, -35, -15, -35, -25] // sweeping wiggles!
                                    }}
                                    transition={{
                                        duration: 2.5,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute z-20 pointer-events-none text-slate-300"
                                    style={{ willChange: "transform, rotate" }}
                                >
                                    <div className="flex flex-col items-center origin-bottom">
                                        {/* Carbon Fiber Handle with Cyan Glow Line */}
                                        <div className="w-1.5 h-48 bg-gradient-to-b from-slate-700 to-slate-900 rounded-full border border-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)] relative">
                                            <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 w-[1px] bg-cyan-400/60 shadow-[0_0_4px_#22d3ee]" />
                                        </div>

                                        {/* Futuristic Sweeper Head matching the premium design */}
                                        <div className="w-28 h-12 bg-slate-950/90 backdrop-blur-md rounded-t-xl border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.5)] relative -mt-1 flex flex-col justify-between p-1.5 overflow-hidden">
                                            <div className="w-full h-0.5 bg-cyan-400 shadow-[0_0_5px_#22d3ee]" />

                                            {/* Cyber laser sweeping bristles */}
                                            <div className="flex justify-around items-end h-6 pr-1 pl-1">
                                                <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                                <div className="w-0.5 h-full bg-cyan-400/70 shadow-[0_0_6px_#22d3ee]" />
                                                <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                                <div className="w-0.5 h-full bg-cyan-400/70 shadow-[0_0_6px_#22d3ee]" />
                                                <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                                <div className="w-0.5 h-full bg-cyan-400/70 shadow-[0_0_6px_#22d3ee]" />
                                                <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                                            </div>
                                        </div>

                                        {/* Sweeping cyan trails trailing behind */}
                                        <div className="absolute top-full w-28 h-2 flex flex-col gap-1 items-end pr-4 opacity-80 mt-1">
                                            <div className="w-16 h-0.5 bg-cyan-400/40 shadow-[0_0_4px_#22d3ee] rounded" />
                                            <div className="w-10 h-0.5 bg-cyan-400/20 shadow-[0_0_3px_#22d3ee] rounded" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="text-center max-w-4xl px-8 flex flex-col items-center relative z-10">
                            <h2 className="text-6xl md:text-9xl font-space font-black tracking-tighter mb-12">
                                Ready to <br />Escalate?
                            </h2>
                            <button
                                onClick={() => setShowConnectModal(true)}
                                className="group flex items-center gap-6 bg-white text-[#0369a1] pl-10 pr-2 py-2 rounded-full font-space font-bold uppercase tracking-widest hover:bg-slate-100 transition-all shadow-2xl"
                            >
                                Deploy Agent
                                <div className="w-14 h-14 bg-[#0369a1] rounded-full flex items-center justify-center text-white group-hover:bg-[#075985] transition-colors shadow-inner">
                                    <ArrowUpRight size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Premium Footer (Revealed at the very bottom) */}
                    <footer className="absolute bottom-0 w-full p-8 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 z-20 pointer-events-auto mix-blend-difference text-white/60">
                        <div className="font-mono text-[10px] tracking-widest text-center sm:text-left">
                            <p>© 2026 FOLIO PAY LTD.</p>
                            <p>ALL SYSTEMS NOMINAL.</p>
                        </div>
                        <div className="flex items-center gap-6 font-mono text-xs tracking-wider">
                            <button onClick={() => setShowAboutModal(true)} className="hover:text-white transition-colors cursor-pointer">About Us</button>
                            <button onClick={() => setShowDocsModal(true)} className="hover:text-white transition-colors cursor-pointer">Documentation</button>
                            <button onClick={() => setShowConnectModal(true)} className="hover:text-white transition-colors cursor-pointer">Launch App</button>
                        </div>
                        <div className="font-mono text-[10px] tracking-widest text-center sm:text-right">
                            <p>DESIGNED FOR AGENTS</p>
                            <p>BASE SEPOLIA NETWORK</p>
                        </div>
                    </footer>
                </section>
            </div>

            {/* Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-[#020202]/95 backdrop-blur-2xl flex flex-col justify-between p-8 lg:p-14"
                        initial={{ opacity: 0, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" }}
                        animate={{ opacity: 1, clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", transition: { duration: 0.45, ease: "easeInOut" } }}
                        exit={{ opacity: 0, clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)", transition: { duration: 0.35, ease: "easeInOut" } }}
                    >
                        {/* Top Bar inside Menu */}
                        <div className="w-full flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <img src="/logo.png" className="w-8 h-8 object-contain invert brightness-200" alt="Folio Pay Logo" />
                                <h1 className="text-xl font-space font-bold tracking-widest text-white">
                                    FOLIO<br /><span className="text-[10px] tracking-[0.3em] font-normal text-white/70 leading-none block -mt-1">PAY</span>
                                </h1>
                            </div>
                            <button 
                                onClick={() => setIsMenuOpen(false)} 
                                className="text-xs font-mono tracking-widest uppercase text-slate-300 hover:text-white transition-all bg-slate-900 border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-full cursor-pointer flex items-center gap-2 shadow-lg"
                            >
                                <span>CLOSE</span> ✕
                            </button>
                        </div>

                        {/* Menu Links */}
                        <div className="flex flex-col gap-6 my-auto max-w-5xl mx-auto w-full">
                            {[
                                { title: 'Launch App', sub: 'Open Workspace & Autonomous Treasury Agent', action: () => { setIsMenuOpen(false); setShowConnectModal(true); } },
                                { title: 'Documentation', sub: 'Architecture, Smart Contracts & AI Audit Workflow', action: () => { setIsMenuOpen(false); setShowDocsModal(true); } },
                                { title: 'About Us', sub: 'Autonomous Corporate Finance & Treasury Infrastructure', action: () => { setIsMenuOpen(false); setShowAboutModal(true); } }
                            ].map((item, i) => (
                                <motion.button
                                    key={item.title}
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1, transition: { delay: 0.15 + (i * 0.08), duration: 0.4 } }}
                                    exit={{ y: -20, opacity: 0 }}
                                    onClick={item.action}
                                    className="text-left group cursor-pointer border-b border-white/5 pb-4 hover:border-folio-brand/30 transition-colors w-full"
                                >
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-4xl md:text-7xl font-space font-black tracking-tighter text-slate-300 group-hover:text-white transition-colors uppercase flex items-center gap-4">
                                            {item.title}
                                            <ArrowUpRight size={32} className="opacity-0 group-hover:opacity-100 text-folio-brand transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1 hidden md:inline-block" />
                                        </span>
                                        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest hidden sm:inline-block">0{i+1}</span>
                                    </div>
                                    <p className="text-xs font-mono text-slate-500 group-hover:text-folio-brand-muted transition-colors mt-1">
                                        {item.sub}
                                    </p>
                                </motion.button>
                            ))}
                        </div>

                        {/* Bottom Footer inside Menu */}
                        <div className="w-full flex justify-between items-center text-slate-500 text-[11px] font-mono border-t border-slate-900 pt-4">
                            <span>AUTONOMOUS TREASURY PROTOCOL</span>
                            <span className="text-folio-brand">BASE SEPOLIA TESTNET</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Connection Modal Overlay */}
            <AnimatePresence>
                {showConnectModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-outfit"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-md bg-[#0a0a0c] border border-slate-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(14,165,233,0.15)] relative p-6 text-zinc-300"
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setShowConnectModal(false)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-sm font-space"
                            >
                                ✕
                            </button>

                            {/* Header */}
                            <div className="flex flex-col items-center mb-6">
                                <img src="/logo.png" className="w-10 h-10 object-contain mb-2 animate-pulse invert brightness-200" alt="Folio Pay Logo" />
                                <h2 className="text-xl font-bold font-space text-white tracking-wider">CONNECT TO WORKSPACE</h2>
                                <p className="text-xs text-slate-500 mt-1">Autonomous Agent Governance Pipeline</p>
                            </div>

                            {/* Tabs */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850 mb-6">
                                <button
                                    type="button"
                                    onClick={() => { setConnectTab('manager'); setErrorMsg(''); }}
                                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${connectTab === 'manager' ? 'bg-folio-brand text-folio-bg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Manager Portal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setConnectTab('employee'); setErrorMsg(''); }}
                                    className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all ${connectTab === 'employee' ? 'bg-folio-brand text-folio-bg' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Employee Hub
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Workspace ID</label>
                                    <input
                                        type="text"
                                        required
                                        value={wsIdInput}
                                        onChange={e => setWsIdInput(e.target.value)}
                                        placeholder="wrk_default"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-folio-brand transition-colors font-mono"
                                    />
                                </div>

                                {connectTab === 'manager' ? (
                                    <>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Treasury Private Key (Optional)</label>
                                            <input
                                                type="password"
                                                value={privateKeyInput}
                                                onChange={e => setPrivateKeyInput(e.target.value)}
                                                placeholder="0x... (leave blank for simulation)"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-folio-brand transition-colors font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Gemini API Key (Optional)</label>
                                            <input
                                                type="password"
                                                value={geminiKeyInput}
                                                onChange={e => setGeminiKeyInput(e.target.value)}
                                                placeholder="AIzaSy... (leave blank for simulation)"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-folio-brand transition-colors font-mono"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 font-mono">Your Name (Optional)</label>
                                        <input
                                            type="text"
                                            value={employeeNameInput}
                                            onChange={e => setEmployeeNameInput(e.target.value)}
                                            placeholder="John Doe"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-folio-brand transition-colors"
                                        />
                                    </div>
                                )}

                                {/* Error display */}
                                {errorMsg && (
                                    <div className="text-[11px] font-medium text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg leading-normal">
                                        {errorMsg}
                                    </div>
                                )}

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-folio-brand text-folio-bg font-space font-bold text-sm tracking-wider uppercase rounded-lg hover:bg-opacity-95 transition-all mt-6 shadow-[0_0_15px_rgba(14,165,233,0.3)] disabled:opacity-50 disabled:cursor-wait font-medium"
                                >
                                    {loading ? 'Establishing Link...' : 'Establish Connection'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Documentation Modal */}
            <AnimatePresence>
                {showDocsModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md font-outfit"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-xl bg-[#0a0a0c] border border-slate-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(14,165,233,0.15)] relative p-6 text-zinc-300 max-h-[85vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setShowDocsModal(false)}
                                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-sm font-space"
                            >
                                ✕
                            </button>

                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/80">
                                <div className="w-9 h-9 rounded-xl bg-folio-brand/10 border border-folio-brand/20 flex items-center justify-center text-folio-brand">
                                    <BookOpen size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold font-space text-white tracking-wider">DOCUMENTATION & ARCHITECTURE</h2>
                                    <p className="text-xs text-slate-400 font-mono">Folio Pay Autonomous Agent Protocol</p>
                                </div>
                            </div>

                            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
                                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850">
                                    <h3 className="text-white font-semibold font-space text-sm mb-1 flex items-center gap-2">
                                        <Zap size={14} className="text-folio-brand" /> 1. Multimodal OCR & Vision
                                    </h3>
                                    <p className="text-slate-400">
                                        Uploaded receipt images are processed via Gemini Vision models to automatically extract the merchant name, currency, and total expenditure.
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-855">
                                    <h3 className="text-white font-semibold font-space text-sm mb-1 flex items-center gap-2">
                                        <Shield size={14} className="text-folio-accent" /> 2. Governance & Policy Validation
                                    </h3>
                                    <p className="text-slate-400">
                                        The autonomous auditor audits cumulative monthly spending, single claim caps, and pre-authorized vendor categories. Over-limit claims are escalated to the Manager Approval Queue.
                                    </p>
                                </div>

                                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-855">
                                    <h3 className="text-white font-semibold font-space text-sm mb-1 flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-emerald-400" /> 3. Instant Multi-Rail Settlement
                                    </h3>
                                    <p className="text-slate-400">
                                        Approved claims immediately execute on Base Sepolia testnet via ERC-20 USDC contracts, or route to simulated UPI bank payouts with cryptographic reference hashes.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => { setShowDocsModal(false); setShowConnectModal(true); }}
                                className="w-full mt-6 py-3 bg-folio-brand text-folio-bg font-space font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-opacity-95 transition-all"
                            >
                                Open Workspace Portal
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GSAP-Powered Cinematic About Us Page */}
            <AboutUsPage 
                isOpen={showAboutModal}
                onClose={() => setShowAboutModal(false)}
                onLaunchApp={() => {
                    setShowAboutModal(false);
                    setShowConnectModal(true);
                }}
                onOpenDocs={() => {
                    setShowAboutModal(false);
                    setShowDocsModal(true);
                }}
            />

        </div>
    );
}

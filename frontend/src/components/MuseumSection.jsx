import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Wifi, Upload, Activity, Zap, Database, Shield } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const cards = [
  { step: "01", title: "Upload", desc: "Drag & drop unstructured receipts, PDFs, or Slack screenshots directly into the portal.", icon: Upload },
  { step: "02", title: "AI Audit", desc: "Agent automatically extracts data, validates vendors, and checks budget limits.", icon: Activity },
  { step: "03", title: "Settle", desc: "Approved claims trigger instant stablecoin payouts on Base Sepolia.", icon: Zap },
  { step: "04", title: "Ledger", desc: "Transactions are cryptographically verified and permanently stored on-chain.", icon: Database },
  { step: "05", title: "Secure", desc: "Zero human intervention required. Fully autonomous and policy-driven.", icon: Shield }
];

const MuseumSection = () => {
  const scrollRef = useRef(null);
  const triggerRef = useRef(null);
  const revealTextRef = useRef(null);

  useGSAP(() => {
    // Force refresh to handle LandingPage pins properly
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 200);

    const mainTrack = gsap.to(scrollRef.current, {
      xPercent: -100,
      x: () => window.innerWidth, // Stop when the right edge hits the right edge of screen
      ease: "none",
      scrollTrigger: {
        trigger: triggerRef.current,
        pin: true,
        scrub: 1,
        start: "top top",
        end: () => "+=" + (scrollRef.current.scrollWidth),
        anticipatePin: 1,
        invalidateOnRefresh: true,
      }
    });

    const boxes = gsap.utils.toArray(".museum-box");
    
    boxes.forEach((box, i) => {
      const isEven = i % 2 === 0;
      const baseRotation = isEven ? gsap.utils.random(4, 12) : gsap.utils.random(-12, -4);
      const baseY = isEven ? gsap.utils.random(-60, -20) : gsap.utils.random(20, 60);
      const randomXOffset = gsap.utils.random(-40, 40); 

      // Reliable scattering effect using the main trigger
      gsap.to(box, {
        rotation: baseRotation,
        y: baseY,
        x: randomXOffset,
        ease: "power1.inOut",
        scrollTrigger: {
          trigger: triggerRef.current, 
          start: "top top", 
          end: () => "+=" + (scrollRef.current.scrollWidth),
          scrub: true,        
        },
      });
    });

    // TEXT FADE-IN LOGIC
    gsap.fromTo(
      revealTextRef.current,
      { 
        opacity: 0,
        xPercent: 10,
      },
      {
        opacity: 1,
        xPercent: -20, // scroll the text slightly left to right like the hero
        ease: "power2.out",
        scrollTrigger: {
          trigger: triggerRef.current,
          start: "top center",
          end: "bottom center",
          scrub: true,
        }
      }
    );

  }, { scope: triggerRef });

  return (
    <div ref={triggerRef} className="relative h-screen w-full overflow-hidden bg-[#020202] border-t border-slate-900 font-outfit">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.1)_0%,transparent_60%)] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none z-0" />

      {/* REVEAL TEXT */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-0 pointer-events-none overflow-hidden">
        <div ref={revealTextRef} className="whitespace-nowrap flex flex-col items-center">
          <h2 className="text-[22vw] leading-none font-space font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/20 via-slate-500/10 to-transparent uppercase inline-block select-none drop-shadow-2xl">
            HOW IT WORKS
          </h2>
          {/* Issue Card CTA Button */}
          <div className="pointer-events-auto mt-4 px-10 py-5 bg-[#050505]/50 backdrop-blur-md border border-white/10 rounded-full text-white uppercase text-sm font-space font-bold tracking-[0.2em] cursor-pointer hover:bg-white hover:text-[#050505] transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.02)] hover:shadow-[0_0_50px_rgba(255,255,255,0.4)] flex items-center gap-3 group">
            <div className="w-2 h-2 rounded-full bg-folio-accent group-hover:bg-[#050505] transition-colors" />
            Issue Corporate Card
          </div>
        </div>
      </div>

      {/* THE FLOATING TRACK (Cards) */}
      <div 
        ref={scrollRef} 
        className="relative z-10 flex h-full items-center pointer-events-none w-max px-[30vw] gap-20"
      >
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
          <div
            key={index}
            className="museum-box relative w-[320px] h-[500px] shrink-0 rounded-[28px] shadow-[0_50px_100px_-20px_rgba(0,0,0,1),inset_0_1px_2px_rgba(255,255,255,0.3)] border-[0.5px] border-t-slate-400/40 border-l-slate-400/20 border-b-slate-900 border-r-slate-900 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] flex flex-col justify-between p-8 overflow-hidden pointer-events-auto cursor-pointer group transition-all duration-700 hover:scale-[1.03] hover:-translate-y-4 hover:shadow-[0_60px_120px_-20px_rgba(14,165,233,0.3)]"
            style={{ zIndex: 10 + index }}
          >
            {/* Metallic Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 ease-out pointer-events-none" />
            
            {/* Top Left Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-folio-accent/20 rounded-full blur-[60px] group-hover:bg-folio-accent/40 transition-colors duration-700 pointer-events-none" />

            {/* Card Header */}
            <div className="flex justify-between items-start w-full relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-slate-600/50 bg-[#0a0a0c] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] group-hover:border-folio-accent/50 transition-colors duration-500">
                  <div className="w-3.5 h-3.5 bg-folio-accent rounded-full shadow-[0_0_15px_#0ea5e9] group-hover:shadow-[0_0_25px_#0ea5e9,0_0_5px_#fff] transition-shadow duration-500" />
                </div>
                <span className="font-space font-bold text-white tracking-[0.2em] text-xs">FOLIO</span>
              </div>
              <Wifi className="text-slate-400 rotate-90" size={26} strokeWidth={2.5} />
            </div>
            
            {/* Middle Section: Chip & Virtual Tag */}
            <div className="flex justify-between items-center w-full mt-12 relative z-10">
              {/* Premium Metallic EMV Chip */}
              <div className="w-11 h-14 rounded-lg bg-gradient-to-br from-[#d4af37] via-[#f3e5ab] to-[#b8860b] p-[1px] shadow-[0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute inset-[1px] rounded-md bg-gradient-to-br from-[#b8860b]/40 to-transparent flex flex-col justify-evenly px-1">
                  <div className="w-full h-px bg-black/20" />
                  <div className="w-full h-px bg-black/20" />
                </div>
                <div className="absolute inset-[1px] rounded-md flex justify-center">
                  <div className="h-full w-px bg-black/20" />
                </div>
              </div>
              
              {/* Icon replacing Mastercard logo */}
              <div className="w-12 h-12 rounded-full bg-[#0a0a0c]/80 border border-slate-700/50 flex items-center justify-center backdrop-blur-md shadow-lg">
                <Icon className="text-folio-accent" size={22} strokeWidth={1.5} />
              </div>
            </div>
            
            {/* Card Details (How to Use) */}
            <div className="w-full mt-auto relative z-10">
              <div className="flex justify-between items-end mb-3">
                <p className="font-mono text-folio-accent text-[10px] uppercase tracking-[0.25em]">Step {card.step}</p>
              </div>
              
              <h4 className="font-space font-black text-white text-3xl mb-3 tracking-tighter drop-shadow-lg">{card.title}</h4>
              <p className="font-outfit font-light text-slate-300 text-sm leading-relaxed mb-6 h-16">{card.desc}</p>
              
            </div>
          </div>
        )})}
      </div>
    </div>
  );
};

export default MuseumSection;

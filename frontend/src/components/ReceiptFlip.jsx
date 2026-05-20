import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CheckCircle2, ExternalLink } from 'lucide-react';

export default function ReceiptFlip({ transaction, onClose }) {
  const containerRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    // 3D Flip entry animation
    gsap.fromTo(containerRef.current, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.3 }
    );
    
    gsap.fromTo(cardRef.current,
      { rotationY: -180, scale: 0.5, opacity: 0 },
      { rotationY: 0, scale: 1, opacity: 1, duration: 1, ease: "back.out(1.5)" }
    );

    // Particle Confetti Burst
    createConfetti();
  }, []);

  const createConfetti = () => {
    const colors = ['#00FFA3', '#9D4EDD', '#FFFFFF', '#3B82F6'];
    for(let i=0; i<50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'absolute w-2 h-2 rounded-full z-50 pointer-events-none';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = '50%';
        confetti.style.top = '50%';
        document.body.appendChild(confetti);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 200;
        const x = Math.cos(angle) * velocity;
        const y = Math.sin(angle) * velocity;

        gsap.to(confetti, {
            x: x,
            y: y,
            opacity: 0,
            duration: 1 + Math.random(),
            ease: "power2.out",
            onComplete: () => {
                confetti.remove();
            }
        });
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        ref={cardRef} 
        className="glass rounded-2xl p-8 max-w-sm w-full relative neon-border"
        style={{ transformPerspective: 1000 }}
      >
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-folio-neon text-black rounded-full p-2 shadow-[0_0_20px_#00FFA3]">
            <CheckCircle2 size={32} />
        </div>
        
        <h2 className="text-2xl font-bold text-center mt-4 mb-6 font-space text-folio-neon">Payout Approved</h2>
        
        <div className="space-y-4 text-sm font-mono">
            <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Vendor</span>
                <span className="text-white font-semibold">{transaction.vendor}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Amount</span>
                <span className="text-folio-neon font-semibold">${transaction.amount_usd}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Recipient</span>
                <span className="text-white font-semibold truncate max-w-[150px]">{transaction.recipient}</span>
            </div>
            <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-gray-400">Type</span>
                <span className="text-folio-purple font-semibold uppercase">{transaction.tx_type}</span>
            </div>
        </div>

        {transaction.explorer_link && (
            <a 
                href={transaction.explorer_link} 
                target="_blank" 
                rel="noreferrer"
                className="mt-6 w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 transition-colors py-3 rounded-lg text-sm interactive"
            >
                View on Explorer <ExternalLink size={16} />
            </a>
        )}

        <button 
            onClick={onClose}
            className="mt-4 w-full bg-folio-neon/20 hover:bg-folio-neon/30 text-folio-neon border border-folio-neon/50 py-3 rounded-lg font-space font-semibold transition-colors interactive"
        >
            Done
        </button>
      </div>
    </div>
  );
}

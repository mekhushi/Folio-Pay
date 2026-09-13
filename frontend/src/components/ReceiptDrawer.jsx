import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { X } from 'lucide-react';

export default function ReceiptDrawer({ transaction, isOpen, onClose, userRole, onApprove, onReject }) {
  const drawerRef = useRef(null);
  const overlayRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
        gsap.to(overlayRef.current, { opacity: 1, pointerEvents: 'auto', duration: 0.3 });
        gsap.to(drawerRef.current, { x: 0, duration: 0.5, ease: "power3.out" });
    } else {
        gsap.to(overlayRef.current, { opacity: 0, pointerEvents: 'none', duration: 0.3 });
        gsap.to(drawerRef.current, { x: '100%', duration: 0.4, ease: "power3.in" });
    }
  }, [isOpen]);

  const getStatusColor = (status) => {
    if (status === 'APPROVED') return 'text-emerald-400';
    if (status === 'PENDING_REVIEW') return 'text-amber-400';
    if (status === 'REJECTED') return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <>
      <div 
        ref={overlayRef}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 opacity-0 pointer-events-none"
        onClick={onClose}
      />
      <div 
        ref={drawerRef}
        className="fixed top-0 right-0 h-full w-full max-w-md glass border-l border-white/10 z-50 transform translate-x-full overflow-y-auto"
      >
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-space font-bold">Receipt Audit Details</h3>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors interactive">
                    <X size={20} />
                </button>
            </div>

            <div className="relative w-full h-96 bg-folio-dark rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                {transaction?.receipt_image ? (
                    <img 
                        src={transaction.receipt_image.startsWith('http') ? transaction.receipt_image : `http://localhost:8000${transaction.receipt_image}`} 
                        alt="Receipt Scan" 
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 font-mono text-sm opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                        [ Receipt Scan Image ]
                    </div>
                )}
                
                {transaction && (
                    <>
                    <div className="absolute top-1/4 left-1/4 w-1/2 h-10 border-2 border-folio-neon bg-folio-neon/10 rounded animate-pulse shadow-[0_0_10px_#00FFA3] pointer-events-none">
                        <span className="absolute -top-6 left-0 text-xs text-folio-neon font-bold">VENDOR: {transaction.vendor}</span>
                    </div>
                    <div className="absolute top-1/2 left-1/3 w-1/3 h-10 border-2 border-folio-purple bg-folio-purple/10 rounded animate-pulse shadow-[0_0_10px_#9D4EDD] pointer-events-none">
                        <span className="absolute -top-6 left-0 text-xs text-folio-purple font-bold">TOTAL: ${transaction.amount_usd}</span>
                    </div>
                    </>
                )}
            </div>

            <div className="mt-8 space-y-6">
                <div className="glass p-4 rounded-xl neon-border">
                    <h4 className="text-xs text-folio-neon mb-2 font-bold uppercase tracking-widest">AI Audit Summary</h4>
                    <p className="text-sm text-gray-300">
                        {transaction?.status === 'PENDING_REVIEW' 
                          ? `This claim requires Manager review because it exceeds the Auto-Approval Limit. Current amount is $${transaction?.amount_usd}.`
                          : `This claim was autonomously verified. The vendor "${transaction?.vendor}" matches the allowed category "${transaction?.category}". Employee monthly limits were respected.`
                        }
                    </p>
                </div>

                <div className="space-y-3 font-mono text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-gray-400">Transaction Ref</span>
                        <span className="text-white truncate max-w-[200px]">{transaction?.tx_hash_or_ref || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-gray-400">Timestamp</span>
                        <span className="text-white">{transaction?.timestamp || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                        <span className="text-gray-400">Status</span>
                        <span className={`font-bold uppercase ${getStatusColor(transaction?.status)}`}>{transaction?.status}</span>
                    </div>
                </div>
            </div>

            {transaction?.status === 'PENDING_REVIEW' && userRole === 'manager' && (
                <div className="mt-8 flex gap-4">
                    <button 
                        onClick={() => {
                            onApprove(transaction.tx_id);
                            onClose();
                        }}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-space font-bold rounded-lg shadow-lg hover:shadow-emerald-500/20 transition-all text-xs uppercase"
                    >
                        Approve (Execute)
                    </button>
                    <button 
                        onClick={() => {
                            onReject(transaction.tx_id);
                            onClose();
                        }}
                        className="flex-1 py-3 bg-red-650/10 hover:bg-red-650/20 text-red-500 font-space font-bold border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all text-xs uppercase"
                    >
                        Reject Claim
                    </button>
                </div>
            )}
        </div>
      </div>
    </>
  );
}

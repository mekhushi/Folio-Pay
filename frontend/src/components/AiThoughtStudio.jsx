import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin);

export default function AiThoughtStudio({ logs = [], className = "" }) {
  const bottomRef = useRef(null);
  const [displayedLogs, setDisplayedLogs] = useState([]);

  useEffect(() => {
    if (logs.length !== displayedLogs.length) {
      setDisplayedLogs(logs);
    }
  }, [logs, displayedLogs]);

  useEffect(() => {
    if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedLogs]);

  return (
    <div className={`overflow-y-auto font-space text-xs relative hide-scrollbar ${className || "glass rounded-xl p-4 h-64 neon-border"}`}>
      <div className="flex flex-col gap-2">
        {displayedLogs.length === 0 ? (
            <div className="text-slate-600 font-mono italic">System ready. Awaiting input stream...</div>
        ) : (
            displayedLogs.map((log, i) => (
                <LogLine key={i} text={log} />
            ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function LogLine({ text }) {
    const lineRef = useRef(null);
    const cursorRef = useRef(null);
    
    const isError = text.includes("FAILURE") || text.includes("failed") || text.includes("Error");
    const isThought = text.startsWith("Thought:") || text.startsWith("[Audit]") || text.startsWith("[Policy]");
    const isTool = text.startsWith("Tool Call:") || text.startsWith("[Ledger]") || text.startsWith("[OCR]") || text.startsWith("[Treasury]");
    const isDecision = text.startsWith("Decision:") || text.startsWith("[Policy Check]") || text.includes("PASSED") || text.includes("successful");
    const isSystem = text.startsWith("System:") || text.startsWith("[System");
    
    let textColor = "text-slate-300";
    if (isError) textColor = "text-red-400 font-semibold";
    else if (isDecision) textColor = "text-emerald-400 font-semibold";
    else if (isThought) textColor = "text-purple-300";
    else if (isTool) textColor = "text-sky-400";
    else if (isSystem) textColor = "text-slate-500 italic";

    useEffect(() => {
        if (lineRef.current) {
            gsap.fromTo(lineRef.current, 
                { text: "" }, 
                { text: text, duration: text.length * 0.02, ease: "none", onComplete: () => {
                    if (cursorRef.current) {
                        gsap.to(cursorRef.current, { opacity: 0, duration: 0.1 });
                    }
                }}
            );
        }
    }, [text]);

    return (
        <div className={`font-mono ${textColor} flex items-start break-words`}>
            <span className="text-gray-500 mr-2 whitespace-nowrap">&gt;</span>
            <span ref={lineRef} className="break-all"></span>
            <span ref={cursorRef} className="animate-pulse inline-block w-2 h-4 bg-folio-neon ml-1 mt-1 shrink-0"></span>
        </div>
    );
}

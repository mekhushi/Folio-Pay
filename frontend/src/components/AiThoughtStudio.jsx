import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin);

export default function AiThoughtStudio({ logs }) {
  const bottomRef = useRef(null);
  const [displayedLogs, setDisplayedLogs] = useState([]);

  useEffect(() => {
    if (logs.length > displayedLogs.length) {
      setDisplayedLogs(logs);
    }
  }, [logs, displayedLogs]);

  useEffect(() => {
    if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedLogs]);

  return (
    <div className="glass rounded-xl p-4 h-64 overflow-y-auto font-space text-sm relative neon-border hide-scrollbar">
      <div className="sticky top-0 bg-folio-dark/80 backdrop-blur pb-2 z-10 mb-2">
         <span className="text-xs text-folio-neon/70 font-bold tracking-widest uppercase">
           System_Terminal // AI.Auditor
         </span>
      </div>
      <div className="flex flex-col gap-2">
        {displayedLogs.map((log, i) => (
           <LogLine key={i} text={log} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function LogLine({ text }) {
    const lineRef = useRef(null);
    const cursorRef = useRef(null);
    
    const isThought = text.startsWith("Thought:");
    const isTool = text.startsWith("Tool Call:");
    const isDecision = text.startsWith("Decision:");
    const isSystem = text.startsWith("System:");
    
    let textColor = "text-gray-300";
    if (isThought) textColor = "text-folio-purple";
    if (isTool) textColor = "text-blue-400";
    if (isDecision) textColor = "text-folio-neon";
    if (isSystem) textColor = "text-gray-400 italic";

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

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Activity, User, Bot } from 'lucide-react';
import { VoiceAgentService } from '../services/geminiService';

const VoiceAgent: React.FC = () => {
  const [status, setStatus] = useState<'disconnected' | 'connected' | 'speaking'>('disconnected');
  const [transcripts, setTranscripts] = useState<{text: string, isUser: boolean}[]>([]);
  const voiceServiceRef = useRef<VoiceAgentService | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    voiceServiceRef.current = new VoiceAgentService(
      (text, isUser) => {
        setTranscripts(prev => [...prev, { text, isUser }]);
      },
      (newStatus) => setStatus(newStatus)
    );

    return () => {
      voiceServiceRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const toggleConnection = async () => {
    if (status === 'disconnected') {
      await voiceServiceRef.current?.connect();
    } else {
      voiceServiceRef.current?.disconnect();
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
      <div className="bg-white w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col h-full">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-blue-400" />
              Atlas Voice Agent
            </h2>
            <p className="text-slate-400 text-sm">Real-time phone support simulation</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
            status === 'disconnected' ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${status === 'disconnected' ? 'bg-red-500' : 'bg-green-400 animate-pulse'}`} />
            {status === 'speaking' ? 'Agent Speaking...' : status === 'connected' ? 'Listening...' : 'Offline'}
          </div>
        </div>

        {/* Visualizer / Transcript Area */}
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto" ref={scrollRef}>
          {transcripts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-60">
              <div className="w-24 h-24 rounded-full border-4 border-slate-200 flex items-center justify-center">
                <Phone className="w-10 h-10" />
              </div>
              <p>Start a call to interact with the AI agent</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transcripts.map((t, i) => (
                <div key={i} className={`flex gap-3 ${t.isUser ? 'justify-end' : 'justify-start'}`}>
                  {!t.isUser && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    t.isUser 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                    {t.text}
                  </div>
                  {t.isUser && (
                     <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </div>
              ))}
              {status === 'speaking' && (
                 <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-1 p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-none">
                       <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                       <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                       <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    </div>
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-white border-t border-slate-100 flex justify-center items-center gap-6">
           <button 
             onClick={toggleConnection}
             className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 ${
               status === 'disconnected' 
                 ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                 : 'bg-red-500 hover:bg-red-600 text-white'
             }`}
           >
             {status === 'disconnected' ? <Phone className="w-8 h-8" /> : <PhoneOff className="w-8 h-8" />}
           </button>
           
           {status !== 'disconnected' && (
             <div className="text-slate-400 text-xs font-medium absolute bottom-2">
               {status === 'speaking' ? 'AI is speaking' : 'Mic active'}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default VoiceAgent;
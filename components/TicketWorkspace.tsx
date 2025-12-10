import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus, Sentiment, TicketPriority, Channel } from '../types';
import { analyzeTicketAI, generateReplyDraft } from '../services/geminiService';
import { 
  Inbox, MessageSquare, AlertCircle, Phone, CheckCircle, 
  Send, Sparkles, RefreshCcw, ShieldAlert, ArrowRight,
  MoreVertical, FileText, User, Bot, CheckSquare, UserPlus, StickyNote, UserCheck
} from 'lucide-react';

interface TicketWorkspaceProps {
  tickets: Ticket[];
  onUpdateTicket: (ticket: Ticket) => void;
}

const TicketWorkspace: React.FC<TicketWorkspaceProps> = ({ tickets, onUpdateTicket }) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(tickets[0]?.id || null);
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState('');
  const [toneMode, setToneMode] = useState('Polite & Professional');
  
  const currentUser = "Jane Doe"; // Mock current user

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Auto-analyze when a ticket is selected if not already analyzed
  useEffect(() => {
    if (selectedTicket && !selectedTicket.analysis) {
      const runAnalysis = async () => {
        const analysis = await analyzeTicketAI(selectedTicket);
        onUpdateTicket({ ...selectedTicket, analysis });
      };
      runAnalysis();
    }
    setDraft(''); // Clear draft on switch
  }, [selectedTicketId]);

  const handleGenerateDraft = async () => {
    if (!selectedTicket || !selectedTicket.analysis) return;
    setDrafting(true);
    try {
      const generatedDraft = await generateReplyDraft(selectedTicket, toneMode, selectedTicket.analysis);
      setDraft(generatedDraft);
    } finally {
      setDrafting(false);
    }
  };

  const getSentimentColor = (s?: Sentiment) => {
    switch(s) {
      case Sentiment.POSITIVE: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case Sentiment.NEGATIVE: return 'text-orange-600 bg-orange-50 border-orange-200';
      case Sentiment.ANGRY: return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-6">
      
      {/* LEFT COLUMN: Ticket List */}
      <div className="w-1/3 min-w-[320px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <Inbox className="w-4 h-4" /> Incoming Tickets
          </h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {tickets.filter(t => t.status === TicketStatus.OPEN).length} Open
          </span>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {tickets.map(ticket => (
            <div 
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className={`p-3 rounded-lg cursor-pointer border transition-all hover:shadow-md ${
                selectedTicketId === ticket.id 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-transparent hover:border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                {ticket.status === TicketStatus.RESOLVED ? (
                   <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-emerald-100 text-emerald-700 flex items-center gap-1">
                     <CheckCircle className="w-3 h-3" /> Resolved
                   </span>
                ) : (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    ticket.priority === TicketPriority.CRITICAL ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ticket.priority}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {new Date(ticket.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{ticket.subject}</h4>
              <p className="text-xs text-slate-500 line-clamp-2 mt-1 opacity-80">
                {ticket.messages[ticket.messages.length-1].content}
              </p>
              <div className="flex gap-2 mt-2">
                <ChannelIcon channel={ticket.channel} />
                {ticket.analysis?.sentiment === Sentiment.ANGRY && (
                  <span className="text-[10px] flex items-center gap-1 text-red-600 font-medium">
                    <ShieldAlert className="w-3 h-3" /> Risk
                  </span>
                )}
                {ticket.assignedTo && (
                  <span className="text-[10px] flex items-center gap-1 text-slate-500 font-medium ml-auto">
                    <User className="w-3 h-3" /> {ticket.assignedTo === currentUser ? 'You' : ticket.assignedTo}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: Workspace */}
      {selectedTicket ? (
        <div className="flex-1 flex gap-6">
          
          {/* Middle: Conversation */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  {selectedTicket.subject}
                  {selectedTicket.assignedTo && (
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 flex items-center gap-1">
                      <User className="w-3 h-3" /> 
                      {selectedTicket.assignedTo === currentUser ? 'Assigned to You' : `Assigned to ${selectedTicket.assignedTo}`}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <User className="w-3 h-3" /> {selectedTicket.customerName} &bull; {selectedTicket.customerEmail}
                </div>
              </div>
              <div className="flex gap-2">
                 <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                    <MoreVertical className="w-4 h-4" />
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
              {selectedTicket.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'agent' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    <div className="font-semibold text-xs opacity-70 mb-1 mb-2 block">
                        {msg.sender === 'agent' ? 'Support Agent' : selectedTicket.customerName}
                    </div>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
               {draft ? (
                  <div className="animate-fade-in border-2 border-indigo-100 rounded-xl p-4 bg-indigo-50/30 relative">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Draft Generated
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setDraft('')} className="text-xs text-slate-400 hover:text-slate-600">Discard</button>
                            <button className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 flex items-center gap-1">
                                <Send className="w-3 h-3" /> Approve & Send
                            </button>
                        </div>
                     </div>
                     <textarea 
                        className="w-full bg-transparent border-none text-slate-700 text-sm focus:ring-0 resize-none h-32"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                     />
                  </div>
               ) : (
                  <div className="flex gap-2 items-center">
                    <button 
                        onClick={handleGenerateDraft}
                        disabled={!selectedTicket.analysis || drafting}
                        className="flex-1 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 text-sm font-medium group"
                    >
                        {drafting ? (
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600" />
                                Generate AI Reply
                            </>
                        )}
                    </button>
                  </div>
               )}
            </div>
          </div>

          {/* Far Right: AI Copilot Panel */}
          <div className="w-[300px] flex flex-col gap-4">
             {/* Analysis Card */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-600" /> AI Insights
                </h3>
                
                {!selectedTicket.analysis ? (
                    <div className="flex flex-col items-center py-8 text-slate-400 gap-2">
                         <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                         <span className="text-xs">Analyzing ticket...</span>
                    </div>
                ) : (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Summary</span>
                            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                                {selectedTicket.analysis.summary}
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Sentiment</span>
                                <div className={`mt-1 text-xs px-2 py-1 rounded border inline-flex items-center gap-1.5 font-medium ${getSentimentColor(selectedTicket.analysis.sentiment)}`}>
                                    {selectedTicket.analysis.sentiment}
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Urgency</span>
                                <div className="mt-1 flex items-center gap-1">
                                    <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${selectedTicket.analysis.urgencyScore > 7 ? 'bg-red-500' : 'bg-blue-500'}`} 
                                            style={{width: `${selectedTicket.analysis.urgencyScore * 10}%`}}
                                        />
                                    </div>
                                    <span className="text-xs font-mono font-bold text-slate-600">{selectedTicket.analysis.urgencyScore}/10</span>
                                </div>
                            </div>
                        </div>

                        <div>
                             <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Suggested Routing</span>
                             <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">
                                 <ArrowRight className="w-3 h-3 text-slate-400" />
                                 {selectedTicket.analysis.suggestedRoute}
                             </div>
                        </div>

                        {selectedTicket.analysis.riskFactors.length > 0 && (
                            <div className="bg-red-50 border border-red-100 p-3 rounded-lg">
                                <span className="text-[10px] uppercase text-red-400 font-bold tracking-wider flex items-center gap-1">
                                    <ShieldAlert className="w-3 h-3" /> Risk Detected
                                </span>
                                <ul className="mt-1 space-y-1">
                                    {selectedTicket.analysis.riskFactors.map(r => (
                                        <li key={r} className="text-xs text-red-700">• {r}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
             </div>

             {/* Quick Actions Card */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                   {selectedTicket.status === TicketStatus.RESOLVED ? (
                      <button 
                        disabled
                        className="w-full flex items-center gap-3 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg transition-all text-xs font-medium opacity-80 cursor-default"
                      >
                         <CheckCircle className="w-4 h-4" />
                         Ticket Resolved
                      </button>
                   ) : (
                      <button 
                        onClick={() => onUpdateTicket({...selectedTicket, status: TicketStatus.RESOLVED})}
                        className="w-full flex items-center gap-3 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 rounded-lg transition-all text-xs font-medium"
                      >
                         <CheckSquare className="w-4 h-4" />
                         Mark as Resolved
                      </button>
                   )}
                   
                   {selectedTicket.assignedTo === currentUser ? (
                      <button 
                        disabled
                        className="w-full flex items-center gap-3 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg transition-all text-xs font-medium opacity-80 cursor-default"
                      >
                         <UserCheck className="w-4 h-4" />
                         Assigned to You
                      </button>
                   ) : (
                      <button 
                        onClick={() => onUpdateTicket({...selectedTicket, assignedTo: currentUser})}
                        className="w-full flex items-center gap-3 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 rounded-lg transition-all text-xs font-medium"
                      >
                         <UserPlus className="w-4 h-4" />
                         Assign to Me
                      </button>
                   )}
                   
                   <button className="w-full flex items-center gap-3 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 rounded-lg transition-all text-xs font-medium">
                      <StickyNote className="w-4 h-4" />
                      Add Internal Note
                   </button>
                </div>
             </div>

             {/* Actions Card */}
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Reply Controls</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-slate-500 font-medium mb-1 block">Tone of Voice</label>
                        <select 
                            value={toneMode}
                            onChange={(e) => setToneMode(e.target.value)}
                            className="w-full text-xs border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option>Polite & Professional</option>
                            <option>Empathetic & Apologetic</option>
                            <option>Concise & Direct</option>
                            <option>Friendly & Casual</option>
                        </select>
                    </div>
                    <button className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors">
                        Update Knowledge Base
                    </button>
                    <button className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg border border-red-200 transition-colors">
                        Escalate to Manager
                    </button>
                </div>
             </div>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
          <p>Select a ticket to view details</p>
        </div>
      )}
    </div>
  );
};

const ChannelIcon = ({channel}: {channel: Channel}) => {
  switch(channel) {
    case Channel.EMAIL: return <Inbox className="w-3 h-3 text-slate-400" />;
    case Channel.CHAT: return <MessageSquare className="w-3 h-3 text-blue-400" />;
    case Channel.VOICE: return <Phone className="w-3 h-3 text-purple-400" />;
    default: return null;
  }
}

export default TicketWorkspace;
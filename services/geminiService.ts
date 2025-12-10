import { GoogleGenAI, Schema, Type, LiveServerMessage, Modality } from "@google/genai";
import { Ticket, TicketAnalysis, Sentiment, TicketPriority } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- Text Intelligence ---

export const analyzeTicketAI = async (ticket: Ticket): Promise<TicketAnalysis> => {
  const model = "gemini-2.5-flash";
  
  const conversationText = ticket.messages
    .map(m => `${m.sender.toUpperCase()}: ${m.content}`)
    .join('\n');

  const prompt = `
    Analyze the following customer support ticket history.
    
    Ticket ID: ${ticket.id}
    Subject: ${ticket.subject}
    Conversation:
    ${conversationText}

    Provide a JSON analysis containing:
    1. A 1-sentence summary.
    2. Sentiment (Positive, Neutral, Negative, Angry).
    3. Urgency score (1-10).
    4. Category (Billing, Tech Support, Feature Request, Sales, General).
    5. Suggested Routing Team (Billing, Technical, Sales, Customer Success).
    6. Risk factors (list of strings, e.g., "Churn Risk", "Legal Threat").
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      sentiment: { type: Type.STRING },
      urgencyScore: { type: Type.INTEGER },
      category: { type: Type.STRING },
      suggestedRoute: { type: Type.STRING },
      riskFactors: { 
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: ["summary", "sentiment", "urgencyScore", "category", "suggestedRoute"]
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Map string sentiment to Enum safely
    let mappedSentiment = Sentiment.NEUTRAL;
    if (result.sentiment?.toLowerCase().includes('ang')) mappedSentiment = Sentiment.ANGRY;
    else if (result.sentiment?.toLowerCase().includes('neg')) mappedSentiment = Sentiment.NEGATIVE;
    else if (result.sentiment?.toLowerCase().includes('pos')) mappedSentiment = Sentiment.POSITIVE;

    return {
      ...result,
      sentiment: mappedSentiment
    };

  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return {
      summary: "AI Analysis Unavailable",
      sentiment: Sentiment.NEUTRAL,
      urgencyScore: 1,
      category: "General",
      suggestedRoute: "General Support",
      riskFactors: []
    };
  }
};

export const generateReplyDraft = async (ticket: Ticket, tone: string, analysis: TicketAnalysis): Promise<string> => {
  const model = "gemini-2.5-flash";
  
  const conversationText = ticket.messages
    .map(m => `${m.sender.toUpperCase()}: ${m.content}`)
    .join('\n');

  const prompt = `
    You are a senior customer support agent. Draft a reply to this ticket.
    
    Context:
    - Customer is experiencing: ${analysis.summary}
    - Sentiment: ${analysis.sentiment}
    - Risk Factors: ${analysis.riskFactors.join(', ')}
    
    Instructions:
    - Use a ${tone} tone.
    - Be empathetic but concise.
    - If there is a risk factor, reassure the customer.
    - Sign off as "Support Team".
    
    Conversation History:
    ${conversationText}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text || "";
};

// --- Live API (Voice Agent) ---

export class VoiceAgentService {
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private nextStartTime = 0;
  private processor: ScriptProcessorNode | null = null;

  constructor(
    private onTranscript: (text: string, isUser: boolean) => void,
    private onStatusChange: (status: 'connected' | 'disconnected' | 'speaking') => void
  ) {}

  async connect() {
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: `
            You are "Atlas", a helpful voice support agent for a SaaS platform. 
            Keep answers brief (under 2 sentences) and conversational.
            If the user sounds angry, apologize and offer to escalate.
          `,
        },
      };

      this.session = await ai.live.connect({
        ...config,
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onclose: () => this.onStatusChange('disconnected'),
          onerror: (err) => console.error(err),
        }
      });

      this.onStatusChange('connected');

    } catch (err) {
      console.error("Voice Connection Failed", err);
      this.disconnect();
    }
  }

  private handleOpen() {
    if (!this.inputAudioContext || !this.mediaStream || !this.session) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      // Convert to PCM 16-bit
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcm16[i] = inputData[i] * 32768;
      }
      
      const uint8 = new Uint8Array(pcm16.buffer);
      const base64 = btoa(String.fromCharCode(...uint8));

      this.session.sendRealtimeInput({
        media: {
          mimeType: 'audio/pcm;rate=16000',
          data: base64
        }
      });
    };

    source.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage) {
    // Handle Text Transcription
    if (message.serverContent?.inputTranscription?.text) {
        this.onTranscript(message.serverContent.inputTranscription.text, true);
    }
    if (message.serverContent?.outputTranscription?.text) {
        this.onTranscript(message.serverContent.outputTranscription.text, false);
    }

    // Handle Audio Output
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputAudioContext) {
      this.onStatusChange('speaking');
      
      const binary = atob(audioData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      // Decode raw PCM
      const float32 = new Float32Array(bytes.length / 2);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < float32.length; i++) {
        float32[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }

      const buffer = this.outputAudioContext.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.outputAudioContext.destination);
      
      // Simple queueing
      const currentTime = this.outputAudioContext.currentTime;
      if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime;
      }
      source.start(this.nextStartTime);
      this.nextStartTime += buffer.duration;
      
      source.onended = () => {
         if (this.outputAudioContext && this.outputAudioContext.currentTime >= this.nextStartTime) {
             this.onStatusChange('connected');
         }
      };
    }
  }

  disconnect() {
    this.session?.close();
    this.processor?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.onStatusChange('disconnected');
  }
}

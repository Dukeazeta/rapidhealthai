'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, Send, Loader2, AlertTriangle, History, Activity, Mic, MicOff } from 'lucide-react';
import ResultCard from '@/components/ResultCard';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string });

interface DiagnosisResult {
  likelyDisease: string;
  riskLevel: string;
  keySigns: string[];
  immediateAction: string;
  urgentReferral: boolean;
}

export default function RapidHealthPage() {
  const [age, setAge] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [history, setHistory] = useState<DiagnosisResult[]>([]);
  const [outbreakAlert, setOutbreakAlert] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSymptoms(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Microphone access is blocked. Please ensure you have granted permission and that you are not in a restricted iframe. Try opening the app in a new tab if the issue persists.');
      } else if (event.error === 'no-speech' || event.error === 'aborted') {
        // Silent fail for no-speech or aborted, just reset the state
        console.warn(`Speech recognition ${event.error}.`);
      } else {
        alert(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!age || !symptoms || !duration) return;

    setLoading(true);
    setResult(null);
    setOutbreakAlert(null);

    try {
      const prompt = `
        You are a medical diagnostic assistant for Community Health Volunteers in rural areas.
        Analyze the following patient data and provide a diagnosis:
        Age: ${age}
        Symptoms: ${symptoms}
        Duration of illness: ${duration}

        Return the response in JSON format with the following fields:
        - likelyDisease: (string)
        - riskLevel: (string: "Low", "Medium", or "High")
        - keySigns: (array of strings)
        - immediateAction: (string)
        - urgentReferral: (boolean)

        Be concise and professional.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              likelyDisease: { type: Type.STRING },
              riskLevel: { type: Type.STRING },
              keySigns: { type: Type.ARRAY, items: { type: Type.STRING } },
              immediateAction: { type: Type.STRING },
              urgentReferral: { type: Type.BOOLEAN },
            },
            required: ["likelyDisease", "riskLevel", "keySigns", "immediateAction", "urgentReferral"],
          },
        },
      });

      if (!response.text) {
        throw new Error('No response text from Gemini');
      }
      const data = JSON.parse(response.text);
      setResult(data);
      setHistory(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Simulated Outbreak Detection
  useEffect(() => {
    if (history.length >= 3) {
      const diseaseCounts: Record<string, number> = {};
      history.forEach(item => {
        const disease = item.likelyDisease.toLowerCase();
        diseaseCounts[disease] = (diseaseCounts[disease] || 0) + 1;
      });

      const outbreakDisease = Object.entries(diseaseCounts).find(([_, count]) => count >= 3);
      if (outbreakDisease) {
        setOutbreakAlert(`⚠️ Possible outbreak of ${outbreakDisease[0].toUpperCase()} detected in this area`);
      }
    }
  }, [history]);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-900">RapidHealth <span className="text-blue-600">AI</span></h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-green-500" /> Live System
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Outbreak Alert */}
        <AnimatePresence>
          {outbreakAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800 shadow-sm"
            >
              <AlertTriangle className="w-6 h-6 shrink-0 text-amber-600" />
              <p className="font-semibold">{outbreakAlert}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" /> Patient Assessment
              </h2>
              
              <form onSubmit={handleAnalyze} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Patient Age</label>
                    <input
                      type="text"
                      placeholder="e.g. 5 years"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g. 2 days"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase">Symptoms & Observations</label>
                    <button
                      type="button"
                      onClick={startListening}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                        isListening 
                          ? 'bg-red-100 text-red-600 animate-pulse' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3 h-3" /> Listening...
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3" /> Voice Input
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    placeholder="Describe symptoms, fever, cough, etc..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Symptoms...
                    </>
                  ) : (
                    <>
                      <Activity className="w-5 h-5" />
                      Run AI Diagnosis
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Results Area */}
            {result && <ResultCard result={result} />}
          </div>

          {/* Sidebar / History */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-500 uppercase tracking-wider">
                <History className="w-4 h-4" /> Recent Cases
              </h2>
              
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No cases recorded yet.</p>
                ) : (
                  history.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{item.likelyDisease}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">{item.riskLevel} Risk</p>
                      </div>
                      {item.urgentReferral && (
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white space-y-2">
              <h3 className="font-bold">Volunteer Support</h3>
              <p className="text-xs opacity-80 leading-relaxed">
                This tool is designed to assist Community Health Volunteers. Always follow Ministry of Health protocols for emergency cases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

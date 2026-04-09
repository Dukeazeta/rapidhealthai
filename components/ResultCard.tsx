'use client';

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface ResultCardProps {
  result: {
    likelyDisease: string;
    riskLevel: string;
    keySigns: string[];
    immediateAction: string;
    urgentReferral: boolean;
  };
}

export default function ResultCard({ result }: ResultCardProps) {
  const isHighRisk = result.riskLevel === 'High' || result.urgentReferral;

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isHighRisk && (
        <div className="bg-red-600 text-white p-4 rounded-lg flex items-center gap-3 shadow-lg animate-pulse">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <div>
            <h3 className="font-bold text-lg">🚨 URGENT CASE – REFER IMMEDIATELY</h3>
            <p className="text-sm opacity-90">This patient requires immediate medical attention at a district hospital.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Likely Diagnosis</p>
              <h2 className="text-2xl font-bold text-gray-900">{result.likelyDisease}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getRiskColor(result.riskLevel)}`}>
              {result.riskLevel} Risk
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Key Signs Detected:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.keySigns.map((sign, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-600 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {sign}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-50">
            <p className="text-sm font-semibold text-gray-700 mb-2">Immediate Action Required:</p>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-blue-900 text-sm leading-relaxed">
                {result.immediateAction}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

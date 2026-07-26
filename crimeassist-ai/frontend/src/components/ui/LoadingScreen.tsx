import React from 'react'
import { Shield } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute animate-ping h-20 w-20 rounded-full bg-blue-500/20" />
        <div className="relative bg-blue-600/20 p-4 rounded-2xl border border-blue-500/30">
          <Shield className="w-12 h-12 text-blue-500 animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-white tracking-wider mb-2">CRIMEASSIST AI</h2>
        <p className="text-sm text-slate-400 font-medium">Karnataka State Police Intelligence Platform</p>
      </div>
      <div className="mt-8 flex items-center space-x-2">
        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" />
      </div>
    </div>
  )
}

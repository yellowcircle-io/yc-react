import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Menu } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 p-6">
        <div className="flex justify-between items-center">
          {/* Left side navigation text */}
          <div className="transform -rotate-90 origin-left translate-y-20 translate-x-4">
            <span className="text-black font-light tracking-widest text-sm">HOME</span>
          </div>
          
          {/* Logo */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
            <h1 className="text-black text-sm font-light tracking-[0.3em]">YELLOWCIRCLE</h1>
          </div>
          
          {/* Hamburger menu */}
          <button className="p-2">
            <Menu className="w-6 h-6 text-black" />
          </button>
        </div>
      </nav>

      {/* Main content container */}
      <div className="flex min-h-screen">
        {/* Left section with text */}
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="max-w-md">
            <div className="space-y-1 text-black font-light text-sm leading-relaxed tracking-wide">
              <p>VIVAMUS SAGITTIS LACUS VEL</p>
              <p>AUGUE LAOREET RUTRUM</p>
              <p>FAUCIBUS DOLOR AUCTOR.</p>
              <p>AENEAN EU LEO QUAM.</p>
              <p>PELLENTESQUE ORNARE SEM</p>
              <p>LACINIA QUAM VENENATIS</p>
              <p>VESTIBULUM. DONEC</p>
            </div>
          </div>
        </div>

        {/* Right section with image and decorative elements */}
        <div className="flex-1 relative">
          {/* Main image placeholder */}
          <div className="absolute inset-0 bg-black">
            {/* Model silhouette overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/80 to-black/60">
              {/* Decorative pattern overlays */}
              <div className="absolute top-20 right-20 w-32 h-32 opacity-30">
                {/* Ornamental pattern 1 */}
                <div className="w-full h-full border-2 border-white/20 rounded-full relative">
                  <div className="absolute inset-4 border border-white/10 rounded-full"></div>
                  <div className="absolute inset-8 border border-white/10 rounded-full"></div>
                </div>
              </div>
              
              {/* Decorative dots pattern */}
              <div className="absolute top-32 right-40 grid grid-cols-4 gap-2">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-white/20 rounded-full"></div>
                ))}
              </div>
              
              {/* Jewelry chain simulation */}
              <div className="absolute bottom-40 right-32 flex flex-col space-y-1">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex space-x-1">
                    {[...Array(6)].map((_, j) => (
                      <div key={j} className="w-3 h-3 bg-white/40 rounded-full"></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Yellow circle accent */}
          <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-yellow-400 rounded-full opacity-90 z-10">
            {/* Inner texture pattern */}
            <div className="absolute inset-8 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full">
              <div className="absolute inset-4 bg-black/20 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decorative elements */}
      <div className="absolute bottom-8 left-8">
        {/* Copyright or brand mark */}
        <div className="w-12 h-12 border-2 border-black rounded-full flex items-center justify-center">
          <span className="text-black text-xs font-light">©</span>
        </div>
      </div>

      <div className="absolute bottom-8 right-8">
        {/* Navigation arrow/button */}
        <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Additional decorative elements scattered across the page */}
      <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-white/30 rounded-full"></div>
      <div className="absolute top-2/3 left-1/4 w-6 h-6 bg-white/20 rounded-full"></div>
      <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-yellow-400/40 rounded-full"></div>
      
      {/* Ornamental border elements */}
      <div className="absolute top-40 right-20 w-16 h-1 bg-white/20"></div>
      <div className="absolute top-60 right-16 w-1 h-16 bg-white/20"></div>
    </div>
  );
}
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h2>Vite + React</h2>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
       PLEASE Update the Vite / React logos to learn! <br/> Is this working  <strong>NOW!</strong>
      </p>
    </>
  )
}

export default App

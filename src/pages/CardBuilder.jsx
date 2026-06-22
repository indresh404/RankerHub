import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

const themes = [
  { id: 'dark', name: 'Dark Mode', color: '#0D1117' },
  { id: 'cyberpunk', name: 'Cyberpunk', color: '#00FF41' },
  { id: 'solarized', name: 'Solarized', color: '#002B36' },
  { id: 'glassmorphism', name: 'Glassmorphism', color: '#8b5cf6' },
];

const CardBuilder = () => {
  const { userData } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState('dark');
  const [copied, setCopied] = useState(false);

  // Fallback to "username" if no GitHub username is available during test
  const githubUsername = userData?.githubUsername || 'RankerHubUser';
  
  // The base URL of the site. In production this should be the live vercel domain
  // For local development, we'll use window.location.origin
  const baseUrl = window.location.origin;
  const devcardUrl = `${baseUrl}/api/devcard/${githubUsername}?theme=${selectedTheme}`;
  
  const markdownCode = `[![RankerHub Stats](${devcardUrl})](${baseUrl}/dashboard/profile/${githubUsername})`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Developer Card Builder
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Customize your dynamic RankerHub stats card and share it on your GitHub profile README.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            
            {/* Theme Selector */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Select Theme
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`flex items-center space-x-2 p-3 rounded-lg border transition-all ${
                      selectedTheme === theme.id
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                        : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div 
                      className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" 
                      style={{ backgroundColor: theme.color }}
                    />
                    <span className="text-sm font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Markdown Export */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Export Markdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Copy this code and paste it into your GitHub Profile README.md file.
              </p>
              
              <div className="relative group">
                <pre className="p-4 bg-slate-50 dark:bg-[#090D1A] rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap break-all">
                  {markdownCode}
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-2 right-2 p-2 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-500 dark:text-slate-400"
                  aria-label="Copy markdown"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            {/* Direct Link */}
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
              <a 
                href={devcardUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
              >
                <span>Open Raw SVG</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                Live Preview
              </h3>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-xs font-medium rounded-full flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span>Auto-updating</span>
              </span>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-[#090D1A] rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <motion.div
                key={selectedTheme}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
              >
                {/* 
                  Using an <img> tag to fetch the SVG directly from the API 
                  We append a timestamp during dev/preview to force refresh if needed,
                  though in production standard caching is fine.
                */}
                <img 
                  src={devcardUrl} 
                  alt={`${githubUsername}'s DevCard`}
                  className="w-full h-auto drop-shadow-xl"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                
                {/* Fallback Error State */}
                <div className="hidden flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                  <span className="text-sm font-medium">Failed to load preview. Is the API endpoint running?</span>
                  <p className="text-xs mt-2">Vercel API routes may not work via standard local Vite dev server without Vercel CLI.</p>
                </div>
              </motion.div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default CardBuilder;

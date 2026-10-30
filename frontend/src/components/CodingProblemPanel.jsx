import React from 'react';
import Editor from '@monaco-editor/react';
import { useThemeStore } from '../store/useThemeStore';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
  { id: 'typescript', label: 'TypeScript' },
];

const DIFFICULTY_COLORS = {
  easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
  hard: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30',
};

export default function CodingProblemPanel({
  problem,
  isGenerating,
  code,
  setCode,
  language,
  setLanguage,
  onRunCode,
  runningCode,
  codeOutput,
  executionResult,
}) {
  const { darkMode } = useThemeStore();

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (problem?.starterCode?.[newLang]) {
      setCode(problem.starterCode[newLang]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden">
      {/* Problem Description */}
      <div className="flex-shrink-0 overflow-y-auto border-b border-slate-200 dark:border-slate-800" style={{ maxHeight: '42%' }}>
        {isGenerating ? (
          <div className="p-4 flex items-center gap-3 text-slate-500 dark:text-slate-400">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm">Generating problem...</span>
          </div>
        ) : problem ? (
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{problem.title}</h3>
              {problem.difficulty && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex-shrink-0 capitalize ${DIFFICULTY_COLORS[problem.difficulty] || DIFFICULTY_COLORS.medium}`}>
                  {problem.difficulty}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{problem.description}</p>

            {problem.examples?.length > 0 && (
              <div className="space-y-2">
                {problem.examples.map((ex, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono">
                    <div className="text-slate-500 dark:text-slate-500"><span className="text-indigo-600 dark:text-indigo-400">Input:</span> {ex.input}</div>
                    <div className="text-slate-500 dark:text-slate-500"><span className="text-emerald-600 dark:text-emerald-400">Output:</span> {ex.output}</div>
                    {ex.explanation && (
                      <div className="text-slate-400 dark:text-slate-600 mt-1 italic">{ex.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {problem.constraints?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Constraints</p>
                <ul className="space-y-0.5">
                  {problem.constraints.map((c, i) => (
                    <li key={i} className="text-xs text-slate-500 dark:text-slate-500 font-mono">• {c}</li>
                  ))}
                </ul>
              </div>
            )}

            {problem.optimalComplexity && (
              <div className="flex gap-3 text-[10px] text-slate-400 dark:text-slate-600">
                <span>⏱ Expected: {problem.optimalComplexity.time}</span>
                <span>💾 Space: {problem.optimalComplexity.space}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-xs text-slate-400 dark:text-slate-600 italic">
            Problem will appear here when the coding round starts.
          </div>
        )}
      </div>

      {/* Editor Header */}
      <div className="flex items-center gap-2 px-3 h-10 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex-shrink-0">
        <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono font-bold uppercase tracking-wider">Solution</span>
        <select
          value={language}
          onChange={e => handleLanguageChange(e.target.value)}
          className="ml-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-700 dark:text-slate-300 px-2 py-0.5 focus:outline-none focus:border-indigo-500"
        >
          {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <button
          onClick={onRunCode}
          disabled={runningCode}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs px-3 py-1 rounded-md transition-colors font-semibold flex items-center gap-1.5"
        >
          {runningCode ? (
            <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Running...</>
          ) : '▶ Run'}
        </button>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={v => setCode(v || '')}
          theme={darkMode ? 'vs-dark' : 'light'}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Output Console */}
      <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" style={{ height: '28%' }}>
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800">
          <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono font-bold uppercase tracking-wider">Console</span>
          {executionResult && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ml-auto ${
              executionResult.passed
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : executionResult.statusId === 6
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
            }`}>
              {executionResult.statusDescription}
              {executionResult.time && ` · ${executionResult.time}s`}
            </span>
          )}
        </div>
        <pre className="flex-1 overflow-auto text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap p-2.5 h-full">
          {codeOutput || 'Click ▶ Run to execute your code...'}
        </pre>
      </div>
    </div>
  );
}

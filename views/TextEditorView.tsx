import React, { useState, useRef } from 'react';
import {
  Sparkles, AlertCircle, CheckCircle2, ChevronDown, ChevronUp,
  RotateCcw, Check, X, Type, Clock, FileText, BookOpen,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SuggestionType = 'grammar' | 'spelling' | 'punctuation' | 'style';
type Priority = 'high' | 'medium' | 'low';
type FilterTab = 'all' | SuggestionType;

interface Suggestion {
  id: string;
  type: SuggestionType;
  priority: Priority;
  original: string;
  suggestion: string;
  explanation: string;
}

interface AnalysisResult {
  overall_score: number;
  summary: string;
  strengths: string[];
  suggestions: Suggestion[];
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<SuggestionType, {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  dotColor: string;
  previewBg: string;
}> = {
  grammar: {
    label: 'Grammar',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-700',
    borderColor: 'border-l-orange-400',
    dotColor: 'bg-orange-400',
    previewBg: 'bg-orange-50',
  },
  spelling: {
    label: 'Spelling',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    borderColor: 'border-l-red-400',
    dotColor: 'bg-red-400',
    previewBg: 'bg-red-50',
  },
  punctuation: {
    label: 'Punctuation',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    borderColor: 'border-l-amber-400',
    dotColor: 'bg-amber-400',
    previewBg: 'bg-amber-50',
  },
  style: {
    label: 'Style',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-700',
    borderColor: 'border-l-indigo-400',
    dotColor: 'bg-indigo-400',
    previewBg: 'bg-indigo-50',
  },
};

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
};

const SCORE_LABEL = (s: number) =>
  s >= 90 ? 'Excellent' : s >= 75 ? 'Good' : s >= 60 ? 'Fair' : s >= 40 ? 'Needs Work' : 'Poor';

const SCORE_COLOR = (s: number) =>
  s >= 90 ? '#22c55e' : s >= 75 ? '#84cc16' : s >= 60 ? '#f59e0b' : s >= 40 ? '#f97316' : '#ef4444';

// ─── Score Ring ───────────────────────────────────────────────────────────────

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = SCORE_COLOR(score);

  return (
    <div className="relative flex-shrink-0 w-20 h-20 flex items-center justify-center">
      <svg width="80" height="80" className="-rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f3f4f6" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute text-center leading-none">
        <div className="text-xl font-bold text-gray-900">{score}</div>
      </div>
    </div>
  );
};

// ─── Suggestion Card ──────────────────────────────────────────────────────────

interface SuggestionCardProps {
  suggestion: Suggestion;
  isHighlighted: boolean;
  onApply: () => void;
  onDismiss: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  animationIndex: number;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion, isHighlighted, onApply, onDismiss, onMouseEnter, onMouseLeave, animationIndex,
}) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[suggestion.type];

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`
        border-l-4 ${cfg.borderColor} transition-colors duration-150
        ${isHighlighted ? 'bg-yellow-50/60' : 'bg-white hover:bg-gray-50/50'}
      `}
      style={{ animationDelay: `${animationIndex * 60}ms` }}
    >
      <div className="px-4 py-3.5">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
            {cfg.label}
          </span>
          <span title={`${suggestion.priority} priority`} className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[suggestion.priority]}`} />
          <div className="flex-1" />
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-gray-300 hover:text-gray-500 transition-colors p-0.5 rounded"
            aria-label={expanded ? 'Collapse explanation' : 'Expand explanation'}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* Before → After */}
        <div className={`${cfg.previewBg} rounded-lg p-3 mb-2.5 space-y-1.5 text-[13px] leading-snug`}>
          <div className="flex gap-2 items-baseline">
            <span className="text-[10px] font-bold text-gray-400 w-7 flex-shrink-0 pt-px">WAS</span>
            <span className="text-gray-500 line-through break-words">{suggestion.original}</span>
          </div>
          <div className="border-t border-gray-200/60 pt-1.5 flex gap-2 items-baseline">
            <span className="text-[10px] font-bold text-emerald-600 w-7 flex-shrink-0 pt-px">NOW</span>
            <span className="text-gray-800 font-medium break-words">{suggestion.suggestion}</span>
          </div>
        </div>

        {/* Explanation */}
        <p
          className={`text-xs text-gray-400 italic leading-relaxed mb-3 transition-all ${
            expanded ? '' : 'line-clamp-1'
          }`}
        >
          {suggestion.explanation}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onApply}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            <Check size={11} />
            Apply
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg bg-gray-100 text-gray-400 text-xs font-bold hover:bg-gray-200 hover:text-gray-600 transition-colors"
            aria-label="Dismiss suggestion"
          >
            <X size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Empty / Loading States ───────────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
      <Sparkles size={26} className="text-primary" />
    </div>
    <h3 className="font-bold text-gray-700 text-base mb-1.5">AI Writing Analysis</h3>
    <p className="text-sm text-gray-400 leading-relaxed max-w-[220px]">
      Enter your text and click "Analyze" to receive Claude&apos;s detailed feedback.
    </p>
    <div className="mt-6 grid grid-cols-2 gap-2 w-full max-w-[220px]">
      {(Object.keys(TYPE_CONFIG) as SuggestionType[]).map(type => (
        <div
          key={type}
          className={`${TYPE_CONFIG[type].previewBg} rounded-xl p-2.5 flex items-center gap-2`}
        >
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_CONFIG[type].dotColor}`} />
          <span className={`text-xs font-bold ${TYPE_CONFIG[type].badgeText}`}>
            {TYPE_CONFIG[type].label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const LoadingSkeleton: React.FC = () => (
  <div className="p-4 space-y-3 animate-pulse">
    {/* Score placeholder */}
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
      <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded-full w-2/3" />
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-4/5" />
      </div>
    </div>
    {/* Suggestion placeholders */}
    {[1, 2, 3].map(i => (
      <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-2.5">
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-5 bg-gray-100 rounded-full w-10" />
        </div>
        <div className="h-3 bg-gray-100 rounded-full w-full" />
        <div className="h-3 bg-gray-100 rounded-full w-3/4" />
        <div className="flex gap-2 pt-1">
          <div className="h-7 bg-gray-100 rounded-lg flex-1" />
          <div className="h-7 bg-gray-100 rounded-lg w-12" />
        </div>
      </div>
    ))}
    <p className="text-center text-xs text-gray-400 font-medium pt-1">
      Claude is analyzing your text…
    </p>
  </div>
);

// ─── Main View ────────────────────────────────────────────────────────────────

export const TextEditorView: React.FC = () => {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [strengthsOpen, setStrengthsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const apiUrl = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:3001';

  // Stats
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Analyze
  const analyzeText = async () => {
    if (text.trim().length < 10) {
      setError('Please enter at least 10 characters to analyze.');
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setFilter('all');
    setDismissedIds(new Set());
    setAppliedIds(new Set());
    setStrengthsOpen(false);

    try {
      const resp = await fetch(`${apiUrl}/api/text-editor/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ error: 'Network error' }));
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      const data: AnalysisResult = await resp.json();
      setAnalysis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Apply one suggestion
  const applySuggestion = (s: Suggestion) => {
    setText(prev => prev.replace(s.original, s.suggestion));
    setAppliedIds(prev => new Set([...prev, s.id]));
  };

  // Dismiss one suggestion
  const dismissSuggestion = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  // Highlight the matching text in the editor
  const highlightInEditor = (s: Suggestion) => {
    if (!textareaRef.current) return;
    const idx = text.indexOf(s.original);
    if (idx !== -1) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(idx, idx + s.original.length);
    }
    setHighlightedId(s.id);
  };

  // Counts
  const activeFor = (type?: SuggestionType) =>
    analysis?.suggestions.filter(
      s => !dismissedIds.has(s.id) && !appliedIds.has(s.id) && (!type || s.type === type)
    ).length ?? 0;

  const totalActive = activeFor();

  const visibleSuggestions = analysis?.suggestions.filter(
    s => !dismissedIds.has(s.id) && !appliedIds.has(s.id) && (filter === 'all' || s.type === filter)
  ) ?? [];

  // Apply all visible suggestions in one pass
  const applyAllVisible = () => {
    let current = text;
    const newApplied = new Set(appliedIds);
    visibleSuggestions.forEach(s => {
      current = current.replace(s.original, s.suggestion);
      newApplied.add(s.id);
    });
    setText(current);
    setAppliedIds(newApplied);
  };

  const appliedCount = appliedIds.size;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!loading && text.trim().length >= 10) analyzeText();
    }
  };

  const reset = () => {
    setAnalysis(null);
    setError(null);
    setFilter('all');
    setDismissedIds(new Set());
    setAppliedIds(new Set());
    setStrengthsOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-gray-100 px-5 py-3.5 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow shadow-primary/25 flex-shrink-0">
            <Sparkles size={17} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-gray-900 text-lg leading-tight">
              AI Writing Assistant
            </h1>
            <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
              Powered by Claude
            </p>
          </div>
          {analysis && (
            <div className="flex items-center gap-1.5">
              <div className={`text-[11px] font-bold px-2.5 py-1 rounded-full`}
                style={{ background: `${SCORE_COLOR(analysis.overall_score)}20`, color: SCORE_COLOR(analysis.overall_score) }}>
                {SCORE_LABEL(analysis.overall_score)} · {analysis.overall_score}/100
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col xl:flex-row gap-0 max-w-7xl mx-auto w-full p-4 lg:p-5 gap-4">

        {/* ─── Editor panel ─── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">

            {/* Document title */}
            <div className="border-b border-gray-100 px-5 py-3">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Untitled document…"
                className="w-full text-base font-bold text-gray-800 placeholder-gray-300 bg-transparent outline-none"
              />
            </div>

            {/* Textarea */}
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Start writing or paste your text here…\n\nThis AI editor analyzes grammar, spelling, punctuation, and style. Press Ctrl+Enter to analyze.`}
                className="w-full min-h-[380px] lg:min-h-[460px] p-5 text-gray-700 text-[15px] leading-[1.75] resize-none outline-none bg-transparent placeholder-gray-300"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              />
              {!text && (
                <div className="absolute bottom-5 right-5 text-gray-200 pointer-events-none">
                  <FileText size={44} strokeWidth={1} />
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div className="border-t border-gray-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Type size={13} />
                  <span><strong className="text-gray-600 font-bold">{wordCount}</strong> words</span>
                </span>
                <span>
                  <strong className="text-gray-600 font-bold">{charCount}</strong> chars
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={13} />
                  <strong className="text-gray-600 font-bold">{readingTime}</strong> min read
                </span>
                {appliedCount > 0 && (
                  <span className="flex items-center gap-1 text-emerald-500 font-bold">
                    <Check size={13} />
                    {appliedCount} applied
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {analysis && (
                  <button
                    onClick={reset}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    <RotateCcw size={13} />
                    Reset
                  </button>
                )}
                <button
                  onClick={analyzeText}
                  disabled={loading || text.trim().length < 10}
                  title="Analyze (Ctrl+Enter)"
                  className={`
                    flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                    ${loading || text.trim().length < 10
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary text-white shadow shadow-primary/30 hover:shadow-md hover:shadow-primary/40 hover:-translate-y-px active:translate-y-0'
                    }
                  `}
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} />
                      Analyze Text
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-px" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        {/* ─── Suggestions panel ─── */}
        <div className="xl:w-[380px] flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">

            {/* No analysis yet */}
            {!analysis && !loading && <EmptyState />}

            {/* Loading */}
            {loading && <LoadingSkeleton />}

            {/* Results */}
            {analysis && !loading && (
              <div className="animate-fade-in">

                {/* Score + Summary */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start gap-4">
                    <ScoreRing score={analysis.overall_score} />
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-2xl font-bold text-gray-900 leading-none">
                          {analysis.overall_score}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">/100</span>
                        <span
                          className="text-xs font-bold ml-1"
                          style={{ color: SCORE_COLOR(analysis.overall_score) }}
                        >
                          {SCORE_LABEL(analysis.overall_score)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{analysis.summary}</p>
                    </div>
                  </div>

                  {/* Type stat pills */}
                  <div className="grid grid-cols-4 gap-1.5 mt-4">
                    {(Object.keys(TYPE_CONFIG) as SuggestionType[]).map(type => {
                      const count = activeFor(type);
                      return (
                        <button
                          key={type}
                          onClick={() => setFilter(filter === type ? 'all' : type)}
                          className={`
                            rounded-lg py-2 px-1 text-center transition-all
                            ${filter === type
                              ? `${TYPE_CONFIG[type].previewBg} ring-1 ring-inset ${TYPE_CONFIG[type].badgeBg}`
                              : 'bg-gray-50 hover:bg-gray-100'
                            }
                          `}
                        >
                          <div className={`text-sm font-bold ${count > 0 ? TYPE_CONFIG[type].badgeText : 'text-gray-300'}`}>
                            {count}
                          </div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-tight">
                            {TYPE_CONFIG[type].label}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Strengths */}
                  {analysis.strengths?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => setStrengthsOpen(v => !v)}
                        className="w-full flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <CheckCircle2 size={14} />
                        {analysis.strengths.length} strength{analysis.strengths.length !== 1 ? 's' : ''} found
                        <div className="ml-auto">{strengthsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</div>
                      </button>
                      {strengthsOpen && (
                        <ul className="mt-2 space-y-1 animate-fade-in">
                          {analysis.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                              <span className="text-emerald-400 mt-0.5 flex-shrink-0">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Suggestion list */}
                {analysis.suggestions.length === 0 ? (
                  <div className="py-10 px-6 text-center">
                    <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                    <h3 className="font-bold text-gray-700 text-sm mb-1">Excellent writing!</h3>
                    <p className="text-xs text-gray-400">No improvements needed.</p>
                  </div>
                ) : (
                  <>
                    {/* Filter tabs */}
                    <div className="flex border-b border-gray-100 overflow-x-auto">
                      {(['all', 'grammar', 'spelling', 'punctuation', 'style'] as FilterTab[]).map(tab => {
                        const count = tab === 'all' ? totalActive : activeFor(tab as SuggestionType);
                        return (
                          <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`
                              flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-[11px] font-bold
                              whitespace-nowrap transition-all border-b-2 min-w-0
                              ${filter === tab
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                              }
                            `}
                          >
                            <span className="truncate capitalize">{tab}</span>
                            {count > 0 && (
                              <span className={`
                                flex-shrink-0 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold
                                ${filter === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}
                              `}>
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Cards */}
                    <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto overscroll-contain">
                      {visibleSuggestions.length === 0 ? (
                        <div className="py-8 px-4 text-center">
                          <BookOpen size={22} className="text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400 font-medium">
                            {totalActive === 0
                              ? 'All suggestions applied!'
                              : 'No suggestions in this category.'}
                          </p>
                        </div>
                      ) : (
                        visibleSuggestions.map((s, idx) => (
                          <SuggestionCard
                            key={s.id}
                            suggestion={s}
                            isHighlighted={highlightedId === s.id}
                            onApply={() => applySuggestion(s)}
                            onDismiss={() => dismissSuggestion(s.id)}
                            onMouseEnter={() => highlightInEditor(s)}
                            onMouseLeave={() => setHighlightedId(null)}
                            animationIndex={idx}
                          />
                        ))
                      )}
                    </div>

                    {/* Apply all footer */}
                    {visibleSuggestions.length > 1 && (
                      <div className="p-3 border-t border-gray-100 bg-gray-50/60">
                        <button
                          onClick={applyAllVisible}
                          className="w-full py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                        >
                          Apply all {filter !== 'all' ? `${TYPE_CONFIG[filter as SuggestionType].label.toLowerCase()} ` : ''}suggestions ({visibleSuggestions.length})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

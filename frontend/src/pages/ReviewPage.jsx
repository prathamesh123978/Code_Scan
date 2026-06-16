import React, { useState } from 'react';
import toast from 'react-hot-toast';
import CodeEditor from '../components/CodeEditor';
import ScoreBar from '../components/ScoreBar';
import ReviewCard from '../components/ReviewCard';
import { reviewCode, reviewGithub } from '../utils/api';
import s from './ReviewPage.module.css';

const LANGUAGES = ['Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'C++', 'C#', 'Ruby', 'PHP'];

const TABS = [
  { id: 'paste',  label: '{ } Paste Code' },
  { id: 'github', label: '⎇  GitHub PR'   },
];

export default function ReviewPage() {
  const [tab, setTab]         = useState('paste');
  const [code, setCode]       = useState('');
  const [prUrl, setPrUrl]     = useState('');
  const [language, setLang]   = useState('Python');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);

  async function handleReview() {
    if (tab === 'paste' && !code.trim()) { toast.error('Paste some code first'); return; }
    if (tab === 'github' && !prUrl.trim()) { toast.error('Enter a GitHub PR URL'); return; }

    setLoading(true);
    setResult(null);
    try {
      const data = tab === 'paste'
        ? await reviewCode(code, language)
        : await reviewGithub(prUrl);
      setResult(data);
      toast.success('Review complete!');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Review failed — is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  const totalIssues = result
    ? (result.bugs?.length || 0) + (result.code_smells?.length || 0) +
      (result.security_issues?.length || 0) + (result.performance_issues?.length || 0)
    : 0;

  return (
    <div className={s.page}>
      {/* Left Panel */}
      <div className={s.left}>
        <div className={s.tabs}>
          {TABS.map(t => (
            <button key={t.id} className={`${s.tab} ${tab === t.id ? s.activeTab : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'paste' ? (
          <>
            <div className={s.toolbar}>
              <label className={s.label}>Language</label>
              <select className={s.select} value={language} onChange={e => setLang(e.target.value)}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <CodeEditor value={code} onChange={setCode} language={language} />
          </>
        ) : (
          <div className={s.ghWrap}>
            <label className={s.label}>GitHub Pull Request URL</label>
            <input
              className={s.input}
              placeholder="https://github.com/owner/repo/pull/42"
              value={prUrl}
              onChange={e => setPrUrl(e.target.value)}
            />

          </div>
        )}

        <button className={s.btn} onClick={handleReview} disabled={loading}>
          {loading ? (
            <><span className={s.spinner} /> Analyzing…</>
          ) : (
            '▶  Run Review'
          )}
        </button>
      </div>

      {/* Right Panel */}
      <div className={s.right}>
        {!result && !loading && (
          <div className={s.empty}>
            <div className={s.emptyIcon}>{'</>'}</div>
            <p>Paste your code and hit<br /><strong>Run Review</strong> to get started</p>
          </div>
        )}

        {loading && (
          <div className={s.empty}>
            <div className={s.pulse}>⟳</div>
            <p>AI is reviewing your code…</p>
          </div>
        )}

        {result && (
          <div className={s.results}>
            <ScoreBar score={result.quality_score} />

            {result.summary && (
              <div className={s.summary}>
                <div className={s.sectionTitle}>Summary</div>
                <p>{result.summary}</p>
              </div>
            )}

            <div className={s.statsRow}>
              {[
                { label: 'Bugs',        count: result.bugs?.length,              color: 'var(--danger)'  },
                { label: 'Smells',      count: result.code_smells?.length,       color: 'var(--warn)'    },
                { label: 'Security',    count: result.security_issues?.length,   color: 'var(--accent2)' },
                { label: 'Performance', count: result.performance_issues?.length, color: 'var(--info)'   },
              ].map(st => (
                <div key={st.label} className={s.stat}>
                  <span className={s.statNum} style={{ color: st.color }}>{st.count || 0}</span>
                  <span className={s.statLabel}>{st.label}</span>
                </div>
              ))}
            </div>

            {totalIssues === 0 && (
              <div className={s.allGood}>✅ No issues found — great code!</div>
            )}

            {result.bugs?.map((item, i) => <ReviewCard key={i} type="bug" item={item} />)}
            {result.security_issues?.map((item, i) => <ReviewCard key={i} type="security" item={item} />)}
            {result.code_smells?.map((item, i) => <ReviewCard key={i} type="smell" item={item} />)}
            {result.performance_issues?.map((item, i) => <ReviewCard key={i} type="perf" item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
}

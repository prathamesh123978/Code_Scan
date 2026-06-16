import React, { useEffect, useState } from 'react';
import { getHistory, getReview, deleteReview } from '../utils/api';
import ReviewCard from '../components/ReviewCard';
import ScoreBar from '../components/ScoreBar';
import s from './Dashboard.module.css';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export default function Dashboard() {
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);

  useEffect(() => {
    getHistory(30)
      .then(d => setReviews(d.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  async function openDetail(id) {
    setSelected(id);
    setDetail(null);
    try {
      const d = await getReview(id);
      setDetail(d);
    } catch {
      setDetail(null);
    }
  }

  // ✅ new
  async function handleDelete(e, id) {
    e.stopPropagation(); // don't open the detail panel
    try {
      await deleteReview(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      if (selected === id) {
        setSelected(null);
        setDetail(null);
      }
    } catch {
      alert('Failed to delete review');
    }
  }

  const scoreColor = (sc) =>
    sc >= 80 ? 'var(--accent)' : sc >= 50 ? 'var(--warn)' : 'var(--danger)';

  return (
    <div className={s.page}>
      {/* Sidebar list */}
      <div className={s.sidebar}>
        <div className={s.sideHeader}>
          <span className={s.sideTitle}>Review History</span>
          <span className={s.count}>{reviews.length}</span>
        </div>

        {loading && <div className={s.msg}>Loading…</div>}
        {!loading && reviews.length === 0 && (
          <div className={s.msg}>No reviews yet.<br />Go review some code!</div>
        )}

        {reviews.map(r => (
          <div
            key={r.id}
            className={`${s.item} ${selected === r.id ? s.activeItem : ''}`}
            onClick={() => openDetail(r.id)}
          >
            <div className={s.itemTop}>
              <span className={s.lang}>{r.language || 'Unknown'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={s.itemScore} style={{ color: scoreColor(r.quality_score) }}>
                  {r.quality_score}
                </span>
                {/* ✅ Delete button */}
                <button
                  onClick={(e) => handleDelete(e, r.id)}
                  title="Delete review"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--danger)',
                    fontSize: '14px',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    lineHeight: 1,
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
            <div className={s.itemSummary}>{r.summary?.slice(0, 80) || '—'}{r.summary?.length > 80 ? '…' : ''}</div>
            <div className={s.itemDate}>{formatDate(r.created_at)}</div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      <div className={s.detail}>
        {!selected && (
          <div className={s.empty}>
            <div className={s.emptyIcon}>📋</div>
            <p>Select a review from the left to see details</p>
          </div>
        )}

        {selected && !detail && (
          <div className={s.empty}><p>Loading…</p></div>
        )}

        {detail && (
          <div className={s.detailInner}>
            <div className={s.detailHead}>
              <div>
                <div className={s.detailLang}>{detail.language}</div>
                <div className={s.detailDate}>{formatDate(detail.created_at)}</div>
              </div>
            </div>

            <ScoreBar score={detail.quality_score} />

            {detail.summary && (
              <div className={s.summary}>
                <div className={s.sectionTitle}>Summary</div>
                <p>{detail.summary}</p>
              </div>
            )}

            {detail.bugs?.map((item, i) => <ReviewCard key={i} type="bug" item={item} />)}
            {detail.security_issues?.map((item, i) => <ReviewCard key={i} type="security" item={item} />)}
            {detail.code_smells?.map((item, i) => <ReviewCard key={i} type="smell" item={item} />)}
            {detail.performance_issues?.map((item, i) => <ReviewCard key={i} type="perf" item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
}
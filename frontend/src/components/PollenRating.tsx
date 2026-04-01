import { useState, useEffect, useCallback } from 'react';

interface RatingSummary {
  count: number;
  avg: number;
  distribution: number[];
}

interface PollenRatingProps {
  cityEn: string;
  cityName: string;
}

const scoreLabels = ['很舒适', '较舒适', '一般', '不适', '很难受'];
const scoreEmojis = ['😊', '🙂', '😐', '😷', '🤧'];

function getFingerprint(): string {
  const stored = localStorage.getItem('pollen_fp');
  if (stored) return stored;
  const fp = Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem('pollen_fp', fp);
  return fp;
}

export default function PollenRating({ cityEn, cityName }: PollenRatingProps) {
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [myScore, setMyScore] = useState<number | null>(null);
  const [hovering, setHovering] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  // Check local storage for today's rating
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const key = `pollen_rating_${cityEn}_${today}`;
    const saved = localStorage.getItem(key);
    if (saved) setMyScore(parseInt(saved));
  }, [cityEn]);

  // Fetch community ratings
  useEffect(() => {
    fetch(`/api/ratings/${cityEn}`)
      .then(r => r.json())
      .then(setSummary)
      .catch(() => {});
  }, [cityEn]);

  const handleRate = useCallback(async (score: number) => {
    if (submitting) return;
    setSubmitting(true);
    setMyScore(score);

    const today = new Date().toISOString().split('T')[0];
    try {
      const res = await fetch('/api/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city_en: cityEn,
          score,
          fingerprint: getFingerprint(),
        }),
      });
      const data = await res.json();
      if (data.count !== undefined) {
        // Re-fetch full summary with distribution
        const summaryRes = await fetch(`/api/ratings/${cityEn}`);
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }
      localStorage.setItem(`pollen_rating_${cityEn}_${today}`, String(score));
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 2000);
    } catch {
      // revert on error
      setMyScore(null);
    } finally {
      setSubmitting(false);
    }
  }, [cityEn, submitting]);

  const displayScore = hovering ?? myScore;
  const totalVotes = summary?.count ?? 0;

  return (
    <div className="rating-section">
      <div className="rating-header">
        <span className="rating-title">今日{cityName}花粉体感</span>
        {totalVotes > 0 && (
          <span className="rating-vote-count">{totalVotes} 人评价</span>
        )}
      </div>

      <div className="rating-scores">
        {[1, 2, 3, 4, 5].map(score => (
          <button
            key={score}
            className={`rating-btn ${myScore === score ? 'active' : ''} ${hovering === score ? 'hover' : ''}`}
            onClick={() => handleRate(score)}
            onMouseEnter={() => setHovering(score)}
            onMouseLeave={() => setHovering(null)}
            disabled={submitting}
            title={scoreLabels[score - 1]}
          >
            <span className="rating-emoji">{scoreEmojis[score - 1]}</span>
            <span className="rating-label">{scoreLabels[score - 1]}</span>
          </button>
        ))}
      </div>

      {justSubmitted && (
        <div className="rating-feedback">感谢反馈!</div>
      )}

      {/* Community distribution bar */}
      {summary && totalVotes > 0 && (
        <div className="rating-community">
          <div className="rating-avg">
            社区平均: <strong>{summary.avg}</strong>/5
            {displayScore && (
              <span className="rating-my-label"> (你选了「{scoreLabels[(displayScore) - 1]}」)</span>
            )}
          </div>
          <div className="rating-dist">
            {summary.distribution.map((count, i) => {
              const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
              return (
                <div key={i} className="rating-dist-row">
                  <span className="rating-dist-label">{scoreEmojis[i]}</span>
                  <div className="rating-dist-bar">
                    <div
                      className="rating-dist-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="rating-dist-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

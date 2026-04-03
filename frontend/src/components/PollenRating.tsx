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

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const key = `pollen_rating_${cityEn}_${today}`;
    const saved = localStorage.getItem(key);
    if (saved) setMyScore(parseInt(saved));
  }, [cityEn]);

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
        const summaryRes = await fetch(`/api/ratings/${cityEn}`);
        setSummary(await summaryRes.json());
      }
      localStorage.setItem(`pollen_rating_${cityEn}_${today}`, String(score));
    } catch {
      setMyScore(null);
    } finally {
      setSubmitting(false);
    }
  }, [cityEn, submitting]);

  const totalVotes = summary?.count ?? 0;

  return (
    <div className="rating-strip">
      <span className="rating-strip-label">今日体感</span>
      <div className="rating-strip-btns">
        {[1, 2, 3, 4, 5].map(score => (
          <button
            key={score}
            className={`rating-chip ${myScore === score ? 'active' : ''}`}
            onClick={() => handleRate(score)}
            onMouseEnter={() => setHovering(score)}
            onMouseLeave={() => setHovering(null)}
            disabled={submitting}
            title={scoreLabels[score - 1]}
          >
            {scoreEmojis[score - 1]}
          </button>
        ))}
      </div>
      {totalVotes > 0 && (
        <span className="rating-strip-summary">
          {totalVotes}人评价 均分<strong>{summary!.avg}</strong>
        </span>
      )}
      {hovering && !myScore && (
        <span className="rating-strip-hint">{scoreLabels[hovering - 1]}</span>
      )}
    </div>
  );
}

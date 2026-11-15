import React, { useEffect, useState } from 'react';
import { STRINGS } from '../lib/i18n.js';

export default function GoalForm({ lang = 'en', onToggleLang, onGenerate, loading, error, onCancel }) {
  const t = STRINGS[lang] || STRINGS.en;
  const [goal, setGoal] = useState(lang === 'ja' ? '人工知能 (AI)' : 'Artificial Intelligence');
  const [months, setMonths] = useState(4);
  const [level, setLevel] = useState('beginner');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [scalePref, setScalePref] = useState('auto');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [customKey, setCustomKey] = useState(() => localStorage.getItem('user_gemini_key') || '');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => {
        const ct = r.headers.get('content-type');
        if (!r.ok || !ct?.includes('application/json')) throw new Error('Not JSON');
        return r.json();
      })
      .then(setHealth)
      .catch(() => {
        const key = import.meta.env.VITE_GEMINI_API_KEY?.trim() || localStorage.getItem('user_gemini_key');
        setHealth({ ok: true, ai: Boolean(key), model: key ? 'Gemini 2.5 Flash' : null });
      });
  }, []);

  // Swap default goal text when toggling EN <-> JA if unchanged
  useEffect(() => {
    if (lang === 'ja' && goal === 'Artificial Intelligence') setGoal('人工知能 (AI)');
    if (lang === 'en' && goal === '人工知能 (AI)') setGoal('Artificial Intelligence');
  }, [lang]);

  const submit = (e) => {
    e.preventDefault();
    if (!goal.trim() || loading) return;
    onGenerate({
      goal: goal.trim(),
      months: Number(months),
      level,
      hoursPerDay: Number(hoursPerDay),
      mountainScale: scalePref === 'auto' ? undefined : Number(scalePref),
    });
  };

  return (
    <div className="form-backdrop">
      <form className="goal-card glass" onSubmit={submit}>
        <div className="brand">
          <span className="brand-icon">🏔️</span>
          <div style={{ flex: 1 }}>
            <h1>{t.appTitle}</h1>
            <p className="tagline">{t.tagline}</p>
          </div>
          <button type="button" className="lang-switch" onClick={onToggleLang} title="Switch language / 言語切替">
            <span className={lang === 'en' ? 'active' : ''}>EN</span>
            <span className={lang === 'ja' ? 'active' : ''}>日本語</span>
          </button>
        </div>

        <label className="field">
          <span>{t.learningGoal}</span>
          <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={t.goalPlaceholder} maxLength={120} autoFocus />
        </label>
        <div className="chips">
          {t.suggestions.map((s) => (
            <button type="button" key={s} className={`chip ${goal === s ? 'active' : ''}`} onClick={() => setGoal(s)}>
              {s}
            </button>
          ))}
        </div>

        <div className="row">
          <label className="field">
            <span>{t.timeAvailable}</span>
            <select value={months} onChange={(e) => setMonths(e.target.value)}>
              {[1, 2, 3, 4, 5, 6, 9, 12].map((m) => (
                <option key={m} value={m}>
                  {t.monthsUnit(m)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t.currentLevel}</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="beginner">{t.levels.beginner}</option>
              <option value="intermediate">{t.levels.intermediate}</option>
              <option value="advanced">{t.levels.advanced}</option>
            </select>
          </label>
          <label className="field">
            <span>{t.hoursPerDay}</span>
            <input type="number" min={0.5} max={12} step={0.5} value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} />
          </label>
        </div>

        <div className="row" style={{ marginTop: '-4px' }}>
          <label className="field" style={{ flex: 1 }}>
            <span>{lang === 'ja' ? '⛰️ 登山規模 (Gemini 1〜10評価で山が変化)' : '⛰️ Mountain Scale (AI Rates 1–10 to shape mountain)'}</span>
            <select value={scalePref} onChange={(e) => setScalePref(e.target.value)}>
              <option value="auto">
                {lang === 'ja' ? '🤖 自動 (Geminiが目標の難易度・規模から1〜10で評価)' : '🤖 Auto (Gemini rates goal ambition 1–10)'}
              </option>
              <option value="1">1/10 — {lang === 'ja' ? 'なだらかな丘 (約850m・小さな丘陵)' : 'Gentle Hill (~850m, small mound)'}</option>
              <option value="3">3/10 — {lang === 'ja' ? '小山 (約2,500m・基礎習得)' : 'Small Mountain (~2,500m)'}</option>
              <option value="5">5/10 — {lang === 'ja' ? '標準アルプス (約4,400m・標準コース)' : 'Standard Alpine Peak (~4,400m)'}</option>
              <option value="7">7/10 — {lang === 'ja' ? '高山サミット (約6,200m・本格プロ級)' : 'High Alpine Summit (~6,200m, quite bigger)'}</option>
              <option value="10">10/10 — {lang === 'ja' ? 'エベレスト級巨大峰 (8,848m・最高峰)' : 'Colossal Everest Summit (8,848m, epic)'}</option>
            </select>
          </label>
        </div>

        {error && <div className="error">{error}</div>}

        <button className="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" /> {t.surveying}
            </>
          ) : (
            t.generateBtn
          )}
        </button>

        <div className="form-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${health?.ai ? 'ai' : 'demo'}`}>
              {health == null ? t.checkingAi : health.ai ? `✨ Gemini (${health.model})` : t.demoBadgeForm}
            </span>
            <button
              type="button"
              className="link"
              style={{ fontSize: '11px', opacity: 0.8 }}
              onClick={() => setShowKeyInput((v) => !v)}
              title="Custom Gemini API Key"
            >
              🔑 {showKeyInput ? (lang === 'ja' ? '閉じる' : 'Close') : 'API Key'}
            </button>
          </div>
          {onCancel && (
            <button type="button" className="link" onClick={onCancel}>
              {t.backToMountain}
            </button>
          )}
        </div>

        {showKeyInput && (
          <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
            <input
              type="password"
              placeholder={lang === 'ja' ? 'Google AI Studio APIキーを入力...' : 'Enter Gemini API key (AI Studio)...'}
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 10px', flex: 1, borderRadius: '8px' }}
            />
            <button
              type="button"
              className="chip active"
              onClick={() => {
                if (customKey.trim()) {
                  localStorage.setItem('user_gemini_key', customKey.trim());
                  setHealth({ ok: true, ai: true, model: 'Gemini (Custom)' });
                } else {
                  localStorage.removeItem('user_gemini_key');
                  const key = import.meta.env.VITE_GEMINI_API_KEY?.trim();
                  setHealth({ ok: true, ai: Boolean(key), model: key ? 'Gemini 2.5 Flash' : null });
                }
                setShowKeyInput(false);
              }}
            >
              {lang === 'ja' ? '保存' : 'Save'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

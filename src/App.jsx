import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MountainScene from './components/MountainScene.jsx';
import GoalForm from './components/GoalForm.jsx';
import TopicPanel from './components/TopicPanel.jsx';
import CampPanel from './components/CampPanel.jsx';
import Hud from './components/Hud.jsx';
import AvatarStoreModal from './components/AvatarStoreModal.jsx';
import { mockRoadmap } from '../shared/mockRoadmap.js';
import { ensureDifficultyAndRests } from '../shared/normalize.js';
import { buildCamps, durationMs, hoursProgress, isCampReached, newClock, simTime } from './lib/schedule.js';
import { getLocalTimeInfo } from './lib/timeOfDay.js';
import { localizeRoadmap, STRINGS } from './lib/i18n.js';
import { lofi } from './lib/lofi.js';
import { generateRoadmapClient, getClientApiKey } from './lib/geminiClient.js';
import {
  subscribeToAuth,
  loginWithGoogle,
  logoutUser,
  saveMountainToCloud,
  loadMountainFromCloud,
  loadSharedMountain,
} from './lib/firebase.js';

const STORAGE_KEY = 'knowledge-mountain-v1';

function loadSaved() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (s?.roadmap?.nodes?.length) {
      ensureDifficultyAndRests(s.roadmap.nodes);
      return s;
    }
  } catch {}
  return null;
}
const saved = loadSaved();

export default function App() {
  const [lang, setLang] = useState(saved?.lang || 'en');
  const [lofiPlaying, setLofiPlaying] = useState(false);
  const [roadmap, setRoadmap] = useState(saved?.roadmap ?? null);
  const [completed, setCompleted] = useState(saved?.completed ?? []);
  const [aiRestNotes, setAiRestNotes] = useState(saved?.aiRestNotes ?? {});
  const [selectedId, setSelectedId] = useState(null);
  const [selectedCampId, setSelectedCampId] = useState(null);
  const [restingCampId, setRestingCampId] = useState(saved?.restingCampId ?? null);
  const [overrideHour, setOverrideHour] = useState(null); // null = live local timezone clock
  const [showForm, setShowForm] = useState(!saved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  const prevSpeedRef = useRef(1);

  // Store & Avatar state (Monetization & Study-to-earn)
  const [coins, setCoins] = useState(saved?.coins ?? 500); // 500 starter bonus coins
  const [ownedAvatars, setOwnedAvatars] = useState(saved?.ownedAvatars ?? ['goku']);
  const [equippedAvatar, setEquippedAvatar] = useState(saved?.equippedAvatar ?? 'goku');
  const [showStore, setShowStore] = useState(false);

  // Auth & Cloud state
  const [user, setUser] = useState(null);
  const [cloudStatus, setCloudStatus] = useState('idle'); // idle | syncing | saved | error
  const [isSpectator, setIsSpectator] = useState(false);
  const [spectatorOwner, setSpectatorOwner] = useState('');

  const [clock, setClock] = useState(
    saved ? saved.clock ?? newClock(Date.parse(saved.roadmap?.createdAt) || Date.now()) : null
  );
  const [realNow, setRealNow] = useState(Date.now());

  const s = STRINGS[lang] || STRINGS.en;
  const viewRoadmap = useMemo(() => localizeRoadmap(roadmap, lang), [roadmap, lang]);

  useEffect(() => {
    const id = setInterval(() => setRealNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  // Save to local storage for offline / quick restore
  useEffect(() => {
    if (roadmap && !isSpectator) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          lang,
          roadmap,
          completed,
          clock,
          restingCampId,
          aiRestNotes,
          coins,
          ownedAvatars,
          equippedAvatar,
        })
      );
    }
  }, [lang, roadmap, completed, clock, restingCampId, aiRestNotes, coins, ownedAvatars, equippedAvatar, isSpectator]);

  // Auth listener & load user's cloud mountain
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const urlParams = new URLSearchParams(window.location.search);
        const climbId = urlParams.get('climb');
        if (!climbId) {
          try {
            setCloudStatus('syncing');
            const cloudData = await loadMountainFromCloud(authUser.uid);
            if (cloudData?.roadmap) {
              ensureDifficultyAndRests(cloudData.roadmap.nodes);
              setRoadmap(cloudData.roadmap);
              setCompleted(cloudData.completed || []);
              if (cloudData.clock) setClock(cloudData.clock);
              setRestingCampId(cloudData.restingCampId || null);
              setAiRestNotes(cloudData.aiRestNotes || {});
              if (cloudData.lang) setLang(cloudData.lang);
              if (cloudData.coins !== undefined) setCoins(cloudData.coins);
              if (cloudData.ownedAvatars) setOwnedAvatars(cloudData.ownedAvatars);
              if (cloudData.equippedAvatar) setEquippedAvatar(cloudData.equippedAvatar);
              setShowForm(false);
              showToast(`☁️ ${authUser.displayName || 'Climber'}, your mountain was loaded from cloud!`);
            } else if (roadmap) {
              // Sync current local mountain to user's new account
              await saveMountainToCloud(
                authUser.uid,
                { roadmap, completed, clock, restingCampId, aiRestNotes, lang, coins, ownedAvatars, equippedAvatar },
                authUser
              );
            }
            setCloudStatus('saved');
          } catch (e) {
            console.warn('[Cloud] Load user mountain failed:', e);
            setCloudStatus('idle');
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Spectator mode: check if `?climb=UID` is in the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const climbId = urlParams.get('climb');
    if (climbId) {
      loadSharedMountain(climbId).then((sharedData) => {
        if (sharedData?.roadmap) {
          setIsSpectator(true);
          setSpectatorOwner(sharedData.user?.displayName || 'Adventurer');
          ensureDifficultyAndRests(sharedData.roadmap.nodes);
          setRoadmap(sharedData.roadmap);
          setCompleted(sharedData.completed || []);
          if (sharedData.clock) setClock(sharedData.clock);
          setRestingCampId(sharedData.restingCampId || null);
          setAiRestNotes(sharedData.aiRestNotes || {});
          if (sharedData.lang) setLang(sharedData.lang);
          if (sharedData.equippedAvatar) setEquippedAvatar(sharedData.equippedAvatar);
          setShowForm(false);
          showToast(`👀 Exploring ${sharedData.user?.displayName || 'Adventurer'}'s Mountain!`);
        }
      });
    }
  }, []);

  // Cloud Auto-Sync: debounced save to Firestore when logged in
  useEffect(() => {
    if (!user || isSpectator || !roadmap) return;
    setCloudStatus('syncing');
    const timer = setTimeout(async () => {
      try {
        await saveMountainToCloud(
          user.uid,
          { roadmap, completed, clock, restingCampId, aiRestNotes, lang, coins, ownedAvatars, equippedAvatar },
          user
        );
        setCloudStatus('saved');
      } catch (err) {
        console.warn('[Cloud] Auto-save error:', err);
        setCloudStatus('error');
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [user, isSpectator, roadmap, completed, clock, restingCampId, aiRestNotes, lang, coins, ownedAvatars, equippedAvatar]);

  const camps = useMemo(
    () => (roadmap ? buildCamps(roadmap.nodes, aiRestNotes, lang) : []),
    [roadmap, aiRestNotes, lang]
  );

  // Local timezone time-of-day
  const minuteBucket = Math.floor(realNow / 60000);
  const timeInfo = useMemo(
    () => getLocalTimeInfo(overrideHour, new Date(minuteBucket * 60000)),
    [overrideHour, minuteBucket]
  );

  useEffect(() => {
    lofi.setMood({ resting: Boolean(restingCampId), night: Boolean(timeInfo?.isNight) });
  }, [restingCampId, timeInfo?.isNight]);

  const toggleLang = useCallback(() => {
    setLang((l) => (l === 'en' ? 'ja' : 'en'));
  }, []);

  const toggleLofi = useCallback(() => {
    setLofiPlaying(lofi.toggle());
  }, []);

  // ---- Countdown / pace ----
  const total = roadmap ? durationMs(roadmap) : 1;
  const simNow = clock ? simTime(clock, realNow) : realNow;
  const elapsed = clock ? Math.min(total, Math.max(0, simNow - clock.startedAt)) : 0;
  const paceFrac = Math.round((elapsed / total) * 10000) / 10000;
  const timeUp = roadmap && elapsed >= total;

  useEffect(() => {
    if (timeUp && clock?.speed > 1) {
      setClock((c) => ({ ...c, anchorReal: Date.now(), anchorSim: c.startedAt + total, speed: 1 }));
    }
  }, [timeUp, clock?.speed, total]);

  const setSpeed = useCallback((speed) => {
    if (speed > 0) setRestingCampId(null);
    setClock((c) => {
      const now = Date.now();
      return { ...c, anchorReal: now, anchorSim: simTime(c, now), speed };
    });
  }, []);

  const restartClock = () => {
    setRestingCampId(null);
    setClock(newClock());
  };

  const selectTopic = useCallback((id) => {
    setSelectedId(id);
    if (id) setSelectedCampId(null);
  }, []);

  const selectCamp = useCallback((campId) => {
    setSelectedCampId(campId);
    if (campId) setSelectedId(null);
  }, []);

  const showToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const handleLogin = async () => {
    try {
      setCloudStatus('syncing');
      const authUser = await loginWithGoogle();
      showToast(`👋 Signed in as ${authUser.displayName || 'Climber'}!`);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        showToast('⚠️ Google sign-in cancelled or failed.');
      }
      setCloudStatus('idle');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
      setCloudStatus('idle');
      showToast('👋 Signed out. Working in local guest mode.');
    } catch (err) {
      console.warn('Sign-out error:', err);
    }
  };

  const handleShare = () => {
    if (!user) {
      showToast('🔑 Please sign in with Google to share your mountain link!');
      return;
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}?climb=${user.uid}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(
        () => showToast(s.linkCopied),
        () => prompt('Copy your shareable mountain link:', shareUrl)
      );
    } else {
      prompt('Copy your shareable mountain link:', shareUrl);
    }
  };

  const exitSpectator = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    setIsSpectator(false);
    setSpectatorOwner('');
    const prev = loadSaved();
    if (prev?.roadmap) {
      setRoadmap(prev.roadmap);
      setCompleted(prev.completed || []);
      setClock(prev.clock || null);
      setRestingCampId(prev.restingCampId || null);
      setAiRestNotes(prev.aiRestNotes || {});
      setShowForm(false);
    } else {
      setShowForm(true);
    }
  };

  const pauseAtCamp = useCallback((campId) => {
    setClock((c) => {
      if (!c) return c;
      if (c.speed > 0) prevSpeedRef.current = c.speed;
      const now = Date.now();
      return { ...c, anchorReal: now, anchorSim: simTime(c, now), speed: 0 };
    });
    setRestingCampId(campId);
  }, []);

  const toggleRestAtCamp = (campId) => {
    if (restingCampId === campId) {
      setRestingCampId(null);
      setSpeed(prevSpeedRef.current || 1);
      showToast(s.toastPackedUp);
    } else {
      pauseAtCamp(campId);
      const campName = campId === 'base' ? s.baseCamp : camps.find((c) => c.id === campId)?.name || 'Camp';
      showToast(s.toastRestingAt(campName));
    }
  };

  const resumeClimb = () => {
    if (!restingCampId) return;
    setRestingCampId(null);
    setSpeed(prevSpeedRef.current || 1);
    showToast(s.toastResumed);
  };

  const doneSet = useMemo(() => new Set(completed), [completed]);
  const isDone = useCallback((id) => doneSet.has(id), [doneSet]);
  const statusOf = useCallback(
    (n) => (doneSet.has(n.id) ? 'completed' : n.prerequisites.every((p) => doneSet.has(p)) ? 'available' : 'locked'),
    [doneSet]
  );

  const hoursSinceRest = useMemo(() => {
    if (!roadmap) return 0;
    const campNodeIds = new Set(camps.map((c) => c.nodeId));
    let sum = 0;
    for (const id of completed) {
      const n = roadmap.nodes.find((x) => x.id === id);
      if (n) sum += n.hours;
      if (campNodeIds.has(id)) sum = 0;
    }
    return sum;
  }, [roadmap, completed, camps]);

  const generate = async (input) => {
    setLoading(true);
    setError('');
    let rm;
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, lang }),
      });
      const ct = res.headers.get('content-type');
      if (!res.ok || !ct?.includes('application/json')) throw new Error(`Server returned ${res.status}`);
      rm = await res.json();
    } catch {
      if (getClientApiKey()) {
        try {
          rm = await generateRoadmapClient({ ...input, lang });
        } catch {
          rm = { ...mockRoadmap(input), warning: 'AI call failed — showing demo roadmap instead.' };
        }
      } else {
        rm = { ...mockRoadmap(input), warning: roadmap ? undefined : 'Running in demo mode (ready for Firebase).' };
      }
    }
    ensureDifficultyAndRests(rm.nodes);
    setLoading(false);
    setRoadmap(rm);
    setCompleted([]);
    setAiRestNotes({});
    setRestingCampId(null);
    setClock(newClock());
    setSelectedId(null);
    setSelectedCampId(null);
    setShowForm(false);
    showToast(rm.warning || s.toastReady(rm.nodes.length));
  };

  const complete = (id, opts = {}) => {
    if (isSpectator) {
      showToast('👀 Spectator mode: You are viewing another climber’s mountain.');
      return;
    }
    const node = viewRoadmap.nodes.find((n) => n.id === id);
    const prevFrac = hoursProgress(roadmap.nodes, completed).frac;
    const next = [...completed, id];
    const nextFrac = hoursProgress(roadmap.nodes, next).frac;
    setCompleted(next);

    const isLast = next.length === roadmap.nodes.length;
    const shouldRest = !isLast && Boolean(opts.shouldRest ?? node.restAfter);
    let nextRestNotes = aiRestNotes;
    if (shouldRest && opts.restReason) {
      nextRestNotes = { ...aiRestNotes, [id]: opts.restReason };
      setAiRestNotes(nextRestNotes);
    }

    const updatedCamps = buildCamps(roadmap.nodes, nextRestNotes, lang);
    const directCamp = updatedCamps.find((c) => c.nodeId === id);
    const crossedCamp =
      directCamp ||
      [...updatedCamps]
        .reverse()
        .find((c) => !isCampReached(c, completed, prevFrac) && isCampReached(c, next, nextFrac));

    const unlocked = roadmap.nodes.filter(
      (n) => !next.includes(n.id) && n.prerequisites.includes(id) && n.prerequisites.every((p) => next.includes(p))
    );

    const earnedCoins = (node.difficulty || 3) * 15 + 10;
    setCoins((c) => c + earnedCoins);

    if (isLast) {
      if (restingCampId) {
        setRestingCampId(null);
        setSpeed(prevSpeedRef.current || 1);
      }
      setCoins((c) => c + 500);
      showToast(`${s.toastSummit} 🏆 +500 Summit Coins!`);
    } else if (shouldRest && crossedCamp) {
      pauseAtCamp(crossedCamp.id);
      setSelectedId(null);
      setSelectedCampId(crossedCamp.id);
      showToast(`${s.toastToughTestRest(node.difficulty || 4, crossedCamp.name)} 🪙 +${earnedCoins} Coins!`);
    } else {
      if (restingCampId) {
        setRestingCampId(null);
        setSpeed(prevSpeedRef.current || 1);
      }
      showToast(`${s.toastClimbed(node.title, unlocked.length)} 🪙 +${earnedCoins} Coins!`);
    }
  };

  const handleEquipAvatar = (avatarId) => {
    setEquippedAvatar(avatarId);
    showToast(lang === 'ja' ? '🥋 アバターを装備しました！' : '🥋 Avatar equipped!');
  };

  const handleBuyAvatar = (avatarItem) => {
    if (coins < avatarItem.price) {
      showToast(lang === 'ja' ? '⚠️ コインが不足しています。' : '⚠️ Not enough Climb Coins.');
      return;
    }
    setCoins((c) => c - avatarItem.price);
    setOwnedAvatars((prev) => (prev.includes(avatarItem.id) ? prev : [...prev, avatarItem.id]));
    setEquippedAvatar(avatarItem.id);
    showToast(
      lang === 'ja'
        ? `🎉 ${avatarItem.nameJa} を購入＆装備しました！`
        : `🎉 Unlocked & equipped ${avatarItem.name}!`
    );
  };

  const handleBuyCoins = (coinsAmount, priceUsd) => {
    setCoins((c) => c + coinsAmount);
    showToast(
      lang === 'ja'
        ? `💎 ${coinsAmount.toLocaleString()} コインを購入しました (${priceUsd})！`
        : `💎 Purchased ${coinsAmount.toLocaleString()} Coins (${priceUsd})!`
    );
  };

  const handleOpenStore = useCallback(() => setShowStore(true), []);
  const handleCloseStore = useCallback(() => setShowStore(false), []);

  const undo = (id) => {
    if (isSpectator) return;
    setCompleted((c) => c.filter((x) => x !== id));
  };

  const selected = viewRoadmap?.nodes.find((n) => n.id === selectedId) || null;
  const canUndo = selected
    ? !roadmap.nodes.some((n) => doneSet.has(n.id) && n.prerequisites.includes(selected.id)) && !isSpectator
    : false;
  const phaseLabel = timeInfo ? s.phases[timeInfo.phase] || timeInfo.phase : '';

  const climberDisplayName = isSpectator
    ? spectatorOwner
    : user?.displayName
      ? user.displayName.split(' ')[0]
      : null;

  return (
    <div className="app">
      {viewRoadmap && (
        <MountainScene
          lang={lang}
          climberName={climberDisplayName}
          roadmap={viewRoadmap}
          camps={camps}
          timeInfo={timeInfo}
          statusOf={statusOf}
          completed={completed}
          selectedId={selectedId}
          onSelect={selectTopic}
          paceFrac={paceFrac}
          restingCampId={restingCampId}
          onSelectCamp={selectCamp}
          equippedAvatar={equippedAvatar}
          onOpenStore={handleOpenStore}
          coins={coins}
        />
      )}
      {!viewRoadmap && <div className="empty-bg" />}

      {viewRoadmap && !showForm && (
        <>
          <Hud
            lang={lang}
            onToggleLang={toggleLang}
            lofiPlaying={lofiPlaying}
            onToggleLofi={toggleLofi}
            user={user}
            cloudStatus={cloudStatus}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onShare={handleShare}
            isSpectator={isSpectator}
            spectatorOwner={spectatorOwner}
            onExitSpectator={exitSpectator}
            roadmap={viewRoadmap}
            camps={camps}
            timeInfo={timeInfo}
            overrideHour={overrideHour}
            onOverrideHour={setOverrideHour}
            completed={completed}
            statusOf={statusOf}
            onSelect={selectTopic}
            onNew={() => setShowForm(true)}
            remainingMs={total - elapsed}
            paceFrac={paceFrac}
            speed={clock?.speed ?? 1}
            onSpeed={setSpeed}
            onRestart={restartClock}
            restingCampId={restingCampId}
            onSelectCamp={selectCamp}
            onResumeClimb={resumeClimb}
            coins={coins}
            onOpenStore={handleOpenStore}
          />
          <TopicPanel
            lang={lang}
            node={selected}
            roadmap={viewRoadmap}
            statusOf={statusOf}
            isDone={isDone}
            canUndo={canUndo}
            hoursSinceRest={hoursSinceRest}
            onComplete={complete}
            onUndo={undo}
            onSelect={selectTopic}
            onClose={() => setSelectedId(null)}
          />
          <CampPanel
            lang={lang}
            campId={selectedCampId}
            camps={camps}
            roadmap={viewRoadmap}
            completed={completed}
            restingCampId={restingCampId}
            onToggleRest={toggleRestAtCamp}
            onSelectTopic={selectTopic}
            onClose={() => setSelectedCampId(null)}
          />
          <div className="hint-bar">{s.hintBar(timeInfo.icon, timeInfo.timeStr, phaseLabel)}</div>
        </>
      )}

      {showStore && (
        <AvatarStoreModal
          lang={lang}
          coins={coins}
          ownedAvatars={ownedAvatars}
          equippedAvatar={equippedAvatar}
          onEquip={handleEquipAvatar}
          onBuyAvatar={handleBuyAvatar}
          onBuyCoins={handleBuyCoins}
          onClose={handleCloseStore}
        />
      )}

      {showForm && (
        <GoalForm
          lang={lang}
          onToggleLang={toggleLang}
          onGenerate={generate}
          loading={loading}
          error={error}
          onCancel={roadmap ? () => setShowForm(false) : null}
        />
      )}

      {toast && <div className="toast glass">{toast}</div>}
    </div>
  );
}

import React, { useState } from 'react';
import { AVATAR_CATALOG, COIN_PACKS, LANDSCAPE_CATALOG } from '../lib/avatarCatalog.js';

export default function AvatarStoreModal({
  lang = 'en',
  coins = 500,
  ownedAvatars = ['goku'],
  equippedAvatar = 'goku',
  ownedLandscapes = ['default'],
  equippedLandscape = 'default',
  onEquip,
  onBuyAvatar,
  onEquipLandscape,
  onBuyLandscape,
  onBuyCoins,
  onClose,
}) {
  const [tab, setTab] = useState('avatars'); // 'avatars' | 'landscapes' | 'coins' | 'earn'
  const [checkoutPack, setCheckoutPack] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const isJa = lang === 'ja';

  const handleConfirmPurchase = (pack) => {
    setProcessing(true);
    setTimeout(() => {
      onBuyCoins(pack.coins, pack.priceUsd);
      setProcessing(false);
      setSuccessMsg(
        isJa
          ? `🎉 購入完了！+${pack.coins.toLocaleString()} コインが付与されました！`
          : `🎉 Purchase successful! +${pack.coins.toLocaleString()} Coins added!`
      );
      setTimeout(() => {
        setCheckoutPack(null);
        setSuccessMsg('');
      }, 2000);
    }, 1000);
  };

  return (
    <div className="store-backdrop" onClick={onClose}>
      <div className="store-modal glass" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="store-header">
          <div className="store-title-wrap">
            <span className="store-logo">🛍️</span>
            <div>
              <h2>{isJa ? 'アバターストア & プロショップ' : 'Summit Avatar & Pro Shop'}</h2>
              <p className="store-subtitle">
                {isJa
                  ? '3Dアバター、ギア、オーラをカスタマイズして学習の山を登ろう'
                  : 'Customize your 3D climber with gear, outfits, and auras'}
              </p>
            </div>
          </div>

          <div className="store-header-right">
            <div className="user-coin-balance" title="Your Climb Coins">
              <span className="coin-icon">🪙</span>
              <span className="coin-count">{coins.toLocaleString()}</span>
              <span className="coin-lbl">{isJa ? 'コイン' : 'Coins'}</span>
            </div>
            <button
              className="topup-btn"
              onClick={() => setTab('coins')}
              title={isJa ? 'コインを購入' : 'Get Coins'}
            >
              + {isJa ? 'チャージ' : 'Get Coins'}
            </button>
            <button className="close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="store-tabs">
          <button
            className={`store-tab-btn ${tab === 'avatars' ? 'active' : ''}`}
            onClick={() => setTab('avatars')}
          >
            🥋 {isJa ? 'アバター & 衣装' : 'Avatars & Outfits'}
          </button>
          <button
            className={`store-tab-btn ${tab === 'landscapes' ? 'active' : ''}`}
            onClick={() => setTab('landscapes')}
          >
            🎄 {isJa ? '景観 & テーマ' : 'Landscapes'}
          </button>
          <button
            className={`store-tab-btn ${tab === 'coins' ? 'active' : ''}`}
            onClick={() => setTab('coins')}
          >
            💰 {isJa ? 'コイン購入' : 'Coin Packs'}
          </button>
          <button
            className={`store-tab-btn ${tab === 'earn' ? 'active' : ''}`}
            onClick={() => setTab('earn')}
          >
            🏆 {isJa ? '学習で無料獲得' : 'Study to Earn'}
          </button>
        </div>

        {/* Tab 1: Avatars & Outfits */}
        {tab === 'avatars' && (
          <div className="store-content">
            <div className="avatar-grid">
              {AVATAR_CATALOG.map((item) => {
                const isOwned = ownedAvatars.includes(item.id);
                const isEquipped = equippedAvatar === item.id;
                const canAfford = coins >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`avatar-card ${isEquipped ? 'equipped' : ''}`}
                    style={{ '--accent-color': item.color }}
                  >
                    <div className="card-top-bar">
                      <span className="rarity-badge" style={{ backgroundColor: `${item.rarityColor}25`, color: item.rarityColor, borderColor: item.rarityColor }}>
                        {item.rarity}
                      </span>
                      <span className="avatar-theme-tag">{item.theme}</span>
                    </div>

                    <div className="avatar-preview-box">
                      <div className="avatar-big-icon">{item.icon}</div>
                      <div className="avatar-glow" style={{ background: item.color }} />
                    </div>

                    <h3 className="avatar-name">{isJa ? item.nameJa : item.name}</h3>
                    <p className="avatar-desc">{isJa ? item.descriptionJa : item.description}</p>

                    <div className="avatar-features-list">
                      {(isJa ? item.featuresJa : item.features).map((feat, i) => (
                        <div key={i} className="feat-chip">
                          ✓ {feat}
                        </div>
                      ))}
                    </div>

                    <div className="card-footer">
                      <div className="price-tag">
                        {item.price === 0 ? (
                          <span className="free-tag">{isJa ? '無料' : 'Free'}</span>
                        ) : (
                          <>
                            <span className="coin-sym">🪙</span>
                            <span className="price-num">{item.price}</span>
                            <span className="usd-alt">({item.priceUsd})</span>
                          </>
                        )}
                      </div>

                      {isEquipped ? (
                        <button className="action-btn equipped-btn" disabled>
                          ✓ {isJa ? '装備中' : 'Equipped'}
                        </button>
                      ) : isOwned ? (
                        <button
                          className="action-btn equip-btn"
                          onClick={() => onEquip(item.id)}
                        >
                          {isJa ? '装備する' : 'Equip'}
                        </button>
                      ) : (
                        <button
                          className={`action-btn buy-btn ${!canAfford ? 'disabled' : ''}`}
                          onClick={() => {
                            if (canAfford) {
                              onBuyAvatar(item);
                            } else {
                              setTab('coins');
                            }
                          }}
                        >
                          {canAfford
                            ? isJa
                              ? `購入 (🪙${item.price})`
                              : `Unlock (🪙${item.price})`
                            : isJa
                            ? 'コイン不足'
                            : 'Get Coins'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Landscapes & Themes */}
        {tab === 'landscapes' && (
          <div className="store-content">
            <div className="avatar-grid">
              {LANDSCAPE_CATALOG.map((item) => {
                const isOwned = ownedLandscapes.includes(item.id);
                const isEquipped = equippedLandscape === item.id;
                const canAfford = coins >= item.price;

                return (
                  <div
                    key={item.id}
                    className={`avatar-card ${isEquipped ? 'equipped' : ''}`}
                    style={{ '--accent-color': item.color }}
                  >
                    <div className="card-top-bar">
                      <span
                        className="rarity-badge"
                        style={{
                          backgroundColor: `${item.rarityColor}25`,
                          color: item.rarityColor,
                          borderColor: item.rarityColor,
                        }}
                      >
                        {item.rarity}
                      </span>
                      <span className="avatar-theme-tag">Environment</span>
                    </div>

                    <div className="avatar-preview-box">
                      <div className="avatar-big-icon">{item.icon}</div>
                      <div className="avatar-glow" style={{ background: item.color }} />
                    </div>

                    <h3 className="avatar-name">{isJa ? item.nameJa : item.name}</h3>
                    <p className="avatar-desc">{isJa ? item.descriptionJa : item.description}</p>

                    <div className="avatar-features-list">
                      {(isJa ? item.featuresJa : item.features).map((feat, i) => (
                        <div key={i} className="feat-chip">
                          ✓ {feat}
                        </div>
                      ))}
                    </div>

                    <div className="card-footer">
                      <div className="price-tag">
                        {item.price === 0 ? (
                          <span className="free-tag">{isJa ? '無料' : 'Free'}</span>
                        ) : (
                          <>
                            <span className="coin-sym">🪙</span>
                            <span className="price-num">{item.price}</span>
                            <span className="usd-alt">({item.priceUsd})</span>
                          </>
                        )}
                      </div>

                      {isEquipped ? (
                        <button className="action-btn equipped-btn" disabled>
                          ✓ {isJa ? '適用中' : 'Active'}
                        </button>
                      ) : isOwned ? (
                        <button
                          className="action-btn equip-btn"
                          onClick={() => onEquipLandscape(item.id)}
                        >
                          {isJa ? '適用する' : 'Apply'}
                        </button>
                      ) : (
                        <button
                          className={`action-btn buy-btn ${!canAfford ? 'disabled' : ''}`}
                          onClick={() => {
                            if (canAfford) {
                              onBuyLandscape(item);
                            } else {
                              setTab('coins');
                            }
                          }}
                        >
                          {canAfford
                            ? isJa
                              ? `購入 (🪙${item.price})`
                              : `Unlock (🪙${item.price})`
                            : isJa
                            ? 'コイン不足'
                            : 'Get Coins'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Coin Packs */}
        {tab === 'coins' && (
          <div className="store-content">
            <div className="coin-packs-header">
              <h3>{isJa ? 'コインパックを選択' : 'Select a Coin Pack'}</h3>
              <p>
                {isJa
                  ? 'プレミアムアバターや限定エフェクトを即座にアンロックできます。'
                  : 'Instantly unlock premium avatars, mythical gear, and exclusive aura effects.'}
              </p>
            </div>

            <div className="coin-packs-grid">
              {COIN_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={`coin-pack-card ${pack.popular ? 'popular' : ''}`}
                >
                  {pack.popular && (
                    <div className="popular-badge">
                      ★ {isJa ? '一番人気' : 'MOST POPULAR'}
                    </div>
                  )}
                  <div className="pack-icon">{pack.icon}</div>
                  <h4 className="pack-title">{isJa ? pack.nameJa : pack.name}</h4>
                  <div className="pack-coins">
                    <span className="coin-symbol">🪙</span>
                    <span className="pack-coin-val">{pack.coins.toLocaleString()}</span>
                  </div>
                  {pack.bonus && <div className="pack-bonus">{pack.bonus}</div>}
                  <button
                    className="pack-buy-btn"
                    onClick={() => setCheckoutPack(pack)}
                  >
                    {isJa ? `${pack.priceUsd} で購入` : `Buy for ${pack.priceUsd}`}
                  </button>
                </div>
              ))}
            </div>

            <div className="checkout-guarantee">
              <span>🔒 256-bit Secure Simulated Checkout</span>
              <span>⚡ Instant Cloud Sync & Permanent Inventory</span>
              <span>💡 Or earn 100% free by completing study milestones!</span>
            </div>
          </div>
        )}

        {/* Tab 3: Study to Earn */}
        {tab === 'earn' && (
          <div className="store-content">
            <div className="earn-banner">
              <h3>🎓 {isJa ? '学習して全アイテムを無料獲得' : 'Study to Earn 100% Free'}</h3>
              <p>
                {isJa
                  ? 'AI Knowledge Mountain では、課金しなくても毎日の学習やクイズ合格でコインが手に入ります。学びを継続して、すべての伝説アバターを手に入れよう！'
                  : 'At AI Knowledge Mountain, you don’t need to spend a single dollar. Every topic mastered and quiz passed awards Climb Coins!'}
              </p>
            </div>

            <div className="earn-milestones-grid">
              <div className="earn-tile">
                <div className="earn-icon">📖</div>
                <h4>{isJa ? 'トピック完了' : 'Master a Topic Node'}</h4>
                <div className="earn-reward">+50 🪙</div>
                <p>{isJa ? 'ロードマップの各単元を学習完了するごとに獲得' : 'Awarded every time you complete a study milestone'}</p>
              </div>

              <div className="earn-tile">
                <div className="earn-icon">🎯</div>
                <h4>{isJa ? 'AIテスト合格' : 'Ace AI Practice Test'}</h4>
                <div className="earn-reward">+25 🪙</div>
                <p>{isJa ? '難関トピックのテストで正解するごとにボーナス' : 'Bonus reward for testing your knowledge with Gemini AI'}</p>
              </div>

              <div className="earn-tile">
                <div className="earn-icon">🏕️</div>
                <h4>{isJa ? 'キャンプ到達 & 休憩' : 'Reach Rest Camps'}</h4>
                <div className="earn-reward">+100 🪙</div>
                <p>{isJa ? 'Camp I〜IIIに到達して焚き火で休息すると獲得' : 'Milestone reward when reaching Camps I, II, or III'}</p>
              </div>

              <div className="earn-tile">
                <div className="earn-icon">🚩</div>
                <h4>{isJa ? '山頂制覇 (Summit)' : 'Conquer the Summit'}</h4>
                <div className="earn-reward">+500 🪙</div>
                <p>{isJa ? '全カリキュラム走破で最高峰の栄誉とコイン獲得' : 'Grand completion reward when all topics are 100% conquered'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Simulated Checkout Drawer */}
        {checkoutPack && (
          <div className="checkout-overlay" onClick={() => !processing && setCheckoutPack(null)}>
            <div className="checkout-dialog glass" onClick={(e) => e.stopPropagation()}>
              <h3>💳 {isJa ? '安全なお支払い (シミュレーション)' : 'Secure Fast Checkout'}</h3>
              <p className="checkout-item-desc">
                {isJa ? checkoutPack.nameJa : checkoutPack.name} — 🪙 {checkoutPack.coins.toLocaleString()} Coins
              </p>

              {successMsg ? (
                <div className="checkout-success">{successMsg}</div>
              ) : (
                <>
                  <div className="checkout-price-row">
                    <span>{isJa ? 'お支払い合計' : 'Total Due'}:</span>
                    <b className="checkout-price-val">{checkoutPack.priceUsd}</b>
                  </div>

                  <div className="payment-methods">
                    <label className="pay-method active">
                      <input type="radio" name="pay" defaultChecked />
                      <span>⚡ Instant 1-Click Pay (Google Pay / Apple Pay Ready)</span>
                    </label>
                    <label className="pay-method">
                      <input type="radio" name="pay" />
                      <span>💳 Credit Card (•••• 4242)</span>
                    </label>
                  </div>

                  <div className="checkout-actions">
                    <button
                      className="confirm-pay-btn"
                      disabled={processing}
                      onClick={() => handleConfirmPurchase(checkoutPack)}
                    >
                      {processing ? 'Processing...' : isJa ? `${checkoutPack.priceUsd} を支払う` : `Pay ${checkoutPack.priceUsd}`}
                    </button>
                    <button
                      className="cancel-btn"
                      disabled={processing}
                      onClick={() => setCheckoutPack(null)}
                    >
                      {isJa ? 'キャンセル' : 'Cancel'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

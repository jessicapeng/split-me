import { useRef, useState } from 'react'
import './App.css'
import { SplitForOthersFlow, RecipientReceiptView } from './SplitForOthers'
import { openWithAppFallback } from './paymentLinks'

const SAVED_PHOTO_KEY = 'split-me-photo'

function parseJsonFromText(text) {
  let raw = text.trim()
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) raw = codeBlock[1].trim()
  return JSON.parse(raw)
}

/* ── Icons ────────────────────────────────────────────────────── */

function AppIcon() {
  return (
    <div className="app-icon-square">
      <svg width="46" height="46" viewBox="0 0 46 46" fill="none" aria-hidden="true">
        <circle cx="11" cy="23" r="5.5" fill="#3B82F6" />
        <path d="M30 9 L18 37" stroke="#1A1A2E" strokeWidth="3.2" strokeLinecap="round" />
        <circle cx="35" cy="23" r="5.5" fill="#34D399" />
      </svg>
    </div>
  )
}

function CameraIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12H19M19 12L13 6M19 12L13 18" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function ScanFeatureIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B7CF6" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M3 7V4.5A1.5 1.5 0 0 1 4.5 3H7M17 3h2.5A1.5 1.5 0 0 1 21 4.5V7M21 17v2.5A1.5 1.5 0 0 1 19.5 21H17M7 21H4.5A1.5 1.5 0 0 1 3 19.5V17M3 12h18" />
    </svg>
  )
}

function CalcFeatureIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6h16M4 10h16M4 14h10M4 18h6M17 16l-1.5 1.5L17 19M17 16l1.5 1.5L17 19" />
    </svg>
  )
}

function SplitFeatureIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9B59B6" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="19" r="2.5" />
      <circle cx="19" cy="19" r="2.5" />
      <path d="M12 7.5V11M12 11L5 16.5M12 11L19 16.5" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B7CF6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function GroupIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22A55B" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
      <circle cx="17" cy="8" r="3.5" />
      <path d="M14.5 14.2C15.6 14 16.8 14 17 14c3.9 0 7 2.5 7 6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function SmallPersonIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#5B6EF5" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function SmallGroupIcon() {
  return (
    <svg width="13" height="11" viewBox="0 0 24 24" fill="none" stroke="#5B6EF5" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
      <circle cx="17" cy="8" r="3.5" />
      <path d="M14.5 14.2C15.6 14 17 14 17 14c3.9 0 7 2.5 7 6" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#5B6EF5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

/* ── Receipt ──────────────────────────────────────────────────── */

const DEMO_ITEMS = [
  { name: 'Burrata',         price: '$25' },
  { name: 'Charred Octopus', price: '$32' },
  { name: 'Spaghetti',       price: '$36' },
  { name: 'Gnocchi',         price: '$33' },
  { name: 'Ravioli',         price: '$44' },
  { name: 'Espresso Budino', price: '$22' },
  { name: 'Panna Cotta',     price: '$19' },
  { name: 'Choc. Cake',      price: '$21' },
]

function ReceiptScallop() {
  return (
    <svg
      width="100%"
      height="12"
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className="scallop-svg"
      aria-hidden="true"
    >
      <path
        d="M0,0 Q5,12 10,0 Q15,12 20,0 Q25,12 30,0 Q35,12 40,0 Q45,12 50,0
           Q55,12 60,0 Q65,12 70,0 Q75,12 80,0 Q85,12 90,0 Q95,12 100,0
           Q105,12 110,0 Q115,12 120,0 Q125,12 130,0 Q135,12 140,0 Q145,12 150,0
           Q155,12 160,0 Q165,12 170,0 Q175,12 180,0 Q185,12 190,0 Q195,12 200,0
           L200,14 L0,14 Z"
        fill="white"
      />
    </svg>
  )
}

function ReceiptScallopTop() {
  return (
    <svg
      width="100%"
      height="10"
      viewBox="0 0 200 10"
      preserveAspectRatio="none"
      style={{ display: 'block', marginBottom: 4 }}
      aria-hidden="true"
    >
      <path
        d="M0,10 Q5,0 10,10 Q15,0 20,10 Q25,0 30,10 Q35,0 40,10 Q45,0 50,10
           Q55,0 60,10 Q65,0 70,10 Q75,0 80,10 Q85,0 90,10 Q95,0 100,10
           Q105,0 110,10 Q115,0 120,10 Q125,0 130,10 Q135,0 140,10 Q145,0 150,10
           Q155,0 160,10 Q165,0 170,10 Q175,0 180,10 Q185,0 190,10 Q195,0 200,10
           L200,0 L0,0 Z"
        fill="#ffffff"
      />
    </svg>
  )
}

function Receipt() {
  return (
    <div className="receipt-card">
      <ReceiptScallopTop />
      <div className="rc-venue">Scarpetta</div>
      <div className="rc-date">Mar 19, 2025 • 7:30 PM</div>
      <div className="rc-dashed" />
      <div className="rc-items">
        {DEMO_ITEMS.map((item, i) => (
          <div key={i} className="rc-row">
            <span className="rc-name">{item.name}</span>
            <span className="rc-price">{item.price}</span>
          </div>
        ))}
      </div>
      <div className="rc-dashed" />
      <div className="rc-row">
        <span className="rc-total-label">Total</span>
        <span className="rc-total-price">$299</span>
      </div>
      <ReceiptScallop />
    </div>
  )
}

/* ── Split panel ──────────────────────────────────────────────── */

function UserPill({ letter, name, amount, avatarBg, letterColor }) {
  return (
    <div className="user-pill">
      <div className="user-avatar" style={{ background: avatarBg }}>
        <span style={{ color: letterColor }}>{letter}</span>
      </div>
      <span className="pill-name">{name}</span>
      <span className="pill-amount">{amount}</span>
    </div>
  )
}

function SplitPanel() {
  return (
    <div className="split-panel">
      <div className="split-title">Split between 3</div>
      <UserPill letter="A" name="You"   amount="$97.25"  avatarBg="#E8EEFF" letterColor="#5B6EF5" />
      <UserPill letter="J" name="Jess"   amount="$110.25"  avatarBg="#E3F5ED" letterColor="#22A55B" />
      <UserPill letter="M" name="Mike" amount="$91.50" avatarBg="#F0EBF8" letterColor="#9B59B6" />
      <div className="settled-pill">
        <CheckIcon />
        <span>All settled up!</span>
      </div>
    </div>
  )
}

function DemoCard() {
  return (
    <div className="demo-card">
      <Receipt />
      <div className="demo-arrow"><ArrowRightIcon /></div>
      <SplitPanel />
    </div>
  )
}

/* ── Feature row ──────────────────────────────────────────────── */

function FeatureItem({ icon, label, sublabel, bg, border }) {
  return (
    <div className={`feature-item${border ? ' feature-border' : ''}`}>
      <div className="feature-icon-bg" style={{ background: bg }}>{icon}</div>
      <div className="feature-label">{label}</div>
      <div className="feature-sub">{sublabel}</div>
    </div>
  )
}

/* ── Items review screen ──────────────────────────────────────── */

const MAX_SPLIT = 8

function ZigZagTop() {
  return (
    <svg width="100%" height="14" viewBox="0 0 300 14" preserveAspectRatio="none" style={{ display: 'block', border: 'none', outline: 'none' }} aria-hidden="true">
      <path d="M-1,-1 L301,-1 L301,14 L285,2 L270,14 L255,2 L240,14 L225,2 L210,14 L195,2 L180,14 L165,2 L150,14 L135,2 L120,14 L105,2 L90,14 L75,2 L60,14 L45,2 L30,14 L15,2 L-1,14 Z" fill="#F7F7F8" stroke="#F7F7F8" strokeWidth="1" />
    </svg>
  )
}

function ItemRow({ item, splitCount, onTap, onSplitPress }) {
  const selected = splitCount > 0
  const price    = typeof item.price === 'number' ? item.price : 0
  const myShare  = selected ? price / splitCount : 0
  return (
    <button type="button" className={`iv-item-row${selected ? ' iv-item-selected' : ''}`} onClick={onTap}>
      {selected && (
        <div className="iv-check">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      )}
      <div className="iv-item-body">
        <div className="iv-item-top">
          <span className="iv-item-name">{item.name}</span>
          <span className="iv-item-price">${price.toFixed(2)}</span>
        </div>
        {selected && (
          <div className="iv-item-bottom">
            <span className="iv-you-pay-left">You pay ${myShare.toFixed(2)}</span>
            <button type="button" className="iv-split-pill iv-split-pill-btn" onClick={e => { e.stopPropagation(); onSplitPress() }}>
              <SmallGroupIcon /><span>Split</span>
            </button>
          </div>
        )}
      </div>
    </button>
  )
}

function SplitModal({ itemName, initialCount, onConfirm, onClose }) {
  const [count, setCount] = useState(initialCount)
  return (
    <div className="split-modal-overlay" onClick={onClose}>
      <div className="split-modal" onClick={e => e.stopPropagation()}>
        <p className="split-modal-item">{itemName}</p>
        <h3 className="split-modal-title">Split with how many?</h3>
        <div className="split-modal-counter">
          <button type="button" className="split-counter-btn" onClick={() => setCount(c => Math.max(1, c - 1))}>−</button>
          <span className="split-counter-num">{count}</span>
          <button type="button" className="split-counter-btn" onClick={() => setCount(c => Math.min(MAX_SPLIT, c + 1))}>+</button>
        </div>
        <p className="split-modal-hint">{count === 1 ? 'Just you' : `You + ${count - 1} other${count - 1 > 1 ? 's' : ''}`}</p>
        <button type="button" className="split-modal-confirm" onClick={() => onConfirm(count)}>Done</button>
      </div>
    </div>
  )
}

function ReceiptSummaryView({ selectedItems, selections, items, receiptMeta, myTotal, onBack }) {
  const BAD = /unknown|n\/a|not found|none|null/i
  const venue = receiptMeta?.venue && !BAD.test(receiptMeta.venue) ? receiptMeta.venue : null
  const date  = receiptMeta?.date  && !BAD.test(receiptMeta.date)  ? receiptMeta.date  : null

  const myTax   = myTotal * 0.085
  const myTip   = myTotal * 0.18
  const myGrand = myTotal + myTax + myTip

  return (
    <div className="items-view">
      <div className="iv-nav">
        <button type="button" className="iv-nav-btn" onClick={onBack} aria-label="Back">
          <ChevronLeftIcon />
        </button>
        <div className="iv-dots">
          {[0, 1, 2, 3].map(i => (
            <span key={i} className={`iv-dot${i === 3 ? ' iv-dot-active' : ''}`} />
          ))}
        </div>
        <div className="iv-nav-btn" aria-hidden="true" style={{ visibility: 'hidden' }} />
      </div>

      <div className="iv-title-section">
        <h2 className="iv-title">Your receipt</h2>
        <p className="iv-subtitle">Here's what you're paying with tax and tip included</p>
      </div>

      <div className="iv-receipt-card">
        <ZigZagTop />
        <div className="iv-receipt-content">
          <div className="sr-header">
            <div className="sr-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M6 2h12a2 2 0 012 2v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="#7C6FF7" strokeWidth="1.8"/>
                <path d="M8 7h8M8 11h8M8 15h5" stroke="#7C6FF7" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="sr-venue">{venue ?? 'Your Receipt'}</div>
              {date && <div className="iv-date">{date}</div>}
            </div>
          </div>

          <div className="iv-dashed" />

          <div className="iv-items">
            {selectedItems.map((item, i) => {
              const originalIdx = items.indexOf(item)
              const split = selections[originalIdx] || 1
              const myShare = item.price / split
              return (
                <div key={i} className="sr-item-row">
                  <span className="sr-qty">{split}×</span>
                  <span className="sr-item-name">{item.name}</span>
                  <span className="sr-item-price">${myShare.toFixed(2)}</span>
                </div>
              )
            })}
          </div>

          <div className="iv-dashed" />

          <div className="iv-totals">
            <div className="iv-total-row">
              <span>Subtotal</span>
              <span>${myTotal.toFixed(2)}</span>
            </div>
            <div className="iv-total-row">
              <span>Tax (8.5%)</span>
              <span>${myTax.toFixed(2)}</span>
            </div>
            <div className="iv-total-row">
              <span>Tip (18%)</span>
              <span>${myTip.toFixed(2)}</span>
            </div>
          </div>

          <div className="iv-dashed" style={{ marginTop: 12 }} />

          <div className="iv-summary-bar" style={{ marginTop: 12 }}>
            <div className="iv-summary-left">
              <span className="iv-summary-label">Total</span>
              <span className="iv-summary-sub">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="iv-summary-right">
              <span className="iv-summary-amount">${myGrand.toFixed(2)}</span>
              <ChevronDownIcon />
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="venmo-btn"
        onClick={() => {
          const note   = venue ? `&note=${encodeURIComponent(venue)}` : ''
          openWithAppFallback(
            `venmo://paycharge?txn=pay&amount=${myGrand.toFixed(2)}${note}`,
            `https://account.venmo.com/pay?amount=${myGrand.toFixed(2)}${note}`,
          )
        }}
      >
        <span className="venmo-btn-text">Pay with</span>
        <span className="venmo-btn-logo">venmo</span>
        <svg className="venmo-btn-icon" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <p className="venmo-secure">
        <svg viewBox="0 0 12 14" fill="none" className="venmo-lock-icon">
          <rect x="1" y="6" width="10" height="7" rx="2" fill="currentColor"/>
          <path d="M3.5 6V4a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        Secure checkout with Venmo
      </p>
    </div>
  )
}

function ItemsView({ items, receiptMeta, onBack }) {
  const [selections, setSelections] = useState(() => new Array(items.length).fill(0))
  const [modalIdx, setModalIdx] = useState(null)
  const [showSummary, setShowSummary] = useState(false)

  const handleTap = (idx) => {
    setSelections(prev => {
      const next = [...prev]
      next[idx] = next[idx] > 0 ? 0 : 1
      return next
    })
  }

  const handleSplitConfirm = (count) => {
    setSelections(prev => {
      const next = [...prev]
      next[modalIdx] = count
      return next
    })
    setModalIdx(null)
  }

  const selectedItems = items.filter((_, i) => selections[i] > 0)
  const myTotal = items.reduce((sum, item, i) => {
    if (selections[i] === 0) return sum
    const price = typeof item.price === 'number' ? item.price : 0
    return sum + price / selections[i]
  }, 0)
  const subtotal = items.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0)
  const tax = subtotal * 0.085
  const tip = subtotal * 0.18

  if (showSummary) {
    return (
      <ReceiptSummaryView
        selectedItems={selectedItems}
        selections={selections}
        items={items}
        receiptMeta={receiptMeta}
        myTotal={myTotal}
        onBack={() => setShowSummary(false)}
      />
    )
  }

  return (
    <div className="items-view">
      {/* Nav */}
      <div className="iv-nav">
        <button type="button" className="iv-nav-btn" onClick={onBack} aria-label="Back">
          <ChevronLeftIcon />
        </button>
        <div className="iv-dots">
          {[0, 1, 2, 3].map(i => (
            <span key={i} className={`iv-dot${i === 3 ? ' iv-dot-active' : ''}`} />
          ))}
        </div>
        <div className="iv-nav-btn" aria-hidden="true" style={{ visibility: 'hidden' }} />
      </div>

      {/* Title */}
      <div className="iv-title-section">
        <h2 className="iv-title">Review your items</h2>
        <p className="iv-subtitle">Tap items you had or split</p>
      </div>

      {/* Receipt card */}
      <div className="iv-receipt-card">
        <ZigZagTop />
        <div className="iv-receipt-content">
          {(() => {
            const BAD = /unknown|n\/a|not found|none|null/i
            const venue = receiptMeta?.venue && !BAD.test(receiptMeta.venue) ? receiptMeta.venue : null
            const date  = receiptMeta?.date  && !BAD.test(receiptMeta.date)  ? receiptMeta.date  : null
            return (
              <>
                <div className="iv-venue">{venue ?? 'Receipt'}</div>
                {date && <div className="iv-date">{date}</div>}
                <div className="iv-dashed" />
              </>
            )
          })()}

          <div className="iv-items">
            {items.map((item, i) => (
              <ItemRow
                key={i}
                item={item}
                splitCount={selections[i]}
                onTap={() => handleTap(i)}
                onSplitPress={() => setModalIdx(i)}
              />
            ))}
          </div>

          <div className="iv-dashed" />

          <div className="iv-totals">
            <div className="iv-total-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="iv-total-row">
              <span>Tax (8.5%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="iv-total-row">
              <span>Tip (18%)</span>
              <span>${tip.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <>
          <div className="iv-summary-bar">
            <div className="iv-summary-left">
              <span className="iv-summary-label">You pay</span>
              <span className="iv-summary-sub">
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="iv-summary-right">
              <span className="iv-summary-amount">${myTotal.toFixed(2)}</span>
            </div>
          </div>
          <button type="button" className="continue-btn" onClick={() => setShowSummary(true)}>
            Continue
          </button>
        </>
      )}

      {modalIdx !== null && (
        <SplitModal
          itemName={items[modalIdx].name}
          initialCount={selections[modalIdx] || 1}
          onConfirm={handleSplitConfirm}
          onClose={() => setModalIdx(null)}
        />
      )}
    </div>
  )
}

/* ── Choice screen ────────────────────────────────────────────── */

function ChoiceScreen({ onSelect, onBack }) {
  return (
    <div className="choice-screen">
      <div className="blob blob-tr" />
      <div className="blob blob-bl" />

      <div className="iv-nav">
        <button type="button" className="iv-nav-btn" onClick={onBack} aria-label="Back">
          <ChevronLeftIcon />
        </button>
        <div className="iv-dots">
          {[0, 1, 2, 3].map(i => (
            <span key={i} className={`iv-dot${i === 2 ? ' iv-dot-active' : ''}`} />
          ))}
        </div>
        <div className="iv-nav-btn" aria-hidden="true" style={{ visibility: 'hidden' }} />
      </div>

      <div className="logo-section">
        <AppIcon />
        <div className="title-row">
          <span className="title-dark">split </span>
          <span className="title-blue">me</span>
        </div>
      </div>

      <p className="choice-heading">How would you like<br />to continue?</p>

      <div className="choice-cards">
        <button type="button" className="choice-card" onClick={() => onSelect('myself')}>
          <div className="choice-card-icon" style={{ background: '#EEF0FF' }}>
            <PersonIcon />
          </div>
          <div className="choice-card-text">
            <span className="choice-card-title">For myself</span>
            <span className="choice-card-sub">Calculate what I owe</span>
          </div>
          <ChevronRightIcon />
        </button>

        <button type="button" className="choice-card" onClick={() => onSelect('others')}>
          <div className="choice-card-icon" style={{ background: '#E3F5ED' }}>
            <GroupIcon />
          </div>
          <div className="choice-card-text">
            <span className="choice-card-title">I paid for everyone</span>
            <span className="choice-card-sub">Split and collect from others</span>
          </div>
          <ChevronRightIcon />
        </button>
      </div>
    </div>
  )
}

/* ── Main App ─────────────────────────────────────────────────── */

// Phone camera photos easily exceed Vercel's ~4.5MB serverless request body
// limit once base64-encoded. Downscaling keeps plenty of resolution for the
// model to read item names/prices while comfortably fitting under that cap.
function downscaleImage(dataUrl, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

function decodeReceiptHash() {
  try {
    const hash = window.location.hash
    if (!hash.startsWith('#receipt=')) return null
    const raw  = hash.slice('#receipt='.length)
    return JSON.parse(decodeURIComponent(escape(atob(raw))))
  } catch {
    return null
  }
}

function App() {
  const fileInputRef  = useRef(null)
  const apiPromiseRef = useRef(null)
  const [recipientData]                                 = useState(decodeReceiptHash)
  const [photo, setPhoto]                               = useState(null)
  const [items, setItems]                               = useState(null)
  const [loading, setLoading]                           = useState(false)
  const [error, setError]                               = useState(null)
  const [view, setView]                                 = useState('landing')
  const [receiptMeta, setReceiptMeta]                   = useState({ venue: null, date: null })
  const [, setCalculatingFor]                           = useState(null)

  const handleCameraClick = () => fileInputRef.current?.click()

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      let photoUrl = reader.result
      try {
        photoUrl = await downscaleImage(reader.result)
      } catch {
        // Fall back to the original if downscaling fails for any reason.
      }
      setPhoto(photoUrl)
      setItems(null)
      setError(null)
      setView('photo')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = async () => {
    if (!photo) { setError('Please add a receipt photo first.'); return }
    setError(null)
    setView('choice')

    const apiPromise = (async () => {
      const res = await fetch('/api/itemize-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || res.statusText)
      const text = data.text
      if (!text) throw new Error('No response from OpenAI')
      const parsed = parseJsonFromText(text)
      if (!parsed || !Array.isArray(parsed.items)) throw new Error('Unexpected format from OpenAI.')
      return { items: parsed.items, venue: parsed.venue || null, date: parsed.date || null }
    })()

    apiPromiseRef.current = apiPromise
  }

  const handleChoiceSelect = async (choice) => {
    setCalculatingFor(choice)
    setLoading(true)
    try {
      const { items, venue, date } = await apiPromiseRef.current
      setItems(items)
      setReceiptMeta({ venue, date })
      setView(choice === 'others' ? 'split-for-others' : 'items')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setView('photo')
    } finally {
      setLoading(false)
    }
  }

  if (recipientData) {
    return (
      <div className="app">
        <RecipientReceiptView data={recipientData} />
      </div>
    )
  }

  return (
    <div className="app">
      {loading && (
        <div className="loading-modal">
          <div className="loading-content">
            <div className="loader" />
            <p className="loading-text">Itemizing your receipt</p>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden-input" aria-hidden="true" />

      {/* Choice view */}
      {view === 'choice' ? (
        <ChoiceScreen onSelect={handleChoiceSelect} onBack={() => setView('photo')} />
      ) : view === 'split-for-others' ? (
        <SplitForOthersFlow
          items={items}
          receiptMeta={receiptMeta}
          onBack={() => setView('choice')}
        />
      ) : view === 'items' ? (
        <ItemsView
          items={items}
          receiptMeta={receiptMeta}
          onBack={() => { setView('landing'); setItems(null); setError(null); setReceiptMeta({ venue: null, date: null }) }}
        />
      ) : view === 'photo' ? (
        /* Photo preview view */
        <div className="landing">
          <div className="blob blob-tr" />
          <div className="blob blob-bl" />

          <div className="iv-nav">
            <button type="button" className="iv-nav-btn" onClick={() => { setView('landing'); setPhoto(null); setError(null) }} aria-label="Back">
              <ChevronLeftIcon />
            </button>
            <div className="iv-dots">
              {[0, 1, 2, 3].map(i => (
                <span key={i} className={`iv-dot${i === 1 ? ' iv-dot-active' : ''}`} />
              ))}
            </div>
            <div className="iv-nav-btn" aria-hidden="true" style={{ visibility: 'hidden' }} />
          </div>

          <div className="logo-section">
            <AppIcon />
            <div className="title-row">
              <span className="title-dark">split </span>
              <span className="title-blue">me</span>
            </div>
          </div>

          <div className="photo-preview-section">
            <div className="photo-container">
              <img src={photo} alt="Receipt preview" className="receipt-thumbnail" />
              <button type="button" className="retake-btn" onClick={handleCameraClick} aria-label="Retake photo">
                <CameraIcon size={14} color="rgba(255,255,255,0.96)" />
              </button>
            </div>
            <button type="button" className="submit-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Processing…' : 'Submit'}
            </button>
            {error && <p className="error-msg">{error}</p>}
          </div>
        </div>
      ) : (
        /* Landing view */
        <div className="landing">
          <div className="blob blob-tr" />
          <div className="blob blob-bl" />

          <div className="logo-section">
            <AppIcon />
            <div className="title-row">
              <span className="title-dark">split </span>
              <span className="title-blue">me</span>
            </div>
          </div>

          <DemoCard />

          <div className="feature-row">
            <FeatureItem icon={<ScanFeatureIcon />} label="Scan"      sublabel="Snap a photo of the bill"            bg="#EEF0FF" border />
            <FeatureItem icon={<CalcFeatureIcon />} label="Calculate" sublabel="Detect items and total instantly"  bg="#E8F8F2" border />
            <FeatureItem icon={<SplitFeatureIcon />} label="Split"    sublabel="Divide fairly and settle up"          bg="#F3EDFA" />
          </div>

          <div className="cta-section">
            <button type="button" className="camera-cta" onClick={handleCameraClick} aria-label="Get started">
              <CameraIcon size={34} color="white" />
            </button>
            <div className="cta-label-row">
              <div className="cta-title">Get started</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

import { useState } from 'react'
import { isMobileDevice, openWithAppFallback } from './paymentLinks'

const DEMO_ITEMS = [
  { name: 'Fried Chicken Ramen',   price: 18.00 },
  { name: 'Pork Tonkotsu',         price: 16.00 },
  { name: 'Spicy Miso Ramen',      price: 17.00 },
  { name: 'Gyoza (6pc)',            price: 8.00  },
  { name: 'Chicken Karaage',       price: 12.00 },
  { name: 'Matcha Latte',          price: 6.00  },
  { name: 'Cold Brew',             price: 5.50  },
  { name: 'Edamame',               price: 4.00  },
  { name: 'Spicy Tuna Roll',       price: 14.00 },
  { name: 'Miso Soup',             price: 3.50  },
]

const TAX_RATE  = 0.085
const TIP_RATE  = 0.18
const MAX_EVEN  = 19

const PALETTE = [
  { chipBg: '#EFF6FF', chipBorder: '#93C5FD', chipText: '#1D4ED8', tagBg: '#DBEAFE', tagText: '#1E40AF' },
  { chipBg: '#FFF7ED', chipBorder: '#FDBA74', chipText: '#C2410C', tagBg: '#FED7AA', tagText: '#9A3412' },
  { chipBg: '#FDF4FF', chipBorder: '#D946EF', chipText: '#86198F', tagBg: '#F5D0FE', tagText: '#701A75' },
  { chipBg: '#F0FDF4', chipBorder: '#86EFAC', chipText: '#166534', tagBg: '#BBF7D0', tagText: '#14532D' },
  { chipBg: '#F5F3FF', chipBorder: '#C4B5FD', chipText: '#6D28D9', tagBg: '#EDE9FE', tagText: '#4C1D95' },
  { chipBg: '#FFF1F2', chipBorder: '#FCA5A5', chipText: '#B91C1C', tagBg: '#FECACA', tagText: '#991B1B' },
  { chipBg: '#F0FDFA', chipBorder: '#5EEAD4', chipText: '#0F766E', tagBg: '#CCFBF1', tagText: '#134E4A' },
  { chipBg: '#FFFBEB', chipBorder: '#FCD34D', chipText: '#92400E', tagBg: '#FEF08A', tagText: '#78350F' },
]

function paletteOf(people, personId) {
  const idx = people.findIndex(p => p.id === personId)
  return PALETTE[(idx < 0 ? 0 : idx) % PALETTE.length]
}

let _id = 0
function uid() { return `p${++_id}` }

function getPersonTotal(items, assignments, personId) {
  const sub = items.reduce((s, item, i) => {
    const assignees = assignments[i] || []
    if (!assignees.includes(personId)) return s
    const price = typeof item.price === 'number' ? item.price : 0
    return s + price / assignees.length
  }, 0)
  return sub * (1 + TAX_RATE + TIP_RATE)
}

/* ── Payment method (cached across sessions) ─────────────────── */

const PAY_INFO_KEY = 'split-me-pay-info'

function loadPayInfo() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PAY_INFO_KEY))
    return { method: parsed?.method === 'zelle' ? 'zelle' : 'venmo', venmo: parsed?.venmo || '', zelle: parsed?.zelle || '' }
  } catch {
    return { method: 'venmo', venmo: '', zelle: '' }
  }
}

function savePayInfo(info) {
  try { localStorage.setItem(PAY_INFO_KEY, JSON.stringify(info)) } catch { /* storage unavailable */ }
}


/* ── Icons ─────────────────────────────────────────────────────── */

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function XCircle() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

function GripIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9"  cy="6"  r="1.2" fill="#D1D5DB"/>
      <circle cx="15" cy="6"  r="1.2" fill="#D1D5DB"/>
      <circle cx="9"  cy="12" r="1.2" fill="#D1D5DB"/>
      <circle cx="15" cy="12" r="1.2" fill="#D1D5DB"/>
      <circle cx="9"  cy="18" r="1.2" fill="#D1D5DB"/>
      <circle cx="15" cy="18" r="1.2" fill="#D1D5DB"/>
    </svg>
  )
}

function BigCheck() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function ZigZagTop() {
  return (
    <svg
      width="100%"
      height="14"
      viewBox="0 0 300 14"
      preserveAspectRatio="none"
      style={{ display: 'block', border: 'none', outline: 'none' }}
      aria-hidden="true"
    >
      <path
        d="M-1,-1 L301,-1 L301,14 L285,2 L270,14 L255,2 L240,14 L225,2 L210,14 L195,2 L180,14 L165,2 L150,14 L135,2 L120,14 L105,2 L90,14 L75,2 L60,14 L45,2 L30,14 L15,2 L-1,14 Z"
        fill="#F7F7F8"
        stroke="#F7F7F8"
        strokeWidth="1"
      />
    </svg>
  )
}

/* ── Shared nav / dots ─────────────────────────────────────────── */

function PageNav({ step, onBack }) {
  return (
    <div className="iv-nav">
      <button type="button" className="iv-nav-btn" onClick={onBack} aria-label="Back">
        <ChevronLeft />
      </button>
      <div className="iv-dots">
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} className={`iv-dot${i === step ? ' iv-dot-active' : ''}`} />
        ))}
      </div>
      <div className="iv-nav-btn" aria-hidden="true" style={{ visibility: 'hidden' }} />
    </div>
  )
}

/* ── Person chips scroll ───────────────────────────────────────── */

function ChipRow({ people, active, onSelect }) {
  return (
    <div className="sfo-chips-scroll">
      {people.map(p => {
        const c       = paletteOf(people, p.id)
        const isActive = active === p.id
        return (
          <button
            key={p.id}
            type="button"
            className={`sfo-chip${isActive ? ' sfo-chip-active' : ''}`}
            style={isActive
              ? { background: c.chipBg, borderColor: c.chipBorder, color: c.chipText }
              : { background: '#ffffff', borderColor: '#E5E7EB', color: '#6B7280' }
            }
            onClick={() => onSelect(p.id)}
          >
            {p.name}
          </button>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 1 — Add People
══════════════════════════════════════════════════════════════════ */

function AddPeoplePage({ people, setPeople, splitMode, setSplitMode, evenCount, setEvenCount, onContinue, onBack }) {
  function updateName(id, name) {
    setPeople(prev => prev.map(p => p.id === id ? { ...p, name } : p))
  }

  function removePerson(id) {
    setPeople(prev => prev.filter(p => p.id !== id))
  }

  function addEmptyPerson() {
    setPeople(prev => [...prev, { id: uid(), name: '', isPayer: false }])
  }

  function stepperChange(delta) {
    setPeople(prev => {
      if (delta > 0) {
        return [...prev, { id: uid(), name: '', isPayer: false }]
      }
      const nonPayers = prev.filter(p => !p.isPayer)
      if (nonPayers.length === 0) return prev
      const removeId = nonPayers[nonPayers.length - 1].id
      return prev.filter(p => p.id !== removeId)
    })
  }

  const nonPayers = people.filter(p => !p.isPayer)
  const allNamed = people.every(p => p.name.trim() !== '')
  const canContinue = splitMode === 'even' ? evenCount > 0 : (nonPayers.length > 0 && allNamed)

  return (
    <div className="sfo-page">
      <PageNav step={0} onBack={onBack} />

      <div className="iv-title-section">
        <h2 className="iv-title">Who's at the table?</h2>
        <p className="iv-subtitle">Add everyone you're splitting with.</p>
      </div>

      <div className="sfo-pay-toggle">
        <button
          type="button"
          className={`sfo-chip${splitMode === 'item' ? ' sfo-chip-active' : ''}`}
          style={splitMode === 'item' ? { background: '#EFF6FF', borderColor: '#3D95CE', color: '#1D4ED8' } : {}}
          onClick={() => setSplitMode('item')}
        >
          Split by item
        </button>
        <button
          type="button"
          className={`sfo-chip${splitMode === 'even' ? ' sfo-chip-active' : ''}`}
          style={splitMode === 'even' ? { background: '#F5F3FF', borderColor: '#7C3AED', color: '#6D28D9' } : {}}
          onClick={() => setSplitMode('even')}
        >
          Split evenly
        </button>
      </div>

      {splitMode === 'even' ? (
        <div className="sfo-card">
          <div className="sfo-stepper-row">
            <span className="sfo-stepper-label">How many other people?</span>
            <div className="sfo-stepper">
              <button
                type="button"
                className="sfo-stepper-btn"
                onClick={() => setEvenCount(c => Math.max(1, c - 1))}
                disabled={evenCount <= 1}
              >−</button>
              <span className="sfo-stepper-num">{evenCount}</span>
              <button
                type="button"
                className="sfo-stepper-btn"
                onClick={() => setEvenCount(c => Math.min(MAX_EVEN, c + 1))}
              >+</button>
            </div>
          </div>
          <div className="sfo-card-divider" />
          <p className="sfo-modal-hint" style={{ padding: '14px 20px' }}>
            The bill will be split equally between you and {evenCount} other{evenCount > 1 ? 's' : ''} — no need to enter names.
          </p>
        </div>
      ) : (
        <div className="sfo-card">
          {/* Stepper */}
          <div className="sfo-stepper-row">
            <span className="sfo-stepper-label">How many people?</span>
            <div className="sfo-stepper">
              <button
                type="button"
                className="sfo-stepper-btn"
                onClick={() => stepperChange(-1)}
                disabled={nonPayers.length === 0}
              >−</button>
              <span className="sfo-stepper-num">{people.length}</span>
              <button type="button" className="sfo-stepper-btn" onClick={() => stepperChange(1)}>+</button>
            </div>
          </div>

          <div className="sfo-card-divider" />

          {/* People list */}
          <div className="sfo-people-list">
            {people.map(p => (
              <div key={p.id} className="sfo-person-row">
                <span className="sfo-drag-handle"><GripIcon /></span>
                <input
                  className="sfo-person-name-input"
                  value={p.name}
                  onChange={e => updateName(p.id, e.target.value)}
                  placeholder={p.isPayer ? 'Your name' : 'Enter name'}
                  autoFocus={p.name === ''}
                />
                {p.isPayer && <span className="sfo-paid-pill">Paid</span>}
                {!p.isPayer && (
                  <button type="button" className="sfo-remove-btn" onClick={() => removePerson(p.id)} aria-label="Remove">
                    <XCircle />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="button" className="sfo-add-btn" onClick={addEmptyPerson}>
            + Add another person
          </button>
        </div>
      )}

      <div className="sfo-sticky-bottom">
        <button
          type="button"
          className="continue-btn"
          onClick={onContinue}
          disabled={!canContinue}
          style={!canContinue ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 2 — Assign Items
══════════════════════════════════════════════════════════════════ */

function UnassignedModal({ items, assignments, onClose }) {
  const unassigned = items.filter((_, i) => (assignments[i] || []).length === 0)
  return (
    <div className="sfo-modal-overlay" onClick={onClose}>
      <div className="sfo-modal" onClick={e => e.stopPropagation()}>
        <div className="sfo-modal-handle" />
        <h3 className="sfo-modal-title">Unassigned items</h3>

        <div className="sfo-unassigned-list">
          {unassigned.length === 0
            ? <p className="sfo-empty-note">All items are assigned!</p>
            : unassigned.map((item, i) => (
              <div key={i} className="sfo-unassigned-row">
                <span className="sfo-ua-name">{item.name}</span>
                <span className="sfo-ua-price">${(typeof item.price === 'number' ? item.price : 0).toFixed(2)}</span>
              </div>
            ))
          }
        </div>

        {unassigned.length > 0 && (
          <p className="sfo-modal-hint">Tap an item to assign it to whoever should pay for it.</p>
        )}

        <button type="button" className="continue-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

function AssignItemsPage({ people, items, assignments, setAssignments, onContinue, onBack }) {
  const [activePerson, setActivePerson] = useState(people[0]?.id ?? null)

  const activeName  = people.find(p => p.id === activePerson)?.name ?? ''
  const personTotal = items.reduce((s, item, i) => {
    const assignees = assignments[i] || []
    if (!assignees.includes(activePerson)) return s
    const price = typeof item.price === 'number' ? item.price : 0
    return s + price / assignees.length
  }, 0)

  function toggleItem(idx) {
    setAssignments(prev => {
      const current = prev[idx] || []
      const next = { ...prev }
      if (current.includes(activePerson)) {
        const updated = current.filter(id => id !== activePerson)
        if (updated.length === 0) delete next[idx]
        else next[idx] = updated
      } else {
        next[idx] = [...current, activePerson]
      }
      return next
    })
  }

  return (
    <div className="sfo-page">
      <PageNav step={1} onBack={onBack} />

      <div className="iv-title-section">
        <h2 className="iv-title">Assign items</h2>
        <p className="iv-subtitle">Tap items to assign them to each person.</p>
      </div>

      <ChipRow people={people} active={activePerson} onSelect={setActivePerson} />

      <div className="iv-receipt-card">
        <ZigZagTop />
        <div className="iv-receipt-content">
          <div className="sfo-assign-header">
            <span className="sfo-assign-label">{activeName}'s items</span>
            <span className="sfo-assign-total" style={{ color: personTotal > 0 ? '#16A34A' : '#9CA3AF' }}>
              ${personTotal.toFixed(2)}
            </span>
          </div>
          <div className="iv-dashed" />

          <div className="sfo-items-list">
            {items.map((item, i) => {
              const price      = typeof item.price === 'number' ? item.price : 0
              const assignees  = assignments[i] || []
              const isSelected = assignees.includes(activePerson)
              const splitCount = assignees.length
              const displayPrice = isSelected && splitCount > 1 ? price / splitCount : price
              return (
                <button
                  key={i}
                  type="button"
                  className={`sfo-item-row${isSelected ? ' sfo-item-selected' : ''}`}
                  onClick={() => toggleItem(i)}
                >
                  <div className={`sfo-checkbox${isSelected ? ' sfo-checkbox-on' : ''}`}>
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                  <span className="sfo-item-name">{item.name}</span>
                  {assignees.length > 0 && (
                    <div className="sfo-person-tags">
                      {assignees.map(id => {
                        const c    = paletteOf(people, id)
                        const name = people.find(p => p.id === id)?.name?.split(' ')[0] ?? '?'
                        return (
                          <span key={id} className="sfo-person-tag" style={{ background: c.tagBg, color: c.tagText }}>
                            {name}
                          </span>
                        )
                      })}
                    </div>
                  )}
                  <span className="sfo-item-price">${displayPrice.toFixed(2)}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="sfo-sticky-bottom">
        <button type="button" className="continue-btn" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 3 — Review Receipts
══════════════════════════════════════════════════════════════════ */

function ReviewReceiptsPage({ people, items, assignments, receiptMeta, onContinue, onBack }) {
  const nonPayers    = people.filter(p => !p.isPayer)
  const [activePerson, setActivePerson] = useState(nonPayers[0]?.id ?? people[0]?.id ?? null)

  const activePersonObj = people.find(p => p.id === activePerson)
  const activeName   = activePersonObj?.name ?? ''
  const isPayer       = activePersonObj?.isPayer ?? false
  const possessive    = isPayer ? 'Your' : `${activeName}'s`
  const personItems  = items
    .map((it, i) => {
      const assignees = assignments[i] || []
      if (!assignees.includes(activePerson)) return null
      const price = typeof it.price === 'number' ? it.price : 0
      return { ...it, price: price / assignees.length }
    })
    .filter(Boolean)
  const sub          = personItems.reduce((s, it) => s + it.price, 0)
  const tax          = sub * TAX_RATE
  const tip          = sub * TIP_RATE
  const total        = sub + tax + tip

  const BAD   = /unknown|n\/a|not found|none|null/i
  const venue = receiptMeta?.venue && !BAD.test(receiptMeta.venue) ? receiptMeta.venue : null

  return (
    <div className="sfo-page">
      <PageNav step={2} onBack={onBack} />

      <div className="iv-title-section">
        <h2 className="iv-title">Review receipts</h2>
        <p className="iv-subtitle">Check each person's total before sending.</p>
      </div>

      <ChipRow people={people} active={activePerson} onSelect={setActivePerson} />

      <div className="iv-receipt-card">
        <ZigZagTop />
        <div className="iv-receipt-content">
          <div className="sfo-review-head">
            <span className="sfo-review-name">{possessive} receipt</span>
            {venue && <span className="sfo-review-venue">{venue}</span>}
          </div>
          <div className="iv-dashed" />

          {personItems.length === 0
            ? <p className="sfo-empty-note">No items assigned to {isPayer ? 'you' : activeName}.</p>
            : (
              <div className="sfo-review-items">
                {personItems.map((item, i) => (
                  <div key={i} className="sfo-review-row">
                    <span className="sr-item-name">{item.name}</span>
                    <span className="sr-item-price">${(typeof item.price === 'number' ? item.price : 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )
          }

          <div className="iv-dashed" />

          <div className="iv-totals">
            <div className="iv-total-row"><span>Subtotal</span><span>${sub.toFixed(2)}</span></div>
            <div className="iv-total-row"><span>Tax (8.5%)</span><span>${tax.toFixed(2)}</span></div>
            <div className="iv-total-row"><span>Tip (18%)</span><span>${tip.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div className="sfo-total-card">
        <span className="sfo-total-label">{isPayer ? 'Your share' : `${activeName} owes`}</span>
        <span className="sfo-total-amount">${total.toFixed(2)}</span>
      </div>

      <div className="sfo-sticky-bottom">
        <button type="button" className="continue-btn" onClick={onContinue}>
          Send requests
        </button>
      </div>
    </div>
  )
}

/* ── Link generation ───────────────────────────────────────────── */

function buildReceiptLink(person, items, assignments, receiptMeta, payInfo) {
  const personItemsWithShare = items
    .map((it, i) => {
      const assignees = assignments[i] || []
      if (!assignees.includes(person.id)) return null
      const price = typeof it.price === 'number' ? it.price : 0
      return { name: it.name, price: price / assignees.length }
    })
    .filter(Boolean)
  const sub   = personItemsWithShare.reduce((s, it) => s + it.price, 0)
  const tax   = sub * TAX_RATE
  const tip   = sub * TIP_RATE
  const total = sub + tax + tip

  const payMethod = payInfo?.method === 'zelle' ? 'zelle' : 'venmo'
  const payHandle = (payInfo?.[payMethod] || '').trim()

  const data = {
    name:  person.name,
    items: personItemsWithShare,
    sub, tax, tip, total,
    venue: receiptMeta?.venue || null,
    payMethod,
    payHandle,
  }

  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))))
    return `${window.location.origin}${window.location.pathname}#receipt=${encoded}`
  } catch {
    return window.location.href
  }
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function CheckSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PAGE 4 — Share Links
══════════════════════════════════════════════════════════════════ */

function ShareLinksPage({ people, items, assignments, receiptMeta, onBack }) {
  const nonPayers = people.filter(p => !p.isPayer)
  const payer     = people.find(p => p.isPayer)
  const yourShare = payer ? getPersonTotal(items, assignments, payer.id) : 0
  const [copied, setCopied] = useState({})
  const [payInfo, setPayInfo] = useState(loadPayInfo)
  const [saved, setSaved] = useState(false)
  const payHandle = payInfo[payInfo.method] || ''

  function confirmSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function setPayMethod(method) {
    setPayInfo(prev => {
      const next = { ...prev, method }
      savePayInfo(next)
      return next
    })
  }

  function setPayHandle(value) {
    setPayInfo(prev => {
      const next = { ...prev, [prev.method]: value }
      savePayInfo(next)
      return next
    })
  }

  function copyLink(p) {
    const link = buildReceiptLink(p, items, assignments, receiptMeta, payInfo)
    navigator.clipboard.writeText(link).catch(() => {
      const el = document.createElement('textarea')
      el.value = link
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    })
    setCopied(prev => ({ ...prev, [p.id]: true }))
    setTimeout(() => setCopied(prev => ({ ...prev, [p.id]: false })), 2200)
  }

  const youReceive = nonPayers.reduce((s, p) => s + getPersonTotal(items, assignments, p.id), 0)

  return (
    <div className="sfo-page">
      <PageNav step={3} onBack={onBack} />

      <div className="iv-title-section">
        <h2 className="iv-title">Share receipts</h2>
        <p className="iv-subtitle">Send each person their link — they'll see their itemized bill and can pay you on Venmo.</p>
      </div>

      <div className="sfo-request-list">
        {payer && (
          <div className="sfo-request-card">
            <div className="sfo-req-left">
              <span className="sfo-req-name">{payer.name}</span>
              <span className="sfo-req-amount">${yourShare.toFixed(2)}</span>
            </div>
            <span className="sfo-paid-pill">Your share</span>
          </div>
        )}
        {nonPayers.map(p => {
          const total     = getPersonTotal(items, assignments, p.id)
          const isCopied  = !!copied[p.id]
          return (
            <div key={p.id} className="sfo-request-card">
              <div className="sfo-req-left">
                <span className="sfo-req-name">{p.name}</span>
                <span className="sfo-req-amount">${total.toFixed(2)}</span>
              </div>
              <button
                type="button"
                className={`sfo-copy-btn${isCopied ? ' sfo-copy-btn-done' : ''}`}
                onClick={() => copyLink(p)}
              >
                {isCopied ? <><CheckSmall /> Copied!</> : <><LinkIcon /> Copy link</>}
              </button>
            </div>
          )
        })}
      </div>

      <div className="sfo-total-card">
        <span className="sfo-total-label">You're owed</span>
        <span className="sfo-total-amount">${youReceive.toFixed(2)}</span>
      </div>

      <div className="sfo-card sfo-pay-card">
        <div className="sfo-stepper-row">
          <span className="sfo-stepper-label">How should they pay you?</span>
        </div>
        <div className="sfo-pay-toggle">
          <button
            type="button"
            className={`sfo-chip${payInfo.method === 'venmo' ? ' sfo-chip-active' : ''}`}
            style={payInfo.method === 'venmo' ? { background: '#EFF6FF', borderColor: '#3D95CE', color: '#1D4ED8' } : {}}
            onClick={() => setPayMethod('venmo')}
          >
            Venmo
          </button>
          <button
            type="button"
            className={`sfo-chip${payInfo.method === 'zelle' ? ' sfo-chip-active' : ''}`}
            style={payInfo.method === 'zelle' ? { background: '#F5F3FF', borderColor: '#7C3AED', color: '#6D28D9' } : {}}
            onClick={() => setPayMethod('zelle')}
          >
            Zelle
          </button>
        </div>
        <div className="sfo-card-divider" />
        <div className="sfo-pay-handle-row">
          <input
            className="sfo-pay-handle-input"
            value={payHandle}
            onChange={e => setPayHandle(e.target.value)}
            placeholder={payInfo.method === 'venmo' ? '@your-venmo-username' : 'Your Zelle email or phone'}
          />
        </div>
      </div>

      <div className="sfo-sticky-bottom">
        <button type="button" className="continue-btn" onClick={confirmSaved}>
          {saved ? <><CheckSmall /> Saved</> : 'Done'}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Recipient receipt view (opened via shared link)
══════════════════════════════════════════════════════════════════ */

export function RecipientReceiptView({ data }) {
  const payMethod = data.payMethod === 'zelle' ? 'zelle' : 'venmo'
  const payHandle = data.payHandle || ''
  const venmoUser = payHandle.replace(/^@/, '')
  const [handleCopied, setHandleCopied] = useState(false)

  function copyHandle() {
    navigator.clipboard.writeText(payHandle).catch(() => {})
    setHandleCopied(true)
    setTimeout(() => setHandleCopied(false), 2200)
  }

  function payWithVenmo() {
    const amount = data.total.toFixed(2)
    const note   = data.venue ? `&note=${encodeURIComponent(data.venue)}` : ''
    const appUrl = venmoUser ? `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(venmoUser)}&amount=${amount}${note}` : null
    const webUrl = `https://account.venmo.com/pay?txn=pay&amount=${amount}${venmoUser ? `&recipients=${encodeURIComponent(venmoUser)}` : ''}${note}`
    openWithAppFallback(appUrl, webUrl)
  }

  function openZelleApp() {
    // Zelle has no officially documented deep-link scheme — this is a
    // best-effort attempt some bank Zelle integrations recognize. It always
    // falls back to Zelle's site so the button never dead-ends.
    const amount = data.total.toFixed(2)
    const note   = data.venue ? `&note=${encodeURIComponent(data.venue)}` : ''
    const appUrl = payHandle ? `zelle://pay?recipient=${encodeURIComponent(payHandle)}&amount=${amount}${note}` : 'zelle://'
    openWithAppFallback(appUrl, 'https://www.zellepay.com/')
  }

  return (
    <div className="sfo-page" style={{ paddingBottom: 80 }}>
      <div className="sfo-recipient-brand">
        <span className="title-dark">split</span>
        <span className="title-blue">me</span>
      </div>

      <div className="iv-title-section">
        <h2 className="iv-title">{data.name}'s receipt</h2>
        <p className="iv-subtitle">Here's your share of the bill</p>
      </div>

      <div className="iv-receipt-card">
        <ZigZagTop />
        <div className="iv-receipt-content">
          {data.venue && (
            <>
              <div className="iv-venue">{data.venue}</div>
              <div className="iv-dashed" />
            </>
          )}

          <div className="sfo-review-items">
            {data.items.map((item, i) => (
              <div key={i} className="sfo-review-row">
                <span className="sr-item-name">{item.name}</span>
                <span className="sr-item-price">${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="iv-dashed" />

          <div className="iv-totals">
            <div className="iv-total-row"><span>Subtotal</span><span>${data.sub.toFixed(2)}</span></div>
            <div className="iv-total-row"><span>Tax (8.5%)</span><span>${data.tax.toFixed(2)}</span></div>
            <div className="iv-total-row"><span>Tip (18%)</span><span>${data.tip.toFixed(2)}</span></div>
          </div>
        </div>
      </div>

      <div className="sfo-total-card" style={{ marginTop: 14 }}>
        <span className="sfo-total-label">You owe</span>
        <span className="sfo-total-amount">${data.total.toFixed(2)}</span>
      </div>

      {payMethod === 'zelle' ? (
        <>
          <p className="venmo-pre-label" style={{ marginTop: 20 }}>Pay back with Zelle</p>

          {isMobileDevice() ? (
            <button type="button" className="venmo-btn zelle-btn" onClick={openZelleApp}>
              <span className="venmo-btn-text">Open</span>
              <span className="venmo-btn-logo">Zelle</span>
            </button>
          ) : (
            <a
              className="venmo-btn zelle-btn"
              href="https://www.zellepay.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="venmo-btn-text">Go to</span>
              <span className="venmo-btn-logo">Zelle</span>
            </a>
          )}

          <div className="sfo-zelle-card">
            <span className="sfo-zelle-handle">{payHandle || 'Ask them for their Zelle info'}</span>
            {payHandle && (
              <button
                type="button"
                className={`sfo-copy-btn${handleCopied ? ' sfo-copy-btn-done' : ''}`}
                onClick={copyHandle}
              >
                {handleCopied ? <><CheckSmall /> Copied!</> : <><LinkIcon /> Copy</>}
              </button>
            )}
          </div>

          <p className="venmo-secure">Send ${data.total.toFixed(2)} to this Zelle contact{isMobileDevice() ? ' — opens your bank\'s Zelle if linked' : ' from your bank\'s app'}</p>
        </>
      ) : (
        <>
          <p className="venmo-pre-label" style={{ marginTop: 20 }}>Pay back with Venmo</p>

          <button type="button" className="venmo-btn" onClick={payWithVenmo}>
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
            Secure payment via Venmo
          </p>
        </>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Main Export
══════════════════════════════════════════════════════════════════ */

export function SplitForOthersFlow({ items: rawItems, receiptMeta, onBack }) {
  const items = (rawItems && rawItems.length > 0) ? rawItems : DEMO_ITEMS

  const [page, setPage] = useState('addPeople')
  const [splitMode, setSplitMode] = useState('item')
  const [people, setPeople] = useState(() => [
    { id: uid(), name: 'You', isPayer: true },
  ])
  const [evenCount, setEvenCount] = useState(1)
  const [assignments, setAssignments] = useState({})

  function handleAddPeopleContinue() {
    if (splitMode === 'even') {
      const payer = people.find(p => p.isPayer) ?? { id: uid(), name: 'You', isPayer: true }
      const friends = Array.from({ length: evenCount }, (_, i) => ({ id: uid(), name: `Friend ${i + 1}`, isPayer: false }))
      const evenPeople = [payer, ...friends]
      const evenAssignments = {}
      items.forEach((_, i) => { evenAssignments[i] = evenPeople.map(p => p.id) })
      setPeople(evenPeople)
      setAssignments(evenAssignments)
      setPage('reviewReceipts')
    } else {
      setPage('assignItems')
    }
  }

  if (page === 'addPeople') return (
    <AddPeoplePage
      people={people}
      setPeople={setPeople}
      splitMode={splitMode}
      setSplitMode={setSplitMode}
      evenCount={evenCount}
      setEvenCount={setEvenCount}
      onContinue={handleAddPeopleContinue}
      onBack={onBack}
    />
  )

  if (page === 'assignItems') return (
    <AssignItemsPage
      people={people}
      items={items}
      assignments={assignments}
      setAssignments={setAssignments}
      onContinue={() => setPage('reviewReceipts')}
      onBack={() => setPage('addPeople')}
    />
  )

  if (page === 'reviewReceipts') return (
    <ReviewReceiptsPage
      people={people}
      items={items}
      assignments={assignments}
      receiptMeta={receiptMeta}
      onContinue={() => setPage('sendRequests')}
      onBack={() => setPage(splitMode === 'even' ? 'addPeople' : 'assignItems')}
    />
  )

  if (page === 'sendRequests') return (
    <ShareLinksPage
      people={people}
      items={items}
      assignments={assignments}
      receiptMeta={receiptMeta}
      onBack={() => setPage('reviewReceipts')}
    />
  )

  return null
}

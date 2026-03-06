import { useRef, useState, useEffect } from 'react'
import './App.css'

const SAVED_PHOTO_KEY = 'split-me-photo'

function parseJsonFromText(text) {
  let raw = text.trim()
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) raw = codeBlock[1].trim()
  return JSON.parse(raw)
}

function App() {
  const fileInputRef = useRef(null)
  const [photo, setPhoto] = useState(null)
  const [photoSelectedThisSession, setPhotoSelectedThisSession] = useState(false)
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [view, setView] = useState('landing')

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_PHOTO_KEY)
    if (saved) setPhoto(saved)
  }, [])

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      setPhoto(dataUrl)
      setPhotoSelectedThisSession(true)
      localStorage.setItem(SAVED_PHOTO_KEY, dataUrl)
      setItems(null)
      setError(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      setError('Add your OpenAI API key to .env (see .env.example).')
      return
    }
    if (!photo) {
      setError('Please add a receipt photo first.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const prompt = `You are helping split a restaurant receipt.\n\nLook at the image of the receipt and extract the line items.\nReturn ONLY valid JSON, no markdown, with this shape:\n{\n  "items": [\n    { "name": string, "price": number }\n  ]\n}\n\nIgnore tax and tip for now; just list the main items and their prices.`

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: photo } },
              ],
            },
          ],
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        const msg = data.error?.message || data.error?.code || res.statusText
        throw new Error(msg)
      }

      const text = data.choices?.[0]?.message?.content?.trim()
      if (!text) throw new Error('No response from OpenAI')

      const parsed = parseJsonFromText(text)
      if (!parsed || !Array.isArray(parsed.items)) {
        throw new Error('Unexpected format from OpenAI.')
      }
      setItems(parsed.items)
      setView('items')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h1 className="app-title">Split Me</h1>
      {view === 'landing' ? (
        <>
          <div className="camera-row">
            <button
              type="button"
              className="camera-btn"
              onClick={handleCameraClick}
              aria-label="Take photo"
            >
              <CameraIcon />
            </button>
            <span className="camera-label">Get Started</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden-input"
            aria-hidden="true"
          />
          {photo && photoSelectedThisSession ? (
            <div className="split-form">
              <button
                type="button"
                className="submit-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Processing…' : 'Submit'}
              </button>
              {error ? <p className="error-msg">{error}</p> : null}
            </div>
          ) : null}
        </>
      ) : (
        <div className="items-screen">
          <div className="items-header">
            <button
              type="button"
              className="back-btn"
              onClick={() => {
                setView('landing')
                setItems(null)
                setError(null)
              }}
            >
              ← Back
            </button>
            <h2 className="items-title">Items found</h2>
          </div>
          <ul className="items-list">
            {items?.map((item, index) => (
              <li key={index}>
                <span className="item-name">{item.name}</span>
                <span className="item-price">
                  {typeof item.price === 'number'
                    ? `$${item.price.toFixed(2)}`
                    : '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

export default App

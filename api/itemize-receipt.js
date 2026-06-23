// Vercel serverless function. Holds the OpenAI key server-side so it's
// never bundled into client JS — the browser calls this route instead of
// calling OpenAI directly.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Server is missing OPENAI_API_KEY' })
    return
  }

  const { photo } = req.body || {}
  if (!photo) {
    res.status(400).json({ error: 'Missing photo' })
    return
  }

  const prompt = `You are helping split a restaurant receipt.\n\nExtract the receipt details and return ONLY valid JSON, no markdown:\n{\n  "venue": string or null,\n  "date": string or null,\n  "items": [\n    { "name": string, "price": number }\n  ]\n}\n\nFor venue: the restaurant/cafe name. For date: the date/time shown. Ignore tax and tip; list only the main food/drink items and their individual prices.`

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: photo } }] }],
      }),
    })
    const data = await openaiRes.json()
    if (!openaiRes.ok) {
      res.status(openaiRes.status).json({ error: data.error?.message || 'OpenAI request failed' })
      return
    }
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) {
      res.status(502).json({ error: 'No response from OpenAI' })
      return
    }
    res.status(200).json({ text })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unexpected server error' })
  }
}

import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

// Safely handle missing keys by falling back to empty string so the client can fallback to heuristics
const apiKey = process.env.GEMINI_API_KEY || ''
const ai = apiKey !== 'dummy-gemini-key' && apiKey !== '' ? new GoogleGenAI({ apiKey }) : null

export async function POST(req: Request) {
  try {
    if (!ai) {
      return NextResponse.json({ error: 'Missing or Mock Gemini API Key' }, { status: 500 })
    }

    const { message, history, context } = await req.json()

    const prompt = `
You are the Lockbox AI Security Assistant. Your job is to help the admin understand and manage their API security platform.

CURRENT DASHBOARD CONTEXT:
${JSON.stringify(context, null, 2)}

RECENT CONVERSATION (for context):
${JSON.stringify(history.slice(-5), null, 2)}

NEW USER QUESTION:
${message}

Instructions:
1. Identify if the user is asking about why a request was blocked/allowed, and precisely explain the reason based on the provided JSON logs.
2. Suggest fixes for blocked requests (e.g. recommend they whitelist the specific IP if missing, or adjust rate limits in the policies).
3. Keep answers incredibly concise and practical. Never ramble.
4. Respond strictly in clear Markdown. Do not include boilerplate greetings.
`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    return NextResponse.json({ text: response.text })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown Gemini API error' }, { status: 500 })
  }
}

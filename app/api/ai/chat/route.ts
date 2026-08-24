import { NextResponse } from 'next/server'
import { moderateVietnamese } from '../../../../lib/moderation'
import { GAME_KNOWLEDGE } from '../../../../lib/game-knowledge'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const messages = Array.isArray(body?.messages) ? body.messages.slice(-12) : []
    if (!messages.length) return NextResponse.json({ error: 'Chưa có nội dung.' }, { status: 400 })

    const cleaned = messages
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m: any) => ({ role: m.role, content: moderateVietnamese(m.content.slice(0, 4000)).text }))
    const last = cleaned.at(-1)
    if (!last || last.role !== 'user' || !last.content.trim()) return NextResponse.json({ error: 'Tin nhắn không hợp lệ.' }, { status: 400 })

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'AI chưa được cấu hình. Thêm OPENROUTER_API_KEY vào biến môi trường server.' }, { status: 503 })

    const endpoint = process.env.AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
    const model = process.env.AI_MODEL || 'openai/gpt-4o-mini'
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(endpoint.includes('openrouter.ai') ? { 'HTTP-Referer': 'https://vietverse1.netlify.app', 'X-Title': 'VietVerse AI' } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: `Bạn là VietVerse AI, trợ lý hướng dẫn game bằng tiếng Việt. Không dùng lời tục tĩu hoặc xúc phạm. Hãy ưu tiên thông tin trong knowledge base dưới đây. Không bịa rằng tính năng đã hoạt động nếu knowledge base chỉ mô tả mục tiêu. Nếu người chơi hỏi cách chơi, hãy đưa từng bước ngắn gọn.\n\nGAME KNOWLEDGE:\n${GAME_KNOWLEDGE}` },
          ...cleaned,
        ],
        temperature: 0.5,
        max_tokens: 900,
      }),
    })
    const data = await upstream.json()
    if (!upstream.ok) {
      console.error('AI provider error:', data)
      return NextResponse.json({ error: 'AI provider đang lỗi hoặc API key không hợp lệ.' }, { status: 502 })
    }
    const content = data?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) return NextResponse.json({ error: 'AI không trả về nội dung.' }, { status: 502 })
    return NextResponse.json({ content: moderateVietnamese(content).text })
  } catch (e) {
    console.error('AI chat error:', e)
    return NextResponse.json({ error: 'Không thể kết nối VietVerse AI.' }, { status: 500 })
  }
}

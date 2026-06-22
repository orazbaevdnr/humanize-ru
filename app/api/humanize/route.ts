import { NextRequest, NextResponse } from 'next/server'
import { groq, MODEL } from '@/lib/groq'

const PROMPTS: Record<string, string> = {
  student:
    'Ты переписываешь текст так, чтобы он читался как написанный живым студентом. Добавляй естественные переходы, варьируй длину предложений, используй простые формулировки. Сохрани смысл и факты. Убери шаблонные обороты, característные для ИИ (например "в современном мире", "важно отметить", "таким образом").',
  business:
    'Ты переписываешь текст в деловом, но живом человеческом стиле. Варьируй структуру предложений, избегай канцелярита и шаблонов ИИ. Сохрани смысл, цифры и факты.',
  blog:
    'Ты переписываешь текст как опытный блогер: разговорно, с личной интонацией, разной длиной предложений, лёгкими отступлениями. Сохрани смысл. Убери штампы ИИ.',
}

export async function POST(req: NextRequest) {
  try {
    const { text, mode = 'student' } = await req.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Введите текст' }, { status: 400 })
    }
    if (text.length > 8000) {
      return NextResponse.json({ error: 'Максимум 8000 символов' }, { status: 400 })
    }
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'Сервис не настроен (нет GROQ_API_KEY)' }, { status: 503 })
    }

    const system =
      (PROMPTS[mode] || PROMPTS.student) +
      ' Отвечай ТОЛЬКО переписанным текстом, без вступлений и комментариев. Пиши на том же языке, что и исходный текст.'

    const completion = await groq.chat.completions.create({
      model: MODEL,
      temperature: 0.9,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: text },
      ],
    })

    const result = completion.choices[0]?.message?.content?.trim() || ''
    return NextResponse.json({ result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Ошибка обработки' }, { status: 500 })
  }
}

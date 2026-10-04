import { requireAdmin } from '../_auth.js';

export async function onRequestGet({ request, env }) {
    const auth = await requireAdmin(request, env);
    if (!auth) {
        return new Response(JSON.stringify({ error: '인증이 필요합니다.' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { results: comments } = await env.DB.prepare(
        'SELECT id, name, content, created_at FROM comments ORDER BY created_at ASC'
    ).all();

    const escape = str => `"${String(str).replace(/"/g, '""')}"`;

    const rows = [
        'ID,이름,내용,작성일시',
        ...comments.map(c =>
            `${c.id},${escape(c.name)},${escape(c.content)},${escape(c.created_at)}`
        ),
    ];

    // ﻿ = UTF-8 BOM — Excel에서 한글 깨짐 방지
    return new Response('﻿' + rows.join('\r\n'), {
        status: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="guestbook.csv"',
        },
    });
}

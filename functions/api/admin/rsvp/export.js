import { requireAdmin } from '../_auth.js';

export async function onRequestGet({ request, env }) {
    const auth = await requireAdmin(request, env);
    if (!auth) return new Response(JSON.stringify({ error: '인증이 필요합니다.' }), { status: 401 });

    const { results } = await env.DB.prepare(
        `SELECT id, attend, name, side, phone, extra_guests, meal, message, created_at
         FROM rsvp ORDER BY created_at DESC`
    ).all();

    const escape = v => {
        if (v == null) return '';
        const s = String(v);
        return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const headers = ['ID', '참석여부', '성함', '측', '연락처', '추가인원', '식사여부', '전달사항', '작성일시'];
    const rows = results.map(r =>
        [r.id, r.attend, r.name, r.side, r.phone, r.extra_guests, r.meal, r.message, r.created_at]
            .map(escape).join(',')
    );
    const csv = '﻿' + [headers.join(','), ...rows].join('\r\n');

    return new Response(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': 'attachment; filename="rsvp.csv"',
        },
    });
}

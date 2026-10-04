import { requireAdmin, jsonRes } from './_auth.js';

export async function onRequestGet({ request, env }) {
    const auth = await requireAdmin(request, env);
    if (!auth) return jsonRes({ error: '인증이 필요합니다.' }, 401);

    const row = await env.DB.prepare(
        "SELECT value FROM settings WHERE key = 'guestbook_locked'"
    ).first();

    return jsonRes({ guestbook_locked: row?.value === '1' });
}

export async function onRequestPut({ request, env }) {
    const auth = await requireAdmin(request, env);
    if (!auth) return jsonRes({ error: '인증이 필요합니다.' }, 401);

    let body;
    try { body = await request.json(); }
    catch { return jsonRes({ error: '잘못된 요청입니다.' }, 400); }

    const locked = body.guestbook_locked ? '1' : '0';
    await env.DB.prepare(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('guestbook_locked', ?)"
    ).bind(locked).run();

    return jsonRes({ success: true });
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        },
    });
}

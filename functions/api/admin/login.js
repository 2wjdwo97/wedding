import { signJwt, jsonRes } from './_auth.js';

export async function onRequestPost({ request, env }) {
    let body;
    try { body = await request.json(); }
    catch { return jsonRes({ error: '잘못된 요청입니다.' }, 400); }

    const { id, password } = body;

    if (!id || !password || id !== env.ADMIN_ID || password !== env.ADMIN_PASSWORD) {
        return jsonRes({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' }, 401);
    }

    const token = await signJwt(env.JWT_SECRET);

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`,
        },
    });
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

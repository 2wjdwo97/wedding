import { requireAdmin, jsonRes } from '../_auth.js';

export async function onRequestDelete({ request, env, params }) {
    const auth = await requireAdmin(request, env);
    if (!auth) return jsonRes({ error: '인증이 필요합니다.' }, 401);

    const row = await env.DB.prepare(
        'SELECT id FROM comments WHERE id = ?'
    ).bind(params.id).first();
    if (!row) return jsonRes({ error: '댓글을 찾을 수 없습니다.' }, 404);

    await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(params.id).run();
    return jsonRes({ success: true });
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        },
    });
}

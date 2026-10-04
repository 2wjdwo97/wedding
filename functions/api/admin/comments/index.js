import { requireAdmin, jsonRes } from '../_auth.js';

const PAGE_SIZE = 20;

export async function onRequestGet({ request, env }) {
    const auth = await requireAdmin(request, env);
    if (!auth) return jsonRes({ error: '인증이 필요합니다.' }, 401);

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const offset = (page - 1) * PAGE_SIZE;

    const countResult = await env.DB.prepare(
        'SELECT COUNT(*) as total FROM comments'
    ).first();
    const total = countResult.total;

    const { results: comments } = await env.DB.prepare(
        'SELECT id, name, content, created_at FROM comments ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(PAGE_SIZE, offset).all();

    return jsonRes({
        comments,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    });
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Cookie',
        },
    });
}

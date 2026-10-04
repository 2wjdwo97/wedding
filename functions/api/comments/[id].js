function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

async function verifyPassword(password, stored) {
    if (!stored || !stored.includes(':')) return false;
    const [salt, storedHex] = stored.split(':');
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: new TextEncoder().encode(salt),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        256
    );
    const hex = Array.from(new Uint8Array(bits))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return hex === storedHex;
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
    });
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export async function onRequestPut({ request, env, params }) {
    const id = params.id;
    let body;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: '잘못된 요청입니다.' }, 400);
    }

    const { password, content } = body;
    if (!password || !content || content.trim().length === 0 || content.length > 500) {
        return jsonResponse({ error: '비밀번호와 내용을 확인해주세요.' }, 400);
    }

    const row = await env.DB.prepare(
        'SELECT password FROM comments WHERE id = ?'
    ).bind(id).first();

    if (!row) return jsonResponse({ error: '댓글을 찾을 수 없습니다.' }, 404);

    const ok = await verifyPassword(password, row.password);
    if (!ok) return jsonResponse({ error: '비밀번호가 맞지 않습니다.' }, 403);

    await env.DB.prepare(
        'UPDATE comments SET content = ? WHERE id = ?'
    ).bind(content, id).run();

    return jsonResponse({ success: true });
}

export async function onRequestDelete({ request, env, params }) {
    const id = params.id;
    let body;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: '잘못된 요청입니다.' }, 400);
    }

    const { password } = body;
    if (!password) return jsonResponse({ error: '비밀번호를 입력해주세요.' }, 400);

    const row = await env.DB.prepare(
        'SELECT password FROM comments WHERE id = ?'
    ).bind(id).first();

    if (!row) return jsonResponse({ error: '댓글을 찾을 수 없습니다.' }, 404);

    const ok = await verifyPassword(password, row.password);
    if (!ok) return jsonResponse({ error: '비밀번호가 맞지 않습니다.' }, 403);

    await env.DB.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();

    return jsonResponse({ success: true });
}

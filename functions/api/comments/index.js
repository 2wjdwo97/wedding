const PAGE_SIZE = 10;
const rateLimitMap = new Map();

export function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

export function validateInput({ name, password, content }) {
    if (!name || name.trim().length === 0 || name.length > 20) {
        return '이름은 1~20자로 입력해주세요.';
    }
    if (!password || password.length === 0 || password.length > 20) {
        return '비밀번호는 1~20자로 입력해주세요.';
    }
    if (content !== undefined) {
        if (!content || content.trim().length === 0 || content.length > 500) {
            return '내용은 1~500자로 입력해주세요.';
        }
    }
    return null;
}

export function checkRateLimit(ip) {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const limit = 5;
    const times = (rateLimitMap.get(ip) || []).filter(t => now - t < windowMs);
    if (times.length >= limit) return false;
    times.push(now);
    rateLimitMap.set(ip, times);
    return true;
}

export async function hashPassword(password) {
    const salt = crypto.randomUUID();
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
    return `${salt}:${hex}`;
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

export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const offset = (page - 1) * PAGE_SIZE;

    const countResult = await env.DB.prepare(
        'SELECT COUNT(*) as total FROM comments'
    ).first();
    const total = countResult.total;

    const { results: comments } = await env.DB.prepare(
        'SELECT id, name, content, created_at FROM comments ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(PAGE_SIZE, offset).all();

    return jsonResponse({
        comments,
        total,
        page,
        totalPages: Math.ceil(total / PAGE_SIZE),
    });
}

export async function onRequestPost({ request, env }) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(ip)) {
        return jsonResponse({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, 429);
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: '잘못된 요청입니다.' }, 400);
    }

    const { name, password, content } = body;
    const err = validateInput({ name, password, content });
    if (err) return jsonResponse({ error: err }, 400);

    const hashedPw = await hashPassword(password);
    await env.DB.prepare(
        'INSERT INTO comments (name, password, content) VALUES (?, ?, ?)'
    ).bind(name, hashedPw, content).run();

    return jsonResponse({ success: true }, 201);
}

// JWT: HMAC-SHA256, Web Crypto API만 사용 (외부 라이브러리 없음)

function b64url(input) {
    const str = input instanceof Uint8Array
        ? Array.from(input).map(b => String.fromCharCode(b)).join('')
        : input;
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlDecode(str) {
    const pad = str.length % 4 === 0 ? 0 : 4 - (str.length % 4);
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
    const binary = atob(b64);
    return new Uint8Array([...binary].map(c => c.charCodeAt(0)));
}

async function hmacKey(secret) {
    return crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

export async function signJwt(secret) {
    const h = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const p = b64url(JSON.stringify({ sub: 'admin', iat: Math.floor(Date.now() / 1000) }));
    const msg = `${h}.${p}`;
    const key = await hmacKey(secret);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
    return `${msg}.${b64url(new Uint8Array(sig))}`;
}

export async function verifyJwt(token, secret) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const msg = `${h}.${p}`;
    try {
        const key = await hmacKey(secret);
        const valid = await crypto.subtle.verify(
            'HMAC', key, b64urlDecode(s), new TextEncoder().encode(msg)
        );
        if (!valid) return null;
        const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p)));
        // 24시간 만료 확인
        if (Math.floor(Date.now() / 1000) - payload.iat > 86400) return null;
        return payload;
    } catch {
        return null;
    }
}

export async function requireAdmin(request, env) {
    const cookie = request.headers.get('Cookie') || '';
    const match = cookie.match(/admin_token=([^;]+)/);
    const token = match?.[1] ?? null;
    return verifyJwt(token, env.JWT_SECRET);
}

export function jsonRes(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

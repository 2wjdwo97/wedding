function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function onRequestPost({ request, env }) {
    let body;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: '잘못된 요청입니다.' }, 400);
    }

    const { attend, name, side, phone, extra_guests, meal, message } = body;

    if (!attend || !['가능', '불가'].includes(attend)) {
        return jsonResponse({ error: '참석 여부를 선택해주세요.' }, 400);
    }

    await env.DB.prepare(
        `INSERT INTO rsvp (attend, name, side, phone, extra_guests, meal, message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
        attend,
        name   || null,
        side   || null,
        phone  || null,
        parseInt(extra_guests) || 0,
        meal    || null,
        message || null
    ).run();

    return jsonResponse({ ok: true });
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

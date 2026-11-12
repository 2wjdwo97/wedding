import { requireAdmin, jsonRes } from '../_auth.js';

const PAGE_SIZE = 20;

export async function onRequestGet({ request, env }) {
    const auth = await requireAdmin(request, env);
    if (!auth) return jsonRes({ error: '인증이 필요합니다.' }, 401);

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const side = url.searchParams.get('side') || '';
    const offset = (page - 1) * PAGE_SIZE;

    const sideWhere = side ? ` AND side=?` : '';
    const sideArgs = side ? [side] : [];

    const [countRow, statsAttend, statsNotAttend, statsMeal, { results: rsvps }] = await Promise.all([
        env.DB.prepare(`SELECT COUNT(*) as total FROM rsvp WHERE 1=1${sideWhere}`)
            .bind(...sideArgs).first(),
        env.DB.prepare(`SELECT SUM(1 + extra_guests) as n FROM rsvp WHERE attend='가능'${sideWhere}`)
            .bind(...sideArgs).first(),
        env.DB.prepare(`SELECT COUNT(*) as n FROM rsvp WHERE attend!='가능'${sideWhere}`)
            .bind(...sideArgs).first(),
        env.DB.prepare(`SELECT SUM(1 + extra_guests) as n FROM rsvp WHERE meal='식사함'${sideWhere}`)
            .bind(...sideArgs).first(),
        env.DB.prepare(
            `SELECT id, attend, name, side, phone, extra_guests, meal, message, created_at FROM rsvp WHERE 1=1${sideWhere} ORDER BY created_at DESC LIMIT ? OFFSET ?`
        ).bind(...sideArgs, PAGE_SIZE, offset).all(),
    ]);

    const total = countRow.total;

    return jsonRes({
        rsvps,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        stats: {
            total,
            attending: statsAttend.n || 0,
            notAttending: statsNotAttend.n || 0,
            meal: statsMeal.n || 0,
        },
    });
}

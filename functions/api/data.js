const DEFAULT_DATA = [
  { id: 'A', label: '课程 A', capacity: 8, selected: [] },
  { id: 'B', label: '课程 B', capacity: 8, selected: [] },
  { id: 'C', label: '课程 C', capacity: 8, selected: [] },
];

const ADMIN_PW = 'admin';
const KV_KEY = 'data';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  let data;
  try {
    data = await env.COURSE_DATA.get(KV_KEY, 'json');
  } catch (e) {
    data = null;
  }
  if (!Array.isArray(data)) data = DEFAULT_DATA;
  return jsonResponse(data);
}

export async function onRequestPost(context) {
  const { env, request } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders() });
  }
  if (body.password !== ADMIN_PW) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders() });
  }

  const data = Array.isArray(body.options) ? body.options : DEFAULT_DATA;

  // Enforce one phone per course: keep a person (by phone) in only the first option they appear in
  const seenPhones = new Set();
  data.forEach(function(opt) {
    if (!opt.selected || !Array.isArray(opt.selected)) return;
    opt.selected = opt.selected.filter(function(p) {
      const phone = (typeof p === 'object' && p.phone) ? p.phone : '';
      if (!phone) return true;
      if (seenPhones.has(phone)) return false;
      seenPhones.add(phone);
      return true;
    });
  });

  // If body contains a "checkPhone" field, check for duplicate registration
  if (body.checkPhone) {
    const phone = body.checkPhone;
    const alreadyRegistered = data.some(opt =>
      opt.selected && opt.selected.some(p => {
        if (typeof p === 'object' && p.phone) return p.phone === phone;
        return false;
      })
    );
    if (alreadyRegistered) {
      return new Response(JSON.stringify({ error: 'duplicate', message: '该手机号已报名' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
  }

  try {
    await env.COURSE_DATA.put(KV_KEY, JSON.stringify(data));
  } catch (e) {
    return new Response('KV write failed: ' + e.message, { status: 500, headers: corsHeaders() });
  }
  return jsonResponse(data);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

const { loadAuthState, loadState, saveState } = require('../lib/crmRuntimeStore');
const { getPublicAdminProfile, verifyAdminSession } = require('../lib/adminAuth');
const {
  buildDashboardSummary,
  generateServiceRecommendations,
  moveInquiryStage,
  recordInquiry,
  saveConsultationNotes,
  updateServiceCatalog,
  updateTemplate,
} = require('../lib/musicMakeoverCrm');

module.exports = async function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  try {
    const authState = await loadAuthState();
    const admin = verifyAdminSession(authState, readBearerToken(req), { throwOnInvalid: false });
    if (!admin) {
      return sendJson(res, 401, { ok: false, error: 'Admin login required' });
    }

    const state = await loadState();

    if (req.method === 'GET') {
      return sendJson(res, 200, {
        ok: true,
        admin: getPublicAdminProfile(admin),
        dashboard: buildDashboardSummary(state),
        state,
      });
    }

    if (req.method === 'POST') {
      const payload = await readBody(req);
      const nextState = applyAction(state, payload);
      await saveState(nextState.state || nextState);
      return sendJson(res, 200, {
        ok: true,
        admin: getPublicAdminProfile(admin),
        dashboard: buildDashboardSummary(nextState.state || nextState),
        state: nextState.state || nextState,
        result: nextState.result || null,
      });
    }

    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error.message || 'CRM request failed' });
  }
};

function applyAction(state, payload) {
  switch (payload.action) {
    case 'inquiry:create':
      return recordInquiry(state, payload.inquiry || payload.payload || {});
    case 'lead:stage':
      return moveInquiryStage(state, payload.inquiryId, payload.stage);
    case 'service:update':
      return updateServiceCatalog(state, payload.serviceId, payload.patch || {});
    case 'consultation:create':
      return saveConsultationNotes(state, payload.consultation || payload.payload || {});
    case 'recommendation:generate':
      return generateServiceRecommendations(state, payload.consultationId);
    case 'template:update':
      return updateTemplate(state, payload.collection, payload.templateId, payload.patch || {});
    default:
      throw new Error(`Unknown CRM action: ${payload.action}`);
  }
}

function readBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function setSecurityHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

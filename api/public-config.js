const { loadState } = require('../lib/crmRuntimeStore');

module.exports = async function handler(req, res) {
  setHeaders(res);

  if (req.method === 'OPTIONS') {
    return sendJson(res, 204, {});
  }

  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  const state = await loadState();
  return sendJson(res, 200, {
    ok: true,
    state: {
      categories: state.categories,
      formFields: state.formFields,
      services: state.services,
      appointmentTypes: state.appointmentTypes,
      adminContent: state.adminContent,
      siteContent: state.siteContent,
      testimonials: (state.testimonials || []).filter(t => t.status === 'approved'),
    },
  });

};

function setHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

const crypto = require('node:crypto');

function requestId(req, res, next) {
    const traceId = crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(16).slice(2, 10);
    req.traceId = traceId;
    res.set('X-Request-Id', traceId);
    next();
}

module.exports = { requestId };

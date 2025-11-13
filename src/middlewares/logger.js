function requestLogger(req, res, next) {
    const start = Date.now();
    const trace = req.traceId || '-';
    console.log(trace, req.method, req.originalUrl);
    res.on('finish', () => {
        console.log(trace, res.statusCode, `${Date.now() - start}ms`);
    });
    next();
}

module.exports = { requestLogger };

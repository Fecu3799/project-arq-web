function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    if (status >= 500) {
        console.error('ERROR', req.traceId, err);
    } else {
        console.warn('WARN', req.traceId, err.title || err.message);
    }

    res.status(status).json({
        status,
        title: err.title || 'Error interno del servidor',
        detail: err.message || 'Algo falló',
        traceId: req.traceId,
    });
}

module.exports = { errorHandler };

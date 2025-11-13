function notFoundHandler(req, res) {
    res.status(404).json({
        status: 404,
        title: 'Recurso no encontrado',
        detail: `Ruta o path inexistente: ${req.method} ${req.originalUrl}`,
        traceId: req.traceId,
    });
}

module.exports = { notFoundHandler };

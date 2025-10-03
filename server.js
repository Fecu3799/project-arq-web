const express = require('express');
const moment = require('moment');

// express server
const app = express();


// MIDDLEWARES

// requestID
const requestId = (req, res, next) => {
    req.traceId = Math.random().toString(16).slice(2, 8);
    res.set('X-Request-Id', req.traceId);
    next();
};

// logger
const logger = (req, res, next) => {
    const time = Date.now();
    console.log(req.traceId, req.method, req.originalUrl);
    res.on('finish', () => console.log(req.traceId, req.statusCode, Date.now() - time, 'ms'));
    next();
};

app.use(requestId);
app.use(logger);
app.use(express.json());



// ROUTES

// Services
app.get('/api/v1/services', (req, res) => {



});

// Appointments
app.get('/api/v1/appointments', (req, res) => {

    

});



// MIDDLEWARES

// Route Not Found
app.use((err, req, res, next) => {
    res.status(404).json({
        status: 404,
        title: 'Recurso no encontrado',
        detail: 'Ruta o path inexistente',
        traceId: req.tracId
    });
});

// Error handler
app.use((err, req, res, next) => {
    const status = err.status || 500;
    console.error('ERROR', req.traceId, err);
    res.status(status).json({
        status,
        title: err.title || 'Error interno del servidor',
        detail: err.message || 'Algo falló',
        traceId: req.traceId
    });
});



// START SERVER
app.listen(process.env.PORT || 3000, function () {

    console.log('API y express.js...');

});
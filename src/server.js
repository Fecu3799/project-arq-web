const express = require('express');
const store = require('./data/store');
const {login, auth, rbac} = require('./utils/auth');


// express server
const app = express();


// MIDDLEWARES

// requestID
app.use((req, res, next) => {
    req.traceId = Math.random().toString(16).slice(2, 8);
    res.set('X-Request-Id', req.traceId);
    next();
});

// logger
app.use((req, res, next) => {
    const time = Date.now();
    console.log(req.traceId, req.method, req.originalUrl);
    res.on('finish', () => console.log(req.traceId, res.statusCode, Date.now() - time, 'ms'));
    next();
});

// body parser
app.use(express.json());



// ROUTES

// Login
app.post('/api/v1/auth/login', async (req, res, next) => {
    
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return next(makeError(400, 'Solicitud incorrecta', 'Falta email o contraseña'));
        }
        const out = await login(email, password);
        res.status(200).json(out);
    } catch (err) {
        next(err);
    }
});



// Admin: CRUD Services
app.get('/api/v1/admin/services', auth, rbac('admin'), async (req, res, next) => {

    try {
        const services = await store.loadServices();
        res.status(200).json(services);
    } catch (err) {
        next(err);
    }
});

app.post('/api/v1/admin/services', auth, rbac('admin'), async (req, res, next) => {

    try {
        const newService = await store.addService(req.body);
        res.status(201).json(newService);
    } catch (err) {
        next(err);
    }
});

app.patch('/api/v1/admin/services/:id', auth, rbac('admin'), async (req, res, next) => {

    try {
        const updatedService = await store.updateService(req.params.id, req.body);
        res.status(200).json(updatedService);
    } catch (err) {
        next(err);
    }
});


// Public Services
app.get('/api/v1/services', async (req, res, next) => {

    try{
        const services = await store.loadServices();
        const activeServices = services.filter(s => s.active);
        res.status(200).json(activeServices);
    } catch (err) {
        next(err);
    }
});

app.get('/api/v1/services/:id', async (req, res, next) => {

    try {
        const services = await store.loadServices();
        const service = services.find(s => s.id === parseInt(req.params.id) && s.active);
        if (!service) {
            res.status(403).json({ message: 'Servicio no disponible' });
        }
        res.status(200).json(service);
    } catch (err) {
        next(err);
    }
});-


// Appointments
app.get('/api/v1/appointments', async (req, res) => {

    

});



// MIDDLEWARES

// Route Not Found
app.use((req, res) => {
    res.status(404).json({
        status: 404,
        title: 'Recurso no encontrado',
        detail: `Ruta o path inexistente: ${req.method} ${req.originalUrl}`,
        traceId: req.traceId,
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
        traceId: req.traceId,
    });
});



// START SERVER
app.listen(process.env.PORT || 3000, function () {

    console.log('API y express.js...');

});
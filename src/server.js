const express = require('express');
const { login, auth, rbac } = require('./utils/auth');
const { makeError } = require('./utils/errors');
const { getDayAvailability } = require('./services/availability.service');
const { createAppointment, updateAppointment, getAppointments } = require('./services/appointments.service');
const servicesService = require('./services/services.service');
const { requestId } = require('./middlewares/request-id');
const { requestLogger } = require('./middlewares/logger');
const { notFoundHandler } = require('./middlewares/not-found');
const { errorHandler } = require('./middlewares/error-handler');

function createApp() {
    const app = express();

    app.use(requestId);
    app.use(requestLogger);
    app.use(express.json());

    // PUBLIC ROUTES
    app.get('/api/v1/services', async (req, res, next) => {
        try {
            const services = await servicesService.getActiveServices();
            res.status(200).json(services);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/v1/services/:id', async (req, res, next) => {
        try {
            const service = await servicesService.getActiveServiceById(req.params.id);
            res.status(200).json(service);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/v1/availability/day', async (req, res, next) => {
        try {
            const availability = await getDayAvailability({
                date: req.query.date,
                service_id: req.query.service_id,
            });
            res.status(200).json(availability);
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/v1/appointments', async (req, res, next) => {
        try {
            const appointment = await createAppointment(req.body);
            res.status(201).json(appointment);
        } catch (err) {
            next(err);
        }
    });

    app.patch('/api/v1/appointments/:id', async (req, res, next) => {
        try {
            const updated = await updateAppointment(req.params.id, req.body);
            res.status(200).json(updated);
        } catch (err) {
            next(err);
        }
    });

    // AUTH
    app.post('/api/v1/auth/login', async (req, res, next) => {
        try {
            const { email, password } = req.body || {};
            if (!email || !password) {
                return next(makeError(400, 'Solicitud incorrecta', 'Faltan credenciales'));
            }
            const out = await login(email, password);
            res.status(200).json(out);
        } catch (err) {
            next(err);
        }
    });

    // ADMIN
    app.get('/api/v1/admin/services', auth, rbac('admin'), async (req, res, next) => {
        try {
            const services = await servicesService.getAllServices();
            res.status(200).json(services);
        } catch (err) {
            next(err);
        }
    });

    app.post('/api/v1/admin/services', auth, rbac('admin'), async (req, res, next) => {
        try {
            const created = await servicesService.createService(req.body);
            res.status(201).json(created);
        } catch (err) {
            next(err);
        }
    });

    app.patch('/api/v1/admin/services/:id', auth, rbac('admin'), async (req, res, next) => {
        try {
            const updated = await servicesService.updateService(req.params.id, req.body);
            res.status(200).json(updated);
        } catch (err) {
            next(err);
        }
    });

    app.get('/api/v1/admin/appointments', auth, rbac('admin'), async (req, res, next) => {
        try {
            const appointments = await getAppointments();
            res.status(200).json(appointments);
        } catch (err) {
            next(err);
        }
    });

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}

function start() {
    const app = createApp();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`API y express.js escuchando en puerto ${port}`);
    });
}

if (require.main === module) {
    start();
}

module.exports = { createApp, start };

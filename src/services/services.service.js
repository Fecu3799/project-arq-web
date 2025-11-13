const store = require('../data/store');
const validate = require('../utils/validations');
const { makeError } = require('../utils/errors');

function parseServiceId(value) {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
        throw makeError(400, 'Solicitud incorrecta', 'El id del servicio debe ser un número entero mayor que cero');
    }
    return id;
}

function ensurePayload(payload) {
    if (payload == null || typeof payload !== 'object') {
        throw makeError(400, 'Solicitud incorrecta', 'Falta el cuerpo de la solicitud');
    }
}

function normalizeName(value) {
    const name = validate.toStringTrim(value);
    if (!name) {
        throw makeError(422, 'Solicitud incorrecta', 'El nombre no puede estar vacío');
    }
    return name;
}

function normalizeDuration(value) {
    const duration = Number(value);
    if (Number.isNaN(duration) || duration <= 0) {
        throw makeError(422, 'Solicitud incorrecta', 'La duración debe ser un número mayor que cero');
    }
    return duration;
}

function normalizePrice(value) {
    const price = Number(value);
    if (Number.isNaN(price) || price < 0) {
        throw makeError(422, 'Solicitud incorrecta', 'El precio debe ser un número mayor o igual que cero');
    }
    return price;
}

function normalizeActive(value) {
    if (value === undefined) return true;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
    }
    throw makeError(422, 'Solicitud incorrecta', 'El campo active debe ser true o false');
}

async function getAllServices() {
    return store.loadServices();
}

async function getActiveServices() {
    const services = await store.loadServices();
    return services.filter(service => service.active);
}

async function getActiveServiceById(id) {
    const serviceId = parseServiceId(id);
    const services = await store.loadServices();
    const service = services.find(s => Number(s.id) === serviceId && s.active);
    if (!service) {
        throw makeError(404, 'Recurso no encontrado', `No existe el servicio con id ${serviceId}`);
    }
    return service;
}

async function createService(payload = {}) {
    ensurePayload(payload);

    const services = await store.loadServices();
    const nextId = services.reduce((max, svc) => (Number(svc.id) > max ? Number(svc.id) : max), 0) + 1;

    const newService = {
        id: nextId,
        name: normalizeName(payload.name),
        duration_min: normalizeDuration(payload.duration_min),
        price: normalizePrice(payload.price),
        active: normalizeActive(payload.active),
    };

    await store.saveServices(services.concat(newService));
    return newService;
}

async function updateService(id, patch = {}) {
    ensurePayload(patch);
    const serviceId = parseServiceId(id);

    const services = await store.loadServices();
    const index = services.findIndex(s => Number(s.id) === serviceId);
    if (index === -1) {
        throw makeError(404, 'Recurso no encontrado', `No existe el servicio con id ${serviceId}`);
    }

    const current = services[index];
    const updated = { ...current };

    if (patch.name !== undefined) {
        updated.name = normalizeName(patch.name);
    }
    if (patch.duration_min !== undefined) {
        updated.duration_min = normalizeDuration(patch.duration_min);
    }
    if (patch.price !== undefined) {
        updated.price = normalizePrice(patch.price);
    }
    if (patch.active !== undefined) {
        updated.active = normalizeActive(patch.active);
    }

    services[index] = updated;
    await store.saveServices(services);
    return updated;
}

module.exports = {
    getAllServices,
    getActiveServices,
    getActiveServiceById,
    createService,
    updateService,
};

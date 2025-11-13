const store = require('../data/store');
const {
    parseServiceId,
    ensurePayload,
    normalizeName,
    normalizeDuration,
    normalizePrice,
    normalizeActive } = require('../utils/validations');
const { makeError } = require('../utils/errors');


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

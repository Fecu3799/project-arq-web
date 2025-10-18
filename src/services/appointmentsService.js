const moment = require('moment');
const store = require('../data/store');
const { makeError } = require('../utils/errors');
const { getDayAvailability } = require('./availabilityService');

const DATE_FORMAT = 'DD-MM-YY';
const TIME_FORMAT = 'HH:mm';
const DATETIME_FORMAT = 'DD-MM-YY HH:mm'


async function createAppointment(input = {}) {

    const { service_id, date, time } = input;

    if(service_id == null || !date || !time) {
        throw makeError(400, 'Solicitud incorrecta', 'La petición está incompleta. Se requiere service_id, date y time');
    }

    const services = await store.loadServices();
    const serviceId = Number(service_id);
    const service = services.find(s => Number(s.id) === serviceId && s.active === true);
    if(!service) {
        throw makeError(404, 'Recurso no encontrado', 'El servicio solicitado no existe o no se encuentra activo');
    }

    const slots = await getDayAvailability({ date, service_id: serviceId });
    const slot = (slots || []).find(s => s.time === `${date} ${time}`);
    if(!slot || slot.status !== 'DISPONIBLE') {
        throw makeError(409, 'Conflicto', 'El horario seleccionado no está disponible');
    }

    const start = moment(`${date} ${time}`, `${DATE_FORMAT} ${TIME_FORMAT}`, true);
    if(!start.isValid()) {
        throw makeError(400, 'Solicitud incorrecta', `fecha u hora inválidos. Formatos: ${DATE_FORMAT} ${TIME_FORMAT}`);
    }
    const end = start.clone().add(parseInt(service.duration_min, 10) || 0, 'minute');

    const list = await store.loadAppointments();
    const nextId = (Array.isArray(list) ? list : []).reduce(
        (max, a) => (Number(a.id) > max ? Number(a.id) : max),
        0 
    ) + 1;

    const now = moment().format(DATETIME_FORMAT);
    const created = {
        id: nextId,
        service_id: serviceId,
        start: start.format(DATETIME_FORMAT),
        end: end.format(DATETIME_FORMAT),
        status: 'confirmed',
        created_at: now,
        updated_at: now
    };

    const updated = Array.isArray(list) ? list.concat(created) : [created];
    await store.saveAppointments(updated);

    return created;
}

module.exports = {
    createAppointment
};
const moment = require('moment');
const store = require('../data/store');
const { makeError } = require('../utils/errors');
const { getDayAvailability } = require('./availability.service');

const DATE_FORMAT = 'DD-MM-YY';
const TIME_FORMAT = 'HH:mm';
const DATETIME_FORMAT = 'DD-MM-YY HH:mm';
const TERMINAL_STATUSES = new Set(['cancelled', 'no_show']);
const hasOwn = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

function normalizeStatus(value) {
    return String(value ?? '').trim().toLowerCase();
}


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


async function updateAppointment(id, patch = {}) {
    const appointmentId = Number(id);
    if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
        throw makeError(400, 'Solicitud incorrecta', 'El id del turno debe ser un entero mayor que cero');
    }

    if (patch == null || typeof patch !== 'object' || Object.keys(patch).length === 0) {
        throw makeError(400, 'Solicitud incorrecta', 'El body esta vacio o no es valido');
    }

    const wantsStatusChange = hasOwn(patch, 'status');
    const wantsReschedule = hasOwn(patch, 'date') || hasOwn(patch, 'time') || hasOwn(patch, 'service_id');

    if (!wantsStatusChange && !wantsReschedule) {
        throw makeError(400, 'Solicitud incorrecta', 'Debe enviar cambios para el turno');
    }

    if (wantsStatusChange && wantsReschedule) {
        throw makeError(400, 'Solicitud incorrecta', 'No se puede reprogramar y cancelar en la misma solicitud');
    }

    const appointments = await store.loadAppointments();
    const index = appointments.findIndex(a => Number(a.id) === appointmentId);
    if (index === -1) {
        throw makeError(404, 'Recurso no encontrado', `No existe un turno con id ${appointmentId}`);
    }

    const current = appointments[index];
    const updated = { ...current };
    let mutated = false;

    // Cambiar estado
    if (wantsStatusChange) {
        const nextStatus = normalizeStatus(patch.status);
        if (!TERMINAL_STATUSES.has(nextStatus)) {
            throw makeError(422, 'Solicitud incorrecta', 'status solo puede ser cancelled o no_show');
        }

        if (TERMINAL_STATUSES.has(current.status)) {
            if (current.status === nextStatus) {
                throw makeError(409, 'Conflicto', 'El turno ya esta en el estado solicitado');
            }
            throw makeError(409, 'Conflicto', 'El turno ya esta cerrado y no se puede modificar');
        }

        if (current.status === nextStatus) {
            throw makeError(409, 'Conflicto', 'El turno ya esta en el estado solicitado');
        }

        updated.status = nextStatus;
        mutated = true;
    }

    // Reprogramar
    if (wantsReschedule) {
        
        if (!hasOwn(patch, 'date') || !hasOwn(patch, 'time')) {
            throw makeError(400, 'Solicitud incorrecta', 'Para reprogramar, date y time son requeridos');
        }

        if (TERMINAL_STATUSES.has(current.status)) {
            throw makeError(409, 'Conflicto', 'No se puede reprogramar un turno cerrado');
        }

        const date = String(patch.date || '').trim();
        const time = String(patch.time || '').trim();
        if (!date || !time) {
            throw makeError(400, 'Solicitud incorrecta', 'date y time no pueden estar vacíos');
        }

        const serviceId = hasOwn(patch, 'service_id') ? Number(patch.service_id) : Number(current.service_id);

        if (!Number.isInteger(serviceId) || serviceId <= 0) {
            throw makeError(400, 'Solicitud incorrecta', 'service_id debe ser un numero entero mayor que cero');
        }

        const services = await store.loadServices();
        const service = services.find(s => Number(s.id) === serviceId && s.active);
        if (!service) {
            throw makeError(404, 'Recurso no encontrado', `No existe el servicio con id ${serviceId} o esta inactivo`);
        }

        const durationMin = parseInt(service.duration_min, 10) || 0;
        if (durationMin <= 0) {
            throw makeError(500, 'Error interno', `El servicio con id ${serviceId} tiene una duracion invalida`);
        }

        const startMoment = moment(`${date} ${time}`, `${DATE_FORMAT} ${TIME_FORMAT}`, true);
        if (!startMoment.isValid()) {
            throw makeError(400, 'Solicitud incorrecta', `fecha u hora invalidos. Formatos: ${DATE_FORMAT} ${TIME_FORMAT}`);
        }

        const slotLabel = startMoment.format(DATETIME_FORMAT);
        const serviceChanged = serviceId !== Number(current.service_id);
        const slotChanged = slotLabel !== current.start;

        if (serviceChanged || slotChanged) {
            const slots = await getDayAvailability({ date, service_id: serviceId });
            const slot = (slots || []).find(s => s.time === slotLabel);
            if (!slot || slot.status !== 'DISPONIBLE') {
                throw makeError(409, 'Conflicto', 'El horario seleccionado no esta disponible');
            }
        }

        const endMoment = startMoment.clone().add(durationMin, 'minute');

        updated.service_id = serviceId;
        updated.start = slotLabel;
        updated.end = endMoment.format(DATETIME_FORMAT);
        mutated = true;
    }

    if (!mutated) {
        throw makeError(400, 'Solicitud incorrecta', 'No se detectaron cambios para el turno');
    }

    updated.updated_at = moment().format(DATETIME_FORMAT);
    appointments[index] = updated;
    await store.saveAppointments(appointments);

    return updated;
}


async function getAppointments() {
    const appointments = await store.loadAppointments();
    return appointments;
}


module.exports = {
    createAppointment,
    updateAppointment,
    getAppointments
};

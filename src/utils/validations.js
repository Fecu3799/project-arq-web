const { makeError } = require('./errors');

// VALIDATION FOR SERVICES

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
    const name = toStringTrim(value);
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


// VALIDATION FOR AVAILABILITY

const WEEKDAYS = ['DOM','LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

function isWorkday(dayMoment, workdays) {
     const normalized = Array.isArray(workdays)
        ? workdays.map(w => String(w).toUpperCase().slice(0,3))
        : [];
    const code = WEEKDAYS[dayMoment.day()];
    return normalized.includes(code);
}

// Verificar dia excepción
function isException(dayMoment, exceptions) {
    const list = Array.isArray(exceptions) ? exceptions : [];
    return list.includes(dayMoment.format('DD-MM-YY'));
}

// Solapamiento de turnos
function overlaps(startA, endA, startB, endB) {
    return startA < endB && endA > startB;
}


// GENERAL VALIDATIONS
function toStringTrim(v) {
  return (v ?? '').toString().trim();
}

module.exports = { 
  toStringTrim,
  parseServiceId,
  ensurePayload,
  normalizeName,
  normalizeDuration,
  normalizePrice,
  normalizeActive,
  isWorkday,
  isException,
  overlaps
};
// Módulo para leer y escribir datos JSON

const fs = require('node:fs/promises');
const path = require('path');
const validate = require('../utils/validations');
const { makeError } = require('../utils/errors');
const { get } = require('node:http');

const DATA_DIR = __dirname;
const filePath = (name) => path.join(DATA_DIR, name);


// MODULOS PRIVADOS. Lectura y Escritura de archivos JSON

async function readJSON(name) {
    try {
        const data = await fs.readFile(filePath(name), 'utf8');
        return JSON.parse(data);
    } catch (e) {
        throw makeError(500, 'Error interno', 'No se pudo leer el archivo');
    }
}

async function writeJSON(name, data) {
    const fp = filePath(name);
    const tmp = fp + '.tmp';
    const json = JSON.stringify(data, null, 2) + '\n';

    try {
        await fs.writeFile(tmp, json, 'utf8');
        await fs.rename(tmp, fp);
    } catch (e) {
        throw makeError(500, 'Error interno', 'No se pudo escribir el archivo');
    }
}

async function getMaxId() {
    const services = await loadServices();
    return services.reduce((max, s) => s.id > max ? s.id : max, 0);
}


// MODULOS PÚBLICOS

// Cargar servicios

async function loadServices() {
    return readJSON('services.json');
}

// Actualizar parcialmente un servicio
async function updateService(id, patch = {}) {
    if(!id) {
        throw makeError(400, 'Solicitud incorrecta', 'Falta id del servicio');
    }

    const services = await loadServices();
    const index = services.findIndex(s => s.id === Number(id));
    if(index == -1) {
        throw makeError(404, 'Recurso no encontrado', `No existe el servicio con id ${id}`);
    }

    const currentService = services[index];
    const updated = { ...currentService };

    if(patch.name !== undefined) {
        const name = validate.toStringTrim(patch.name);
        if(!name) throw makeError(422, 'Solicitud incorrecta', 'El nombre no puede estar vacío');
        updated.name = name;
    }
    if(patch.duration_min !== undefined) {
        const duration_min = Number(patch.duration_min);
        if(Number.isNaN(duration_min) || duration_min <= 0) {
            throw makeError(422, 'Solicitud incorrecta', 'La duración debe ser un número mayor que cero');
        }
        updated.duration_min = duration_min;
    }
    if(patch.price !== undefined) {
        const price = Number(patch.price);
        if(Number.isNaN(price) || price < 0) {
            throw makeError(422, 'Solicitud incorrecta', 'El precio debe ser un número mayor o igual que cero');
        }
        updated.price = price;
    }
    if(patch.active !== undefined) {
        const active = patch.active;
        if(typeof active !== 'boolean') {
            throw makeError(422, 'Solicitud incorrecta', 'El campo activo debe ser true o false');
        }
        updated.active = active;
    }

    services[index] = updated;
    await writeJSON('services.json', services);
    return updated;
}

// Agregar un servicio
async function addService(newServiceData = {}) {
    if(newServiceData == null || typeof newServiceData !== 'object') {
        throw makeError(400, 'Solicitud incorrecta', 'Falta el objeto servicio');
    }

    const services = await loadServices();
    const newId = await getMaxId() + 1;

    const newService = {
        id: newId,
        name: validate.toStringTrim(newServiceData.name),
        duration_min: Number(newServiceData.duration_min),
        price: Number(newServiceData.price),
        active: newServiceData.active === undefined ? true : Boolean(newServiceData.active),
    };

    services.push(newService);
    await writeJSON('services.json', services);
    return newService;
}

// Cargar usuarios
async function loadUsers() {
    return readJSON('users.json');
}

// Cargar agenda
async function loadSchedule() {
    return readJSON('shedule.json');
}

// Cargar turnos
async function loadAppointments() {
    return readJSON('appointments.json');
}
// Guardar turnos
async function saveAppointments(data) {
    if (!Array.isArray(data)) {
        throw makeError(500, 'Error interno', 'SaveAppointments requiere un array');
    }
    await writeJSON('appointments.json', data);
}

module.exports = {
    loadServices,
    updateService,
    addService,
    loadUsers,
    loadSchedule,
    loadAppointments,
    saveAppointments,
};


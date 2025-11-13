const fs = require('node:fs/promises');
const path = require('node:path');
const { makeError } = require('../utils/errors');


// DATA ACCESS 

const DATA_DIR = __dirname;
const FILES = {
    services: 'services.json',
    users: 'users.json',
    schedule: 'schedule.json',
    appointments: 'appointments.json',
};

const filePath = (name) => path.join(DATA_DIR, name);

async function readJSON(name) {
    try {
        const data = await fs.readFile(filePath(name), 'utf8');
        return JSON.parse(data);
    } catch (err) {
        throw makeError(500, 'Error interno', `No se pudo leer el archivo ${name}`);
    }
}

async function writeJSON(name, data) {
    const target = filePath(name);
    const tmp = `${target}.tmp`;
    const json = JSON.stringify(data, null, 2) + '\n';

    try {
        await fs.writeFile(tmp, json, 'utf8');
        await fs.rename(tmp, target);
    } catch (err) {
        throw makeError(500, 'Error interno', `No se pudo escribir el archivo ${name}`);
    }
}


// PUBLIC API

async function loadServices() {
    return readJSON(FILES.services);
}

async function saveServices(data) {
    if (!Array.isArray(data)) {
        throw makeError(500, 'Error interno', 'saveServices requiere un array');
    }
    await writeJSON(FILES.services, data);
}

async function loadUsers() {
    return readJSON(FILES.users);
}

async function loadSchedule() {
    return readJSON(FILES.schedule);
}

async function loadAppointments() {
    return readJSON(FILES.appointments);
}

async function saveAppointments(data) {
    if (!Array.isArray(data)) {
        throw makeError(500, 'Error interno', 'saveAppointments requiere un array');
    }
    await writeJSON(FILES.appointments, data);
}

module.exports = {
    loadServices,
    saveServices,
    loadUsers,
    loadSchedule,
    loadAppointments,
    saveAppointments,
};

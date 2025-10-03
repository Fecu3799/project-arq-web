// Módulo para leer y escribir datos JSON

const fs = require('node:fs/promises');
const path = require('path');

const DATA_DIR = __dirname;

const filePath = (name) => path.join(DATA_DIR, name);
const makeError = (status, title, detail) => {
    const err = new Error(detail);
    err.status = status;
    err.title = title;

    return err;
};

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

// Modulos públicos

async function loadServices() {
    return readJSON('services.json');
}
async function loadUsers() {
    return readJSON('users.json');
}
async function loadSchedule() {
    return readJSON('shedule.json');
}
async function loadAppointments() {
    return readJSON('appointments.json');
}
async function saveAppointments(data) {
    if (!Array.isArray(data)) {
        throw makeError(500, 'Error interno', 'SaveAppointments requiere un array');
    }
    await writeJSON('appointments.json', data);
}

module.exports = {
    loadServices,
    loadUsers,
    loadSchedule,
    loadAppointments,
    saveAppointments,
};


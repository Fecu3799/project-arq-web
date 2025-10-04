const crypto = require('node:crypto');
const store = require('../data/store');
const { makeError } = require('./errors');

const sessions = new Map();

function newToken() {
    return crypto.randomUUID(); // Genera un token opaco
}

async function login(email, password) {
    const users = await store.loadUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        throw makeError(401, 'No autorizado', 'Email o contraseña incorrectos');
    };

    const token = newToken();
    sessions.set(token, { id: user.id, role: user.role, name: user.name, email: user.email});
    return { token, user: { id: user.id, role: user.role, name: user.name, email: user.email } };
};

function auth(req, res, next) {
    const hdr = req.get('Authorization') || '';
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    if(!m) return next(makeError(401, 'No autorizado', 'Falta el token de autenticación'));

    const token = m[1].trim();
    const actor = sessions.get(token);
    if (!actor) return next(makeError(401, 'No autorizado', 'Token inválido o expirado'));
    req.actor = actor; // Inyectamos el actor en la request
    next();
};

function rbac(...allowedRoles) {
    return (req, res, next) => {
        if (!req.actor) return next(makeError(500, 'Error interno', 'Falta autenticación'));
        if (!allowedRoles.includes(req.actor.role)) {
            return next(makeError(403, 'Prohibido', 'No tiene permisos para este recurso'));
        }
        next();
    };
}

module.exports = { login, auth, rbac };
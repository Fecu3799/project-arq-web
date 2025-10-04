function makeError(status, title, detail) {
    const err = new Error(detail);
    err.status = status;
    err.title = title;

    return err;
}

module.exports = { makeError };
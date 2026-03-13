const apiError = require('../utils/apiError');

const errorHandler = (err, req, res, next) => {
    const status = err.statusCode ||  500;
    console.error(err.stack);
    res.status(status || 500).json({status: status, message: err.message, data: err.data});
}

module.exports = errorHandler;
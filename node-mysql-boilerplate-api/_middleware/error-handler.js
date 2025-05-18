module.exports = errorHandler;

function errorHandler(err, req, res, next) {
    console.error('Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
    });

    if (typeof (err) === 'string') {
        // custom application error
        return res.status(400).json({ message: err });
    }

    if (err.name === 'ValidationError') {
        // mongoose validation error
        return res.status(400).json({ message: err.message });
    }

    if (err.name === 'UnauthorizedError') {
        // jwt authentication error
        return res.status(401).json({ message: 'Invalid Token' });
    }

    if (err.name === 'SequelizeValidationError') {
        // sequelize validation error
        return res.status(400).json({ 
            message: 'Validation Error',
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        // sequelize unique constraint error
        return res.status(400).json({ 
            message: 'Duplicate Entry',
            field: err.errors[0].path,
            value: err.errors[0].value
        });
    }

    // default to 500 server error
    return res.status(500).json({ 
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
}
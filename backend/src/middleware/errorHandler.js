const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err.code === '23505') {
        return res.status(409).json({
            error: 'Resource already exists',
            details: err.detail
        });
    }

    if (err.code === '23503') {
        return res.status(400).json({
            error: 'Invalid reference. Related resource not found',
            details: err.detail
        });
    }

    if (err.code === '23502') {
        return res.status(400).json({
            error: 'Required field missing',
            details: err.detail
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.message
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired'
        });
    }

    const statusCode = err.status || 500;
    const errorMessage = err.message || (typeof err === 'string' ? err : 'Internal server error');

    res.status(statusCode).json({
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle uncaught exceptions (synchronous errors)
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    console.error(err.stack);

    // Critical: If the port is busy (EADDRINUSE), we MUST exit so the process doesn't hang.
    if (err.code === 'EADDRINUSE') {
        process.exit(1);
    }
    // For other errors in dev, we might keep it alive, but generally uncaughtException should restart.
    // However, user specifically asked to prevent "crashes".
    // We'll keep it alive for non-fatal errors during dev.
});

// Handle unhandled promise rejections (async errors)
process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    // process.exit(1); 
});
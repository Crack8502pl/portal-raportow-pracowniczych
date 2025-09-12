import app from './app';
import { sequelize } from './models';
import { config } from './config/app';

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync database models (in development)
    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized.');
    }

    // Start server
    const server = app.listen(config.port, config.host, () => {
      console.log(`🚀 Server running on ${config.host}:${config.port}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🌐 API Base URL: http://${config.host}:${config.port}/api`);
      console.log(`📁 Static Files: http://${config.host}:${config.port}/static`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received. Shutting down gracefully...');
      server.close(async () => {
        console.log('✅ HTTP server closed.');
        await sequelize.close();
        console.log('✅ Database connection closed.');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received. Shutting down gracefully...');
      server.close(async () => {
        console.log('✅ HTTP server closed.');
        await sequelize.close();
        console.log('✅ Database connection closed.');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
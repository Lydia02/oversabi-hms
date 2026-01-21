import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/index.js';
import { swaggerSpec } from './config/swagger.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Oversabi HMS API Documentation'
}));

// API Routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Oversabi Hospital Management System',
    version: '1.0.0',
    description: 'Seamless health records transfer across hospitals in Nigeria',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      patients: '/api/v1/patients',
      doctors: '/api/v1/doctors',
      visits: '/api/v1/visits',
      consent: '/api/v1/consent'
    }
  });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Oversabi Hospital Management System                      ║
║   ─────────────────────────────────────                    ║
║                                                            ║
║   Server running on port ${PORT}                             ║
║                                                            ║
║   API Documentation: http://localhost:${PORT}/api-docs        ║
║   Health Check: http://localhost:${PORT}/api/v1/health        ║
║                                                            ║
║   Environment: ${config.nodeEnv.padEnd(40)}║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  if (reason instanceof Error) {
    console.error('Stack:', reason.stack);
  }
});

// Add error handler for the server itself
server.on('error', (error) => {
  console.error('❌ SERVER ERROR:', error);
});

export default app;

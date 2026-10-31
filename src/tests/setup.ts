// Variables de entorno mínimas para que los módulos se puedan importar en los tests
// (no se conecta a ninguna base: los tests unitarios usan repositorios falsos).
process.env.MONGO_URI ??= 'mongodb://127.0.0.1:27017/crm-test';
process.env.JWT_SECRET ??= 'secreto-de-test';
process.env.JWT_EXPIRES_IN ??= '1h';
process.env.NODE_ENV ??= 'test';

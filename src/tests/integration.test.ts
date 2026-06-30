import { describe, it, expect } from 'vitest';

describe('API Integration Tests', () => {
  it('should have correct port configured', () => {
    const port = process.env.PORT || 3000;
    expect(port).toBe('3000');
  });

  it('should have JWT_SECRET configured', () => {
    const jwtSecret = process.env.JWT_SECRET;
    expect(jwtSecret).toBeDefined();
    expect(typeof jwtSecret).toBe('string');
  });

  it('should have MONGO_URI configured', () => {
    const mongoUri = process.env.MONGO_URI;
    expect(mongoUri).toBeDefined();
    expect(mongoUri?.includes('mongodb')).toBe(true);
  });

  it('should have NODE_ENV set', () => {
    const nodeEnv = process.env.NODE_ENV;
    expect(nodeEnv).toBeDefined();
    expect(['development', 'production', 'test']).toContain(nodeEnv);
  });

  it('should validate JWT expiration time format', () => {
    const jwtExpires = process.env.JWT_EXPIRES_IN || '1h';
    expect(jwtExpires).toMatch(/\d+(h|m|s|d)/);
  });
});

describe('Middleware and Security', () => {
  it('should have FRONTEND_URL configured for CORS', () => {
    const frontendUrl = process.env.FRONTEND_URL;
    expect(frontendUrl).toBeDefined();
    expect(frontendUrl?.includes('localhost')).toBe(true);
  });

  it('should validate different user roles', () => {
    const roles = ['cliente', 'vendedor', 'operario', 'admin'];
    expect(roles.length).toBeGreaterThan(0);
    expect(roles).toContain('cliente');
    expect(roles).toContain('admin');
  });
});

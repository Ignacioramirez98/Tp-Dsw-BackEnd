import { describe, it, expect } from 'vitest';
import { z } from 'zod';
describe('Zod Validation Tests', () => {
    const emailSchema = z.string().email();
    const passwordSchema = z.string().min(6);
    const userNameSchema = z.string().min(3);
    it('should validate correct email', () => {
        const result = emailSchema.safeParse('test@example.com');
        expect(result.success).toBe(true);
    });
    it('should reject invalid email', () => {
        const result = emailSchema.safeParse('notanemail');
        expect(result.success).toBe(false);
    });
    it('should validate password minimum length', () => {
        const result = passwordSchema.safeParse('test123456');
        expect(result.success).toBe(true);
    });
    it('should reject short password', () => {
        const result = passwordSchema.safeParse('abc');
        expect(result.success).toBe(false);
    });
    it('should validate username minimum length', () => {
        const result = userNameSchema.safeParse('testuser');
        expect(result.success).toBe(true);
    });
    it('should reject short username', () => {
        const result = userNameSchema.safeParse('ab');
        expect(result.success).toBe(false);
    });
});
describe('Role-based Access Tests', () => {
    it('should define different role levels', () => {
        const roles = {
            cliente: 1,
            operario: 2,
            vendedor: 3,
            admin: 4
        };
        expect(roles.cliente < roles.admin).toBe(true);
        expect(roles.vendedor < roles.admin).toBe(true);
    });
    it('should validate role hierarchy', () => {
        const userRoles = ['cliente', 'vendedor', 'operario', 'admin'];
        const protectedRoles = ['vendedor', 'admin'];
        const cliente = 'cliente';
        const vendedor = 'vendedor';
        expect(protectedRoles).not.toContain(cliente);
        expect(protectedRoles).toContain(vendedor);
    });
});
//# sourceMappingURL=validation.test.js.map
import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
describe('Cliente - Password Hashing', () => {
    it('should hash password with bcrypt', async () => {
        const password = 'test123456';
        const hashed = await bcrypt.hash(password, 10);
        const isValid = await bcrypt.compare(password, hashed);
        expect(isValid).toBe(true);
    });
    it('should not match wrong password', async () => {
        const password = 'test123456';
        const hashed = await bcrypt.hash(password, 10);
        const isValid = await bcrypt.compare('wrongpassword', hashed);
        expect(isValid).toBe(false);
    });
    it('should generate different hashes for same password', async () => {
        const password = 'test123456';
        const hash1 = await bcrypt.hash(password, 10);
        const hash2 = await bcrypt.hash(password, 10);
        expect(hash1).not.toEqual(hash2);
        // But both should validate the same password
        expect(await bcrypt.compare(password, hash1)).toBe(true);
        expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
});
describe('Validación de entrada', () => {
    it('should validate email format', () => {
        const validEmail = 'test@example.com';
        const invalidEmail = 'notanemail';
        expect(validEmail.includes('@')).toBe(true);
        expect(invalidEmail.includes('@')).toBe(false);
    });
    it('should validate password length', () => {
        const shortPassword = 'abc';
        const validPassword = 'test123456';
        expect(shortPassword.length >= 6).toBe(false);
        expect(validPassword.length >= 6).toBe(true);
    });
});
//# sourceMappingURL=cliente.test.js.map
import { describe, it, expect } from 'vitest';
import { parseOrigins } from '../../shared/cors.js';

describe('parseOrigins', () => {
    it('usa el front local por defecto si la variable no está definida o está vacía', () => {
        expect(parseOrigins(undefined)).toEqual(['http://localhost:4200']);
        expect(parseOrigins('')).toEqual(['http://localhost:4200']);
        expect(parseOrigins(' , ')).toEqual(['http://localhost:4200']);
    });

    it('devuelve una URL tal cual', () => {
        expect(parseOrigins('https://pauny-crm.vercel.app')).toEqual(['https://pauny-crm.vercel.app']);
    });

    it('saca la barra final, que haría fallar CORS sin avisar', () => {
        expect(parseOrigins('https://pauny-crm.vercel.app/')).toEqual(['https://pauny-crm.vercel.app']);
    });

    it('admite varias URLs separadas por coma y limpia los espacios', () => {
        expect(parseOrigins('http://localhost:4200, https://pauny-crm.vercel.app/')).toEqual([
            'http://localhost:4200',
            'https://pauny-crm.vercel.app',
        ]);
    });
});

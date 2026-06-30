import { Router } from 'express';
import { login, crearUsuario, obtenerTodos, obtenerPorId, desactivarUsuario } from './usuario.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';

const usuarioRouter = Router();

/**
 * Rutas de Autenticación
 */

// Login - PÚBLICO
usuarioRouter.post('/login', login);

/**
 * Rutas de Gestión de Usuarios (Solo Admin)
 */

// Crear usuario - requiere admin
usuarioRouter.post('/', protectRoute, requireRole('admin'), crearUsuario);

// Obtener todos - requiere admin
usuarioRouter.get('/', protectRoute, requireRole('admin'), obtenerTodos);

// Obtener uno por ID - requiere admin
usuarioRouter.get('/:id', protectRoute, requireRole('admin'), obtenerPorId);

// Desactivar usuario - requiere admin
usuarioRouter.patch('/:id/desactivar', protectRoute, requireRole('admin'), desactivarUsuario);

export { usuarioRouter };

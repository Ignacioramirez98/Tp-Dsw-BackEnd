import { Router } from 'express';
import { login, crearUsuario, obtenerTodos, obtenerPorId, desactivarUsuario } from './usuario.controller.js';
import { protectRoute, requireRole } from '../middleware/roleAuth.middleware.js';
import { asyncHandler } from '../middleware/async-handler.js';

const usuarioRouter = Router();

// Login - público
usuarioRouter.post('/login', asyncHandler(login));

// Gestión de usuarios - solo admin
usuarioRouter.post('/', protectRoute, requireRole('admin'), asyncHandler(crearUsuario));
usuarioRouter.get('/', protectRoute, requireRole('admin'), asyncHandler(obtenerTodos));
usuarioRouter.get('/:id', protectRoute, requireRole('admin'), asyncHandler(obtenerPorId));
usuarioRouter.patch('/:id/desactivar', protectRoute, requireRole('admin'), asyncHandler(desactivarUsuario));

export { usuarioRouter };

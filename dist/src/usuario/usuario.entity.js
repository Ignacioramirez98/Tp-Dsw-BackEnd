var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { ObjectId } from 'mongodb';
export let Usuario = class Usuario {
    constructor(data = {}) {
        this.activo = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        Object.assign(this, data);
    }
};
__decorate([
    PrimaryKey(),
    __metadata("design:type", ObjectId)
], Usuario.prototype, "_id", void 0);
__decorate([
    Property({ unique: true }),
    __metadata("design:type", String)
], Usuario.prototype, "usuario", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Usuario.prototype, "contrase\u00F1a", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Usuario.prototype, "rol", void 0);
__decorate([
    Property(),
    __metadata("design:type", Boolean)
], Usuario.prototype, "activo", void 0);
__decorate([
    Property({ nullable: true }),
    __metadata("design:type", ObjectId)
], Usuario.prototype, "clienteId", void 0);
__decorate([
    Property({ nullable: true }),
    __metadata("design:type", ObjectId)
], Usuario.prototype, "vendedorId", void 0);
__decorate([
    Property({ nullable: true }),
    __metadata("design:type", ObjectId)
], Usuario.prototype, "operarioId", void 0);
__decorate([
    Property(),
    __metadata("design:type", Date)
], Usuario.prototype, "createdAt", void 0);
__decorate([
    Property({ onUpdate: () => new Date() }),
    __metadata("design:type", Date)
], Usuario.prototype, "updatedAt", void 0);
Usuario = __decorate([
    Entity({ collection: 'usuarios' }),
    __metadata("design:paramtypes", [Object])
], Usuario);
//# sourceMappingURL=usuario.entity.js.map
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
export let Cliente = class Cliente {
    constructor(data = {}) {
        Object.assign(this, data);
    }
};
__decorate([
    PrimaryKey(),
    __metadata("design:type", ObjectId)
], Cliente.prototype, "_id", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Cliente.prototype, "nombre", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Cliente.prototype, "apellido", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Cliente.prototype, "dni", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Cliente.prototype, "mail", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Cliente.prototype, "telefono", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Cliente.prototype, "direccion", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Cliente.prototype, "razon_social", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Cliente.prototype, "usuario", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Cliente.prototype, "contrase\u00F1a", void 0);
Cliente = __decorate([
    Entity({ collection: 'clientes' }),
    __metadata("design:paramtypes", [Object])
], Cliente);
//# sourceMappingURL=cliente.entity.js.map
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
export let Vendedor = class Vendedor {
    constructor(data = {}) {
        Object.assign(this, data);
    }
};
__decorate([
    PrimaryKey(),
    __metadata("design:type", ObjectId)
], Vendedor.prototype, "_id", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Vendedor.prototype, "nombre", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Vendedor.prototype, "apellido", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Vendedor.prototype, "mail", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Vendedor.prototype, "dni", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Vendedor.prototype, "telefono", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Vendedor.prototype, "rol", void 0);
Vendedor = __decorate([
    Entity({ collection: 'vendedores' }),
    __metadata("design:paramtypes", [Object])
], Vendedor);
//# sourceMappingURL=vendedor.entity.js.map
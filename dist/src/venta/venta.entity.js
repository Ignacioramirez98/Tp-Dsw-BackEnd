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
export let Venta = class Venta {
    constructor(data = {}) {
        Object.assign(this, data);
    }
};
__decorate([
    PrimaryKey(),
    __metadata("design:type", ObjectId)
], Venta.prototype, "_id", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Venta.prototype, "estado", void 0);
__decorate([
    Property(),
    __metadata("design:type", Date)
], Venta.prototype, "fechaContacto", void 0);
__decorate([
    Property(),
    __metadata("design:type", Date)
], Venta.prototype, "fechaDeVenta", void 0);
__decorate([
    Property(),
    __metadata("design:type", Date)
], Venta.prototype, "fechaEntrega", void 0);
__decorate([
    Property({ nullable: true }),
    __metadata("design:type", Object)
], Venta.prototype, "fechaCancelacion", void 0);
__decorate([
    Property(),
    __metadata("design:type", ObjectId)
], Venta.prototype, "clienteId", void 0);
__decorate([
    Property(),
    __metadata("design:type", Array)
], Venta.prototype, "productoIds", void 0);
__decorate([
    Property(),
    __metadata("design:type", Array)
], Venta.prototype, "servicioIds", void 0);
Venta = __decorate([
    Entity({ collection: 'ventas' }),
    __metadata("design:paramtypes", [Object])
], Venta);
//# sourceMappingURL=venta.entity.js.map
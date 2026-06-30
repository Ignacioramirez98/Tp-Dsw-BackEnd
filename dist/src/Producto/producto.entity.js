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
export let Producto = class Producto {
    constructor(data = {}) {
        Object.assign(this, data);
    }
};
__decorate([
    PrimaryKey(),
    __metadata("design:type", ObjectId)
], Producto.prototype, "_id", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Producto.prototype, "nombre", void 0);
__decorate([
    Property(),
    __metadata("design:type", String)
], Producto.prototype, "descripcion", void 0);
__decorate([
    Property(),
    __metadata("design:type", Number)
], Producto.prototype, "importe_compra", void 0);
__decorate([
    Property(),
    __metadata("design:type", Number)
], Producto.prototype, "importe_venta", void 0);
__decorate([
    Property(),
    __metadata("design:type", Number)
], Producto.prototype, "stock", void 0);
__decorate([
    Property({ nullable: true }),
    __metadata("design:type", String)
], Producto.prototype, "imagenUrl", void 0);
Producto = __decorate([
    Entity({ collection: 'productos' }),
    __metadata("design:paramtypes", [Object])
], Producto);
//# sourceMappingURL=producto.entity.js.map
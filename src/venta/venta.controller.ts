import { Request, Response, NextFunction } from "express"
import { VentaRepository } from "./venta.repository.js"
import { Venta } from "./venta.entity.js"

const repository = new VentaRepository()

function sanitizeVentaInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
    estado: req.body.estado,
    fechaContacto: req.body.fechaContacto,
    fechaDeVenta: req.body.fechaDeVenta,
    fechaEntrega: req.body.fechaEntrega,
    fechaCancelacion: req.body.fechaCancelacion,
    cantidad: req.body.cantidad,
    }

    Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
        delete req.body.sanitizedInput[key]
    }
    })
    next()
}

async function findAll(req: Request, res: Response){
    res.json({ data: await repository.findAll() })
}

async function findOne(req: Request, res: Response){
    const id = req.params.id
    const venta = await repository.findOne({id})
    if (!venta) {
        return res.status(404).send({message:'Venta no encontrada'})
    }
    res.json({data : venta})
}

async function add(req: Request, res: Response){
    const input = req.body.sanitizedInput

    const ventaInput = new Venta(
        input.estado,        
        input.fechaContacto,
        input.fechaDeVenta,
        input.fechaEntrega,
        input.fechaCancelacion,
        input.cantidad
    )

    const venta = await repository.add(ventaInput)
    return res.status(201).send({message: 'Venta creada', data: venta})
}

async function update(req: Request, res: Response) {
    const venta = await repository.update(req.params.id, req.body.sanitizedInput)

    if (!venta) {
        return res.status(404).send({ message: 'venta not found' })
    }  

    return res.status(200).send({ message: 'venta updated successfully', data: venta })
}

async function remove(req: Request, res: Response){
    const id = req.params.id
    const venta = await repository.delete({id})

    if (!venta){
        res.status(404).send({message: 'venta not found'})
    } else{
        res.status(200).send({message: 'venta deleted successfully'})
    }
}

export {sanitizeVentaInput, findAll, findOne, add, update, remove}
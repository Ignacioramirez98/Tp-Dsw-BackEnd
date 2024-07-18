import { Request, Response, NextFunction } from "express"
import { ProductoRepository } from "./producto.repository.js"
import { Producto } from "./producto.entity.js"

const repository = new ProductoRepository()

function sanitizeProductoInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
    nombre: req.body.nombre,
    descripcion: req.body.descripcion,
    importe_compra: req.body.importe_compra,
    importe_venta: req.body.importe_venta,
    stock: req.body.stock,
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
    const producto = await repository.findOne({id})
    if (!producto) {
        return res.status(404).send({message:'Producto no encontrado'})
    }
    res.json({data : producto})
}

async function add(req: Request, res: Response){
    const input = req.body.sanitizedInput

    const productoInput = new Producto(
        input.nombre,        
        input.descripcion,
        input.importe_compra,
        input.importe_venta,
        input.stock
    )

    const producto = await repository.add(productoInput)
    return res.status(201).send({message: 'Producto creado', data: producto})
}

async function update(req: Request, res: Response) {
    const producto = await repository.update(req.params.id, req.body.sanitizedInput)

    if (!producto) {
        return res.status(404).send({ message: 'producto not found' })
    }  

    return res.status(200).send({ message: 'producto updated successfully', data: producto })
}

async function remove(req: Request, res: Response){
    const id = req.params.id
    const producto = await repository.delete({id})

    if (!producto){
        res.status(404).send({message: 'Producto not found'})
    } else{
        res.status(200).send({message: 'Producto deleted successfully'})
    }
}

export {sanitizeProductoInput, findAll, findOne, add, update, remove}


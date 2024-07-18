import { Request, Response, NextFunction } from "express"
import { VendedorRepository } from "./vendedor.repository.js"
import { Vendedor } from "./vendedor.entity.js"

const repository = new VendedorRepository()

function sanitizeVendedorInput(req: Request, res: Response, next: NextFunction) {
    req.body.sanitizedInput = {
    nombre: req.body.nombre,
    apellido: req.body.apellido,
    mail: req.body.mail,
    dni: req.body.dni,
    telefono: req.body.telefono,
    rol: req.body.rol,
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
    const vendedor = await repository.findOne({id})
    if (!vendedor) {
        return res.status(404).send({message:'Vendedor no encontrado'})
    }
    res.json({data : vendedor})
}

async function add(req: Request, res: Response){
    const input = req.body.sanitizedInput

    const vendedorInput = new Vendedor(
        input.nombre,        
        input.apellido,
        input.mail,
        input.dni,
        input.telefono,
        input.rol
    )

    const vendedor = await repository.add(vendedorInput)
    return res.status(201).send({message: 'Vendedor creado', data: vendedor})
}

async function update(req: Request, res: Response) {
    const vendedor = await repository.update(req.params.id, req.body.sanitizedInput)

    if (!vendedor) {
        return res.status(404).send({ message: 'Vendedor not found' })
    }  

    return res.status(200).send({ message: 'Vendedor updated successfully', data: vendedor })
}

async function remove(req: Request, res: Response){
    const id = req.params.id
    const vendedor = await repository.delete({id})

    if (!vendedor){
        res.status(404).send({message: 'Vendedor not found'})
    } else{
        res.status(200).send({message: 'Vendedor deleted successfully'})
    }
}

export {sanitizeVendedorInput, findAll, findOne, add, update, remove}


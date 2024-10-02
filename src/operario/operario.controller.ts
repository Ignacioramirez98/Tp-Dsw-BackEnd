import { Request, Response, NextFunction } from "express"
import { OperarioRepository } from "./operario.repository.js"
import { Operario } from "./operario.entity.js"

const repository = new OperarioRepository()

function sanitizeOperarioInput(req: Request, res: Response, next: NextFunction) {
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
    const operario = await repository.findOne({id})
    if (!operario) {
        return res.status(404).send({message:'Operario no encontrado'})
    }
    res.json({data : operario})
}

async function add(req: Request, res: Response){
    const input = req.body.sanitizedInput

    const operarioInput = new Operario(
        input.nombre,        
        input.apellido,
        input.mail,
        input.dni,
        input.telefono,
        input.rol
    )

    const operario = await repository.add(operarioInput)
    return res.status(201).send({message: 'Operario creado', data: operario})
}

async function update(req: Request, res: Response) {
    const operario = await repository.update(req.params.id, req.body.sanitizedInput)

    if (!operario) {
        return res.status(404).send({ message: 'operario not found' })
    }  

    return res.status(200).send({ message: 'operario updated successfully', data: operario })
}

async function remove(req: Request, res: Response){
    const id = req.params.id
    const operario = await repository.delete({id})

    if (!operario){
        res.status(404).send({message: 'Operario not found'})
    } else{
        res.status(200).send({message: 'Operario deleted successfully'})
    }
}

export {sanitizeOperarioInput, findAll, findOne, add, update, remove}
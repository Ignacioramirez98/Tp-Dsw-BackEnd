
import express from 'express'
import cors from 'cors'
import multer from 'multer';
import { productoRouter } from './Producto/producto.routes.js'
import { vendedorRouter } from './Vendedor/vendedor.routes.js'

const app = express()

app.use(cors({
  origin: 'http://localhost:4200'
}));

app.use(express.json())

app.use('/productos', productoRouter)
app.use('/vendedores', vendedorRouter)

app.use((_, res) => {
  return res.status(404).send({ message: 'Resource not found' })
})

app.listen(3000, () => {
  console.log('Server runnning on http://localhost:3000/')
})



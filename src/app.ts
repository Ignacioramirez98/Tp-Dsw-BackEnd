
import express from 'express'
import { productoRouter } from './Producto/producto.routes.js'

const app = express()
app.use(express.json())

app.use('/productos', productoRouter)

app.use((_, res) => {
  return res.status(404).send({ message: 'Resource not found' })
})

app.listen(3000, () => {
  console.log('Server runnning on http://localhost:3000/')
})



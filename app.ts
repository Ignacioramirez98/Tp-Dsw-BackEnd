const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const Producto = require("./models/Producto");
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de bodyParser para parsear las solicitudes JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conexión a la base de datos MongoDB
mongoose.connect('mongodb+srv://nacho98nacho98:dsw123@cluster0.z5xdoug.mongodb.net/', {
          useNewUrlParser: true,
          useUnifiedTopology: true
}).then(() => {
          console.log("Conexión a la base de datos exitosa");
}).catch((err) => {
          console.error("Error al conectar a la base de datos:", err);
});


//creacion de la instancia
const producto = new Producto({
          // Aquí asigna los valores para los campos del model
          nombre: "test1",
          descripcion: "descripcion test1",
          importe_compra: 1,
          importe_venta: 2,
          stock: 5

});

// Guardar la instancia en la base de datos
producto.save()
          .then(resultado => {
                    console.log("Instancia guardada:", resultado);
          })
          .catch(error => {
                    console.error("Error al guardar la instancia:", error);
          });

// Crear un nuevo producto (POST)
app.post("/productos", (req, res) => {
  const nuevoProducto = new Producto(req.body);
  nuevoProducto.save()
    .then(producto => res.status(201).json(producto))
    .catch(error => res.status(400).json({ error: error.message }));
});

// Obtener todos los productos (GET)
app.get("/productos", (req, res) => {
  Producto.find()
    .then(productos => res.json(productos))
    .catch(error => res.status(500).json({ error: error.message }));
});

// Obtener un producto por ID (GET)
app.get("/productos/:id", (req, res) => {
  Producto.findById(req.params.id)
    .then(producto => {
      if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.json(producto);
    })
    .catch(error => res.status(500).json({ error: error.message }));
});

// Actualizar un producto por ID (PUT)
app.put("/productos/:id", (req, res) => {
  Producto.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .then(producto => {
      if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
    res.json(producto).save();
    })
    .catch(error => res.status(400).json({ error: error.message }));
});

// Actualizar parcialmente un producto por ID (PATCH)
app.patch("/productos/:id", (req, res) => {
  Producto.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .then(producto => {
      if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.json(producto);
    })
    .catch(error => res.status(400).json({ error: error.message }));
});

// Eliminar un producto por ID (DELETE)
app.delete("/productos/:id", (req, res) => {
  Producto.findByIdAndDelete(req.params.id)
    .then(producto => {
      if (!producto) {
        return res.status(404).json({ error: "Producto no encontrado" });
      }
      res.json({ message: "Producto eliminado" });
    })
    .catch(error => res.status(500).json({ error: error.message }));
});


module.exports = app
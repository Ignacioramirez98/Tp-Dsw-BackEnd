import express from "express";
import mongoose from "mongoose"
import bodyParser from "body-parser"
import Producto from "./app/Producto";

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


//Persistencia en la bd
const producto = new Producto({
          // Aquí asigna los valores para los campos del modelo
          // Ejemplo:
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


// Iniciar el servidor
app.listen(PORT, () => {
          console.log(`Servidor iniciado en el puerto ${PORT}`);
});

/**
 * Migra las ventas guardadas con el formato anterior (productoIds: ObjectId[])
 * al formato nuevo: un documento en items_venta por producto, con cantidad y precio.
 *
 * Como el formato viejo no guardaba cantidades, cada producto pasa con cantidad 1
 * y el precio de venta actual del producto.
 *
 * Uso (después de `npm run build`):
 *   npm run migrar:items-venta              -> solo muestra lo que haría
 *   npm run migrar:items-venta -- --aplicar -> aplica los cambios en la base
 */
import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const aplicar = process.argv.includes('--aplicar');

async function main() {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error('Falta MONGO_URI en el .env');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('crm');

    const ventas = await db.collection('ventas').find({ productoIds: { $exists: true } }).toArray();
    console.log(`Ventas con formato anterior: ${ventas.length}`);

    for (const venta of ventas) {
        const productoIds: ObjectId[] = venta.productoIds ?? [];
        const items = [];
        for (const productoId of productoIds) {
            const producto = await db.collection('productos').findOne({ _id: productoId });
            items.push({
                ventaId: venta._id,
                productoId,
                cantidad: 1,
                precioUnitario: producto?.importe_venta ?? 0,
            });
        }

        console.log(`- Venta ${venta._id}: ${items.length} ítem(s)`);
        if (!aplicar) continue;

        if (items.length > 0) {
            await db.collection('items_venta').insertMany(items);
        }
        await db.collection('ventas').updateOne({ _id: venta._id }, { $unset: { productoIds: '' } });
    }

    console.log(aplicar ? 'Migración aplicada.' : 'Simulación: no se modificó nada. Usar --aplicar para guardar.');
    await client.close();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});

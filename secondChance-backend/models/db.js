// db.js
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

// MongoDB connection URL with authentication options
let url = `${process.env.MONGO_URL}`;

let dbInstance = null;
const dbName = `${process.env.MONGO_DB}`;

async function connectToDatabase() {
    if (dbInstance){
        return dbInstance
    };

    const client = new MongoClient(url);      

    try {
        await client.connect(); // Conectarse a MongoDB
        dbInstance = client.db(dbName); // Asigna la base de datos a dbInstance
        console.log("Conectado a MongoDB correctamente.");
        return dbInstance; // Retorna la instancia de la base de datos
    } catch (error) {
        console.error("Error conectando a MongoDB:", error);
        throw error;
    }
}

module.exports = connectToDatabase;

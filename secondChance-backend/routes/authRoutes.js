const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const pino = require('pino');  // Import Pino logger
const { body, validationResult } = require('express-validator');


dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const logger = pino();  // Create a Pino logger instance

router.post('/register', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();
        // Task 2: Access MongoDB `users` collection
        const collection = db.collection("users");
        // Task 3: Check if user credentials already exists in the database and throw an error if they do
        const existingEmail = await collection.findOne({ email: req.body.email });

        if (existingEmail) {
            logger.error('Email id already exists');
            return res.status(400).json({ error: 'Email id already exists' });
        }
        // Task 4: Create a hash to encrypt the password so that it is not readable in the database
        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);
        // Task 5: Insert the user into the database
        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            createdAt: new Date(),
        });
        // Task 6: Create JWT authentication if passwords match with user._id as payload
        const payload = {
            user: {
                id: newUser.insertedId,
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);
        // Task 7: Log the successful registration using the logger
        logger.info('User registered successfully');
        // Task 8: Return the user email and the token as a JSON
        res.json({ authtoken, email: req.body.email });

    } catch (e) {
        return res.status(500).send('Internal server error');
    }
});

router.post('/login', async (req, res) => {
    try {
        // Task 1: Connect to `secondChance` in MongoDB through `connectToDatabase` in `db.js`.
        const db = await connectToDatabase();
        // Task 2: Access MongoDB `users` collection
        const collection = db.collection("users");
        // Task 3: Check for user credentials in database
        const theUser = await collection.findOne({ email: req.body.email });
        if (!theUser) {
            logger.error('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        // Task 4: Check if the password matches the encrypted password and send appropriate message on mismatch
        const passwordMatch = await bcryptjs.compare(req.body.password, theUser.password);
        if (!passwordMatch) {
            logger.error('Passwords do not match');
            return res.status(401).json({ error: 'Wrong password' });
        }

        // Task 5: Fetch user details from a database
        const userName = theUser.firstName;
        const userEmail = theUser.email;
        // Task 6: Create JWT authentication if passwords match with user._id as payload
        const payload = {
            user: {
                id: theUser._id.toString(),
            },
        };
        const authtoken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        // Task 7: Send appropriate message if the user is not found (Task3)
        logger.info('User logged in successfully');
        res.status(200).json({ authtoken, userEmail, userName });
    } catch (e) {
        logger.error(`Login error: ${e.message}`);
        return res.status(500).json({ error: 'Internal server error', details: e.message });

    }
});

// {Insert it along with other imports} Task 1: Use the `body`,`validationResult` from `express-validator` for input validation
router.put('/update', async (req, res) => {
    // Task 2: Validate the input using `validationResult` and return an appropriate message if you detect an error

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.error('Errores de validación en la solicitud de actualización', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Task 3: Check if `email` is present in the header and throw an appropriate error message if it is not present
        const email = req.headers.email;

        if (!email) {
            logger.error('Email no encontrado en los encabezados de la solicitud');
            return res.status(400).json({ error: "Email no encontrado en los encabezados de la solicitud" });
        }
        // Task 4: Connect to MongoDB
        const db = await connectToDatabase();
        const collection = db.collection("users");
        // Task 5: Find the user credentials in database

        const existingUser = await collection.findOne({ email });
        if (!existingUser) {
            logger.error('Usuario no encontrado');
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Task 6: Update the user credentials in the database
        const updatedUser = await collection.findOneAndUpdate(
            { email },
            {
                $set: {
                    firstName: req.body.name,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

        if (!updatedUser) {
            logger.error('Error al actualizar usuario');
            return res.status(500).json({ error: "Error al actualizar usuario" });
        }
        // Task 7: Create JWT authentication with `user._id` as a payload using the secret key from the .env file
        const payload = {
            user: {
                id: updatedUser._id.toString(),
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);
        logger.info('Usuario actualizado correctamente');
        res.json({ authtoken });
    } catch (e) {
        console.error("Error en el servidor:", e);
        return res.status(500).send("Internal server error");

    }
});

module.exports = router;
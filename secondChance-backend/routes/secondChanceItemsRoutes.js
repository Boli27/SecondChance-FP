const express = require('express')
const multer = require('multer')
const router = express.Router()
const connectToDatabase = require('../models/db')
const logger = require('../logger')

// Define the upload directory path
const directoryPath = 'public/images'

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, directoryPath) // Specify the upload directory
  },
  filename(req, file, cb) {
    cb(null, file.originalname) // Use the original file name
  }
})

const upload = multer({ storage })

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
  logger.info('/ called')
  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')
    const secondChanceItems = await collection.find({}).toArray()
    res.json(secondChanceItems)
  } catch (e) {
    logger.error('Oops, something went wrong', e)
    next(e)
  }
})

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')
    let secondChanceItem = req.body

    const lastItemQuery = await collection.find().sort({ id: -1 }).limit(1)
    await lastItemQuery.forEach(item => {
      secondChanceItem.id = (parseInt(item.id, 10) + 1).toString()
    })

    const dateAdded = Math.floor(new Date().getTime() / 1000)
    secondChanceItem.dateAdded = dateAdded

    secondChanceItem = await collection.insertOne(secondChanceItem)

    res.status(201).json({
      id: secondChanceItem.insertedId,
      message: 'Item added successfully'
    })
  } catch (e) {
    next(e)
  }
})

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')
    const secondChanceItem = await collection.findOne({ id })

    if (!secondChanceItem) {
      return res.status(404).send('secondChanceItem not found')
    }
    res.json(secondChanceItem)
  } catch (e) {
    next(e)
  }
})

// Update an existing item
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')
    const secondChanceItem = await collection.findOne({ id })

    if (!secondChanceItem) {
      logger.error('secondChanceItem not found')
      return res.status(404).json({ error: 'secondChanceItem not found' })
    }

    const updatedFields = {
      category: req.body.category,
      condition: req.body.condition,
      ageDays: req.body.age_days,
      description: req.body.description,
      ageYears: Number((req.body.age_days / 365).toFixed(1)), // Cálculo de edad en años
      updatedAt: new Date() // Fecha de actualización
    }

    const updatedItem = await collection.findOneAndUpdate(
      { id }, // Filtro por ID
      { $set: updatedFields }, // Actualización
      { returnDocument: 'after' } // Devuelve el documento actualizado
    )

    res.status(200).json(updatedItem.value)
  } catch (e) {
    next(e)
  }
})

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const db = await connectToDatabase()
    const collection = db.collection('secondChanceItems')
    const secondChanceItem = await collection.findOne({ id })

    if (!secondChanceItem) {
      return res.status(404).json({ error: 'Item not found' })
    }

    await collection.deleteOne({ id })
    res.json({ message: `Item with id ${id} deleted successfully` })
  } catch (e) {
    next(e)
  }
})

module.exports = router

require('dotenv').config()
const express = require('express')
const axios = require('axios')
const logger = require('./logger')
const expressPinoLogger = require('express-pino-logger')

const natural = require('natural')

// Inicializar servidor Express
const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(expressPinoLogger({ logger }))

// Definir la ruta de análisis de sentimiento
app.post('/sentiment', async (req, res) => {
  try {
    // Extraer la frase del cuerpo de la solicitud
    const { sentence } = req.body

    if (!sentence) {
      logger.error('No sentence provided')
      return res.status(400).json({ error: 'No sentence provided' })
    }

    // Inicializar el analizador de sentimientos
    const Analyzer = natural.SentimentAnalyzer
    const stemmer = natural.PorterStemmer
    const analyzer = new Analyzer('English', stemmer, 'afinn')

    // Realizar el análisis de sentimiento
    const analysisResult = analyzer.getSentiment(sentence.split(' '))

    let sentimentText = 'neutral'

    if (analysisResult < 0) {
      sentimentText = 'negative'
    } else if (analysisResult <= 0.33) {
      sentimentText = 'neutral'
    } else {
      sentimentText = 'positive'
    }

    // Registrar resultado
    logger.info(`Sentiment analysis result: ${analysisResult}`)

    // Responder con el resultado del análisis
    res.status(200).json({
      sentimentScore: analysisResult,
      sentimentText
    })
  } catch (error) {
    logger.error(`Error performing sentiment analysis: ${error}`)
    res.status(500).json({ message: 'Error performing sentiment analysis' })
  }
})

app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
})

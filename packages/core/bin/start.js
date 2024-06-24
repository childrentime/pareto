/* eslint-disable */
const express = require('express')
const path = require('path')

const server = express()

const app = require('./server').app

const port = process.env.PORT || 4000

server.use('/', express.static(path.join(__dirname, './public')))
server.use('/', express.static(path.join(__dirname, './client')))

server.use((req, res, next) => {
  app.handle(req, res, next)
})

server.listen(port, () => {
  console.log(`server is listening on port: http://localhost:${port}`)
})

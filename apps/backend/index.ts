import express from 'express'
import {mainRouter} from './routes/index.ts'

const app = express()
app.use(express.json())

app.use("/api/v1", mainRouter)

app.listen(3000)
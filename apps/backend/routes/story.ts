import express from 'express'
import z from 'zod'

export const storyRouter = express.Router()

const createStorySchema = z.object({
    script: z.string()
})


storyRouter.post("/create", async (req, res) => {
    
})


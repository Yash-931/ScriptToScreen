import express from 'express'
import z from 'zod'
import { prisma } from '../db'

export const userRouter = express.Router()

const userSignupSchema = z.object({
    name: z.string(),
    username: z.string(),
    password: z.string()
})

const userSigninSchema = z.object({
    name: z.string(),
    username: z.string(),
    password: z.string()
})

userRouter.post("/signup", async (req, res) => {
    const {success, data} = userSignupSchema.safeParse(req.body)
    if(!success){
        res.status(403).json({
            message: "Input validation failed"
        })
        return
    }

    const isPresent = await prisma.user.findFirst({
        where: {
            username: data.username
        }
    })

    if(isPresent){
        res.status(403).json({
            message: "User with username already exists. Please move to sign in"
        })
        return
    }

    const user = await prisma.user.create({
        data: {
            username: data.username,
            name: data.name,
            password: data.password
        }
    })

    res.status(201).json({
        message: "User created successfully",
        user
    })
})

userRouter.post("/signin", async (req, res) => {
    const {success, data} = userSigninSchema.safeParse(req.body)
    if(!success){
        res.status(401).json({
            message: "Input validation failed"
        })
        return
    }

    
})

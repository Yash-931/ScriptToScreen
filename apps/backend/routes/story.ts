import express from 'express'
import z from 'zod'
import { scriptBreakdown } from '../script'
import { getImageFromUrl, getSignedUrl, imageGeneration, uploadImage } from '../image'
import { authMiddleware } from '../middleware/auth'
import {prisma} from '../db.ts'

export const storyRouter = express.Router()

const createStorySchema = z.object({
    image: z.string(),
    script: z.string()
})

storyRouter.post("/create", authMiddleware, async (req, res) => {
    const {success, data} = createStorySchema.safeParse(req.body);
    const userId = req.user

    if(!success){
        res.status(401).json({
            message: "Input validation failed"
        })
        return
    }

    //script breaking down
    const response = await scriptBreakdown(data.script)
    console.log(response);

    //store the input image in s3 bucket and the url of the bucket in the db
    const base64Image = await getImageFromUrl(data.image)
    const destination = `uploads/images/users/${userId}/${Date.now()}`
    const url = await uploadImage(base64Image, destination, "image/png")

    console.log(url)

    //saving the url in the db
    await prisma.charecter.create({
        data: {
            name: response.scenes[0].charactersInScene[0],
            imageUrl: url!,
            user_id: userId
        }
    })

    //generate the starting frame
    const signedUrl = await getSignedUrl(destination)

    console.log("Signed url: " + signedUrl)

    const base64SignedImg = await getImageFromUrl(signedUrl)

    await imageGeneration(response.scenes[0].imagePrompt, base64SignedImg)

    return res.status(200).json({
        message: "Success"
    })
})


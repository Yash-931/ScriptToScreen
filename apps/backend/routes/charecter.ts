import express from "express";
import { getImageFromUrl, imageGeneration } from "../image";
import { authMiddleware } from "../middleware/auth";

export const charecterRouter = express.Router();

charecterRouter.post("/create", authMiddleware, async (req, res) => {
    const { imageUrl } = req.body;
    const base64image = await getImageFromUrl(imageUrl)

    await imageGeneration("Given the image of a user, generate the side profile snapshot of this user. The generated image must be of a portfolio style snapshot", base64image)
    
});

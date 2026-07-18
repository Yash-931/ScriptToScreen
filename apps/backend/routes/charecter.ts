import express from "express";
import axios from "axios";
import { getImageFromUrl, imageGeneration } from "../image";

export const charecterRouter = express.Router();

charecterRouter.post("/create", async (req, res) => {
    const { imageUrl } = req.body;
    const base64image = await getImageFromUrl(imageUrl)

    await imageGeneration("Given the image of a user, generate the side profile snapshot of this user. The generated image must be of a portfolio style snapshot", base64image)

});

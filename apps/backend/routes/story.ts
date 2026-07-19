import express from "express";
import z from "zod";
import { scriptBreakdown } from "../script";
import {
  getImageFromUrl,
  getMotionPrompt,
  getSignedUrl,
  imageGeneration,
  uploadImage,
  videoOutput,
} from "../image";
import { authMiddleware } from "../middleware/auth";
import { prisma } from "../db.ts";

export const storyRouter = express.Router();

const createStorySchema = z.object({
  image: z.string(),
  script: z.string(),
});

storyRouter.post("/create", authMiddleware, async (req, res) => {
  const { success, data } = createStorySchema.safeParse(req.body);
  const userId = req.user;

  if (!success) {
    res.status(401).json({
      message: "Input validation failed",
    });
    return;
  }

  //script breaking down
  const response = await scriptBreakdown(data.script);
  console.log(response);

  //store the input image in s3 bucket and the url of the bucket in the db
  const base64Image = await getImageFromUrl(data.image);
  const destination = `uploads/images/users/${userId}/${Date.now()}`;
  const url = await uploadImage(base64Image, destination, "image/png");

  console.log(url);

  //saving the url in the db
  await prisma.charecter.create({
    data: {
      name: response.scenes[0].charactersInScene[0],
      imageUrl: destination,
      user_id: userId,
    },
  });

  const frames = [];

  //generating all the scene images and pushing them to s3 and path to frames array
  for (const scene of response.scenes) {
    console.log("Start frame generation for all scenes");
    const responseImage = await imageGeneration(scene.imagePrompt, base64Image);
    const responseImgDestination = `uploads/images/frames/${userId}/${Date.now()}`;

    await uploadImage(responseImage, responseImgDestination, "image/png");
    frames.push(responseImgDestination);
  }

  //1. pass the each frame to gemini to get a detailed motion prompt for each scene

  //2. then pass that prompt + system prompt + each frame image as starting of that scene to veo 3 to generate a video out of it (for each scene)

  for (let i = 0; i < frames.length; i++) {
    const currScene = response.scenes[0];
    const currImgPrompt = currScene.imagePrompt;
    const currImgCaption = currScene.caption;

    //getting out the motion prompt from gemini
    console.log("Generating motion prompt");
    const motionPrompt = await getMotionPrompt(currImgPrompt, currImgCaption);

    const startFrameUrl = await getSignedUrl(frames[i]!);

    const imgBytes = await getImageFromUrl(startFrameUrl);

    const videoDestinationPath = `/uploads/videos/${userId}/${Date.now()}`;

    if (i < response.scenes.length - 1) {
      console.log("Cooling off for 3 seconds before next scene...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    console.log("Generating video response");
    await videoOutput(motionPrompt, imgBytes, videoDestinationPath);
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log("Waiting before the next call...")

  }

  return res.status(200).json({
    message: "Success",
  });
});

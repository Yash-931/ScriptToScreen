import express from "express";
import { userRouter } from "./user";
import { storyRouter } from "./story";
import { sceneRouter } from "./scene";

export const mainRouter = express.Router()

mainRouter.use("/users", userRouter)
mainRouter.use("/scenes", sceneRouter)
mainRouter.use("/stories", storyRouter)
import express from "express";
import z, { date } from "zod";
import { prisma } from "../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const userRouter = express.Router();

const userSignupSchema = z.object({
  name: z.string(),
  username: z.string(),
  password: z.string(),
});

const userSigninSchema = z.object({
  username: z.string(),
  password: z.string(),
});

userRouter.post("/signup", async (req, res) => {
  const { success, data } = userSignupSchema.safeParse(req.body);
  if (!success) {
    res.status(403).json({
      message: "Input validation failed",
    });
    return;
  }

  const isPresent = await prisma.user.findFirst({
    where: {
      username: data.username,
    },
  });

  if (isPresent) {
    res.status(403).json({
      message: "User with username already exists. Please move to sign in",
    });
    return;
  }

  const hashPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      name: data.name,
      password: hashPassword,
    },
  });

  res.status(201).json({
    message: "User created successfully",
    user,
  });
});

userRouter.post("/signin", async (req, res) => {
  const { success, data } = userSigninSchema.safeParse(req.body);
  if (!success) {
    res.status(401).json({
      message: "Input validation failed",
    });
    return;
  }

  const db_user = await prisma.user.findFirst({
    where: {
      username: data.username,
    },
  });

  if (!db_user) {
    res.status(401).json({
      message: "User with username doesn't exist. Please signup first",
    });
    return;
  }

  const isPasswordMatch = await bcrypt.compare(data.password, db_user.password);

  if (!isPasswordMatch) {
    res.status(403).json({
      message: "Incorrect credentials",
    });
    return;
  }

  const token = jwt.sign(
    {
      data: db_user.id,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "1h",
    },
  );

  res.status(200).json({
    message: "Signin successfull",
    token: token
  })
});

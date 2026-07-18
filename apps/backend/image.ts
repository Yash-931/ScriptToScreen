import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import * as fs from "node:fs";
import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: process.env.GCP_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

const bucket = storage.bucket(process.env.IMAGE_BUCKET!);

const ai = new GoogleGenAI({
  vertexai: true,
  project: process.env.GCP_PROJECT,
  location: "us-central1",
});

export async function getImageFromUrl(url: string) {
  const image = await axios.get(url, { responseType: "arraybuffer" });
  const base64image = Buffer.from(image.data).toString("base64");
  return base64image;
}

export async function imageGeneration(
  user_prompt: string,
  base64image: string,
) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [
      { text: user_prompt },
      { inlineData: { mimeType: "image/png", data: base64image } },
    ],
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData,
  );

  if (!imagePart || !imagePart.inlineData?.data) {
    throw new Error("Model failed to output a modified image.");
  }

  fs.writeFileSync(
    "gemini-image.png",
    Buffer.from(imagePart.inlineData.data, "base64"),
  );
  console.log("Image saved successfully");
}

export async function uploadImage(
  base64image: string,
  destination: string,
  mimeType: string,
) {
  try {
    const cleanBase64 = base64image.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(cleanBase64, "base64");

    const file = bucket.file(destination);

    await file.save(imgBuffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: "public, max-age=31536000",
      },
      resumable: false,
    });

    const url = `https://googleapis.com{bucket.name}/${file.name}`;
    return url;
  } catch (error) {
    console.error("Error uploading the file to s3" + error);
  }
}

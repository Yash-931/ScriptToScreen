import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import {
  FRAME_GENERATION_SYSTEM_PROMPT,
  VIDEO_MOTION_SYSTEM_PROMPT,
} from "./config/prompts";
import { response } from "express";

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
    config: {
      systemInstruction: FRAME_GENERATION_SYSTEM_PROMPT,
    },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData,
  );

  if (!imagePart || !imagePart.inlineData?.data) {
    throw new Error("Model failed to output a modified image.");
  }

  return imagePart.inlineData.data;
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

    const url = `https://googleapis.com/${process.env.IMAGE_BUCKET}/${file.name}`;
    return url;
  } catch (error) {
    console.error("Error uploading the file to s3" + error);
  }
}

export async function getSignedUrl(fileName: string) {
  try {
    const options = {
      version: "v4",
      action: "read",
      expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
    };

    const [url] = await storage
      .bucket(process.env.IMAGE_BUCKET!)
      .file(fileName)
      .getSignedUrl(options);

    return url;
  } catch (error) {
    console.error("Error generating the signed url: " + error);
  }
}

export async function getMotionPrompt(imagePrompt: string, caption: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Scene details: ${imagePrompt}. Scene caption: ${caption}`,
    config: {
      systemInstruction: VIDEO_MOTION_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "OBJECT",
        properties: { videoMotionPrompt: { type: "STRING" } },
        required: ["videoMotionPrompt"],
      },
    },
  });

  const parsedMotion = JSON.parse(response.text!);
  const videoPrompt = parsedMotion.videoMotionPrompt;
  return videoPrompt;
}

export async function videoOutput(
  user_prompt: string,
  imgBytes: string,
  videoDestinationPath: string,
  retries = 3,
  delayMs = 30000,
) {
  // Get your bucket name dynamically from your storage bucket instance
  const bucketName = bucket.name;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `Sending video generation request to Veo (Attempt ${attempt}/${retries})...`,
      );

      let operation = await ai.models.generateVideos({
        model: "veo-3.1-fast-generate-001",
        prompt: user_prompt,
        image: {
          imageBytes: imgBytes,
          mimeType: "image/png",
        },
        // ◄ CRITICAL FOR VERTEX AI: You must tell it where to save the output in GCS
        config: {
          aspectRatio: "16:9",
          outputGcsUri: `gs://${bucketName}/vertex-veo-tmp/`,
        } as any,
      });

      // Polling loop until processing completes
      while (!operation.done) {
        console.log("Waiting for video generation...");
        await new Promise((resolve) => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
      }

      if (operation.error) {
        throw new Error(
          `Google Veo Processing Fault: ${operation.error.message}`,
        );
      }

      // 1. Get the generated cloud storage URI (looks like gs://your-bucket/vertex-veo-tmp/xxxx.mp4)
      const gcsUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!gcsUri) {
        throw new Error(
          "Video generation completed, but no GCS output URI was found.",
        );
      }

      console.log(`Video generated directly by Vertex AI into GCS: ${gcsUri}`);

      // 2. Extract the relative file path from the gs:// string to target it with the cloud SDK
      // Example: "gs://my-bucket/vertex-veo-tmp/abc.mp4" -> "vertex-veo-tmp/abc.mp4"
      const generatedFilePath = gcsUri.replace(`gs://${bucketName}/`, "");
      const generatedFile = bucket.file(generatedFilePath);

      // 3. Move/Rename the file directly in the cloud to your final requested destination path
      console.log(
        `Moving file from temp space to final destination path: ${videoDestinationPath}`,
      );
      await generatedFile.move(videoDestinationPath);

      console.log(
        "🎉 Video saved and moved successfully in your GCS storage bucket!",
      );
      return;
    } catch (error: any) {
      const errorMessage = error?.message || "";
      const errorStatus = error?.status || "";

      const isRateLimit =
        errorMessage.includes("429") ||
        errorMessage.includes("RESOURCE_EXHAUSTED") ||
        errorStatus === "RESOURCE_EXHAUSTED" ||
        error?.code === 429;

      if (isRateLimit && attempt < retries) {
        const backoffTime = delayMs * attempt * 2;
        console.warn(
          `\n⚠️ RATE LIMIT HIT. Waiting ${backoffTime / 1000} seconds before retrying...\n`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      } else {
        console.error("Execution failed completely:");
        throw error;
      }
    }
  }
}

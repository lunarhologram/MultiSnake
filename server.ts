import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  let lastAiCall = 0;
  const MIN_INTERVAL = 12000; // 12 seconds minimum between any AI calls (5 per minute)

  // AI Feedback Endpoint
  app.post("/api/ai/feedback", async (req, res) => {
    const now = Date.now();
    if (now - lastAiCall < MIN_INTERVAL) {
      return res.json({ feedback: "Professor Pip is sorting his sunflower seeds. Try again in a few seconds! 🐹🌻" });
    }

    try {
      lastAiCall = now;
      const { correctAnswers, wrongAnswers, averageTime, recentHistory, studentName } = req.body;
      
      const prompt = `You are "Professor Pip", a friendly, high-energy math-loving hamster. 
      Analyze this primary student's multiplication performance:
      - Name: ${studentName || 'Student'}
      - Correct: ${correctAnswers}
      - Wrong: ${wrongAnswers}
      - Avg Time per Answer: ${averageTime}s
      - Recent History: ${JSON.stringify(recentHistory)}

      Provide a short, encouraging message (max 2 sentences). 
      If they are doing great, celebrate! 
      If they missed a few, give a tiny tip (like "Remember, 7x8 is just 7x7 plus 7 more!"). 
      Use kid-friendly emojis.`;

      const result = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
      });

      res.json({ feedback: result.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Professor Pip is taking a nap. Try again soon!" });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

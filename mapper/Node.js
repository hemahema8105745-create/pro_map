const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();
const { gTTS } = require('gtts');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Upload folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ===============================
//  MAIN API ENDPOINT
// ===============================
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const filePath = req.file.path;

    // Step 1 — AI or fallback description
    const description = await generateDescription(filePath);

    // Step 2 — Save text file
    const baseName = path.basename(filePath, path.extname(filePath));
    const textPath = path.join(uploadDir, baseName + '.txt');
    fs.writeFileSync(textPath, description, 'utf8');

    // Step 3 — Generate MP3
    const audioPath = path.join(uploadDir, baseName + '.mp3');
    await generateTTS(description, audioPath);

    // Serve files
    app.use('/uploads', express.static(uploadDir));

    res.json({
      description,
      textUrl: `/uploads/${path.basename(textPath)}`,
      audioUrl: `/uploads/${path.basename(audioPath)}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// ===============================
//  AI DESCRIPTION FUNCTION
// ===============================
async function generateDescription(imagePath) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  // Fallback mode (no API key)
  if (!OPENAI_API_KEY) {
    const name = path.basename(imagePath);
    return `Concise description of image (${name}): This is a placeholder summary.`;
  }

  // If using OpenAI
  const imageBytes = fs.readFileSync(imagePath).toString('base64');

  const payload = {
    model: "gpt-4o-mini",
    input: [
      { role: "user", content: "Provide a concise narrated description optimized for screen readers." },
      { role: "user", image_base64: imageBytes }
    ]
  };

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const data = await resp.json();
  let text = data?.output?.[0]?.content?.[0]?.text || "AI could not generate description.";

  return text;
}

// ===============================
//  TEXT-TO-SPEECH GENERATOR
// ===============================
function generateTTS(text, output) {
  return new Promise((resolve, reject) => {
    try {
      const tts = new gTTS(text, 'en');
      const stream = tts.stream();
      const writeStream = fs.createWriteStream(output);
      stream.pipe(writeStream);
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
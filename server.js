// server.ts
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var isProd = process.env.NODE_ENV === "production";
var PORT = Number(process.env.PORT) || 3e3;
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi (\u0939\u093F\u0902\u0926\u0940)",
  hinglish: "Hinglish (Hindi written in Roman/English alphabet, very natural Indian conversation style)",
  bn: "Bengali (\u09AC\u09BE\u0982\u09B2\u09BE)",
  ta: "Tamil (\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD)",
  te: "Telugu (\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41)",
  mr: "Marathi (\u092E\u0930\u093E\u0920\u0940)",
  gu: "Gujarati (\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0)",
  kn: "Kannada (\u0C95\u0CA8\u0CCD\u0CA8\u0CA1)",
  ml: "Malayalam (\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02)",
  pa: "Punjabi (\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40)",
  ur: "Urdu (\u0627\u0631\u062F\u0648)",
  od: "Odia (\u0B13\u0B21\u0B3C\u0B3F\u0B06)"
};
var DISEASE_LIBRARY = [
  {
    id: "fever-flu",
    name: "Viral Fever & Seasonal Flu",
    nameHi: "\u0935\u093E\u092F\u0930\u0932 \u092C\u0941\u0916\u093E\u0930 \u0914\u0930 \u092B\u094D\u0932\u0942",
    category: "Infections",
    symptoms: ["High temperature (>100\xB0F)", "Body ache & chills", "Headache", "Fatigue & sore throat"],
    homeCare: ["Rest adequately", "Drink plenty of warm fluids & ORS", "Sponge with lukewarm water if fever is high", "Paracetamol for temperature as per weight/doctor advice"],
    redFlags: ["Fever > 103\xB0F lasting > 3 days", "Severe breathlessness or chest tightness", "Confusion, lethargy, or inability to keep fluids down"],
    doctor: "General Physician / Internal Medicine"
  },
  {
    id: "dengue-malaria",
    name: "Dengue & Vector-borne Fevers",
    nameHi: "\u0921\u0947\u0902\u0917\u0942 \u0914\u0930 \u092E\u0932\u0947\u0930\u093F\u092F\u093E",
    category: "Vector-borne",
    symptoms: ["Sudden high fever", "Severe pain behind eyes (retro-orbital)", "Intense joint & muscle pain (breakbone fever)", "Skin rashes / petechiae"],
    homeCare: ["Strict bed rest", "Coconut water, fresh juices, and ORS to maintain platelets and hydration", "Avoid NSAIDs like Ibuprofen/Aspirin (can worsen bleeding)"],
    redFlags: ["Bleeding gums, nosebleeds, or blood in stool/vomit", "Severe continuous abdominal pain", "Sudden drop in platelet count below 50,000"],
    doctor: "General Physician / Infectious Diseases Specialist"
  },
  {
    id: "stomach-gastro",
    name: "Gastroenteritis & Food Poisoning",
    nameHi: "\u092A\u0947\u091F \u092E\u0947\u0902 \u0938\u0902\u0915\u094D\u0930\u092E\u0923 \u0914\u0930 \u0926\u0938\u094D\u0924",
    category: "Digestive",
    symptoms: ["Loose watery stools", "Abdominal cramping", "Nausea and vomiting", "Mild fever and dehydration"],
    homeCare: ["Immediate ORS (Oral Rehydration Solution) after every loose motion", "BRAT diet: Banana, Rice (curd rice/khichdi), Applesauce, Toast", "Avoid dairy (except curd/buttermilk), spicy foods, and oily dishes"],
    redFlags: ["Signs of severe dehydration (dry mouth, sunken eyes, no urine for >8 hours)", "High fever with blood or mucus in stool", "Persistent vomiting for more than 24 hours"],
    doctor: "Gastroenterologist / General Physician"
  },
  {
    id: "skin-rash-eczema",
    name: "Skin Rashes, Eczema & Fungal Infections",
    nameHi: "\u0924\u094D\u0935\u091A\u093E \u0915\u0947 \u091A\u0915\u0924\u094D\u0924\u0947, \u0926\u093E\u0926 \u0914\u0930 \u090F\u0932\u0930\u094D\u091C\u0940",
    category: "Dermatology",
    symptoms: ["Red itchy bumps or patches", "Dry, flaky skin or blisters", "Ring-shaped red patches with raised borders (Ringworm/Tinea)", "Burning sensation"],
    homeCare: ["Keep the area clean and completely dry", "Wear loose, breathable cotton clothes", "Avoid scratching to prevent secondary bacterial infection", "Cool compress for itch relief"],
    redFlags: ["Rapidly spreading rash accompanied by facial swelling or difficulty breathing (Anaphylaxis - call 112/108 immediately)", "Pus formation, yellow crusting, or hot tender skin", "Rash with sudden high fever and joint pain"],
    doctor: "Dermatologist"
  },
  {
    id: "migraine-headache",
    name: "Migraine & Tension Headache",
    nameHi: "\u092E\u093E\u0907\u0917\u094D\u0930\u0947\u0928 \u0914\u0930 \u0938\u093F\u0930\u0926\u0930\u094D\u0926",
    category: "Neurology",
    symptoms: ["Throbbing pain usually on one side of head", "Sensitivity to light (photophobia) and sound", "Nausea or visual aura", "Tight band-like sensation around forehead"],
    homeCare: ["Rest in a dark, quiet, cool room", "Apply cold compress or ice pack to forehead/neck", "Stay well hydrated and maintain regular meal schedules", "Gentle neck and shoulder stretching"],
    redFlags: ['"Thunderclap" headache: sudden severe explosive headache (maximum intensity within seconds)', "Headache accompanied by numbness, slurred speech, or vision loss", "Headache after head trauma / injury or with stiff neck and high fever"],
    doctor: "Neurologist / General Physician"
  },
  {
    id: "hypertension",
    name: "Hypertension (High Blood Pressure)",
    nameHi: "\u0909\u091A\u094D\u091A \u0930\u0915\u094D\u0924\u091A\u093E\u092A (\u0939\u093E\u0908 \u092C\u0940\u092A\u0940)",
    category: "Cardiovascular",
    symptoms: ['Often "silent" without early symptoms', "Morning headache", "Dizziness or lightheadedness", "Shortness of breath on exertion"],
    homeCare: ["Reduce sodium (salt) intake (< 5g per day)", "Eat DASH diet rich in potassium, leafy greens, fruits, and whole grains", "30 minutes daily brisk walking", "Practice deep breathing, meditation, and stress management", "Never stop prescribed BP medication abruptly"],
    redFlags: ["BP reading > 180/120 mmHg (Hypertensive crisis)", "Severe chest pain, breathlessness, or radiating arm pain", "Sudden numbness, weakness on one side of face/body, or slurred speech (Stroke warning)"],
    doctor: "Cardiologist / General Physician"
  },
  {
    id: "diabetes",
    name: "Type 2 Diabetes & Blood Sugar Control",
    nameHi: "\u0921\u093E\u092F\u092C\u093F\u091F\u0940\u091C (\u092E\u0927\u0941\u092E\u0947\u0939)",
    category: "Metabolic & Endocrine",
    symptoms: ["Frequent urination (especially at night)", "Excessive thirst and hunger", "Unexplained weight loss or chronic fatigue", "Slow healing cuts or frequent infections"],
    homeCare: ["Low glycemic index diet (avoid refined sugar, maida, sugary drinks)", "Include fenugreek seeds, cinnamon, bitter gourd (karela), high fiber vegetables", "Regular post-meal 15-minute walks", "Daily foot inspection for minor blisters or sores"],
    redFlags: ["Extreme high blood sugar (>300 mg/dL) with fruity breath, vomiting, confusion (Ketoacidosis / HHS)", "Severe hypoglycemia (shakiness, cold sweat, dizziness, confusion < 70 mg/dL - immediately consume sugar/glucose)"],
    doctor: "Endocrinologist / Diabetologist"
  },
  {
    id: "asthma-cough",
    name: "Asthma, Bronchitis & Respiratory Allergy",
    nameHi: "\u0905\u0938\u094D\u0925\u092E\u093E, \u0926\u092E\u093E \u0914\u0930 \u090F\u0932\u0930\u094D\u091C\u0940 \u0935\u093E\u0932\u0940 \u0916\u093E\u0902\u0938\u0940",
    category: "Respiratory",
    symptoms: ["Wheezing whistling sound when breathing", "Dry or productive chest cough", "Shortness of breath triggered by dust, pollen, cold air, or exertion", "Tight feeling in chest"],
    homeCare: ["Use prescribed rescue inhaler (Salbutamol) as directed by doctor", "Warm saline steam inhalation (1-2 times daily)", "Warm ginger-honey water or turmeric milk for soothing throat", "Stay away from smoke, dust mites, and strong incense/perfumes"],
    redFlags: ["Severe breathlessness unable to speak full sentences without pausing", "Lips or fingernails turning blue/grey (Cyanosis - hypoxia)", "No improvement after rescue inhaler puffs (Call ambulance immediately)"],
    doctor: "Pulmonologist / Chest Physician"
  },
  {
    id: "gerd-acidity",
    name: "Acid Reflux (GERD) & Acidity",
    nameHi: "\u090F\u0938\u093F\u0921\u093F\u091F\u0940 \u0914\u0930 \u0917\u0948\u0938 (GERD)",
    category: "Digestive",
    symptoms: ["Burning chest pain behind breastbone (Heartburn)", "Sour taste or regurgitation of acid in mouth", "Bloating and excessive burping", "Difficulty swallowing or feeling lump in throat"],
    homeCare: ["Eat small, frequent meals rather than heavy dinners", "Avoid lying down immediately after meals (wait at least 2-3 hours)", "Elevate head of bed by 6 inches", "Limit caffeine, chocolate, oily/deep-fried items, and carbonated beverages"],
    redFlags: ["Heartburn accompanied by chest tightness radiating to jaw, neck, left arm, or cold sweats (Must rule out Heart Attack)", "Vomiting blood or dark black tarry stools", "Difficulty or pain while swallowing solid foods"],
    doctor: "Gastroenterologist"
  },
  {
    id: "uti",
    name: "Urinary Tract Infection (UTI)",
    nameHi: "\u092F\u0942\u0930\u093F\u0928 \u0907\u0928\u094D\u092B\u0947\u0915\u094D\u0936\u0928 (\u092F\u0942\u091F\u0940\u0906\u0908)",
    category: "Urology & Nephrology",
    symptoms: ["Strong persistent urge to urinate", "Burning pain or stinging during urination (Dysuria)", "Cloudy, dark, or strong-smelling urine", "Lower pelvic or lower back discomfort"],
    homeCare: ["Drink 2.5 - 3 liters of water daily to flush bacteria", "Do not hold urine; empty bladder completely", "Maintain strict intimate hygiene; wipe front to back", "Consult doctor for clean urine culture before taking random antibiotics"],
    redFlags: ["High fever with shaking chills and severe flank/back pain (indicates kidney infection / Pyelonephritis)", "Visible blood in urine (Hematuria)", "Severe nausea, vomiting, and inability to urinate"],
    doctor: "Urologist / Gynecologist / Physician"
  }
];
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "60mb" }));
  app.use(express.urlencoded({ extended: true, limit: "60mb" }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.get("/api/diseases", (req, res) => {
    res.json({ diseases: DISEASE_LIBRARY });
  });
  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioData, mimeType = "audio/webm", languageHint } = req.body;
      if (!audioData) {
        return res.status(400).json({ error: "Missing audioData" });
      }
      const promptText = `Transcribe the spoken audio with high accuracy. 
The user may be speaking in English, Hindi, Hinglish, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, or Odia.
${languageHint ? `User preferred language hint: ${languageHint}.` : ""}
Return ONLY the transcribed text without extra preamble, formatting tags, or quotes.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-transcribe",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioData
              }
            },
            {
              text: promptText
            }
          ]
        }
      });
      const transcript = response.text ? response.text.trim() : "";
      res.json({ transcript });
    } catch (error) {
      console.error("Transcription error:", error);
      res.status(500).json({
        error: error.message || "Failed to transcribe audio"
      });
    }
  });
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice = "Kore" } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Missing text for TTS" });
      }
      const sanitizedText = text.slice(0, 800);
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: sanitizedText,
                speechMetadata: {
                  style: "Warm, compassionate, caring medical assistant speaking clearly and gently"
                }
              }
            ]
          }
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || "Kore" }
            }
          }
        }
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: "No audio returned from TTS model" });
      }
      res.json({
        audioBase64: base64Audio,
        mimeType: "audio/wav"
      });
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate speech audio"
      });
    }
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        message = "",
        language = "en",
        media = [],
        // Array of { mimeType: string, data: string, name?: string }
        history = [],
        // Previous messages [{ role: 'user' | 'model', text: string }]
        voiceRequested = false
      } = req.body;
      const targetLanguageName = LANGUAGE_NAMES[language] || "English";
      const systemInstruction = `You are "AarogyaAI" (\u0906\u0930\u094B\u0917\u094D\u092F AI), an empathetic, culturally sensitive, highly accessible multimodal health and disease advisor.
Your mission is to provide clear, actionable, accurate medical guidance for general diseases and symptoms to all users regardless of their literacy level or background.

IMPORTANT MEDICAL & SAFETY DIRECTIVES:
1. Medical Disclaimer: Always reinforce that you are an AI health advisor providing educational triage and first-aid recommendations, NOT a final clinical diagnosis. For serious issues, prescription drugs, or surgical emergencies, a physical examination by a registered physician is crucial.
2. Multimodal Analysis:
   - If a PHOTO is attached (e.g. skin rash, eye condition, swelling, tongue, throat, medication strip, or test report): carefully examine the visual characteristics (color, borders, texture, lesions, distribution, text on medicine).
   - If a VIDEO is attached (e.g. movement, tremor, cough/breathing difficulty, rash spread): inspect dynamics, frequency, respiratory rate, and physical behavior.
   - If an AUDIO is attached: analyze vocal strain, cough sound (dry vs productive vs wheezing), breathlessness, or user's spoken words.
3. Language & Tone:
   - Provide the ENTIRE response primarily in: ${targetLanguageName}.
   ${language === "hinglish" ? '- For Hinglish: use friendly, conversational Hindi written in Latin/English alphabet with simple terms (e.g. "Aapko thoda bukhar aur sharir dard lag raha hai. Pehle ORS aur paani peena shuru karein..."). Very natural for young & general Indian audience.' : language === "hi" ? "- For Hindi: use respectful, easy-to-understand Hindi (\u0936\u0941\u0926\u094D\u0927 \u0914\u0930 \u0938\u0930\u0932 \u0939\u093F\u0902\u0926\u0940, \u0915\u0920\u093F\u0928 \u0905\u0902\u0917\u094D\u0930\u0947\u091C\u0940 \u0936\u092C\u094D\u0926\u094B\u0902 \u0915\u0947 \u0939\u093F\u0902\u0926\u0940 \u0905\u0930\u094D\u0925 \u0938\u093E\u0925 \u092E\u0947\u0902)." : `- For ${targetLanguageName}: use fluent, natural, grammatically correct phrasing in ${targetLanguageName}.`}
   - Tone: Warm, empathetic, comforting, non-judgmental, easy to understand.
4. Structured Response Format:
   Your markdown reply MUST include these clear sections with emojis:
   - \u{1FA7A} **Immediate Assessment & Probable Conditions** (What might be happening, common general illnesses matching the query)
   - \u{1F50D} **Visual / Media Observations** (Only if photo/video/audio was provided: describe key findings seen or heard)
   - \u{1F33F} **Safe Home Care & First-Aid Measures** (Proven safe relief, hydration, diet, rest, positioning)
   - \u{1F6A8} **Emergency Red Flags (When to go to Hospital / Doctor IMMEDIATELY)** (Clear warning indicators: e.g. severe breathlessness, fever > 103\xB0F, chest pain, confusion)
   - \u{1F468}\u200D\u2695\uFE0F **Recommended Specialist / Next Steps** (Which doctor to visit, e.g. General Physician, Dermatologist, ENT, Pediatrician, etc.)
   - \u26A0\uFE0F **Medicine Precautions** (Do NOT prescribe prescription-only antibiotics or steroids. Clarify safe basic OTC practices e.g. Paracetamol / ORS, and warn against self-medication)

5. Accessibility Spoken Summary:
   At the very end of your response, output a special delimiter followed by a clean, 2-3 sentence conversational spoken summary that can be read aloud by Text-To-Speech for visually impaired or audio-first users:
   <<<SPOKEN_SUMMARY>>>
   [Spoken summary here in ${targetLanguageName}, without any markdown asterisks, bullet points, or complex symbols, spoken warmly as a caring doctor/nurse].
   <<<END_SPOKEN_SUMMARY>>>
   <<<SEVERITY>>>low|moderate|urgent|emergency<<<END_SEVERITY>>>
   <<<SPECIALIST>>>Recommended Doctor Type<<<END_SPECIALIST>>>`;
      const parts = [];
      if (Array.isArray(media) && media.length > 0) {
        for (const item of media) {
          if (item && item.mimeType && item.data) {
            parts.push({
              inlineData: {
                mimeType: item.mimeType,
                data: item.data
              }
            });
          }
        }
      }
      let contextPrompt = "";
      if (Array.isArray(history) && history.length > 0) {
        const recentHistory = history.slice(-4);
        contextPrompt += "Recent conversation context:\n";
        for (const msg of recentHistory) {
          contextPrompt += `${msg.role === "user" ? "User" : "AarogyaAI"}: ${msg.text}
`;
        }
        contextPrompt += "\nCurrent User Query:\n";
      }
      const userText = message || (media.length > 0 ? "Please analyze this health photo/audio/video and give me medical advice." : "Hello, can you help with general health advice?");
      parts.push({
        text: `${contextPrompt}${userText}

Please respond in ${targetLanguageName} as instructed.`
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: { parts },
        config: {
          systemInstruction
        }
      });
      const rawText = response.text || "";
      let spokenSummary = "";
      let replyText = rawText;
      let severity = "moderate";
      let specialist = "General Physician";
      const spokenMatch = rawText.match(/<<<SPOKEN_SUMMARY>>>([\s\S]*?)<<<END_SPOKEN_SUMMARY>>>/);
      if (spokenMatch) {
        spokenSummary = spokenMatch[1].trim();
        replyText = replyText.replace(/<<<SPOKEN_SUMMARY>>>[\s\S]*?<<<END_SPOKEN_SUMMARY>>>/, "").trim();
      }
      const severityMatch = rawText.match(/<<<SEVERITY>>>(low|moderate|urgent|emergency)<<<END_SEVERITY>>>/i);
      if (severityMatch) {
        severity = severityMatch[1].toLowerCase();
        replyText = replyText.replace(/<<<SEVERITY>>>[\s\S]*?<<<END_SEVERITY>>>/, "").trim();
      }
      const specialistMatch = rawText.match(/<<<SPECIALIST>>>([\s\S]*?)<<<END_SPECIALIST>>>/);
      if (specialistMatch) {
        specialist = specialistMatch[1].trim();
        replyText = replyText.replace(/<<<SPECIALIST>>>[\s\S]*?<<<END_SPECIALIST>>>/, "").trim();
      }
      if (!spokenSummary) {
        spokenSummary = replyText.replace(/[*#_`]/g, "").split("\n").filter((line) => line.trim().length > 10)[0] || "Here is your health advisory summary.";
      }
      let audioBase64 = null;
      if (voiceRequested && spokenSummary) {
        try {
          const ttsRes = await ai.models.generateContent({
            model: "gemini-3.8-flash-lite-tts",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: spokenSummary.slice(0, 600),
                    speechMetadata: {
                      style: "Warm, caring doctor speaking gently"
                    }
                  }
                ]
              }
            ],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Kore" }
                }
              }
            }
          });
          audioBase64 = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        } catch (ttsErr) {
          console.warn("TTS auto-generation warning:", ttsErr);
        }
      }
      res.json({
        reply: replyText,
        spokenSummary,
        severity,
        specialist,
        audioBase64,
        language
      });
    } catch (error) {
      console.error("Chat advice error:", error);
      res.status(500).json({
        error: error.message || "Failed to process medical query"
      });
    }
  });
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AarogyaAI server running on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

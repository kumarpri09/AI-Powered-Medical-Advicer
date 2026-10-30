import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// Initialize shared GoogleGenAI client with required User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिंदी)',
  hinglish: 'Hinglish (Hindi written in Roman/English alphabet, very natural Indian conversation style)',
  bn: 'Bengali (বাংলা)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  mr: 'Marathi (मराठी)',
  gu: 'Gujarati (ગુજરાતી)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  ur: 'Urdu (اردو)',
  od: 'Odia (ଓଡ଼ିଆ)',
};

const DISEASE_LIBRARY = [
  {
    id: 'fever-flu',
    name: 'Viral Fever & Seasonal Flu',
    nameHi: 'वायरल बुखार और फ्लू',
    category: 'Infections',
    symptoms: ['High temperature (>100°F)', 'Body ache & chills', 'Headache', 'Fatigue & sore throat'],
    homeCare: ['Rest adequately', 'Drink plenty of warm fluids & ORS', 'Sponge with lukewarm water if fever is high', 'Paracetamol for temperature as per weight/doctor advice'],
    redFlags: ['Fever > 103°F lasting > 3 days', 'Severe breathlessness or chest tightness', 'Confusion, lethargy, or inability to keep fluids down'],
    doctor: 'General Physician / Internal Medicine'
  },
  {
    id: 'dengue-malaria',
    name: 'Dengue & Vector-borne Fevers',
    nameHi: 'डेंगू और मलेरिया',
    category: 'Vector-borne',
    symptoms: ['Sudden high fever', 'Severe pain behind eyes (retro-orbital)', 'Intense joint & muscle pain (breakbone fever)', 'Skin rashes / petechiae'],
    homeCare: ['Strict bed rest', 'Coconut water, fresh juices, and ORS to maintain platelets and hydration', 'Avoid NSAIDs like Ibuprofen/Aspirin (can worsen bleeding)'],
    redFlags: ['Bleeding gums, nosebleeds, or blood in stool/vomit', 'Severe continuous abdominal pain', 'Sudden drop in platelet count below 50,000'],
    doctor: 'General Physician / Infectious Diseases Specialist'
  },
  {
    id: 'stomach-gastro',
    name: 'Gastroenteritis & Food Poisoning',
    nameHi: 'पेट में संक्रमण और दस्त',
    category: 'Digestive',
    symptoms: ['Loose watery stools', 'Abdominal cramping', 'Nausea and vomiting', 'Mild fever and dehydration'],
    homeCare: ['Immediate ORS (Oral Rehydration Solution) after every loose motion', 'BRAT diet: Banana, Rice (curd rice/khichdi), Applesauce, Toast', 'Avoid dairy (except curd/buttermilk), spicy foods, and oily dishes'],
    redFlags: ['Signs of severe dehydration (dry mouth, sunken eyes, no urine for >8 hours)', 'High fever with blood or mucus in stool', 'Persistent vomiting for more than 24 hours'],
    doctor: 'Gastroenterologist / General Physician'
  },
  {
    id: 'skin-rash-eczema',
    name: 'Skin Rashes, Eczema & Fungal Infections',
    nameHi: 'त्वचा के चकत्ते, दाद और एलर्जी',
    category: 'Dermatology',
    symptoms: ['Red itchy bumps or patches', 'Dry, flaky skin or blisters', 'Ring-shaped red patches with raised borders (Ringworm/Tinea)', 'Burning sensation'],
    homeCare: ['Keep the area clean and completely dry', 'Wear loose, breathable cotton clothes', 'Avoid scratching to prevent secondary bacterial infection', 'Cool compress for itch relief'],
    redFlags: ['Rapidly spreading rash accompanied by facial swelling or difficulty breathing (Anaphylaxis - call 112/108 immediately)', 'Pus formation, yellow crusting, or hot tender skin', 'Rash with sudden high fever and joint pain'],
    doctor: 'Dermatologist'
  },
  {
    id: 'migraine-headache',
    name: 'Migraine & Tension Headache',
    nameHi: 'माइग्रेन और सिरदर्द',
    category: 'Neurology',
    symptoms: ['Throbbing pain usually on one side of head', 'Sensitivity to light (photophobia) and sound', 'Nausea or visual aura', 'Tight band-like sensation around forehead'],
    homeCare: ['Rest in a dark, quiet, cool room', 'Apply cold compress or ice pack to forehead/neck', 'Stay well hydrated and maintain regular meal schedules', 'Gentle neck and shoulder stretching'],
    redFlags: ['"Thunderclap" headache: sudden severe explosive headache (maximum intensity within seconds)', 'Headache accompanied by numbness, slurred speech, or vision loss', 'Headache after head trauma / injury or with stiff neck and high fever'],
    doctor: 'Neurologist / General Physician'
  },
  {
    id: 'hypertension',
    name: 'Hypertension (High Blood Pressure)',
    nameHi: 'उच्च रक्तचाप (हाई बीपी)',
    category: 'Cardiovascular',
    symptoms: ['Often "silent" without early symptoms', 'Morning headache', 'Dizziness or lightheadedness', 'Shortness of breath on exertion'],
    homeCare: ['Reduce sodium (salt) intake (< 5g per day)', 'Eat DASH diet rich in potassium, leafy greens, fruits, and whole grains', '30 minutes daily brisk walking', 'Practice deep breathing, meditation, and stress management', 'Never stop prescribed BP medication abruptly'],
    redFlags: ['BP reading > 180/120 mmHg (Hypertensive crisis)', 'Severe chest pain, breathlessness, or radiating arm pain', 'Sudden numbness, weakness on one side of face/body, or slurred speech (Stroke warning)'],
    doctor: 'Cardiologist / General Physician'
  },
  {
    id: 'diabetes',
    name: 'Type 2 Diabetes & Blood Sugar Control',
    nameHi: 'डायबिटीज (मधुमेह)',
    category: 'Metabolic & Endocrine',
    symptoms: ['Frequent urination (especially at night)', 'Excessive thirst and hunger', 'Unexplained weight loss or chronic fatigue', 'Slow healing cuts or frequent infections'],
    homeCare: ['Low glycemic index diet (avoid refined sugar, maida, sugary drinks)', 'Include fenugreek seeds, cinnamon, bitter gourd (karela), high fiber vegetables', 'Regular post-meal 15-minute walks', 'Daily foot inspection for minor blisters or sores'],
    redFlags: ['Extreme high blood sugar (>300 mg/dL) with fruity breath, vomiting, confusion (Ketoacidosis / HHS)', 'Severe hypoglycemia (shakiness, cold sweat, dizziness, confusion < 70 mg/dL - immediately consume sugar/glucose)'],
    doctor: 'Endocrinologist / Diabetologist'
  },
  {
    id: 'asthma-cough',
    name: 'Asthma, Bronchitis & Respiratory Allergy',
    nameHi: 'अस्थमा, दमा और एलर्जी वाली खांसी',
    category: 'Respiratory',
    symptoms: ['Wheezing whistling sound when breathing', 'Dry or productive chest cough', 'Shortness of breath triggered by dust, pollen, cold air, or exertion', 'Tight feeling in chest'],
    homeCare: ['Use prescribed rescue inhaler (Salbutamol) as directed by doctor', 'Warm saline steam inhalation (1-2 times daily)', 'Warm ginger-honey water or turmeric milk for soothing throat', 'Stay away from smoke, dust mites, and strong incense/perfumes'],
    redFlags: ['Severe breathlessness unable to speak full sentences without pausing', 'Lips or fingernails turning blue/grey (Cyanosis - hypoxia)', 'No improvement after rescue inhaler puffs (Call ambulance immediately)'],
    doctor: 'Pulmonologist / Chest Physician'
  },
  {
    id: 'gerd-acidity',
    name: 'Acid Reflux (GERD) & Acidity',
    nameHi: 'एसिडिटी और गैस (GERD)',
    category: 'Digestive',
    symptoms: ['Burning chest pain behind breastbone (Heartburn)', 'Sour taste or regurgitation of acid in mouth', 'Bloating and excessive burping', 'Difficulty swallowing or feeling lump in throat'],
    homeCare: ['Eat small, frequent meals rather than heavy dinners', 'Avoid lying down immediately after meals (wait at least 2-3 hours)', 'Elevate head of bed by 6 inches', 'Limit caffeine, chocolate, oily/deep-fried items, and carbonated beverages'],
    redFlags: ['Heartburn accompanied by chest tightness radiating to jaw, neck, left arm, or cold sweats (Must rule out Heart Attack)', 'Vomiting blood or dark black tarry stools', 'Difficulty or pain while swallowing solid foods'],
    doctor: 'Gastroenterologist'
  },
  {
    id: 'uti',
    name: 'Urinary Tract Infection (UTI)',
    nameHi: 'यूरिन इन्फेक्शन (यूटीआई)',
    category: 'Urology & Nephrology',
    symptoms: ['Strong persistent urge to urinate', 'Burning pain or stinging during urination (Dysuria)', 'Cloudy, dark, or strong-smelling urine', 'Lower pelvic or lower back discomfort'],
    homeCare: ['Drink 2.5 - 3 liters of water daily to flush bacteria', 'Do not hold urine; empty bladder completely', 'Maintain strict intimate hygiene; wipe front to back', 'Consult doctor for clean urine culture before taking random antibiotics'],
    redFlags: ['High fever with shaking chills and severe flank/back pain (indicates kidney infection / Pyelonephritis)', 'Visible blood in urine (Hematuria)', 'Severe nausea, vomiting, and inability to urinate'],
    doctor: 'Urologist / Gynecologist / Physician'
  },
];

async function startServer() {
  const app = express();

  // Middleware with high limit for image, audio, and video payloads
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Diseases encyclopedia
  app.get('/api/diseases', (req, res) => {
    res.json({ diseases: DISEASE_LIBRARY });
  });

  // Transcribe audio using gemini-3.5-transcribe
  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioData, mimeType = 'audio/webm', languageHint } = req.body;
      if (!audioData) {
        return res.status(400).json({ error: 'Missing audioData' });
      }

      const promptText = `Transcribe the spoken audio with high accuracy. 
The user may be speaking in English, Hindi, Hinglish, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu, or Odia.
${languageHint ? `User preferred language hint: ${languageHint}.` : ''}
Return ONLY the transcribed text without extra preamble, formatting tags, or quotes.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: audioData,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      });

      const transcript = response.text ? response.text.trim() : '';
      res.json({ transcript });
    } catch (error: any) {
      console.error('Transcription error:', error);
      res.status(500).json({
        error: error.message || 'Failed to transcribe audio',
      });
    }
  });

  // Text to Speech using gemini-3.8-flash-lite-tts
  app.post('/api/tts', async (req, res) => {
    try {
      const { text, voice = 'Kore' } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Missing text for TTS' });
      }

      // Keep text concise for voice reading (first 400 chars if too long)
      const sanitizedText = text.slice(0, 800);

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: sanitizedText,
                speechMetadata: {
                  style: 'Warm, compassionate, caring medical assistant speaking clearly and gently',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: 'No audio returned from TTS model' });
      }

      res.json({
        audioBase64: base64Audio,
        mimeType: 'audio/wav',
      });
    } catch (error: any) {
      console.error('TTS error:', error);
      res.status(500).json({
        error: error.message || 'Failed to generate speech audio',
      });
    }
  });

  // Main multimodal chat and symptom advisor
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        message = '',
        language = 'en',
        media = [], // Array of { mimeType: string, data: string, name?: string }
        history = [], // Previous messages [{ role: 'user' | 'model', text: string }]
        voiceRequested = false,
      } = req.body;

      const targetLanguageName = LANGUAGE_NAMES[language] || 'English';

      const systemInstruction = `You are "AarogyaAI" (आरोग्य AI), an empathetic, culturally sensitive, highly accessible multimodal health and disease advisor.
Your mission is to provide clear, actionable, accurate medical guidance for general diseases and symptoms to all users regardless of their literacy level or background.

IMPORTANT MEDICAL & SAFETY DIRECTIVES:
1. Medical Disclaimer: Always reinforce that you are an AI health advisor providing educational triage and first-aid recommendations, NOT a final clinical diagnosis. For serious issues, prescription drugs, or surgical emergencies, a physical examination by a registered physician is crucial.
2. Multimodal Analysis:
   - If a PHOTO is attached (e.g. skin rash, eye condition, swelling, tongue, throat, medication strip, or test report): carefully examine the visual characteristics (color, borders, texture, lesions, distribution, text on medicine).
   - If a VIDEO is attached (e.g. movement, tremor, cough/breathing difficulty, rash spread): inspect dynamics, frequency, respiratory rate, and physical behavior.
   - If an AUDIO is attached: analyze vocal strain, cough sound (dry vs productive vs wheezing), breathlessness, or user's spoken words.
3. Language & Tone:
   - Provide the ENTIRE response primarily in: ${targetLanguageName}.
   ${
     language === 'hinglish'
       ? '- For Hinglish: use friendly, conversational Hindi written in Latin/English alphabet with simple terms (e.g. "Aapko thoda bukhar aur sharir dard lag raha hai. Pehle ORS aur paani peena shuru karein..."). Very natural for young & general Indian audience.'
       : language === 'hi'
       ? '- For Hindi: use respectful, easy-to-understand Hindi (शुद्ध और सरल हिंदी, कठिन अंग्रेजी शब्दों के हिंदी अर्थ साथ में).'
       : `- For ${targetLanguageName}: use fluent, natural, grammatically correct phrasing in ${targetLanguageName}.`
   }
   - Tone: Warm, empathetic, comforting, non-judgmental, easy to understand.
4. Structured Response Format:
   Your markdown reply MUST include these clear sections with emojis:
   - 🩺 **Immediate Assessment & Probable Conditions** (What might be happening, common general illnesses matching the query)
   - 🔍 **Visual / Media Observations** (Only if photo/video/audio was provided: describe key findings seen or heard)
   - 🌿 **Safe Home Care & First-Aid Measures** (Proven safe relief, hydration, diet, rest, positioning)
   - 🚨 **Emergency Red Flags (When to go to Hospital / Doctor IMMEDIATELY)** (Clear warning indicators: e.g. severe breathlessness, fever > 103°F, chest pain, confusion)
   - 👨‍⚕️ **Recommended Specialist / Next Steps** (Which doctor to visit, e.g. General Physician, Dermatologist, ENT, Pediatrician, etc.)
   - ⚠️ **Medicine Precautions** (Do NOT prescribe prescription-only antibiotics or steroids. Clarify safe basic OTC practices e.g. Paracetamol / ORS, and warn against self-medication)

5. Accessibility Spoken Summary:
   At the very end of your response, output a special delimiter followed by a clean, 2-3 sentence conversational spoken summary that can be read aloud by Text-To-Speech for visually impaired or audio-first users:
   <<<SPOKEN_SUMMARY>>>
   [Spoken summary here in ${targetLanguageName}, without any markdown asterisks, bullet points, or complex symbols, spoken warmly as a caring doctor/nurse].
   <<<END_SPOKEN_SUMMARY>>>
   <<<SEVERITY>>>low|moderate|urgent|emergency<<<END_SEVERITY>>>
   <<<SPECIALIST>>>Recommended Doctor Type<<<END_SPECIALIST>>>`;

      // Build contents parts
      const parts: any[] = [];

      // Add media parts (images, video, audio)
      if (Array.isArray(media) && media.length > 0) {
        for (const item of media) {
          if (item && item.mimeType && item.data) {
            parts.push({
              inlineData: {
                mimeType: item.mimeType,
                data: item.data,
              },
            });
          }
        }
      }

      // Build context from history
      let contextPrompt = '';
      if (Array.isArray(history) && history.length > 0) {
        const recentHistory = history.slice(-4);
        contextPrompt += 'Recent conversation context:\n';
        for (const msg of recentHistory) {
          contextPrompt += `${msg.role === 'user' ? 'User' : 'AarogyaAI'}: ${msg.text}\n`;
        }
        contextPrompt += '\nCurrent User Query:\n';
      }

      const userText = message || (media.length > 0 ? 'Please analyze this health photo/audio/video and give me medical advice.' : 'Hello, can you help with general health advice?');
      parts.push({
        text: `${contextPrompt}${userText}\n\nPlease respond in ${targetLanguageName} as instructed.`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          systemInstruction,
        },
      });

      const rawText = response.text || '';

      // Parse delimiters
      let spokenSummary = '';
      let replyText = rawText;
      let severity: 'low' | 'moderate' | 'urgent' | 'emergency' = 'moderate';
      let specialist = 'General Physician';

      const spokenMatch = rawText.match(/<<<SPOKEN_SUMMARY>>>([\s\S]*?)<<<END_SPOKEN_SUMMARY>>>/);
      if (spokenMatch) {
        spokenSummary = spokenMatch[1].trim();
        replyText = replyText.replace(/<<<SPOKEN_SUMMARY>>>[\s\S]*?<<<END_SPOKEN_SUMMARY>>>/, '').trim();
      }

      const severityMatch = rawText.match(/<<<SEVERITY>>>(low|moderate|urgent|emergency)<<<END_SEVERITY>>>/i);
      if (severityMatch) {
        severity = severityMatch[1].toLowerCase() as any;
        replyText = replyText.replace(/<<<SEVERITY>>>[\s\S]*?<<<END_SEVERITY>>>/, '').trim();
      }

      const specialistMatch = rawText.match(/<<<SPECIALIST>>>([\s\S]*?)<<<END_SPECIALIST>>>/);
      if (specialistMatch) {
        specialist = specialistMatch[1].trim();
        replyText = replyText.replace(/<<<SPECIALIST>>>[\s\S]*?<<<END_SPECIALIST>>>/, '').trim();
      }

      if (!spokenSummary) {
        // Fallback: take first paragraph or clean summary
        spokenSummary = replyText
          .replace(/[*#_`]/g, '')
          .split('\n')
          .filter((line) => line.trim().length > 10)[0] || 'Here is your health advisory summary.';
      }

      // If voice was requested, generate TTS audio as well
      let audioBase64: string | null = null;
      if (voiceRequested && spokenSummary) {
        try {
          const ttsRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash-lite-tts',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: spokenSummary.slice(0, 600),
                    speechMetadata: {
                      style: 'Warm, caring doctor speaking gently',
                    },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
              },
            },
          });
          audioBase64 = ttsRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
        } catch (ttsErr) {
          console.warn('TTS auto-generation warning:', ttsErr);
        }
      }

      res.json({
        reply: replyText,
        spokenSummary,
        severity,
        specialist,
        audioBase64,
        language,
      });
    } catch (error: any) {
      console.error('Chat advice error:', error);
      res.status(500).json({
        error: error.message || 'Failed to process medical query',
      });
    }
  });

  // Serve static files or Vite dev server
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AarogyaAI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

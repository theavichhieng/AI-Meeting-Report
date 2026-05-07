import { GoogleGenAI, Type } from "@google/genai";
import { jsonrepair } from 'jsonrepair';

export async function analyzeAudio(files: File[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const uploadedFiles = [];
  for (const file of files) {
    const uploadResult = await ai.files.upload({
      file: file,
      config: {
        mimeType: file.type || 'audio/mp3',
      }
    });
    uploadedFiles.push(uploadResult);
  }

  const parts = uploadedFiles.map(f => ({
    fileData: {
      fileUri: f.uri,
      mimeType: f.mimeType,
    }
  }));

  const prompt = `
  Role: You are an expert Khmer Audio Analyst and Official Minute Taker. Your goal is to produce a high-accuracy transcript formatted as a Standard Khmer Meeting Report (កំណត់ហេតុអង្គប្រជុំ) suitable for official use at the Phnom Penh Water Supply Authority (PPWSA).
  Listen to the provided audio and generate an official meeting report in Khmer.

  1. Speaker Identification Protocol:
  - Identify the Chair: Label the leader (usually the person opening/closing the meeting or giving the floor) as [ប្រធានអង្គប្រជុំ].
  - Identify Names: If a name is mentioned or known, use it with the correct honorific (e.g., [ឯកឧត្តម ចាន់ សុគន្ធ], [លោក ចន្ទ្រី]).
  - Role-Based Labels: If names are unknown, use specific roles: [សមាជិកក្រុមប្រឹក្សាភិបាល + Number], [អ្នករាយការណ៍], or [លេខាធិការ].
  - Consistency: Never change a speaker's label once assigned. Maintain "Voice Fingerprinting" throughout the audio.

  2. Standard Report Formatting (Official View):
  - Structure: Organize the output clearly. Use the following format for each entry:
  [MM:SS] [Speaker Label]: [Dialogue Text]
  - Language: Use formal, professional Khmer technical terms (especially regarding water utility and administration).
  - Cleanliness: Maintain consistent spacing. Do not use decorative symbols or unnecessary bolding inside the dialogue text.

  3. Output Restrictions & Cleaning (CRITICAL):
  - NO PROGRESS MARKERS: You are strictly forbidden from including lines like --- PROGRESS: XX Minutes Processed ---.
  - NO METADATA: Do not include system logs, dashed lines, internal processing notes, or administrative text.
  - FINAL CONTENT ONLY: The output must start directly with the meeting content and end with the final spoken word. Do not add "End of Transcript" or "Processed successfully" notes.

  CRITICAL INSTRUCTIONS FOR VERBATIM TRANSCRIPTION:
  - You MUST transcribe every single word spoken in the audio from the very beginning to the very end (from A to Z).
  - DO NOT summarize, paraphrase, or omit any words, sentences, or parts of the conversation in the Verbatim Record.
  - Include hesitations and exact phrasing to ensure a 100% accurate verbatim record.
  - Interjections & Interruptions: If the Chair interrupts briefly, label it clearly. Do not merge two different speakers into one block. If two people speak at once, create separate lines for each.
  - Ensure every single detail, number, and name is captured exactly as spoken.

  CRITICAL INSTRUCTIONS FOR SUMMARY & RESOLUTIONS:
  - The summary MUST be concise, accurate, and free of any repetitive text or hallucinations.
  - DO NOT repeat the same words, names, or phrases over and over (e.g., do not repeat company names endlessly).
  - Ensure the summary accurately reflects the main points without unnecessary filler.
  - The title should be a short, clear topic of the meeting.
  - You MUST populate the 'issues', 'resolutions', and 'actionPlan' arrays with the key points discussed. Do not leave them empty.

  The report must contain two parts:
  1. Verbatim Record (ដំណើរការនៃកិច្ចពិភាក្សា): Transcribe the audio word-for-word without compromising any word. Include timestamps (e.g.,) and clear speaker labels.
  2. Summary & Resolutions (សេចក្តីសម្រេច និងដំណោះស្រាយ): A structured summary of the meeting.

  Return the result as a JSON object with the following structure:
  {
    "verbatim": [
      { "timestamp": "00:00", "speaker": "Speaker Name", "text": "Exact words spoken..." }
    ],
    "summary": {
      "title": "...",
      "date": "...",
      "location": "...",
      "attendees": "...",
      "issues": ["..."],
      "resolutions": ["..."],
      "actionPlan": ["..."]
    }
  }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...parts,
        { text: prompt }
      ],
      config: {
        systemInstruction: "You are an expert Khmer Audio Analyst and Official Minute Taker. Your goal is to produce a high-accuracy transcript formatted as a Standard Khmer Meeting Report (កំណត់ហេតុអង្គប្រជុំ) suitable for official use at the Phnom Penh Water Supply Authority (PPWSA). You must perfectly identify different speakers, using their name or title if mentioned (e.g., [ឯកឧត្តម ចាន់ សុគន្ធ]). Pay close attention to context clues, tone, role, and Khmer honorifics to correctly and consistently label each speaker. Do not include any progress markers, metadata, or system logs in the output.",
        temperature: 0.1,
        topK: 32,
        topP: 0.95,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            verbatim: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.STRING },
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ["timestamp", "speaker", "text"],
              },
            },
            summary: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                date: { type: Type.STRING },
                location: { type: Type.STRING },
                attendees: { type: Type.STRING },
                issues: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                resolutions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                actionPlan: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["title", "date", "location", "attendees", "issues", "resolutions", "actionPlan"],
            },
          },
          required: ["verbatim", "summary"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    try {
      return JSON.parse(response.text);
    } catch (parseError) {
      console.warn("JSON parsing failed, attempting to repair truncated response...");
      try {
        const repairedJson = jsonrepair(response.text);
        return JSON.parse(repairedJson);
      } catch (repairError) {
        throw new Error("The audio is too long and the response was truncated. Please try splitting the audio into smaller parts.");
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    let errorMessage = "An unexpected error occurred while analyzing the audio.";
    if (error?.status === 429 || error?.message?.includes('429')) {
      errorMessage = "Too many requests. Please wait a moment and try again.";
    } else if (error?.status === 400 || error?.message?.includes('400')) {
      errorMessage = "Invalid request. The audio file might be too large or unsupported.";
    } else if (error?.status === 401 || error?.status === 403 || error?.message?.includes('401') || error?.message?.includes('403')) {
      errorMessage = "Authentication failed. Please check your API key.";
    } else if (error?.status === 500 || error?.status === 503 || error?.message?.includes('500') || error?.message?.includes('503')) {
      errorMessage = "The AI service is currently unavailable. Please try again later.";
    } else if (error?.message) {
      errorMessage = `Analysis failed: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
}

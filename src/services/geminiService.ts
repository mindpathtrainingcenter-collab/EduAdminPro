import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const generateEducationDocument = async (params: {
  type: string;
  level: string;
  subject: string;
  grade: string;
  topic: string;
  additionalInfo?: string;
}) => {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Anda adalah Administrator Kurikulum Pendidikan Indonesia yang Profesional.
    Buatlah dokumen ${params.type} untuk kurikulum Merdeka/K13 dengan detail berikut:
    - Jenjang: ${params.level}
    - Mata Pelajaran: ${params.subject}
    - Kelas: ${params.grade}
    - Topik/Materi: ${params.topic}
    ${params.additionalInfo ? `- Informasi Tambahan/Instruksi Khusus: ${params.additionalInfo}` : ''}

    Gunakan bahasa Indonesia yang formal, terstruktur, dan sesuai dengan regulasi pendidikan terbaru di Indonesia.
    Format output harus dalam Markdown yang rapi.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating document:", error);
    throw error;
  }
};

export const generateQuestions = async (params: {
  subject: string;
  grade: string;
  topic: string;
  count: number;
}) => {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `
    Generate ${params.count} soal ujian untuk:
    - Mata Pelajaran: ${params.subject}
    - Kelas: ${params.grade}
    - Topik: ${params.topic}

    Sertakan:
    - Kunci Jawaban
    - Penjelasan
    - Level Kognitif (C1-C6)
    
    Gunakan format Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
};

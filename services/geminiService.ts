import { GoogleGenAI, Type } from "@google/genai";
import { LegalVerdict, FileData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `Sen son derece profesyonel, tarafsýz ve uzman bir 'Dijital Hakim'sin. 
Görevin, kullanýcý tarafýndan sunulan metni ve BELGELERÝ (Resim/PDF) satýr satýr inceleyerek içerisindeki TÜM farklý hukuki uyuþmazlýklarý, sorularý, talepleri veya maddeleri tek tek tespit etmektir.

Analiz kurallarý:
1. Belgede birden fazla soru veya konu varsa, her birini AYRI birer analiz nesnesi olarak oluþtur.
2. Hiçbir soruyu atlama. Eðer belgede 10 farklý madde/soru varsa, yanýtýn 10 nesnelik bir liste olmalý.
3. Her nesne þu yapýda olmalý:
   - vakaOzeti: O maddeye özel kýsa özet.
   - hukukiNiteleme: Maddenin hukuki alaný.
   - ilgiliMaddeler: Kanun dayanaklarý.
   - gerekce: Hukuki sebep.
   - basitAciklama: Vatandaþýn anlayacaðý sade özet.
   - hukum: O spesifik soruya dair nihai karar/öneri.

Önemli: Cevaplarýn HER ZAMAN geçerli bir JSON ARRAY (liste) formatýnda olmalýdýr.`;

export const analyzeDispute = async (dispute: string, files: FileData[]): Promise<LegalVerdict[]> => {
  const promptText = `Lütfen ekteki belgeleri ve metni incele. Belgedeki TÜM maddeleri, sorularý ve hukuki problemleri tek tek tespit et ve her biri için ayrý detaylý analiz yap: ${dispute || ''}`;
  
  const parts: any[] = [{ text: promptText }];

  files.forEach(file => {
    parts.push({
      inlineData: {
        data: file.data.split(',')[1],
        mimeType: file.mimeType
      }
    });
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              vakaOzeti: { type: Type.STRING },
              hukukiNiteleme: { type: Type.STRING },
              ilgiliMaddeler: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    kanun: { type: Type.STRING },
                    madde: { type: Type.STRING },
                    icerik: { type: Type.STRING }
                  },
                  required: ["kanun", "madde", "icerik"]
                }
              },
              gerekce: { type: Type.STRING },
              basitAciklama: { type: Type.STRING },
              hukum: { type: Type.STRING }
            },
            required: ["vakaOzeti", "hukukiNiteleme", "ilgiliMaddeler", "gerekce", "basitAciklama", "hukum"]
          }
        }
      }
    });

    let text = response.text;
    if (!text) throw new Error("Modelden yanýt alýnamadý.");
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    // Tek nesne dönerse listeye çevir, liste dönerse aynen ver
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    console.error("Gemini Multi-Analysis Error:", err);
    throw err;
  }
};

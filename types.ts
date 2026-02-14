export interface LegalVerdict {
  vakaOzeti: string;
  hukukiNiteleme: string;
  ilgiliMaddeler: { kanun: string; madde: string; icerik: string }[];
  gerekce: string;
  basitAciklama: string; // Kullanýcýnýn anlayacaðý sade dil
  hukum: string;
}

export interface FileData {
  data: string; // base64
  mimeType: string;
}

export type AppStatus = 'IDLE' | 'ANALYZING' | 'RESULT' | 'ERROR';

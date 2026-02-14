
import React, { useState, useRef } from 'react';
import { analyzeDispute } from './services/geminiService';
import { LegalVerdict, AppStatus, FileData } from './types';

const App: React.FC = () => {
  const [dispute, setDispute] = useState('');
  const [status, setStatus] = useState<AppStatus>('IDLE');
  const [result, setResult] = useState<LegalVerdict[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    (Array.from(files) as File[]).forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      if (!isImage && !isPdf) {
        alert("Lütfen sadece resim veya PDF formatýnda belgeler yükleyin.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFiles(prev => [...prev, {
          data: reader.result as string,
          mimeType: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConsult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispute.trim() && uploadedFiles.length === 0) {
      setError("Lütfen bir uyuþmazlýk özeti yazýn veya en az bir belge yükleyin.");
      return;
    }

    setStatus('ANALYZING');
    setError(null);

    try {
      const data = await analyzeDispute(dispute, uploadedFiles);
      setResult(data);
      setStatus('RESULT');
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError("Analiz sýrasýnda bir hata oluþtu. Belgelerin karmaþýklýðýna göre iþlem süresi deðiþebilir. Lütfen tekrar deneyin.");
      setStatus('ERROR');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f5f9]">
      {/* Header - Safe Area Padding eklendi */}
      <header className="legal-gradient text-white pt-12 pb-6 px-4 shadow-lg border-b-4 border-amber-600">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <i className="fas fa-balance-scale text-3xl text-amber-500"></i>
            <div>
              <h1 className="serif-font text-2xl font-bold tracking-wide uppercase">Dijital Hakim</h1>
              <p className="text-slate-400 text-[10px] font-medium italic uppercase tracking-widest">Adli Karar Destek Sistemi</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-4xl w-full mx-auto p-4 md:p-8 pb-24">
        {status !== 'RESULT' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden transition-all">
            <div className="p-6 md:p-10 space-y-8">
              {/* Metin Giriþi */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <i className="fas fa-pen-nib text-amber-700 text-sm"></i>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Olayýn Özeti</h2>
                </div>
                <textarea
                  value={dispute}
                  onChange={(e) => setDispute(e.target.value)}
                  placeholder="Karmaþýk belgelerinizi yükleyin, tüm maddeleri tek tek analiz edelim..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-slate-800 transition-all shadow-inner text-sm"
                ></textarea>
              </section>

              {/* Belge Yükleme */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <i className="fas fa-file-upload text-amber-700 text-sm"></i>
                  </div>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Belge & Delil Havuzu</h2>
                </div>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:border-amber-500 hover:bg-amber-50 cursor-pointer transition-all group relative overflow-hidden"
                >
                  <input 
                    type="file" 
                    hidden 
                    ref={fileInputRef} 
                    multiple 
                    accept="image/*,application/pdf" 
                    onChange={handleFileUpload}
                  />
                  <div className="relative z-10">
                    <i className="fas fa-cloud-upload-alt text-4xl text-slate-300 group-hover:text-amber-500 mb-3 transition-colors"></i>
                    <p className="text-slate-600 font-bold text-sm">Belgeleri Ekleyin</p>
                    <p className="text-slate-400 text-[10px] mt-1">PDF veya Fotoðraf</p>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    {uploadedFiles.map((file, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl border border-slate-200 overflow-hidden group shadow-sm bg-slate-50">
                        {file.mimeType === 'application/pdf' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-600 p-2 text-center">
                             <i className="fas fa-file-pdf text-2xl mb-1"></i>
                             <span className="text-[8px] font-bold uppercase">PDF</span>
                          </div>
                        ) : (
                          <img src={file.data} className="w-full h-full object-cover" />
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                          className="absolute top-1 right-1 bg-white/90 text-red-600 w-6 h-6 rounded-full shadow-lg flex items-center justify-center transition-opacity"
                        >
                          <i className="fas fa-times text-[10px]"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-center gap-3 animate-pulse">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <p className="text-red-700 text-xs font-bold">{error}</p>
                </div>
              )}

              <button
                onClick={handleConsult}
                disabled={status === 'ANALYZING'}
                className="btn-active w-full bg-slate-900 text-white py-5 rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4 group"
              >
                {status === 'ANALYZING' ? (
                  <>
                    <i className="fas fa-gavel fa-spin text-amber-500"></i>
                    <span className="animate-pulse">Analiz Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-balance-scale group-hover:rotate-12 transition-transform"></i>
                    Analizi Baþlat
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {status === 'ANALYZING' && (
          <div className="mt-12 text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 border-4 border-amber-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-amber-600 rounded-full border-t-transparent animate-spin"></div>
              <i className="fas fa-landmark absolute inset-0 flex items-center justify-center text-xl text-slate-300"></i>
            </div>
            <div className="space-y-2">
              <h3 className="serif-font text-lg font-bold text-slate-700">Adalet Terazisi Çalýþýyor</h3>
              <p className="text-slate-400 text-xs italic">Veriler kanun maddeleriyle eþleþtiriliyor...</p>
            </div>
          </div>
        )}

        {status === 'RESULT' && result && (
          <div className="space-y-6 animate-in slide-in-from-bottom-10 duration-700">
            {/* Rapor Baþlýðý */}
            <div className="bg-white rounded-3xl shadow-xl border-t-8 border-amber-700 p-8 text-center">
                <i className="fas fa-check-circle text-amber-600 text-4xl mb-4"></i>
                <h2 className="serif-font text-2xl font-bold text-slate-900 uppercase tracking-tight">ANALÝZ TAMAMLANDI</h2>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-2 font-bold">{result.length} Madde Ýncelendi</p>
            </div>

            {/* Maddelerin Listelenmesi */}
            {result.map((item, index) => (
              <div key={index} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 transition-all">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="bg-slate-900 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Madde {index + 1}
                  </span>
                  <span className="text-[10px] text-amber-700 font-black uppercase tracking-tighter">{item.hukukiNiteleme}</span>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="bg-amber-50/50 border-l-4 border-amber-500 p-5 rounded-r-2xl">
                    <p className="text-slate-800 text-sm serif-font leading-relaxed italic">
                      "{item.basitAciklama}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-2 uppercase text-[9px] tracking-widest flex items-center gap-2">
                        <i className="fas fa-book text-amber-600"></i> Yasal Dayanak
                      </h4>
                      <div className="space-y-2">
                        {item.ilgiliMaddeler.map((m, idx) => (
                          <div key={idx} className="text-[10px] text-slate-600 leading-tight">
                            <span className="font-bold text-slate-900">{m.kanun} Md.{m.madde}:</span> {m.icerik}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 border-2 border-slate-900 rounded-2xl bg-white text-center shadow-lg">
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nihai Karar / Öneri</h4>
                      <p className="serif-font text-base font-black text-slate-900 uppercase">
                        {item.hukum}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Aksiyon Butonlarý */}
            <div className="grid grid-cols-2 gap-3 pt-4 no-print">
              <button 
                onClick={() => { setStatus('IDLE'); setUploadedFiles([]); setResult(null); }}
                className="btn-active bg-white border-2 border-slate-200 text-slate-700 py-4 rounded-2xl font-bold text-xs hover:bg-slate-50 transition-all"
              >
                Yeni Analiz
              </button>
              <button 
                onClick={() => window.print()}
                className="btn-active bg-slate-900 text-white py-4 rounded-2xl font-bold text-xs shadow-xl transition-all"
              >
                Raporu Kaydet
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 bg-slate-900 text-slate-500 text-[9px] text-center px-6">
        <p className="max-w-xs mx-auto leading-relaxed uppercase tracking-tighter opacity-50">
          Bu uygulama yapay zeka tarafýndan Türk mevzuatýna göre üretilen tavsiye niteliðinde analizler sunar.
        </p>
      </footer>

      <style>{`
        @media print { .no-print { display: none; } body { background: white; } }
        /* iPhone Çentik ve Alt Bar Desteði */
        header { padding-top: max(3rem, env(safe-area-inset-top)); }
        footer { padding-bottom: max(3rem, env(safe-area-inset-bottom)); }
      `}</style>
    </div>
  );
};

export default App;

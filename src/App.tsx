import React, { useState, useRef, useEffect } from 'react';
import { Mic, Play, Pause, X, Copy, Printer, Square } from 'lucide-react';
import { analyzeAudio } from './services/geminiService';

const Header = () => (
  <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[#6B53A4] rounded-lg flex items-center justify-center text-white font-bold">
        KA
      </div>
      <div>
        <h1 className="font-bold text-lg leading-tight text-gray-900">Khmer Audio Pro</h1>
        <p className="text-[10px] text-gray-500 tracking-widest uppercase">Fidelity Report Engine</p>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="px-4 py-1.5 bg-purple-50 text-[#6B53A4] text-xs font-bold tracking-wider rounded-full uppercase">
        Secure V2.5 • Unified Protocol
      </div>
      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Documentation</a>
      <a 
        href="https://t.me/TheaviChhieng" 
        target="_blank" 
        rel="noopener noreferrer" 
        title="ប្រសិនបើលោកអ្នកមានចម្ងល់អាចទំនាក់ទំនងមកកាន់ Telegram របស់ខ្ញុំបាន"
        className="text-sm text-gray-600 hover:text-gray-900 font-medium"
      >
        Support Center
      </a>
    </div>
  </header>
);

const UploadBox = ({ id, label, sublabel, file, onFileSelect, onClear }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordedFile = new File([audioBlob], "Recorded_Audio.webm", { type: 'audio/webm' });
        onFileSelect(recordedFile);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
  };

  if (file) {
    return (
      <div className="border-2 border-dashed border-green-500 rounded-3xl p-6 bg-green-50/30 relative flex flex-col items-center justify-center h-64">
        <div className="absolute top-4 left-6 text-xs font-bold text-green-600 tracking-wider">
          PART {id} SELECTED
        </div>
        <button onClick={onClear} className="absolute top-4 right-6 text-red-500 hover:text-red-700">
          <X size={20} />
        </button>
        <div className="font-medium text-gray-900 mb-4 truncate w-full px-4 text-center">{file.name}</div>
        <div className="w-full max-w-md bg-white rounded-full p-2 flex items-center gap-4 shadow-sm border border-gray-100">
          <button className="w-10 h-10 bg-[#6B53A4] rounded-full flex items-center justify-center text-white shrink-0">
            <Play size={20} className="ml-1" />
          </button>
          <div className="text-xs text-gray-500 font-mono">0:00</div>
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#6B53A4] w-1/3 rounded-full"></div>
          </div>
          <div className="text-xs text-gray-500 font-mono pr-4">--:--</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-3xl p-8 flex flex-col items-center justify-center h-64 hover:border-[#6B53A4] transition-colors bg-white">
      <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-[#6B53A4] mb-4">
        {isRecording ? <Mic size={24} className="animate-pulse text-red-500" /> : <Mic size={24} />}
      </div>
      <h3 className="font-bold text-gray-900 mb-1">{label}</h3>
      <p className="text-sm text-gray-500 mb-6">{sublabel}</p>
      
      <div className="flex gap-3">
        <input 
          type="file" 
          accept="audio/*" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFileSelect(e.target.files[0]);
            }
          }}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-2.5 bg-[#6B53A4] text-white rounded-lg text-sm font-medium hover:bg-[#5A458A] transition-colors"
        >
          ជ្រើសរើសឯកសារ
        </button>

        {isRecording ? (
          <button 
            onClick={stopRecording}
            className="px-6 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <Square size={16} fill="currentColor" /> បញ្ឈប់
          </button>
        ) : (
          <button 
            onClick={startRecording}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Mic size={16} /> ថតសម្លេង
          </button>
        )}
      </div>
    </div>
  );
};

const ResultView = ({ results, files, onBack }: any) => {
  const [activeTab, setActiveTab] = useState('verbatim');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const validFiles = files?.filter(Boolean) || [];
    if (validFiles.length > 0) {
      const url = URL.createObjectURL(validFiles[0]);
      const audio = new Audio(url);
      audioRef.current = audio;

      const setAudioData = () => setDuration(audio.duration);
      const setAudioTime = () => setCurrentTime(audio.currentTime);
      const setAudioEnd = () => { setIsPlaying(false); setCurrentTime(0); };

      audio.addEventListener('loadedmetadata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', setAudioEnd);

      return () => {
        audio.removeEventListener('loadedmetadata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', setAudioEnd);
        audio.pause();
        URL.revokeObjectURL(url);
        if (audioRef.current === audio) {
          audioRef.current = null;
        }
      };
    }
  }, [files]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
          }).catch(error => {
            console.error("Audio playback error:", error);
            setIsPlaying(false);
          });
        } else {
          setIsPlaying(true);
        }
      }
    }
  };

  const changeSpeed = () => {
    const rates = [1, 1.25, 1.5, 2, 0.5];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const percentage = Math.max(0, Math.min(1, x / bounds.width));
    const newTime = percentage * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleCopy = () => {
    const header = "ព្រះរាជាណាចក្រកម្ពុជា\nជាតិ សាសនា ព្រះមហាក្សត្រ\n\n";
    let content = "";

    if (activeTab === 'verbatim') {
      content = results.verbatim?.map((i: any) => `[${i.timestamp}] [${i.speaker}]: ${i.text}`).join('\n\n') || '';
    } else {
      content = `កំណត់ហេតុអង្គប្រជុំពេញលេញ និងលម្អិតបំផុត\n` + 
                `កាលបរិច្ឆេទ៖ ${results.summary?.date || "N/A"}\n` +
                `ប្រធានបទ៖ ${results.summary?.title || "សេចក្តីសង្ខេប (Summary)"}\n\n` +
                `ទីកន្លែង៖ ${results.summary?.location || "N/A"}\n` +
                `អ្នកចូលរួម៖ ${results.summary?.attendees || "N/A"}\n\n` +
                `១. បញ្ហាដែលបានលើកឡើង\n` +
                (results.summary?.issues?.map((i: string) => `- ${i}`).join('\n') || 'មិនមានទិន្នន័យ (No data)') + `\n\n` +
                `២. សេចក្តីសម្រេច និងដំណោះស្រាយ (Resolutions)\n` +
                (results.summary?.resolutions?.map((i: string) => `- ${i}`).join('\n') || 'មិនមានទិន្នន័យ (No data)') + `\n\n` +
                `៣. ទិសដៅអនុវត្តបន្ត (Action Plan)\n` +
                (results.summary?.actionPlan?.map((i: string) => `- ${i}`).join('\n') || 'មិនមានទិន្នន័យ (No data)');
    }

    const fullText = header + content;
    navigator.clipboard.writeText(fullText);
    alert('Copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex bg-gray-100 p-1 rounded-full">
          <button 
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'verbatim' ? 'bg-white text-[#6B53A4] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('verbatim')}
          >
            របាយការណ៍ពេញលេញ
          </button>
          <button 
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'summary' ? 'bg-white text-[#6B53A4] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('summary')}
          >
            សេចក្តីសង្ខេប
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white rounded-full px-4 py-2 items-center gap-4 shadow-sm border border-gray-100 hidden md:flex">
            <button onClick={togglePlay} className="w-8 h-8 bg-[#6B53A4] rounded-full flex items-center justify-center text-white shrink-0 hover:bg-[#5A458A] transition-colors">
              {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <div className="text-xs text-gray-500 font-mono w-8 text-right">{formatTime(currentTime)}</div>
            
            <div 
              className="flex items-center gap-[2px] h-6 mx-2 w-32 cursor-pointer group relative"
              onClick={handleSeek}
            >
              <div className="absolute inset-0 bg-transparent z-10" />
              {Array.from({ length: 32 }).map((_, i) => {
                const progress = duration > 0 ? currentTime / duration : 0;
                const isActive = i / 32 <= progress;
                const height = isPlaying && !isActive ? 30 + Math.random() * 70 : (isActive ? 100 : 20);
                return (
                  <div 
                    key={i} 
                    className={`w-1 rounded-full transition-all duration-150 ${isActive ? 'bg-[#6B53A4]' : 'bg-gray-200 group-hover:bg-gray-300'}`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>

            <div className="text-xs text-gray-500 font-mono w-8">{formatTime(duration)}</div>
            
            <button 
              onClick={changeSpeed}
              className="ml-2 px-3 py-1.5 text-xs font-bold text-[#6B53A4] bg-purple-50 rounded-full hover:bg-purple-100 transition-colors border border-purple-100"
              title="Playback Speed"
            >
              {playbackRate}x
            </button>
          </div>

          <button onClick={handleCopy} className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Copy size={16} /> ចម្លងអត្ថបទ
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-[#6B53A4] text-white rounded-full text-sm font-medium hover:bg-[#5A458A] flex items-center gap-2">
            <Printer size={16} /> បោះពុម្ព
          </button>
        </div>
      </div>

      <div id="print-area" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 min-h-[600px]">
        <div className="text-center mb-12">
          <h1 className="font-bold text-lg mb-1">ព្រះរាជាណាចក្រកម្ពុជា</h1>
          <h2 className="font-bold text-md mb-2">ជាតិ សាសនា ព្រះមហាក្សត្រ</h2>
          <div className="flex justify-center items-center gap-2">
            <div className="h-[2px] w-12 bg-black"></div>
            <span className="text-xl leading-none mt-1">✧</span>
            <div className="h-[2px] w-12 bg-black"></div>
          </div>
        </div>

        {activeTab === 'verbatim' ? (
          <div className="space-y-6">
            {results.verbatim?.map((item: any, idx: number) => (
              <p key={idx} className={`text-gray-800 leading-relaxed ${item.speaker === 'SYSTEM' ? 'text-center font-mono my-8' : ''}`}>
                {item.speaker !== 'SYSTEM' && <span className="font-bold text-gray-900">[{item.timestamp}] [{item.speaker}]:</span>} {item.text}
              </p>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center mb-10 space-y-3">
              <h2 className="font-bold text-gray-900">កំណត់ហេតុអង្គប្រជុំពេញលេញ និងលម្អិតបំផុត</h2>
              <p className="font-semibold text-gray-800">កាលបរិច្ឆេទ៖ {results.summary?.date || "N/A"}</p>
              <p className="font-semibold text-gray-800">ប្រធានបទ៖ {results.summary?.title || "សេចក្តីសង្ខេប (Summary)"}</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl space-y-3 text-gray-700">
              <p><span className="font-semibold">ទីកន្លែង៖</span> {results.summary?.location || "N/A"}</p>
              <p><span className="font-semibold">អ្នកចូលរួម៖</span> {results.summary?.attendees || "N/A"}</p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4">១. បញ្ហាដែលបានលើកឡើង</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-800">
                {results.summary?.issues?.map((issue: string, idx: number) => (
                  <li key={idx}>{issue}</li>
                ))}
                {(!results.summary?.issues || results.summary.issues.length === 0) && <li>មិនមានទិន្នន័យ (No data)</li>}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4">២. សេចក្តីសម្រេច និងដំណោះស្រាយ (Resolutions)</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-800">
                {results.summary?.resolutions?.map((res: string, idx: number) => (
                  <li key={idx}>{res}</li>
                ))}
                {(!results.summary?.resolutions || results.summary.resolutions.length === 0) && <li>មិនមានទិន្នន័យ (No data)</li>}
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-4">៣. ទិសដៅអនុវត្តបន្ត (Action Plan)</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-800">
                {results.summary?.actionPlan?.map((plan: string, idx: number) => (
                  <li key={idx}>{plan}</li>
                ))}
                {(!results.summary?.actionPlan || results.summary.actionPlan.length === 0) && <li>មិនមានទិន្នន័យ (No data)</li>}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <button onClick={onBack} className="text-[#6B53A4] hover:underline font-medium">
          &larr; ត្រឡប់ទៅទំព័រដើម
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [mode, setMode] = useState<'single' | 'split'>('single');
  const [files, setFiles] = useState<(File | null)[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAnalyze = async () => {
    const validFiles = files.filter(Boolean) as File[];
    if (validFiles.length === 0) return;

    setIsAnalyzing(true);
    try {
      const res = await analyzeAudio(validFiles);
      setResults(res);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error analyzing audio. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (results) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] font-sans">
        <Header />
        <ResultView results={results} files={files} onBack={() => setResults(null)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] font-sans">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#6B53A4] mb-4">
            ប្រព័ន្ធរៀបចំរបាយការណ៍សម្លេង<br/>កម្រិតស្តង់ដារ
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            បំប្លែងសម្លេងកិច្ចប្រជុំរយៈពេលវែងមកជាឯកសារផ្លូវការ និងសេចក្តីសង្ខេបស្វ័យប្រវត្តិតាមរយៈ បច្ចេកវិទ្យា AI ជំនាន់ចុងក្រោយ។
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-full inline-flex">
            <button 
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${mode === 'single' ? 'bg-white text-[#6B53A4] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => { setMode('single'); setFiles([]); }}
            >
              ឯកសារតែមួយ (Single)
            </button>
            <button 
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${mode === 'split' ? 'bg-white text-[#6B53A4] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => { setMode('split'); setFiles([]); }}
            >
              បែងចែកជា ២ ភាគ (Split)
            </button>
          </div>
        </div>

        {mode === 'single' ? (
          <div className="max-w-2xl mx-auto">
            <UploadBox 
              id={1}
              label="បញ្ចូលឯកសារសម្លេង"
              sublabel="អូស ឬ ចុចដើម្បីជ្រើសរើសឯកសារសម្លេង"
              file={files[0]}
              onFileSelect={(f: File) => setFiles([f])}
              onClear={() => setFiles([])}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <UploadBox 
              id={1}
              label="ភាគទី១ (Part 1)"
              sublabel="បញ្ចូលភាគដំបូង"
              file={files[0]}
              onFileSelect={(f: File) => {
                const newFiles = [...files];
                newFiles[0] = f;
                setFiles(newFiles);
              }}
              onClear={() => {
                const newFiles = [...files];
                newFiles[0] = null;
                setFiles(newFiles);
              }}
            />
            <UploadBox 
              id={2}
              label="ភាគទី២ (Part 2)"
              sublabel="បញ្ចូលភាគបញ្ចប់"
              file={files[1]}
              onFileSelect={(f: File) => {
                const newFiles = [...files];
                newFiles[1] = f;
                setFiles(newFiles);
              }}
              onClear={() => {
                const newFiles = [...files];
                newFiles[1] = null;
                setFiles(newFiles);
              }}
            />
          </div>
        )}

        <div className="text-center mt-10">
          <button 
            onClick={handleAnalyze}
            disabled={files.filter(Boolean).length === 0 || isAnalyzing}
            className={`px-8 py-3 rounded-xl text-white font-medium text-lg transition-colors ${
              files.filter(Boolean).length > 0 && !isAnalyzing ? 'bg-[#6B53A4] hover:bg-[#5A458A]' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAnalyzing ? 'កំពុងវិភាគ...' : 'ចាប់ផ្តើមវិភាគគ្រប់ផ្នែក'}
          </button>
        </div>

        <div className="text-center mt-8 text-xs text-gray-400 space-y-2">
          <p>គាំទ្រឯកសារ MP3, WAV, AAC</p>
          <p className="text-red-400">សំគាល់: បើឯកសារមានទំហំធំជាង 100MB សូមប្រើមុខងារ "បែងចែកជា ២ ភាគ" ដើម្បីកាត់បន្ថយការប្រើប្រាស់ MEMORY។</p>
        </div>
      </main>
    </div>
  );
}

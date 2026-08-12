import React, { useState, useRef, useEffect } from 'react';
import heic2any from 'heic2any';
import { Upload, Download, Share2, Dices, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CanvasPreview, CanvasRef } from './components/CanvasPreview';
import { HackerBackground } from './components/HackerBackground';
import { ScrambleText } from './components/ScrambleText';
import { generateTitle, STACKS } from './data';

export default function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);

  const [name, setName] = useState('');
  const [stack, setStack] = useState('');
  const [title, setTitle] = useState(generateTitle());
  
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showStackSuggestions, setShowStackSuggestions] = useState(false);

  const canvasRef = useRef<CanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      let blob: Blob = file;
      
      // Convert HEIC if needed
      if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
        const result = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });
        blob = Array.isArray(result) ? result[0] : result;
      }

      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        setPhoto(img);
        setIsProcessingImage(false);
      };
      img.src = objectUrl;
    } catch (error) {
      console.error('Failed to process image', error);
      alert('Failed to process image. Please try another one.');
      setIsProcessingImage(false);
    }
  };

  const handleShuffleTitle = () => {
    setTitle(generateTitle());
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    const blob = await canvasRef.current.getBlob();
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HH-Goa-2026-${name || 'Builder'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    setIsSharing(true);
    
    try {
      const blob = await canvasRef.current.getBlob();
      if (!blob) throw new Error("Could not generate image");

      const file = new File([blob], 'hhgoa-builder-id.png', { type: 'image/png' });
      const shareData = {
        text: "I'm building at Hacker House Goa 2026 \ud83c\udf34\ud83d\udcbb #FrameInGoa",
        files: [file],
      };

      // Try native share first
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(shareData);
      } else {
        // Fallback: upload to backend, then open X intent
        const formData = new FormData();
        formData.append('image', blob, 'builder-id.png');
        
        const response = await fetch('/api/share', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) throw new Error("Failed to upload to server");
        
        const { id } = await response.json();
        const shareUrl = `${window.location.origin}/s/${id}`;
        
        const tweetText = encodeURIComponent(`I'm building at Hacker House Goa 2026 \ud83c\udf34\ud83d\udcbb #FrameInGoa\n\n`);
        const twitterIntent = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterIntent, '_blank');
      }
    } catch (error) {
      console.error('Share failed', error);
      alert('Sharing failed. You can always download the image and share it manually!');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-hh-green font-mono pb-20 relative overflow-hidden">
      {/* Interactive Background only on landing */}
      {!isStarted && <HackerBackground />}

      {/* Header */}
      <header className="pt-12 pb-8 px-6 text-center border-b border-hh-yellow/20 relative z-10 bg-hh-green/80 backdrop-blur-sm">
        <h1 className="font-serif text-5xl md:text-7xl font-bold text-hh-yellow tracking-tighter uppercase mb-4 cursor-default">
          <ScrambleText text="Hacker" /> <span className="text-hh-pink mx-2 font-sans font-bold">गोवा</span> <ScrambleText text="House" />
        </h1>
        <p className="text-hh-cream/80 uppercase tracking-widest text-sm md:text-base cursor-default">
          <ScrambleText text="28 - 31 OCT 2026 ✦ GOA, INDIA ✦ 2:47 PM STUDIO" />
        </p>
      </header>

      <AnimatePresence mode="wait">
        {!isStarted ? (
          <motion.main 
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: "blur(5px)" }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto px-4 mt-20 flex flex-col items-center text-center relative z-10"
          >
            <h2 className="font-serif text-5xl md:text-7xl text-hh-cream mb-8 leading-tight">
              <ScrambleText text="Less Noise." />
              <br/>
              <span className="text-hh-yellow italic"><ScrambleText text="More Signal." /></span>
            </h2>
            <p className="text-hh-cream/90 font-mono text-lg md:text-xl max-w-lg mb-12 cursor-default">
              4 Days. One Rhythm. Everything Intentional.<br/>
              <span className="text-hh-pink uppercase tracking-widest text-sm mt-4 block">
                <ScrambleText text="✦ Heads down. Ship or ship. ✦" />
              </span>
            </p>
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "12px 12px 0 #ff007f" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsStarted(true)}
              className="bg-hh-yellow text-hh-green text-xl md:text-2xl px-10 py-5 rounded font-bold uppercase hover:bg-white transition-colors border-4 border-hh-yellow shadow-[8px_8px_0_#ff007f] flex items-center gap-3 relative group overflow-hidden"
            >
              <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Claim Your Builder ID
              {/* Shine effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1s_forwards] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />
            </motion.button>
          </motion.main>
        ) : (
          <motion.main 
            key="editor"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-5xl mx-auto px-4 mt-8 flex flex-col md:flex-row gap-10"
          >
            
            {/* Editor Form */}
          <div className="flex-1 flex flex-col gap-6">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-hh-cream text-hh-green p-8 rounded-xl border-4 border-hh-green shadow-[8px_8px_0_#ff007f]"
            >
              <h2 className="font-serif text-3xl font-bold mb-8 flex items-center gap-3">
                <motion.span 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="text-hh-pink inline-block"
                >
                  ✦
                </motion.span> 
                BUILDER DETAILS
              </h2>
              
              <div className="space-y-6">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-hh-green/70">Profile Photo</label>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg, image/heic"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-hh-green text-hh-yellow px-4 py-4 rounded hover:bg-hh-green/90 transition-colors uppercase font-bold flex items-center justify-center gap-3 text-lg"
                    disabled={isProcessingImage}
                  >
                    {isProcessingImage ? (
                      <><RefreshCw className="animate-spin w-5 h-5" /> Processing...</>
                    ) : (
                      <><Upload className="w-5 h-5" /> {photo ? 'Change Photo' : 'Upload Photo'}</>
                    )}
                  </motion.button>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-hh-green/70">Identity</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="YOUR NAME"
                    className="w-full bg-transparent border-b-4 border-hh-green/20 px-0 py-3 font-serif text-2xl font-bold outline-none focus:border-hh-pink uppercase placeholder:text-hh-green/30 transition-colors"
                    maxLength={20}
                  />
                </div>

                {/* Stack */}
                <div className="relative">
                  <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-hh-green/70">Stack / Role</label>
                  <input 
                    type="text"
                    value={stack}
                    onChange={(e) => {
                      setStack(e.target.value);
                      setShowStackSuggestions(true);
                    }}
                    onFocus={() => setShowStackSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowStackSuggestions(false), 200)}
                    placeholder="FRONTEND"
                    className="w-full bg-transparent border-b-4 border-hh-green/20 px-0 py-3 font-mono text-xl outline-none focus:border-hh-pink uppercase placeholder:text-hh-green/30 transition-colors"
                    maxLength={20}
                  />
                  <AnimatePresence>
                    {showStackSuggestions && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 bg-white border-4 border-hh-green mt-2 max-h-48 overflow-y-auto z-20 rounded shadow-xl"
                      >
                        {STACKS.filter(s => s.toLowerCase().includes(stack.toLowerCase())).map(s => (
                          <button 
                            key={s} 
                            className="w-full text-left px-6 py-3 hover:bg-hh-green hover:text-hh-yellow uppercase text-sm font-bold transition-colors border-b border-hh-green/10 last:border-0"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setStack(s);
                              setShowStackSuggestions(false);
                            }}
                          >
                            {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Title Generator */}
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-widest text-hh-green/70">Builder Class</label>
                  <div className="flex gap-3">
                    <input 
                      type="text"
                      value={title}
                      readOnly
                      className="w-full bg-hh-green/5 border-2 border-hh-green/20 rounded px-4 py-3 font-serif italic text-xl font-bold outline-none uppercase text-hh-pink"
                    />
                    <motion.button 
                      whileHover={{ scale: 1.1, rotate: 15 }}
                      whileTap={{ scale: 0.9, rotate: -15 }}
                      onClick={handleShuffleTitle}
                      className="bg-hh-pink text-white p-3 rounded hover:bg-hh-green hover:text-hh-yellow transition-colors shrink-0 shadow-md"
                      title="Reroll Title"
                    >
                      <Dices className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Live Preview */}
          <div className="flex-1 flex flex-col items-center gap-8">
            <motion.div 
              className="w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              <CanvasPreview 
                ref={canvasRef}
                photo={photo}
                name={name}
                stack={stack}
                title={title}
              />
            </motion.div>

            <motion.div 
              className="w-full flex gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="flex-1 bg-transparent border-4 border-hh-yellow text-hh-yellow py-4 px-6 rounded hover:bg-hh-yellow hover:text-hh-green transition-colors uppercase font-bold flex items-center justify-center gap-2 text-lg"
              >
                <Download className="w-6 h-6" /> Download
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, y: -2, boxShadow: "6px 6px 0 #ff007f" }}
                whileTap={{ scale: 0.98, boxShadow: "0px 0px 0 #ff007f" }}
                onClick={handleShare}
                disabled={isSharing}
                className="flex-1 bg-hh-pink text-white py-4 px-6 rounded hover:bg-white hover:text-hh-pink transition-all uppercase font-bold flex items-center justify-center gap-2 border-4 border-hh-pink shadow-[4px_4px_0_#105935] disabled:opacity-50 text-lg"
              >
                {isSharing ? (
                  <><RefreshCw className="animate-spin w-6 h-6" /> WAIT...</>
                ) : (
                  <><Share2 className="w-6 h-6" /> POST TO X</>
                )}
              </motion.button>
            </motion.div>
          </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}


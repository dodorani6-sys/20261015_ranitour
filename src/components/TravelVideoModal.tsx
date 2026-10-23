"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Download,
  Volume2,
  VolumeX,
  Sparkles,
  MapPin,
  Check,
  Film,
  Camera,
  Layers,
  Smartphone,
  Square,
  Monitor,
  Share2,
  Clock,
  Compass,
} from "lucide-react";
import { Place, TripPlan } from "@/types/trip";

interface TravelVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripPlan;
  activeDay: number;
  places: Place[];
  onUpdatePlaceCaption?: (placeId: string, caption: string) => void;
}

type AspectRatio = "9:16" | "1:1" | "16:9";
type ThemeStyle = "modern" | "vintage" | "shorts";

export const TravelVideoModal: React.FC<TravelVideoModalProps> = ({
  isOpen,
  onClose,
  trip,
  activeDay,
  places,
  onUpdatePlaceCaption,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Video Settings
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [themeStyle, setThemeStyle] = useState<ThemeStyle>("modern");
  const [includeMapIntro, setIncludeMapIntro] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false); // Default mute for reels music

  // Captions for each place (defaults to memo or generic caption)
  const [sceneCaptions, setSceneCaptions] = useState<Record<string, string>>({});

  // Playback / Recording state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(12);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const loadedImagesRef = useRef<Record<string, HTMLImageElement>>({});

  // Initialize captions from places and memos
  useEffect(() => {
    const initialCaptions: Record<string, string> = {};
    places.forEach((p, idx) => {
      initialCaptions[p.id] =
        p.customCaption ||
        p.memo ||
        (idx === 0
          ? `${trip.title} 설레는 시작! 🚌`
          : idx === places.length - 1
          ? `오늘 여정의 완벽한 마무리 ✨`
          : `${p.name} 필수 방문 코스 ✨`);
    });
    setSceneCaptions(initialCaptions);
  }, [places, trip.title]);

  // Preload all place photos into memory
  useEffect(() => {
    places.forEach((p) => {
      if (p.photoUrl && !loadedImagesRef.current[p.id]) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = p.photoUrl;
        img.onload = () => {
          loadedImagesRef.current[p.id] = img;
        };
      }
    });
  }, [places]);

  // Calculate durations: Intro = 2.5s, Each place = 3.0s, Outro = 2.0s
  const introDuration = includeMapIntro ? 2.5 : 0;
  const placeDuration = 3.0;
  const outroDuration = 2.0;
  const calculatedTotal =
    introDuration + Math.max(1, places.length) * placeDuration + outroDuration;

  useEffect(() => {
    setTotalDuration(calculatedTotal);
  }, [calculatedTotal]);

  // Canvas Dimensions based on Aspect Ratio
  const getCanvasDimensions = () => {
    if (aspectRatio === "9:16") return { width: 720, height: 1280 };
    if (aspectRatio === "1:1") return { width: 1080, height: 1080 };
    return { width: 1280, height: 720 };
  };

  // Play synthesized joyful lo-fi chime sound using Web Audio API when sound is enabled
  const playTravelTone = (freq = 440, type: OscillatorType = "sine") => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // Audio autoplay restrictions
    }
  };

  // Canvas Drawing Engine for Any Timestamp
  const drawFrame = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // 1. SCENE 1: MAP ROUTE INTRO (0 to introDuration)
    if (includeMapIntro && time < introDuration) {
      drawMapIntroScene(ctx, width, height, time / introDuration);
      return;
    }

    // 2. SCENE 3: OUTRO (last 2 seconds)
    const placeTimeStart = introDuration;
    const placeTimeTotal = Math.max(1, places.length) * placeDuration;
    const outroTimeStart = placeTimeStart + placeTimeTotal;

    if (time >= outroTimeStart) {
      const outroProgress = Math.min(1, (time - outroTimeStart) / outroDuration);
      drawOutroScene(ctx, width, height, outroProgress);
      return;
    }

    // 3. SCENE 2: PLACE SCENES (1 to N)
    const activePlaceElapsed = time - placeTimeStart;
    const currentPlaceIndex = Math.min(
      places.length - 1,
      Math.max(0, Math.floor(activePlaceElapsed / placeDuration))
    );
    const placeSceneProgress =
      (activePlaceElapsed % placeDuration) / placeDuration;

    const currentPlace = places[currentPlaceIndex];
    if (currentPlace) {
      drawPlaceScene(
        ctx,
        width,
        height,
        currentPlace,
        currentPlaceIndex,
        placeSceneProgress
      );
    }
  };

  // 1. Draw Map Intro Scene
  const drawMapIntroScene = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    progress: number
  ) => {
    // Background gradient (sky / road map style)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (themeStyle === "vintage") {
      bgGrad.addColorStop(0, "#fef3c7");
      bgGrad.addColorStop(1, "#fde68a");
    } else if (themeStyle === "shorts") {
      bgGrad.addColorStop(0, "#0f172a");
      bgGrad.addColorStop(1, "#1e1b4b");
    } else {
      bgGrad.addColorStop(0, "#e0f2fe");
      bgGrad.addColorStop(1, "#dbeafe");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Map Grid Pattern
    ctx.strokeStyle =
      themeStyle === "shorts" ? "rgba(255,255,255,0.08)" : "rgba(100,116,139,0.15)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Animated Route Line across places
    if (places.length > 0) {
      const cx = w / 2;
      const cy = h / 2 - 40;
      const radius = Math.min(w, h) * 0.28;

      const points = places.map((_, i) => {
        const angle =
          (i / Math.max(1, places.length)) * Math.PI * 1.5 - Math.PI / 2;
        return {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * (radius * 0.7),
        };
      });

      // Draw dashed connecting path
      ctx.beginPath();
      ctx.strokeStyle =
        themeStyle === "shorts" ? "#818cf8" : "rgba(37, 99, 235, 0.4)";
      ctx.lineWidth = 6;
      ctx.setLineDash([8, 6]);
      points.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw animated forward line
      const activePointIndex = Math.min(
        points.length - 1,
        Math.floor(progress * points.length)
      );

      ctx.beginPath();
      ctx.strokeStyle = themeStyle === "shorts" ? "#38bdf8" : "#2563eb";
      ctx.lineWidth = 6;
      points.slice(0, activePointIndex + 1).forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();

      // Draw Markers
      points.forEach((pt, i) => {
        const isReached = i <= activePointIndex;
        // Outer glow
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isReached ? 18 : 12, 0, Math.PI * 2);
        ctx.fillStyle = isReached
          ? themeStyle === "shorts"
            ? "#6366f1"
            : "#2563eb"
          : "rgba(148, 163, 184, 0.5)";
        ctx.fill();

        // Pin Number
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Pretendard, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i + 1), pt.x, pt.y);

        // Place label
        if (isReached && places[i]) {
          ctx.fillStyle = themeStyle === "shorts" ? "#f8fafc" : "#0f172a";
          ctx.font = "bold 12px Pretendard, sans-serif";
          ctx.fillText(places[i].name.slice(0, 8), pt.x, pt.y + 26);
        }
      });
    }

    // Intro Title Card (Center/Bottom)
    const cardY = h * 0.72;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 20;

    // Badge
    ctx.fillStyle = themeStyle === "shorts" ? "#6366f1" : "#2563eb";
    roundRect(ctx, w / 2 - 80, cardY - 50, 160, 32, 16);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Pretendard, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${activeDay}일차 여행 시작`, w / 2, cardY - 34);

    // Main Title
    ctx.fillStyle = themeStyle === "shorts" ? "#ffffff" : "#0f172a";
    ctx.font = "900 28px Pretendard, sans-serif";
    ctx.fillText(trip.title, w / 2, cardY);

    // Subtitle
    ctx.fillStyle = themeStyle === "shorts" ? "#94a3b8" : "#64748b";
    ctx.font = "500 15px Pretendard, sans-serif";
    ctx.fillText(
      `${trip.startDate} - ${trip.endDate} · 총 ${places.length}곳의 여정`,
      w / 2,
      cardY + 32
    );
    ctx.restore();
  };

  // 2. Draw Individual Place Scene with Ken Burns Zoom & Subtitle
  const drawPlaceScene = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    place: Place,
    index: number,
    progress: number
  ) => {
    const img = loadedImagesRef.current[place.id];

    // Background Photo with smooth Ken Burns Zoom Effect
    if (img && img.complete) {
      ctx.save();
      const zoom = 1.0 + progress * 0.12; // 1.0 to 1.12 subtle zoom
      const translateX = (1 - zoom) * (w / 2);
      const translateY = (1 - zoom) * (h / 2);

      ctx.translate(translateX, translateY);
      ctx.scale(zoom, zoom);

      // Cover scaling
      drawImageCover(ctx, img, 0, 0, w, h);
      ctx.restore();
    } else {
      // Fallback stylized colored card when no user photo uploaded
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#1e293b");
      grad.addColorStop(1, "#0f172a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Decorative center icon
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 - 40, 100, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "600 18px Pretendard, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📷 사진을 등록하면 멋진 배경으로 채워집니다", w / 2, h / 2 - 30);
    }

    // Vintage Film Polaroid Border Style
    if (themeStyle === "vintage") {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 18;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      // Warm vintage film tint
      ctx.fillStyle = "rgba(245, 158, 11, 0.08)";
      ctx.fillRect(0, 0, w, h);
    }

    // Bottom Dark Vignette Gradient for Subtitle Readability
    const grad = ctx.createLinearGradient(0, h * 0.5, 0, h);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.5, "rgba(0, 0, 0, 0.5)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.88)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, h * 0.5, w, h * 0.5);

    // Top Header: Order Number & Destination Badge
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    roundRect(ctx, 24, 28, 130, 36, 18);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Pretendard, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`📍 코스 ${index + 1} / ${places.length}`, 40, 46);
    ctx.restore();

    // Bottom Subtitle & Place Name
    const captionText =
      sceneCaptions[place.id] || place.memo || `${place.name} 방문!`;
    const bottomY = h - 90;

    // Subtitle Container Card
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Place Name Heading
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px Pretendard, sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 10;
    ctx.fillText(place.name, w / 2, bottomY - 38);

    // Editable Custom Subtitle (Highlight Box)
    ctx.font = "600 17px Pretendard, sans-serif";
    const subMetrics = ctx.measureText(captionText);
    const boxW = Math.min(w - 60, subMetrics.width + 40);

    ctx.fillStyle =
      themeStyle === "shorts"
        ? "rgba(99, 102, 241, 0.9)"
        : themeStyle === "vintage"
        ? "rgba(254, 243, 199, 0.95)"
        : "rgba(255, 255, 255, 0.92)";

    roundRect(ctx, w / 2 - boxW / 2, bottomY - 6, boxW, 40, 12);
    ctx.fill();

    ctx.fillStyle =
      themeStyle === "shorts"
        ? "#ffffff"
        : themeStyle === "vintage"
        ? "#78350f"
        : "#0f172a";
    ctx.fillText(captionText, w / 2, bottomY + 14);
    ctx.restore();

    // Scene Transition Progress Bar (Top)
    const barW = (w - 48) / places.length;
    places.forEach((_, i) => {
      ctx.fillStyle =
        i < index
          ? "#ffffff"
          : i === index
          ? "rgba(255,255,255,0.9)"
          : "rgba(255,255,255,0.25)";
      roundRect(ctx, 24 + i * (barW + 2), 16, barW - 2, 4, 2);
      ctx.fill();
    });
  };

  // 3. Draw Outro Scene
  const drawOutroScene = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    progress: number
  ) => {
    // Elegant Dark Blue Outro
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const cy = h / 2;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Glowing Star / Heart Icon
    ctx.font = "40px sans-serif";
    ctx.fillText("✨", w / 2, cy - 80);

    // Ending Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 28px Pretendard, sans-serif";
    ctx.fillText(`${trip.title} 완주!`, w / 2, cy - 20);

    // Detail Summary
    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 16px Pretendard, sans-serif";
    ctx.fillText(
      `총 ${places.length}곳 방문 완료 · 라니투어로 완성한 여행`,
      w / 2,
      cy + 22
    );

    // Signature Brand
    ctx.fillStyle = "#818cf8";
    ctx.font = "bold 14px Pretendard, sans-serif";
    ctx.fillText("RANITOUR TRAVEL REEL", w / 2, cy + 70);
    ctx.restore();
  };

  // Helper: Round Rectangle
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  // Helper: Draw image with object-fit: cover scaling
  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;
    let sWidth = img.width;
    let sHeight = img.height;
    let sx = 0;
    let sy = 0;

    if (imgRatio > canvasRatio) {
      sWidth = img.height * canvasRatio;
      sx = (img.width - sWidth) / 2;
    } else {
      sHeight = img.width / canvasRatio;
      sy = (img.height - sHeight) / 2;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
  };

  // Animation Loop Controller
  useEffect(() => {
    if (!isOpen) return;

    if (isPlaying) {
      const loop = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = (timestamp - startTimeRef.current) / 1000;

        if (elapsed >= totalDuration) {
          setIsPlaying(false);
          setCurrentTime(totalDuration);
          startTimeRef.current = 0;
        } else {
          setCurrentTime(elapsed);
          drawFrame(elapsed);
          animationFrameRef.current = requestAnimationFrame(loop);
        }
      };
      animationFrameRef.current = requestAnimationFrame(loop);
    } else {
      drawFrame(currentTime);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, isPlaying, totalDuration, aspectRatio, themeStyle, includeMapIntro, sceneCaptions]);

  // Adjust canvas resolution when aspect ratio changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dim = getCanvasDimensions();
      canvas.width = dim.width;
      canvas.height = dim.height;
      drawFrame(currentTime);
    }
  }, [aspectRatio]);

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      startTimeRef.current = 0;
    }
    setIsPlaying(!isPlaying);
  };

  // Replay
  const handleReplay = () => {
    setCurrentTime(0);
    startTimeRef.current = 0;
    setIsPlaying(true);
    if (soundEnabled) playTravelTone(523.25);
  };

  // Handle caption change
  const handleCaptionChange = (placeId: string, val: string) => {
    setSceneCaptions((prev) => ({ ...prev, [placeId]: val }));
    onUpdatePlaceCaption?.(placeId, val);
  };

  // Export Video to MP4 / WebM using MediaRecorder
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsExporting(true);
      setExportProgress(10);
      setIsPlaying(false);

      // Supported video mime types (iOS Safari supports video/mp4 since iOS 14.3+)
      const mimeTypes = [
        "video/mp4;codecs=avc1",
        "video/mp4",
        "video/webm;codecs=vp9",
        "video/webm",
      ];
      const selectedMime =
        mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";

      const stream = canvas.captureStream(30); // 30 fps
      const recorder = new MediaRecorder(
        stream,
        selectedMime ? { mimeType: selectedMime } : undefined
      );
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, {
          type: selectedMime || "video/mp4",
        });
        const url = URL.createObjectURL(finalBlob);
        setExportedVideoUrl(url);
        setIsExporting(false);
        setExportProgress(100);

        // Auto trigger download for iPhone / PC
        const link = document.createElement("a");
        link.href = url;
        link.download = `${trip.title.replace(/\s+/g, "_")}_여행릴스.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      // Play through timeline frame-by-frame and record
      recorder.start();
      const fps = 30;
      const totalFrames = Math.round(totalDuration * fps);

      for (let f = 0; f <= totalFrames; f++) {
        const t = (f / totalFrames) * totalDuration;
        drawFrame(t);
        setCurrentTime(t);
        setExportProgress(Math.round((f / totalFrames) * 90));
        // Yield to browser
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }

      recorder.stop();
    } catch (err) {
      console.error("Video export failed:", err);
      alert("비디오 변환 중 오류가 발생했습니다. 브라우저 지원 여부를 확인해주세요.");
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                <span>여행 후기 릴스 비디오 제작</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold border border-indigo-500/30">
                  AI 릴스 스튜디오
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {trip.title} · {places.length}개 장소의 추억
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2-Column (Left: Canvas Preview, Right: Customization & Subtitle Controls) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto">
          {/* Left Column: Video Canvas Preview Area */}
          <div className="flex-1 bg-black/90 flex flex-col items-center justify-center p-4 relative min-h-[380px] sm:min-h-[440px]">
            {/* The Video Canvas */}
            <div
              className={`relative shadow-2xl rounded-2xl overflow-hidden border border-slate-700/60 max-h-[50vh] md:max-h-[58vh] flex items-center justify-center bg-slate-950 transition-all ${
                aspectRatio === "9:16"
                  ? "aspect-[9/16] w-auto h-[48vh]"
                  : aspectRatio === "1:1"
                  ? "aspect-square w-auto h-[44vh]"
                  : "aspect-[16/9] w-full max-w-[480px] h-auto"
              }`}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain select-none"
              />

              {/* Center Play Overlay when Paused */}
              {!isPlaying && !isExporting && (
                <button
                  onClick={handleTogglePlay}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-indigo-600/90 hover:bg-indigo-600 text-white flex items-center justify-center shadow-2xl backdrop-blur-xs transition-transform active:scale-90"
                >
                  <Play className="w-6 h-6 ml-0.5 fill-current" />
                </button>
              )}

              {/* Exporting Spinner Overlay */}
              {isExporting && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 z-20">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-3" />
                  <p className="font-bold text-sm">고화질 비디오 렌더링 중...</p>
                  <p className="text-xs text-indigo-400 mt-1">{exportProgress}% 완료</p>
                  <div className="w-48 h-2 bg-slate-800 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Playback Controls & Progress Bar */}
            <div className="w-full max-w-sm mt-3 flex items-center gap-3 px-2">
              <button
                onClick={handleTogglePlay}
                className="p-2 rounded-xl text-white hover:bg-slate-800 transition-colors"
                title={isPlaying ? "일시정지" : "재생"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              </button>
              <button
                onClick={handleReplay}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="처음부터 다시보기"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Progress Slider */}
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 w-8">
                  {Math.floor(currentTime)}s
                </span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-75"
                    style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-500 w-8">
                  {Math.floor(totalDuration)}s
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Settings, Styles & Scene Caption Editor */}
          <div className="w-full md:w-[380px] p-4 sm:p-5 flex flex-col gap-5 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/60 overflow-y-auto">
            {/* 1. Aspect Ratio Switcher */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <span>영상 비율 선택</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => setAspectRatio("9:16")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    aspectRatio === "9:16"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>9:16 릴스</span>
                </button>
                <button
                  onClick={() => setAspectRatio("1:1")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    aspectRatio === "1:1"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>1:1 피드</span>
                </button>
                <button
                  onClick={() => setAspectRatio("16:9")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    aspectRatio === "16:9"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>16:9 가로</span>
                </button>
              </div>
            </div>

            {/* 2. Theme Style Picker */}
            <div>
              <label className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>감성 템플릿 테마</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setThemeStyle("modern")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    themeStyle === "modern"
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold text-xs">🌿 모던</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">클린 자막</div>
                </button>
                <button
                  onClick={() => setThemeStyle("vintage")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    themeStyle === "vintage"
                      ? "bg-amber-600/20 border-amber-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold text-xs">📸 빈티지</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">필름 프레임</div>
                </button>
                <button
                  onClick={() => setThemeStyle("shorts")}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    themeStyle === "shorts"
                      ? "bg-purple-600/20 border-purple-500 text-white"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="font-bold text-xs">⚡ 숏폼</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">네온 팝</div>
                </button>
              </div>
            </div>

            {/* 3. Toggles: Map Intro & Audio */}
            <div className="flex items-center gap-3 pt-1 border-t border-slate-800/80">
              {/* Map Intro Toggle */}
              <button
                type="button"
                onClick={() => setIncludeMapIntro(!includeMapIntro)}
                className={`flex-1 flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  includeMapIntro
                    ? "bg-indigo-950/40 border-indigo-500/60 text-indigo-300"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>지도 인트로</span>
                </span>
                <span className="text-[11px] font-bold">
                  {includeMapIntro ? "ON" : "OFF"}
                </span>
              </button>

              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex-1 flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  soundEnabled
                    ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
                title={soundEnabled ? "소리 켜짐 (효과음 재생)" : "무음 (인스타 릴스 음악 추가용)"}
              >
                <span className="flex items-center gap-1.5">
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  <span>사운드</span>
                </span>
                <span className="text-[11px] font-bold">
                  {soundEnabled ? "켜짐" : "무음"}
                </span>
              </button>
            </div>

            {/* 4. Scene Subtitle Editor */}
            <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>장소별 자막 편집 ({places.length}개 씬)</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  타이핑 즉시 반영
                </span>
              </label>

              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {places.map((place, idx) => (
                  <div
                    key={place.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-xs text-slate-200 truncate">
                          {place.name}
                        </span>
                      </div>
                      {place.photoUrl ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                          사진 등록됨
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-md">
                          기본 배경
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={sceneCaptions[place.id] || ""}
                      onChange={(e) => handleCaptionChange(place.id, e.target.value)}
                      placeholder="이 장소의 감성 자막을 적어보세요"
                      className="w-full text-xs bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Primary Export Button */}
            <div className="pt-2 shrink-0">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportVideo}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting ? "비디오 제작 중..." : "아이폰 갤러리에 저장 (비디오 다운로드)"}
                </span>
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-1.5">
                💡 인스타 릴스나 틱톡에 올릴 땐 인스타 최신 인기 음악을 입혀보세요!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

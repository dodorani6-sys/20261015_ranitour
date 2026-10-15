"use client";

import React, { useState } from "react";
import { KeyRound, ExternalLink, X, Check, HelpCircle } from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (newKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  onSaveKey,
}) => {
  const [inputVal, setInputVal] = useState(currentKey);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(inputVal.trim());
    onClose();
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(`NEXT_PUBLIC_KAKAO_MAP_API_KEY=${inputVal.trim()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <span>카카오맵 API 키 설정</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Kakao JavaScript 키 (32자리)
            </label>
            <input
              type="text"
              placeholder="예: 7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-mono transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              입력하신 키는 브라우저 로컬 저장소(localStorage)에 안전하게 저장됩니다.
            </p>
          </div>

          <div className="bg-blue-50/80 rounded-xl p-4 border border-blue-100 text-xs text-blue-900 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-blue-800">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>카카오맵 API 발급 및 설정 가이드</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1 leading-relaxed">
              <li>
                <a
                  href="https://developers.kakao.com/console/app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline font-medium hover:text-blue-700 inline-flex items-center gap-0.5"
                >
                  카카오 디벨로퍼스 콘솔 <ExternalLink className="w-3 h-3" />
                </a>
                에서 애플리케이션 추가
              </li>
              <li>
                <strong>[앱 키]</strong> 메뉴에서 <strong>JavaScript 키</strong> 복사
              </li>
              <li>
                <strong>[플랫폼] → [Web]</strong>에 사이트 도메인 등록:
                <div className="mt-1 font-mono bg-white px-2 py-1 rounded border border-blue-200 text-slate-800 text-[11px] inline-block">
                  http://localhost:3000
                </div>
              </li>
            </ol>
          </div>

          {inputVal && (
            <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-600 font-mono truncate mr-2">
                NEXT_PUBLIC_KAKAO_MAP_API_KEY={inputVal}
              </span>
              <button
                type="button"
                onClick={handleCopyEnv}
                className="shrink-0 px-2.5 py-1 text-slate-700 hover:text-blue-600 font-medium hover:bg-white rounded transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : ".env 복사"}
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              닫기
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
            >
              적용하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

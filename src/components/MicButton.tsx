'use client';

import { useState } from 'react';

interface MicButtonProps {
    onResult: (text: string) => void;
    lang: string;
}

export function MicButton({ onResult, lang }: MicButtonProps) {
    const [isListening, setIsListening] = useState(false);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert(lang === 'tr' ? 'Ses girişi bu tarayıcıda desteklenmiyor. Chrome kullanın.' : 'Voice input not supported. Use Chrome.');
            return;
        }
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const r = new SpeechRecognition();
        r.lang = lang === 'tr' ? 'tr-TR' : 'en-US';
        r.continuous = false;
        r.interimResults = false;
        r.onstart = () => setIsListening(true);
        r.onend = () => setIsListening(false);
        r.onerror = () => setIsListening(false);
        r.onresult = (e: any) => onResult(e.results[0][0].transcript);
        r.start();
    };

    return (
        <button
            onClick={isListening ? () => setIsListening(false) : startListening}
            style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: isListening ? 'rgba(239,68,68,0.15)' : 'rgba(107,92,231,0.15)',
                border: `0.5px solid ${isListening ? 'rgba(239,68,68,0.3)' : 'rgba(107,92,231,0.25)'}`,
                borderRadius: 20, padding: '5px 10px', cursor: 'pointer',
                animation: isListening ? 'pulse 1s infinite' : 'none',
            }}
        >
            <span style={{ fontSize: 12 }}>{isListening ? '⏹' : '🎙'}</span>
            <span style={{ fontSize: 9, color: isListening ? '#F87171' : '#9B8FFF', fontWeight: 500 }}>
                {isListening
                    ? (lang === 'tr' ? 'Dinleniyor...' : 'Listening...')
                    : (lang === 'tr' ? 'Sesle yaz' : 'Voice input')}
            </span>
        </button>
    );
}

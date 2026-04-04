'use client';

import { forwardRef } from 'react';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';
import * as htmlToImage from 'html-to-image';

interface ShareCardProps {
    problem: string;
    characters: string[];
    votedPersona: string;
    topInsight: string;
    reportId: string;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
    ({ problem, characters, votedPersona, topInsight, reportId }, ref) => {
        const voted = CHARACTER_VISUALS[votedPersona];

        return (
            <div
                ref={ref}
                style={{
                    width: 1080,
                    height: 1080,
                    background: '#0D0D0F',
                    padding: 64,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontFamily: '"Playfair Display", serif',
                    position: 'fixed',
                    left: -9999,
                    top: -9999,
                }}
            >
                {/* Header */}
                <div>
                    <div style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.3)',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase' as const,
                        marginBottom: 32,
                    }}>
                        16TypeTalk · Meclisin Kararı
                    </div>

                    {/* Problem */}
                    <div style={{
                        fontSize: 22,
                        color: 'rgba(255,255,255,0.85)',
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                        marginBottom: 40,
                        maxWidth: 860,
                    }}>
                        &ldquo;{problem.length > 120 ? problem.slice(0, 117) + '...' : problem}&rdquo;
                    </div>

                    {/* Characters */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 48 }}>
                        {characters.map(mbti => {
                            const c = CHARACTER_VISUALS[mbti];
                            if (!c) return null;
                            return (
                                <div key={mbti} style={{
                                    background: c.bg,
                                    border: `1px solid ${c.accentColor}40`,
                                    borderRadius: 12,
                                    padding: '8px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}>
                                    <span style={{ fontSize: 18 }}>{c.emoji}</span>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: c.accentColor }}>{mbti}</div>
                                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{c.label}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Top insight */}
                {voted && (
                    <div style={{
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: 16,
                        padding: '28px 32px',
                        borderLeft: `3px solid ${voted.accentColor}`,
                        marginBottom: 40,
                    }}>
                        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                            Bana şunu söylediler:
                        </div>
                        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, fontStyle: 'italic' }}>
                            {topInsight.length > 200 ? topInsight.slice(0, 197) + '...' : topInsight}
                        </div>
                    </div>
                )}

                {/* Voted persona + footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    {voted && (
                        <div>
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
                                En çok uyum hissettiğim ses
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                background: voted.bg,
                                borderRadius: 12,
                                padding: '10px 16px',
                                border: `1px solid ${voted.accentColor}60`,
                            }}>
                                <span style={{ fontSize: 22 }}>{voted.emoji}</span>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: voted.accentColor }}>{votedPersona}</div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{voted.label}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ textAlign: 'right' as const }}>
                        <div style={{ fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.15)', marginBottom: 4 }}>
                            16typetalk.app
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.1)' }}>
                            {reportId}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);

ShareCard.displayName = 'ShareCard';

export default ShareCard;

// Hook: generate PNG blob from card element, download or share
export function useShareCard() {
    const generate = async (cardElement: HTMLElement): Promise<Blob | null> => {
        try {
            const dataUrl = await htmlToImage.toPng(cardElement, {
                width: 1080,
                height: 1080,
                pixelRatio: 2,
            });
            const response = await fetch(dataUrl);
            return await response.blob();
        } catch (err) {
            console.error('Share card generation failed:', err);
            return null;
        }
    };

    const download = async (cardElement: HTMLElement, filename = '16typetalk-karar.png') => {
        const blob = await generate(cardElement);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const share = async (cardElement: HTMLElement) => {
        const blob = await generate(cardElement);
        if (!blob) return;
        const file = new File([blob], '16typetalk-karar.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: 'Meclisin Kararı — 16TypeTalk',
                text: 'MBTI karakterlerin benim sorunum hakkında ne düşündüğünü keşfet',
                files: [file],
            });
        } else {
            await download(cardElement);
        }
    };

    return { generate, download, share };
}

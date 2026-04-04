'use client';

import { CHARACTER_VISUALS } from '@/lib/characterVisuals';

interface CharacterAvatarProps {
    mbti: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    isSelected?: boolean;
    isVoted?: boolean;
}

const SIZES = {
    sm: { box: 36, emoji: 16, font: 10 },
    md: { box: 48, emoji: 20, font: 11 },
    lg: { box: 64, emoji: 28, font: 13 },
};

export default function CharacterAvatar({ mbti, size = 'md', showLabel, isSelected, isVoted }: CharacterAvatarProps) {
    const config = CHARACTER_VISUALS[mbti];
    if (!config) return null;

    const s = SIZES[size];

    return (
        <div className="flex flex-col items-center" style={{ gap: 6 }}>
            <div
                style={{
                    width: s.box,
                    height: s.box,
                    borderRadius: 14,
                    background: config.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: s.emoji,
                    border: isSelected || isVoted
                        ? `2px solid ${config.accentColor}`
                        : '1.5px solid rgba(255,255,255,0.08)',
                    boxShadow: isSelected || isVoted
                        ? `0 0 12px ${config.accentColor}40`
                        : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative' as const,
                }}
            >
                <span style={{ lineHeight: 1 }}>{config.emoji}</span>
                {isVoted && (
                    <div style={{
                        position: 'absolute' as const,
                        top: -4,
                        right: -4,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: config.accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        color: 'white',
                    }}>★</div>
                )}
            </div>
            {showLabel && (
                <div style={{ textAlign: 'center' as const }}>
                    <div style={{ fontSize: s.font, fontWeight: 500, color: config.accentColor }}>
                        {mbti}
                    </div>
                    <div style={{ fontSize: s.font - 1, color: 'rgba(255,255,255,0.4)' }}>
                        {config.label}
                    </div>
                </div>
            )}
        </div>
    );
}

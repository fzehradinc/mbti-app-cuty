'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { CHARACTERS } from '@/data/characters';

export default function FinalReport() {
    const { report, selectedCharacters, turns, startNewSession } = useAppStore();

    if (!report) return null;

    // Determine dominant vote
    const voteCounts: Record<string, number> = {};
    turns.forEach(t => {
        if (t.userVote) voteCounts[t.userVote] = (voteCounts[t.userVote] || 0) + 1;
    });
    const dominantVote = Object.entries(voteCounts).sort(([, a], [, b]) => b - a)[0];
    const dominantMbti = dominantVote?.[0] || selectedCharacters[0];
    const dominantChar = CHARACTERS.find(c => c.mbti === dominantMbti);

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Top bar */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                    <span className="text-lg">☰</span>
                    <span className="text-sm tracking-[0.2em] uppercase font-medium">İÇ MECLİS</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold">
                    {dominantMbti?.[0] || 'U'}
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1
                        className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Meclisin Kararı
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        {turns.length} turda elde edilen içgörüler
                    </p>
                </motion.div>

                {/* Core Tension */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl p-5 mb-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                >
                    <p className="text-xs tracking-[0.15em] uppercase text-[var(--text-secondary)] mb-3 font-medium">
                        TEMEL GERİLİM
                    </p>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                        {report.coreTension}
                    </p>
                </motion.div>

                {/* Character Positions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl p-5 mb-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                >
                    <p className="text-xs tracking-[0.15em] uppercase text-[var(--text-secondary)] mb-4 font-medium">
                        KARAKTERLERİN NİHAİ POZİSYONLARI
                    </p>
                    <div className="space-y-4">
                        {Object.entries(report.characterPositions).map(([mbti, position]) => {
                            const char = CHARACTERS.find(c => c.mbti === mbti);
                            return (
                                <div key={mbti} className="flex gap-3">
                                    <div
                                        className="w-1 rounded-full flex-shrink-0"
                                        style={{ background: char?.color || '#7C3AED' }}
                                    />
                                    <div>
                                        <p className="text-xs font-bold tracking-wider mb-1" style={{ color: char?.color }}>
                                            {mbti}
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                            {position}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* User Insight + Weekly Action */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-2 gap-3 mb-4"
                >
                    <div
                        className="rounded-xl p-4"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                    >
                        <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--text-secondary)] mb-3 font-medium">
                            SENİN SESİN
                        </p>
                        <div className="flex flex-col items-center">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold mb-2"
                                style={{ background: `${dominantChar?.color}20`, color: dominantChar?.color }}
                            >
                                {dominantMbti?.substring(0, 2)}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] text-center">
                                {dominantChar?.name || 'Empatik'} Yaklaşım
                            </p>
                        </div>
                    </div>

                    <div
                        className="rounded-xl p-4"
                        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))', border: '1px solid rgba(124,58,237,0.2)' }}
                    >
                        <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--text-secondary)] mb-3 font-medium">
                            HAFTALIK AKSİYON
                        </p>
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                            {report.nextStep}
                        </p>
                    </div>
                </motion.div>

                {/* Action Paths */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl p-5 mb-6"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                >
                    <p className="text-xs tracking-[0.15em] uppercase text-[var(--text-secondary)] mb-4 font-medium">
                        ÖNERİLEN YOLLAR
                    </p>
                    <div className="space-y-4">
                        {report.actionPaths.map((path, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs bg-[var(--accent)]/20 text-[var(--accent)]">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                                    {path}
                                </p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* User Insight */}
                {report.userInsight && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="rounded-xl p-5 mb-8"
                        style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}
                    >
                        <p className="text-xs tracking-[0.15em] uppercase text-[var(--accent)] mb-3 font-medium">
                            İÇGÖRÜ
                        </p>
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed italic">
                            {report.userInsight}
                        </p>
                    </motion.div>
                )}

                {/* Share button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full py-4 rounded-xl text-white font-semibold text-sm tracking-wider uppercase flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    ← BU RAPORU PAYLAŞ
                </motion.button>

                {/* Archive ID */}
                <p className="text-center text-[10px] text-[var(--text-secondary)]/30 mt-4 tracking-wider">
                    ARŞİV NO: #MECLIS-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}
                </p>

                {/* New Session Button */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    onClick={startNewSession}
                    className="mt-6 w-full py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-white/5 transition-all tracking-wider uppercase"
                >
                    Yeni Danışma Başlat →
                </motion.button>
            </div>

            {/* Bottom nav (mobile) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around py-3 px-4 text-xs text-[var(--text-secondary)]" style={{ background: 'rgba(13, 13, 15, 0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border-subtle)' }}>
                <button className="flex flex-col items-center gap-1" onClick={startNewSession}>
                    <span>⚡</span>
                    <span>MECLİS</span>
                </button>
                <button className="flex flex-col items-center gap-1" onClick={startNewSession}>
                    <span>✦</span>
                    <span>YENİ KONU</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                    <span>📂</span>
                    <span>ARŞİV</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-[var(--accent)]">
                    <span>📋</span>
                    <span>RAPORLAR</span>
                </button>
            </div>
        </div>
    );
}

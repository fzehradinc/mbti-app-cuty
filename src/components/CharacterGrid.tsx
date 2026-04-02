'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { CHARACTERS } from '@/data/characters';
import CharacterCard from './CharacterCard';

export default function CharacterGrid() {
    const { selectedCharacters, toggleCharacter, setScreen } = useAppStore();

    const handleProceed = () => {
        if (selectedCharacters.length >= 2) {
            setScreen('invite');
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 pt-6 pb-4"
            >
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setScreen('welcome')}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-2"
                    >
                        ← GERİ DÖN
                    </button>
                    <span className="text-sm tracking-[0.2em] uppercase font-medium text-[var(--text-primary)]">
                        İÇ MECLİS
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-center justify-center text-xs">
                        ⚙
                    </div>
                </div>

                <div className="inline-block px-3 py-1 rounded-full text-xs bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 mb-4">
                    2 İLA 5 KARAKTER SEÇ
                </div>

                <h2
                    className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    Kimi davet etmek istiyorsun?
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                    Kendi stratejik konseyinizi kurun. Her karakter farklı bir bilişsel işleyiş ve çözüm perspektifi sunar.
                </p>
            </motion.div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-32">
                <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                    {CHARACTERS.map((char, i) => (
                        <CharacterCard
                            key={char.mbti}
                            mbti={char.mbti}
                            isSelected={selectedCharacters.includes(char.mbti)}
                            onToggle={() => toggleCharacter(char.mbti)}
                            index={i}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Bar */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-0 left-0 right-0 px-4 py-4 glass"
                style={{ background: 'rgba(13, 13, 15, 0.95)', backdropFilter: 'blur(20px)' }}
            >
                <div className="max-w-lg mx-auto flex items-center gap-4">
                    {/* Avatars */}
                    <div className="flex -space-x-2">
                        {selectedCharacters.slice(0, 5).map((mbti) => {
                            const char = CHARACTERS.find(c => c.mbti === mbti);
                            return (
                                <div
                                    key={mbti}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[var(--bg-primary)]"
                                    style={{ background: char?.color || '#7C3AED' }}
                                >
                                    {mbti[0]}
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex-1">
                        <p className="text-xs text-[var(--text-secondary)]">
                            {selectedCharacters.length > 0
                                ? `${selectedCharacters.length} seçildi`
                                : 'KONSEY TAMAMLANMIYOR'}
                        </p>
                    </div>

                    <motion.button
                        onClick={handleProceed}
                        disabled={selectedCharacters.length < 2}
                        className="px-6 py-3 rounded-xl text-white font-semibold text-sm tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{
                            background: selectedCharacters.length >= 2
                                ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                                : 'rgba(124, 58, 237, 0.2)',
                        }}
                        whileHover={selectedCharacters.length >= 2 ? { scale: 1.02 } : {}}
                        whileTap={selectedCharacters.length >= 2 ? { scale: 0.97 } : {}}
                    >
                        MECLİSİ KUR →
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

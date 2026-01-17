import { motion } from 'framer-motion';
import { Problem } from '@/types/game';
import { ArrowRight, BookOpen, Lightbulb, Code } from 'lucide-react';

interface ProblemScreenProps {
  problem: Problem;
  mode: 'practice' | 'interview';
  onStart: () => void;
  onBack: () => void;
}

export const ProblemScreen = ({ problem, mode, onStart, onBack }: ProblemScreenProps) => {
  const difficultyColors = {
    Easy: 'text-mint bg-mint/10',
    Medium: 'text-peach bg-peach/10',
    Hard: 'text-destructive bg-destructive/10',
  };

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 max-w-4xl">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onBack}
        className="mb-8 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
      >
        ← Quay lại
      </motion.button>

      {/* Problem Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-strong rounded-2xl p-6 md:p-8 mb-6"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground">
            {problem.skill}
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent">
            Level {problem.level}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          {problem.title}
        </h1>

        {/* Story */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 mb-6 border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
            <p className="text-foreground leading-relaxed">{problem.story}</p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Code className="w-4 h-4 text-accent" />
            Yêu cầu
          </h3>
          <p className="text-muted-foreground">{problem.description}</p>
        </div>

        {/* Input/Output */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-muted/50 rounded-xl p-4">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Input</h4>
            <p className="text-foreground text-sm font-mono">{problem.input}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Output</h4>
            <p className="text-foreground text-sm font-mono">{problem.output}</p>
          </div>
        </div>

        {/* Examples */}
        <div className="mb-6">
          <h3 className="font-semibold text-foreground mb-3">Ví dụ</h3>
          <div className="space-y-3">
            {problem.examples.map((example, index) => (
              <div key={index} className="bg-foreground/5 rounded-xl p-4 font-mono text-sm">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <span className="text-muted-foreground">Input:</span>
                  <code className="text-accent">{example.input}</code>
                  <span className="text-muted-foreground hidden md:inline">→</span>
                  <span className="text-muted-foreground">Output:</span>
                  <code className="text-primary">{example.output}</code>
                </div>
                {example.explanation && (
                  <p className="mt-2 text-xs text-muted-foreground font-sans">
                    💡 {example.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hints (Practice mode only) */}
        {mode === 'practice' && (
          <div className="bg-mint/5 rounded-xl p-4 border border-mint/20">
            <h3 className="font-semibold text-mint mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Gợi ý
            </h3>
            <ul className="space-y-2">
              {problem.hints.map((hint, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-mint">{index + 1}.</span>
                  {hint}
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>

      {/* Start Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="w-full btn-primary text-white font-semibold py-4 rounded-xl text-lg flex items-center justify-center gap-2"
      >
        Bắt đầu giải bài
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

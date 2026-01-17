import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Problem, LANGUAGES } from '@/types/game';
import { Code, Send, Clock, ChevronDown, FileText, Lightbulb, Lock } from 'lucide-react';
import { LoadingOverlay } from './LoadingOverlay';
import { toast } from 'sonner';

// Code templates for each language
const CODE_TEMPLATES: Record<string, string> = {
  javascript: `// Viết code của bạn ở đây
function solve(input) {
  // TODO: Implement your solution
  
  return result;
}

// Ví dụ sử dụng:
// console.log(solve(input));
`,
  python: `# Viết code của bạn ở đây
def solve(input):
    # TODO: Implement your solution
    
    return result

# Ví dụ sử dụng:
# print(solve(input))
`,
  java: `// Viết code của bạn ở đây
import java.util.*;

public class Solution {
    public static void main(String[] args) {
        // TODO: Implement your solution
        
    }
    
    public static Object solve(Object input) {
        // TODO: Implement your solution
        
        return null;
    }
}
`,
  c: `// Viết code của bạn ở đây
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    // TODO: Implement your solution
    
    return 0;
}
`,
  cpp: `// Viết code của bạn ở đây
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // TODO: Implement your solution
    
    return 0;
}
`,
  typescript: `// Viết code của bạn ở đây
function solve(input: any): any {
  // TODO: Implement your solution
  
  return result;
}

// Ví dụ sử dụng:
// console.log(solve(input));
`,
};

const ADMIN_PASSWORD = 'twossg';

interface SolvingScreenProps {
  problem: Problem;
  mode: 'practice' | 'interview';
  onSubmit: (thinking: string, code: string, language: string, answers: string[]) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const SolvingScreen = ({ 
  problem, 
  mode, 
  onSubmit, 
  onBack,
  isLoading 
}: SolvingScreenProps) => {
  const [code, setCode] = useState(CODE_TEMPLATES['javascript']);
  const [language, setLanguage] = useState('javascript');
  const [timeLeft, setTimeLeft] = useState(mode === 'interview' ? 20 * 60 : null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [isPasteUnlocked, setIsPasteUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  const languageRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const isPasteUnlockedRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isPasteUnlockedRef.current = isPasteUnlocked;
  }, [isPasteUnlocked]);

  // Timer for interview mode
  useEffect(() => {
    if (mode !== 'interview' || timeLeft === null) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode]);

  // Close language menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(e.target as Node)) {
        setShowLanguageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Anti-cheat: Block paste globally and in Monaco editor
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isPasteUnlockedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        setShowPasswordModal(true);
        toast.error('⚠️ Không được phép dán code! Nhập mật khẩu admin để mở khóa.');
      }
    };

    document.addEventListener('paste', handlePaste, true);
    return () => document.removeEventListener('paste', handlePaste, true);
  }, []);

  // Handle Monaco Editor mount to block paste
  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Block paste command in Monaco
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      if (!isPasteUnlockedRef.current) {
        setShowPasswordModal(true);
        toast.error('⚠️ Không được phép dán code! Nhập mật khẩu admin để mở khóa.');
        return;
      }
      // If unlocked, execute default paste
      editor.trigger('keyboard', 'editor.action.clipboardPasteAction', null);
    });

    // Also block Shift+Insert
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, () => {
      if (!isPasteUnlockedRef.current) {
        setShowPasswordModal(true);
        toast.error('⚠️ Không được phép dán code! Nhập mật khẩu admin để mở khóa.');
        return;
      }
      editor.trigger('keyboard', 'editor.action.clipboardPasteAction', null);
    });
  };

  // Update code template when language changes
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    // Only update template if code is still default template
    const currentTemplate = CODE_TEMPLATES[language];
    if (code === currentTemplate || code === '') {
      setCode(CODE_TEMPLATES[newLanguage]);
    }
    setShowLanguageMenu(false);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsPasteUnlocked(true);
      setShowPasswordModal(false);
      setPasswordInput('');
      toast.success('✅ Đã mở khóa chức năng dán code!');
    } else {
      toast.error('❌ Mật khẩu không đúng!');
      setPasswordInput('');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    onSubmit('', code, language, []);
  };

  const selectedLang = LANGUAGES.find(l => l.id === language)!;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-mint/10 text-mint border-mint/20';
      case 'Medium': return 'bg-peach/10 text-peach border-peach/20';
      case 'Hard': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen flex flex-col sakura-bg">
      {/* Loading Overlay */}
      <LoadingOverlay isVisible={isLoading} />

      {/* Header */}
      <div className="glass-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            ← Thoát
          </button>

          <h1 className="text-lg font-semibold text-foreground hidden md:block">
            {problem.title}
          </h1>

          <div className="flex items-center gap-4">
            {/* Timer */}
            {timeLeft !== null && (
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                timeLeft < 300 ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
              </div>
            )}

            {/* Language Selector */}
            <div className="relative" ref={languageRef}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <span>{selectedLang.icon}</span>
                <span className="text-sm font-medium">{selectedLang.name}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              <AnimatePresence>
                {showLanguageMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-40 bg-card rounded-lg shadow-card border overflow-hidden z-20"
                  >
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        onClick={() => handleLanguageChange(lang.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                          lang.id === language ? 'bg-primary/10 text-primary' : ''
                        }`}
                      >
                        <span>{lang.icon}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal for Paste */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Lock className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Chống gian lận</h3>
                  <p className="text-sm text-muted-foreground">Nhập mật khẩu admin để dán code</p>
                </div>
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Mật khẩu..."
                className="w-full px-4 py-2 rounded-lg border bg-background text-foreground mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Xác nhận
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split Layout Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Left Panel - Problem Description */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-[45%] glass-card-strong rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Đề bài</h3>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(problem.difficulty)}`}>
              {problem.difficulty}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Problem Title - Mobile */}
            <h2 className="text-xl font-bold text-foreground md:hidden">{problem.title}</h2>
            
            {/* Story */}
            {problem.story && (
              <div className="bg-primary/5 rounded-xl p-4 border-l-4 border-primary">
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  {problem.story}
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </p>
            </div>

            {/* Examples */}
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-accent" />
                Ví dụ
              </h4>
              <div className="space-y-3">
                {problem.examples.map((example, index) => (
                  <div key={index} className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">Input:</span>
                      <code className="text-sm text-accent font-mono bg-accent/10 px-2 py-0.5 rounded">
                        {example.input}
                      </code>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground w-14 shrink-0">Output:</span>
                      <code className="text-sm text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">
                        {example.output}
                      </code>
                    </div>
                    {example.explanation && (
                      <p className="text-xs text-muted-foreground mt-2 pl-14">
                        💡 {example.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>

        {/* Right Panel - Code Editor */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-[55%] glass-card-strong rounded-2xl overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Code className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-foreground">Code Editor</h3>
            {isPasteUnlocked && (
              <span className="ml-auto text-xs text-mint bg-mint/10 px-2 py-1 rounded-full">
                🔓 Đã mở khóa paste
              </span>
            )}
          </div>
          
          <div className="flex-1 min-h-[400px] lg:min-h-0">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorMount}
              theme="vs-light"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
              }}
            />
          </div>

          <div className="p-4 border-t border-border flex justify-between items-center">
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              ← Quay lại
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !code.trim()}
              className="btn-primary text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang chấm...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Nộp bài
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChallengeProgress } from '@/types/challenge';
import { Sparkles, Trophy, Key, ExternalLink, Loader2, CheckCircle, AlertCircle, BookOpen, Code2, Users, Brain, Target, Flame, Gift, Calendar, Shield, LogIn, LogOut, User, Crown, XCircle, RefreshCw, Lock } from 'lucide-react';
import { validateApiKey } from '@/lib/aiService';
import { ChallengeGuide } from './ChallengeGuide';
import { ChallengeDashboard } from './ChallengeDashboard';
import heroBanner from '@/assets/hero-banner.png';

interface UserProfile {
  id: string;
  name: string;
  student_id: string;
}

interface StartScreenProps {
  challengeProgress: ChallengeProgress;
  onStart: () => void;
  onShowProgress: () => void;
  onOpenApiKey: () => void;
  onSaveApiKey: (apiKey: string) => void;
  onSelectProblem: () => void;
  onStartChallenge: () => void;
  onResetChallenge: (password: string) => void;
  onStartChallengeProblem: (difficulty: 'Easy' | 'Medium' | 'Hard') => void;
  onShowLeaderboard: () => void;
  onNavigateToAuth: () => void;
  onSignOut: () => void;
  hasApiKey: boolean;
  currentApiKey?: string;
  isAuthenticated: boolean;
  userProfile: UserProfile | null;
}

export const StartScreen = ({ 
  challengeProgress,
  onStart, 
  onShowProgress, 
  onOpenApiKey,
  onSaveApiKey,
  onSelectProblem,
  onStartChallenge,
  onResetChallenge,
  onStartChallengeProblem,
  onShowLeaderboard,
  onNavigateToAuth,
  onSignOut,
  hasApiKey,
  currentApiKey,
  isAuthenticated,
  userProfile,
}: StartScreenProps) => {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showChallengeGuide, setShowChallengeGuide] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Vui lòng nhập API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const isValid = await validateApiKey(apiKey.trim());
      if (isValid) {
        setSuccess(true);
        setTimeout(() => {
          onSaveApiKey(apiKey.trim());
          setSuccess(false);
        }, 1000);
      } else {
        setError('API key không hợp lệ. Vui lòng kiểm tra lại.');
      }
    } catch (err) {
      setError('Không thể xác thực API key. Vui lòng thử lại.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSkipValidation = () => {
    if (apiKey.trim()) {
      onSaveApiKey(apiKey.trim());
    }
  };

  const handleStartChallengeClick = () => {
    setShowChallengeGuide(false);
    onStartChallenge();
  };

  const handleResetSubmit = () => {
    onResetChallenge(resetPassword);
    setResetPassword('');
    setShowResetModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col sakura-bg">
      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-background rounded-2xl p-6 max-w-md w-full shadow-2xl border border-border"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Nhập Mật Khẩu</h3>
                  <p className="text-sm text-muted-foreground">Để tham gia lại thử thách</p>
                </div>
              </div>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full px-4 py-3 bg-muted/50 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <motion.button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetPassword('');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-muted hover:bg-muted/80 font-medium transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Hủy
                </motion.button>
                <motion.button
                  onClick={handleResetSubmit}
                  disabled={!resetPassword.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-medium disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Xác Nhận
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Header */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        {isAuthenticated && userProfile ? (
          <>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full border border-primary/20">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">{userProfile.name}</span>
              <span className="text-xs text-muted-foreground">({userProfile.student_id})</span>
            </div>
            <motion.button
              onClick={onSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/80 hover:bg-muted text-sm font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </motion.button>
          </>
        ) : (
          <motion.button
            onClick={onNavigateToAuth}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-medium shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập
          </motion.button>
        )}
      </div>

      {/* Hero Section with Anime Banner */}
      <div className="relative w-full h-72 md:h-[380px] overflow-hidden">
        <motion.img 
          src={heroBanner} 
          alt="Think Like an Interviewer" 
          className="w-full h-full object-cover object-top"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
        
        {/* Floating decorative elements */}
        <motion.div 
          className="absolute top-20 left-10 w-16 h-16 rounded-full bg-primary/20 blur-xl"
          animate={{ y: [-10, 10, -10], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-32 right-20 w-24 h-24 rounded-full bg-accent/30 blur-xl"
          animate={{ y: [10, -10, 10], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />

        {/* Title Overlay */}
        <div className="absolute inset-0 flex items-end justify-center pb-8 md:pb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="text-center px-4"
          >
            <motion.div 
              className="flex items-center justify-center gap-3 mb-3"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Brain className="w-8 h-8 md:w-9 md:h-9 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 drop-shadow-lg">
              <span className="text-foreground">Think Like an</span>
              <br />
              <span className="gradient-text">Interviewer</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg font-medium">
              Luyện thuật toán theo góc nhìn nhà tuyển dụng
            </p>
            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>by <span className="text-primary font-semibold">TWO</span> - Together We Overcome</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 py-6 max-w-5xl -mt-4">
        {/* Challenge Failed State */}
        {challengeProgress.failed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <motion.div 
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-destructive/10 via-destructive/5 to-orange-500/10 border border-destructive/30 p-6"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-destructive/10 rounded-full blur-3xl" />
              
              <div className="relative flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center shadow-lg shrink-0"
                  >
                    <XCircle className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                      <h3 className="font-bold text-lg text-destructive">Thử Thách Đã Kết Thúc</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {challengeProgress.failedReason || 'Bạn đã không hoàn thành thử thách.'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tiến độ: Ngày {challengeProgress.completedDays}/20 • Đã hoàn thành {challengeProgress.completedDays} ngày
                    </p>
                  </div>
                </div>
                <motion.button
                  className="bg-gradient-to-r from-primary to-accent text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 whitespace-nowrap"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowResetModal(true)}
                >
                  <RefreshCw className="w-5 h-5" />
                  Thử Lại
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Challenge CTA - Show if no active challenge and not failed */}
        {!challengeProgress.isActive && !challengeProgress.failed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <motion.div 
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-yellow-500/10 border border-primary/20 p-6 cursor-pointer"
              whileHover={{ scale: 1.01 }}
              onClick={() => setShowChallengeGuide(true)}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              
              <div className="relative flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shrink-0"
                  >
                    <Gift className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="w-5 h-5 text-orange-500" />
                      <h3 className="font-bold text-lg">Thử Thách 20 Ngày - Thưởng 500k</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Hoàn thành 5 bài/ngày trong 20 ngày liên tục để nhận thưởng 500,000 VND
                    </p>
                  </div>
                </div>
                <motion.button
                  className="btn-primary text-white font-semibold py-3 px-6 rounded-xl flex items-center gap-2 whitespace-nowrap"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowChallengeGuide(true);
                  }}
                >
                  <Target className="w-5 h-5" />
                  Tham Gia Ngay
                </motion.button>
              </div>

              {/* Quick Rules */}
              <div className="relative mt-4 flex flex-wrap gap-3 text-xs">
                <span className="px-3 py-1.5 bg-white/50 rounded-full flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  20 ngày liên tục
                </span>
                <span className="px-3 py-1.5 bg-white/50 rounded-full flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-accent" />
                  5 bài/ngày (3 dễ, 1 TB, 1 khó)
                </span>
                <span className="px-3 py-1.5 bg-white/50 rounded-full flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-destructive" />
                  Chống gian lận AI
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Challenge Dashboard - Show if challenge is active */}
        {challengeProgress.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <ChallengeDashboard
              progress={challengeProgress}
              currentDayChallenge={challengeProgress.dailyChallenges[challengeProgress.currentDay - 1] || null}
              onStartProblem={onStartChallengeProblem}
              onViewGuide={() => setShowChallengeGuide(true)}
            />
          </motion.div>
        )}

        {/* API Key Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card-strong rounded-2xl p-5 mb-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <motion.div 
              className="w-12 h-12 rounded-xl icon-gradient flex items-center justify-center"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              <Key className="w-6 h-6 text-white" />
            </motion.div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Groq API Key</h3>
              <p className="text-xs text-muted-foreground">Dùng để AI chấm điểm bài làm</p>
            </div>
            {hasApiKey && (
              <motion.div 
                className="flex items-center gap-1.5 px-2.5 py-1 bg-mint/20 rounded-full border border-mint/30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle className="w-3.5 h-3.5 text-mint" />
                <span className="text-xs font-medium text-mint-foreground">Đã kết nối</span>
              </motion.div>
            )}
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
                setSuccess(false);
              }}
              placeholder="gsk_..."
              className="w-full px-4 py-3 bg-muted/50 rounded-xl border border-border 
                       focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none
                       font-mono text-sm transition-all"
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-mint text-sm bg-mint/10 px-3 py-2 rounded-lg"
              >
                <CheckCircle className="w-4 h-4" />
                API key hợp lệ! Đang lưu...
              </motion.div>
            )}

            <div className="flex gap-2">
              <motion.button
                onClick={handleSaveApiKey}
                disabled={isValidating || !apiKey.trim()}
                className="flex-1 btn-primary text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Lưu Key
                  </>
                )}
              </motion.button>
              <motion.button
                onClick={handleSkipValidation}
                disabled={!apiKey.trim()}
                className="btn-secondary py-3 px-5 rounded-xl font-medium disabled:opacity-50 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Bỏ qua
              </motion.button>
            </div>

            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Lấy API key miễn phí tại Groq Console
            </a>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid md:grid-cols-2 gap-3 mb-5"
        >
          <motion.button
            onClick={onStart}
            disabled={!hasApiKey}
            className="btn-primary text-white font-bold py-4 rounded-2xl text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: hasApiKey ? 1.02 : 1 }}
            whileTap={{ scale: hasApiKey ? 0.98 : 1 }}
          >
            <Sparkles className="w-5 h-5" />
            <span>{hasApiKey ? 'Luyện Tập Ngẫu Nhiên' : 'Nhập API Key trước'}</span>
          </motion.button>

          <motion.button
            onClick={onSelectProblem}
            disabled={!hasApiKey}
            className="btn-secondary py-4 rounded-2xl font-bold text-foreground flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: hasApiKey ? 1.02 : 1 }}
            whileTap={{ scale: hasApiKey ? 0.98 : 1 }}
          >
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Chọn Bài Tập</span>
          </motion.button>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={onShowProgress}
          className="w-full btn-secondary py-3 rounded-2xl font-semibold text-foreground flex items-center justify-center gap-2"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Trophy className="w-5 h-5 text-peach" />
          Xem Lịch Sử & Thành Tích
        </motion.button>

        {/* Leaderboard Button */}
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          onClick={onShowLeaderboard}
          className="w-full mt-3 py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 text-foreground hover:border-yellow-500/50 transition-colors"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Crown className="w-5 h-5 text-yellow-500" />
          Bảng Xếp Hạng Thử Thách
        </motion.button>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Được phát triển với 💖 bởi <span className="text-primary font-semibold">TWO</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Together We Overcome</p>
        </motion.div>
      </div>

      {/* Challenge Guide Modal */}
      <AnimatePresence>
        {showChallengeGuide && (
          <ChallengeGuide
            onStartChallenge={handleStartChallengeClick}
            onClose={() => setShowChallengeGuide(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

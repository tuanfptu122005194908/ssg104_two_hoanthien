import { motion } from 'framer-motion';
import { 
  Trophy, Calendar, Target, CheckCircle, Clock, Flame,
  ArrowRight, Star, AlertCircle, Gift
} from 'lucide-react';
import { ChallengeProgress, CHALLENGE_RULES, DailyChallenge } from '@/types/challenge';
import { getChallengeStats } from '@/lib/challengeStore';
import { CountdownTimer } from './CountdownTimer';

interface ChallengeDashboardProps {
  progress: ChallengeProgress;
  currentDayChallenge: DailyChallenge | null;
  onStartProblem: (difficulty: 'Easy' | 'Medium' | 'Hard') => void;
  onViewGuide: () => void;
}

export const ChallengeDashboard = ({ 
  progress, 
  currentDayChallenge, 
  onStartProblem,
  onViewGuide 
}: ChallengeDashboardProps) => {
  const stats = getChallengeStats(progress);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-700 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case 'easy': return 'Dễ';
      case 'medium': return 'Trung bình';
      case 'hard': return 'Khó';
      default: return diff;
    }
  };

  const isDayComplete = currentDayChallenge?.completed ?? false;

  return (
    <div className="space-y-6">
      {/* Challenge Progress Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-strong rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Thử Thách 20 Ngày</h2>
              <p className="text-sm text-muted-foreground">
                Ngày {progress.currentDay} / {CHALLENGE_RULES.totalDays}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Countdown Timer - only show if day not complete */}
            {!isDayComplete && <CountdownTimer />}
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatCurrency(CHALLENGE_RULES.reward)}</p>
              <p className="text-xs text-muted-foreground">Phần thưởng</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Tiến độ tổng</span>
            <span className="font-medium">{Math.round(stats.progressPercentage)}%</span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.progressPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full xp-bar rounded-full"
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-primary">{progress.consecutiveDays}</p>
            <p className="text-xs text-muted-foreground">Ngày liên tiếp</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-accent">{stats.completedProblems}</p>
            <p className="text-xs text-muted-foreground">Bài đã làm</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-xl">
            <p className="text-2xl font-bold text-mint">{stats.daysRemaining}</p>
            <p className="text-xs text-muted-foreground">Ngày còn lại</p>
          </div>
        </div>

        <button
          onClick={onViewGuide}
          className="mt-4 text-sm text-primary hover:underline flex items-center gap-1"
        >
          <AlertCircle className="w-4 h-4" />
          Xem lại luật chơi
        </button>
      </motion.div>

      {/* Today's Challenge */}
      {currentDayChallenge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card-strong rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Nhiệm Vụ Hôm Nay</h3>
              <p className="text-sm text-muted-foreground">Ngày {currentDayChallenge.day}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Easy Problems */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor('easy')}`}>
                  {getDifficultyLabel('easy')} ({currentDayChallenge.completedProblems.easy.length}/{CHALLENGE_RULES.dailyRequirements.easy})
                </span>
                {currentDayChallenge.completedProblems.easy.length >= CHALLENGE_RULES.dailyRequirements.easy ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <motion.button
                    onClick={() => onStartProblem('Easy')}
                    className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                    whileHover={{ x: 3 }}
                  >
                    Làm bài <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentDayChallenge.completedProblems.easy.length / CHALLENGE_RULES.dailyRequirements.easy) * 100}%` }}
                />
              </div>
            </div>

            {/* Medium Problems */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor('medium')}`}>
                  {getDifficultyLabel('medium')} ({currentDayChallenge.completedProblems.medium.length}/{CHALLENGE_RULES.dailyRequirements.medium})
                </span>
                {currentDayChallenge.completedProblems.medium.length >= CHALLENGE_RULES.dailyRequirements.medium ? (
                  <CheckCircle className="w-5 h-5 text-yellow-600" />
                ) : (
                  <motion.button
                    onClick={() => onStartProblem('Medium')}
                    className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                    whileHover={{ x: 3 }}
                  >
                    Làm bài <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentDayChallenge.completedProblems.medium.length / CHALLENGE_RULES.dailyRequirements.medium) * 100}%` }}
                />
              </div>
            </div>

            {/* Hard Problems */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor('hard')}`}>
                  {getDifficultyLabel('hard')} ({currentDayChallenge.completedProblems.hard.length}/{CHALLENGE_RULES.dailyRequirements.hard})
                </span>
                {currentDayChallenge.completedProblems.hard.length >= CHALLENGE_RULES.dailyRequirements.hard ? (
                  <CheckCircle className="w-5 h-5 text-red-600" />
                ) : (
                  <motion.button
                    onClick={() => onStartProblem('Hard')}
                    className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                    whileHover={{ x: 3 }}
                  >
                    Làm bài <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${(currentDayChallenge.completedProblems.hard.length / CHALLENGE_RULES.dailyRequirements.hard) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {currentDayChallenge.completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-4 bg-mint/20 border border-mint/30 rounded-xl flex items-center gap-3"
            >
              <CheckCircle className="w-6 h-6 text-mint" />
              <div>
                <p className="font-semibold text-mint-foreground">Hoàn thành ngày {currentDayChallenge.day}!</p>
                <p className="text-sm text-muted-foreground">Quay lại vào ngày mai để tiếp tục</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* 20-Day Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card-strong rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-secondary-foreground" />
          </div>
          <h3 className="font-bold text-lg">Lịch Thử Thách</h3>
        </div>

        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {Array.from({ length: CHALLENGE_RULES.totalDays }).map((_, index) => {
            const day = index + 1;
            const challenge = progress.dailyChallenges[index];
            const isCompleted = challenge?.completed;
            const isCurrent = day === progress.currentDay;
            const isPast = day < progress.currentDay;

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`
                  aspect-square rounded-xl flex items-center justify-center font-bold text-sm
                  ${isCompleted 
                    ? 'bg-gradient-to-br from-mint to-accent text-white' 
                    : isCurrent 
                      ? 'bg-primary text-white ring-2 ring-primary/50 ring-offset-2' 
                      : isPast && !isCompleted
                        ? 'bg-destructive/20 text-destructive'
                        : 'bg-muted text-muted-foreground'
                  }
                `}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : day}
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-mint to-accent" />
            <span>Hoàn thành</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>Hôm nay</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive/20" />
            <span>Bỏ lỡ</span>
          </div>
        </div>
      </motion.div>

      {/* Challenge Complete */}
      {stats.isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card-strong rounded-2xl p-8 text-center bg-gradient-to-br from-yellow-500/10 via-primary/10 to-accent/10"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">🎉 Chúc mừng!</h2>
          <p className="text-muted-foreground mb-4">
            Bạn đã hoàn thành Thử Thách 20 Ngày!
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500/20 rounded-xl">
            <Gift className="w-5 h-5 text-yellow-600" />
            <span className="font-bold text-yellow-700">{formatCurrency(CHALLENGE_RULES.reward)}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Liên hệ admin để nhận thưởng sau khi xác minh
          </p>
        </motion.div>
      )}
    </div>
  );
};

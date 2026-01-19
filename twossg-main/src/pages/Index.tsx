import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameState, GameProgress, Problem } from '@/types/game';
import { loadProgress, saveProgress, addHistoryEntry, getXPForScore, checkNewBadges } from '@/lib/gameStore';
import { getChallengeStats, CHALLENGE_RULES } from '@/lib/challengeStore';
import { gradeWithAI } from '@/lib/aiService';
import { getRandomProblem } from '@/data/problems';
import { StartScreen } from '@/components/game/StartScreen';
import { ProblemScreen } from '@/components/game/ProblemScreen';
import { SolvingScreen } from '@/components/game/SolvingScreen';
import { ResultScreen } from '@/components/game/ResultScreen';
import { ProgressScreen } from '@/components/game/ProgressScreen';
import { ProblemListScreen } from '@/components/game/ProblemListScreen';
import { APIKeyModal } from '@/components/game/APIKeyModal';
import { BrowserWarning } from '@/components/game/BrowserWarning';
import { ChallengeCertificate } from '@/components/game/ChallengeCertificate';
import { ChallengeProblemSelector } from '@/components/game/ChallengeProblemSelector';
import Leaderboard from '@/components/game/Leaderboard';
import { useAuth } from '@/hooks/useAuth';
import { useChallengeProgress } from '@/hooks/useChallengeProgress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const { 
    progress: challengeProgress, 
    startChallenge: startChallengeAsync, 
    markProblemCompleted: markProblemCompletedAsync,
    resetChallenge: resetChallengeAsync,
    loading: challengeLoading 
  } = useChallengeProgress();
  const [progress, setProgress] = useState<GameProgress>(loadProgress());
  const [gameState, setGameState] = useState<GameState>({
    screen: 'start',
    mode: 'practice',
    currentProblem: null,
    userThinking: '',
    userCode: '',
    selectedLanguage: 'javascript',
    interviewAnswers: [],
    aiResponse: null,
    isLoading: false,
    timeLeft: 0,
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [lastXPGained, setLastXPGained] = useState(0);
  const [lastNewBadges, setLastNewBadges] = useState<string[]>([]);
  const [currentChallengeDifficulty, setCurrentChallengeDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | null>(null);
  const [showProblemSelector, setShowProblemSelector] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Load game progress on mount
  useEffect(() => {
    const saved = loadProgress();
    setProgress(saved);
  }, []);

  const handleStart = () => {
    const problem = getRandomProblem(progress.level + 2);
    setCurrentChallengeDifficulty(null);
    setGameState(prev => ({
      ...prev,
      screen: 'problem',
      mode: 'practice',
      currentProblem: problem,
    }));
  };

  const handleStartChallenge = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để tham gia thử thách');
      navigate('/auth');
      return;
    }
    await startChallengeAsync();
    toast.success('🔥 Bắt đầu Thử Thách 20 Ngày!');
  };

  const handleResetChallenge = async (password: string) => {
    if (password !== 'SE2005') {
      toast.error('Mật khẩu không đúng!');
      return;
    }
    await resetChallengeAsync();
    toast.info('Thử thách đã được reset. Bạn có thể bắt đầu lại!');
  };

  const handleStartChallengeProblem = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    setCurrentChallengeDifficulty(difficulty);
    setShowProblemSelector(true);
  };

  const handleSelectChallengeProblem = (problem: Problem) => {
    setShowProblemSelector(false);
    setGameState(prev => ({
      ...prev,
      screen: 'problem',
      mode: 'practice',
      currentProblem: problem,
    }));
  };

  const handleStartSolving = () => {
    setGameState(prev => ({
      ...prev,
      screen: 'solving',
      userThinking: '',
      userCode: '',
      interviewAnswers: [],
    }));
  };

  const handleSubmit = async (thinking: string, code: string, language: string, answers: string[]) => {
    if (!gameState.currentProblem || !gameState.mode) return;

    if (!progress.apiKey) {
      toast.error('Vui lòng nhập Groq API key để chấm điểm');
      setShowApiKeyModal(true);
      return;
    }

    setGameState(prev => ({ ...prev, isLoading: true }));

    try {
      const aiResponse = await gradeWithAI(progress.apiKey, {
        problem: gameState.currentProblem,
        userThinking: thinking,
        userCode: code,
        language,
        interviewAnswers: answers,
        interviewQuestions: gameState.currentProblem.interviewQuestions,
        mode: gameState.mode,
      });

      // Calculate rewards
      const xpGained = getXPForScore(aiResponse.totalScore, gameState.mode);
      const newBadges = checkNewBadges(progress, aiResponse.totalScore, gameState.mode);

      // Update progress
      const updatedProgress = addHistoryEntry(
        progress,
        gameState.currentProblem.id,
        aiResponse.totalScore,
        gameState.mode,
        aiResponse.feedback
      );

      setProgress(updatedProgress);
      setLastXPGained(xpGained);
      setLastNewBadges(newBadges);

      // Update challenge progress if in challenge mode
      if (currentChallengeDifficulty && challengeProgress.isActive && isAuthenticated) {
        const updatedChallengeProgress = await markProblemCompletedAsync(
          gameState.currentProblem.id,
          currentChallengeDifficulty,
          aiResponse.totalScore
        );
        
        // Save result to database
        if (user) {
          try {
            await supabase.from('challenge_results').insert({
              user_id: user.id,
              problem_id: gameState.currentProblem.id,
              problem_title: gameState.currentProblem.title,
              difficulty: currentChallengeDifficulty,
              score: aiResponse.totalScore,
              day_number: challengeProgress.currentDay,
            });
          } catch (dbError) {
            console.error('Error saving to leaderboard:', dbError);
          }
        }
        
        // Show progress toast
        const diffKey = currentChallengeDifficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
        const currentDay = updatedChallengeProgress.dailyChallenges[updatedChallengeProgress.currentDay - 1];
        if (currentDay) {
          const completed = currentDay.completedProblems[diffKey].length;
          const required = CHALLENGE_RULES.dailyRequirements[diffKey];
          if (aiResponse.totalScore >= 6) {
            toast.success(`✅ Hoàn thành ${completed}/${required} bài ${currentChallengeDifficulty}!`);
          }
        }
      }

      setGameState(prev => ({
        ...prev,
        screen: 'result',
        aiResponse,
        isLoading: false,
        userThinking: thinking,
        userCode: code,
        selectedLanguage: language,
        interviewAnswers: answers,
      }));

      if (newBadges.length > 0) {
        toast.success(`🏆 Badge mới: ${newBadges.join(', ')}`);
      }
    } catch (error) {
      console.error('Grading error:', error);
      toast.error('Lỗi khi chấm điểm. Vui lòng kiểm tra API key và thử lại.');
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleContinue = () => {
    setGameState({
      screen: 'start',
      mode: 'practice',
      currentProblem: null,
      userThinking: '',
      userCode: '',
      selectedLanguage: 'javascript',
      interviewAnswers: [],
      aiResponse: null,
      isLoading: false,
      timeLeft: 0,
    });
  };

  const handleSaveApiKey = (apiKey: string) => {
    const updatedProgress = { ...progress, apiKey };
    setProgress(updatedProgress);
    saveProgress(updatedProgress);
    toast.success('API key đã được lưu!');
  };

  const handleBack = () => {
    const screenMap: Record<string, GameState['screen']> = {
      problem: 'start',
      solving: 'problem',
      result: 'start',
      progress: 'start',
      problemList: 'start',
    };
    setGameState(prev => ({
      ...prev,
      screen: screenMap[prev.screen] || 'start',
    }));
  };

  const handleSelectProblemFromList = (problem: Problem) => {
    setGameState(prev => ({
      ...prev,
      screen: 'problem',
      mode: 'practice',
      currentProblem: problem,
    }));
  };

  const challengeStats = getChallengeStats(challengeProgress);

  return (
    <div className="min-h-screen">
      {/* Browser Warning - shows once per day */}
      <BrowserWarning />

      {/* Show Certificate if challenge is complete */}
      {challengeStats.isComplete && gameState.screen === 'start' && (
        <div className="fixed inset-0 bg-black/80 z-40 overflow-y-auto py-8">
          <div className="container max-w-3xl mx-auto px-4">
            <ChallengeCertificate progress={challengeProgress} />
            <div className="text-center mt-4">
              <button
                onClick={() => {/* Certificate can be dismissed by scrolling down */}}
                className="text-white/70 hover:text-white text-sm"
              >
                Kéo xuống để xem trang chủ
              </button>
            </div>
          </div>
        </div>
      )}

      {gameState.screen === 'start' && !showLeaderboard && (
        <StartScreen
          challengeProgress={challengeProgress}
          onStart={handleStart}
          onShowProgress={() => setGameState(prev => ({ ...prev, screen: 'progress' }))}
          onOpenApiKey={() => setShowApiKeyModal(true)}
          onSaveApiKey={handleSaveApiKey}
          onSelectProblem={() => setGameState(prev => ({ ...prev, screen: 'problemList' }))}
          onStartChallenge={handleStartChallenge}
          onResetChallenge={handleResetChallenge}
          onStartChallengeProblem={handleStartChallengeProblem}
          onShowLeaderboard={() => setShowLeaderboard(true)}
          onNavigateToAuth={() => navigate('/auth')}
          onSignOut={signOut}
          hasApiKey={!!progress.apiKey}
          currentApiKey={progress.apiKey}
          isAuthenticated={isAuthenticated}
          userProfile={profile}
        />
      )}

      {showLeaderboard && (
        <Leaderboard onBack={() => setShowLeaderboard(false)} />
      )}

      {gameState.screen === 'problem' && gameState.currentProblem && gameState.mode && (
        <ProblemScreen
          problem={gameState.currentProblem}
          mode={gameState.mode}
          onStart={handleStartSolving}
          onBack={handleBack}
        />
      )}

      {gameState.screen === 'solving' && gameState.currentProblem && gameState.mode && (
        <SolvingScreen
          problem={gameState.currentProblem}
          mode={gameState.mode}
          onSubmit={handleSubmit}
          onBack={handleBack}
          isLoading={gameState.isLoading}
        />
      )}

      {gameState.screen === 'result' && gameState.currentProblem && gameState.aiResponse && (
        <ResultScreen
          problem={gameState.currentProblem}
          aiResponse={gameState.aiResponse}
          xpGained={lastXPGained}
          newBadges={lastNewBadges}
          onContinue={handleContinue}
          onViewProgress={() => setGameState(prev => ({ ...prev, screen: 'progress' }))}
        />
      )}

      {gameState.screen === 'progress' && (
        <ProgressScreen
          progress={progress}
          onBack={handleBack}
        />
      )}

      {gameState.screen === 'problemList' && (
        <ProblemListScreen
          onSelectProblem={handleSelectProblemFromList}
          onBack={handleBack}
          completedProblemIds={progress.history.map(h => h.problemId)}
        />
      )}

      <APIKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleSaveApiKey}
        currentKey={progress.apiKey}
      />

      {showProblemSelector && currentChallengeDifficulty && (
        <ChallengeProblemSelector
          difficulty={currentChallengeDifficulty}
          completedProblemIds={
            challengeProgress.dailyChallenges[challengeProgress.currentDay - 1]?.completedProblems[
              currentChallengeDifficulty.toLowerCase() as 'easy' | 'medium' | 'hard'
            ] || []
          }
          allCompletedProblemIds={
            challengeProgress.dailyChallenges.flatMap(day => [
              ...day.completedProblems.easy,
              ...day.completedProblems.medium,
              ...day.completedProblems.hard,
            ])
          }
          onSelectProblem={handleSelectChallengeProblem}
          onClose={() => setShowProblemSelector(false)}
        />
      )}
    </div>
  );
};

export default Index;
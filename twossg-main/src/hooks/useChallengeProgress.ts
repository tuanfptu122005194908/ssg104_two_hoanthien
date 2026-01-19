import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChallengeProgress, DailyChallenge, CHALLENGE_RULES } from '@/types/challenge';
import { useAuth } from './useAuth';
import { problems } from '@/data/problems';

const defaultChallengeProgress: ChallengeProgress = {
  isActive: false,
  startDate: null,
  currentDay: 0,
  consecutiveDays: 0,
  completedDays: 0,
  dailyChallenges: [],
  activityLogs: [],
  lastActivityDate: null,
  failed: false,
  failedReason: undefined,
};

// Get problems by difficulty from the actual problem list
const getProblemsByDifficulty = (difficulty: 'Easy' | 'Medium' | 'Hard'): number[] => {
  return problems.filter(p => p.difficulty === difficulty).map(p => p.id);
};

// Generate random problems ensuring no repeats across days
const generateRandomProblemIds = (
  count: number, 
  difficulty: 'Easy' | 'Medium' | 'Hard',
  excludeIds: number[] = []
): number[] => {
  const availableIds = getProblemsByDifficulty(difficulty).filter(id => !excludeIds.includes(id));
  const shuffled = [...availableIds].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Get all previously used problem IDs from daily challenges
const getUsedProblemIds = (dailyChallenges: DailyChallenge[]): number[] => {
  const usedIds: number[] = [];
  dailyChallenges.forEach(day => {
    usedIds.push(...day.problems.easy, ...day.problems.medium, ...day.problems.hard);
  });
  return usedIds;
};

const generateDailyChallenge = (day: number, date: string, excludeIds: number[] = []): DailyChallenge => {
  const easyProblems = generateRandomProblemIds(3, 'Easy', excludeIds);
  const mediumProblems = generateRandomProblemIds(1, 'Medium', excludeIds);
  const hardProblems = generateRandomProblemIds(1, 'Hard', excludeIds);

  return {
    day,
    date,
    completed: false,
    problems: {
      easy: easyProblems,
      medium: mediumProblems,
      hard: hardProblems,
    },
    completedProblems: {
      easy: [],
      medium: [],
      hard: [],
    },
  };
};

// Check if a date is today
const isToday = (dateStr: string): boolean => {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
};

// Get the date difference in days
const getDaysDifference = (dateStr1: string, dateStr2: string): number => {
  const date1 = new Date(dateStr1);
  const date2 = new Date(dateStr2);
  const diffTime = date2.getTime() - date1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// Validate and update challenge progress based on current date
const validateAndUpdateProgress = (progress: ChallengeProgress): ChallengeProgress => {
  if (!progress.isActive || progress.failed) {
    return progress;
  }

  const today = new Date().toISOString().split('T')[0];
  const lastActivity = progress.lastActivityDate;
  
  if (!lastActivity) {
    return progress;
  }

  // Check if it's still the same day
  if (isToday(lastActivity)) {
    return progress;
  }

  // Get the current day's challenge
  const currentDayChallenge = progress.dailyChallenges[progress.currentDay - 1];
  
  if (!currentDayChallenge) {
    return progress;
  }

  const daysDiff = getDaysDifference(lastActivity, today);

  // If more than 1 day has passed, the user failed
  if (daysDiff > 1) {
    return {
      ...progress,
      isActive: false,
      failed: true,
      failedReason: `Bạn đã bỏ lỡ ${daysDiff - 1} ngày. Thử thách đã kết thúc.`,
    };
  }

  // It's the next day (daysDiff === 1)
  // Check if yesterday's challenge was completed
  if (!currentDayChallenge.completed) {
    return {
      ...progress,
      isActive: false,
      failed: true,
      failedReason: `Bạn chưa hoàn thành đủ 5 bài trong Ngày ${progress.currentDay}. Thử thách đã kết thúc.`,
    };
  }

  // Yesterday was completed, advance to next day
  if (progress.currentDay >= CHALLENGE_RULES.totalDays) {
    // Challenge completed successfully!
    return progress;
  }

  // Generate new daily challenge for today
  const usedIds = getUsedProblemIds(progress.dailyChallenges);
  const newDayNumber = progress.currentDay + 1;
  const newDailyChallenge = generateDailyChallenge(newDayNumber, today, usedIds);

  return {
    ...progress,
    currentDay: newDayNumber,
    dailyChallenges: [...progress.dailyChallenges, newDailyChallenge],
    lastActivityDate: today,
  };
};

export const useChallengeProgress = () => {
  const { user, isAuthenticated } = useAuth();
  const [progress, setProgress] = useState<ChallengeProgress>(defaultChallengeProgress);
  const [loading, setLoading] = useState(true);

  // Load progress from database
  const loadProgress = useCallback(async () => {
    if (!user) {
      setProgress(defaultChallengeProgress);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading progress:', error);
        setProgress(defaultChallengeProgress);
      } else if (data) {
        // Convert database format to ChallengeProgress
        let challengeProgress: ChallengeProgress = {
          isActive: data.is_active,
          startDate: data.start_date,
          currentDay: data.current_day,
          consecutiveDays: data.consecutive_days,
          completedDays: data.completed_days,
          dailyChallenges: (data.daily_challenges as unknown as DailyChallenge[]) || [],
          activityLogs: (data.activity_logs as unknown as any[]) || [],
          lastActivityDate: data.last_activity_date,
          failed: false,
          failedReason: undefined,
        };
        
        // Validate and update based on current date
        challengeProgress = validateAndUpdateProgress(challengeProgress);
        
        // If progress was updated (day advanced or failed), save it
        if (challengeProgress.currentDay !== data.current_day || challengeProgress.failed) {
          await saveProgress(challengeProgress);
        }
        
        setProgress(challengeProgress);
      } else {
        // No progress record yet - will be created on first action
        setProgress(defaultChallengeProgress);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
      setProgress(defaultChallengeProgress);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save progress to database
  const saveProgress = useCallback(async (newProgress: ChallengeProgress) => {
    if (!user) return;

    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const dbData = {
        is_active: newProgress.isActive && !newProgress.failed,
        start_date: newProgress.startDate,
        current_day: newProgress.currentDay,
        consecutive_days: newProgress.consecutiveDays,
        completed_days: newProgress.completedDays,
        daily_challenges: JSON.parse(JSON.stringify(newProgress.dailyChallenges)),
        activity_logs: JSON.parse(JSON.stringify(newProgress.activityLogs)),
        last_activity_date: newProgress.lastActivityDate,
      };

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('user_progress')
          .update(dbData)
          .eq('user_id', user.id);
        if (updateError) console.error('Error updating progress:', updateError);
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            ...dbData,
          });
        if (insertError) console.error('Error inserting progress:', insertError);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [user]);

  // Start challenge
  const startChallenge = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    const newProgress: ChallengeProgress = {
      isActive: true,
      startDate: today,
      currentDay: 1,
      consecutiveDays: 0,
      completedDays: 0,
      dailyChallenges: [generateDailyChallenge(1, today)],
      activityLogs: [],
      lastActivityDate: today,
      failed: false,
      failedReason: undefined,
    };
    
    setProgress(newProgress);
    await saveProgress(newProgress);
    return newProgress;
  }, [saveProgress]);

  // Reset challenge (for users who failed and want to try again)
  const resetChallenge = useCallback(async () => {
    const resetProgress: ChallengeProgress = {
      ...defaultChallengeProgress,
      failed: false,
      failedReason: undefined,
    };
    
    setProgress(resetProgress);
    await saveProgress(resetProgress);
    return resetProgress;
  }, [saveProgress]);

  // Mark problem completed
  const markProblemCompleted = useCallback(async (
    problemId: number,
    difficulty: 'Easy' | 'Medium' | 'Hard',
    score: number
  ) => {
    if (score < CHALLENGE_RULES.minScoreToPass) {
      return progress;
    }

    if (progress.failed) {
      return progress;
    }

    const currentChallenge = progress.dailyChallenges[progress.currentDay - 1];
    if (!currentChallenge) return progress;

    const diffKey = difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
    
    if (currentChallenge.completedProblems[diffKey].includes(problemId)) {
      return progress; // Already completed
    }

    const updatedChallenge: DailyChallenge = {
      ...currentChallenge,
      completedProblems: {
        ...currentChallenge.completedProblems,
        [diffKey]: [...currentChallenge.completedProblems[diffKey], problemId],
      },
    };

    // Check if daily challenge is complete
    const isComplete = 
      updatedChallenge.completedProblems.easy.length >= CHALLENGE_RULES.dailyRequirements.easy &&
      updatedChallenge.completedProblems.medium.length >= CHALLENGE_RULES.dailyRequirements.medium &&
      updatedChallenge.completedProblems.hard.length >= CHALLENGE_RULES.dailyRequirements.hard;

    if (isComplete) {
      updatedChallenge.completed = true;
    }

    const dailyChallenges = [...progress.dailyChallenges];
    dailyChallenges[progress.currentDay - 1] = updatedChallenge;

    const newProgress: ChallengeProgress = {
      ...progress,
      dailyChallenges,
      completedDays: isComplete ? progress.completedDays + 1 : progress.completedDays,
      consecutiveDays: isComplete ? progress.consecutiveDays + 1 : progress.consecutiveDays,
      lastActivityDate: new Date().toISOString().split('T')[0],
    };

    setProgress(newProgress);
    await saveProgress(newProgress);
    return newProgress;
  }, [progress, saveProgress]);

  // Load on mount and when user changes
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    loading,
    startChallenge,
    markProblemCompleted,
    resetChallenge,
    isAuthenticated,
  };
};

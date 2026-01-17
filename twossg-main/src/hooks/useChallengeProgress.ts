import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChallengeProgress, DailyChallenge, CHALLENGE_RULES } from '@/types/challenge';
import { useAuth } from './useAuth';

const defaultChallengeProgress: ChallengeProgress = {
  isActive: false,
  startDate: null,
  currentDay: 0,
  consecutiveDays: 0,
  completedDays: 0,
  dailyChallenges: [],
  activityLogs: [],
  lastActivityDate: null,
};

const generateDailyChallenge = (day: number, date: string): DailyChallenge => {
  const generateRandomProblemIds = (count: number, difficulty: string): number[] => {
    const baseId = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 50 : 80;
    const ids: number[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(baseId + Math.floor(Math.random() * 20) + i);
    }
    return ids;
  };

  const easyProblems = generateRandomProblemIds(3, 'Easy');
  const mediumProblems = generateRandomProblemIds(1, 'Medium');
  const hardProblems = generateRandomProblemIds(1, 'Hard');

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
        const challengeProgress: ChallengeProgress = {
          isActive: data.is_active,
          startDate: data.start_date,
          currentDay: data.current_day,
          consecutiveDays: data.consecutive_days,
          completedDays: data.completed_days,
          dailyChallenges: (data.daily_challenges as unknown as DailyChallenge[]) || [],
          activityLogs: (data.activity_logs as unknown as any[]) || [],
          lastActivityDate: data.last_activity_date,
        };
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

      if (existing) {
        // Update existing
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            is_active: newProgress.isActive,
            start_date: newProgress.startDate,
            current_day: newProgress.currentDay,
            consecutive_days: newProgress.consecutiveDays,
            completed_days: newProgress.completedDays,
            daily_challenges: JSON.parse(JSON.stringify(newProgress.dailyChallenges)),
            activity_logs: JSON.parse(JSON.stringify(newProgress.activityLogs)),
            last_activity_date: newProgress.lastActivityDate,
          })
          .eq('user_id', user.id);
        if (updateError) console.error('Error updating progress:', updateError);
      } else {
        // Insert new
        const { error: insertError } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            is_active: newProgress.isActive,
            start_date: newProgress.startDate,
            current_day: newProgress.currentDay,
            consecutive_days: newProgress.consecutiveDays,
            completed_days: newProgress.completedDays,
            daily_challenges: JSON.parse(JSON.stringify(newProgress.dailyChallenges)),
            activity_logs: JSON.parse(JSON.stringify(newProgress.activityLogs)),
            last_activity_date: newProgress.lastActivityDate,
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
    };
    
    setProgress(newProgress);
    await saveProgress(newProgress);
    return newProgress;
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
    isAuthenticated,
  };
};

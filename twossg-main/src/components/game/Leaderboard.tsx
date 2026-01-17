import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Trophy, Medal, Award, Star, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LeaderboardEntry {
  user_id: string;
  name: string;
  student_id: string;
  total_score: number;
  problems_completed: number;
  avg_score: number;
  current_day: number;
  is_active: boolean;
  joined_at: string;
}

interface LeaderboardProps {
  onBack: () => void;
}

const Leaderboard = ({ onBack }: LeaderboardProps) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Get all users with their progress
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select(`
          user_id,
          is_active,
          current_day,
          completed_days,
          created_at,
          profiles!inner(name, student_id)
        `);

      if (progressError) throw progressError;

      // Get all results
      const { data: results, error: resultsError } = await supabase
        .from('challenge_results')
        .select('user_id, score, day_number');

      if (resultsError) throw resultsError;

      // Aggregate results by user
      const resultsMap = new Map<string, { scores: number[]; maxDay: number }>();
      results?.forEach((result: any) => {
        if (!resultsMap.has(result.user_id)) {
          resultsMap.set(result.user_id, { scores: [], maxDay: 0 });
        }
        const userData = resultsMap.get(result.user_id)!;
        userData.scores.push(result.score);
        userData.maxDay = Math.max(userData.maxDay, result.day_number);
      });

      // Combine data
      const leaderboardData: LeaderboardEntry[] = (progressData || []).map((item: any) => {
        const userResults = resultsMap.get(item.user_id) || { scores: [], maxDay: 0 };
        const totalScore = userResults.scores.reduce((a, b) => a + b, 0);
        
        return {
          user_id: item.user_id,
          name: item.profiles.name,
          student_id: item.profiles.student_id,
          total_score: totalScore,
          problems_completed: userResults.scores.length,
          avg_score: userResults.scores.length > 0 
            ? Math.round(totalScore / userResults.scores.length) 
            : 0,
          current_day: item.current_day || userResults.maxDay,
          is_active: item.is_active,
          joined_at: item.created_at,
        };
      });

      // Sort by total score (active users first, then by score)
      leaderboardData.sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        if (a.total_score !== b.total_score) return b.total_score - a.total_score;
        return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
      });

      setEntries(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_results',
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Star className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    if (rank === 2) return 'bg-gray-400/10 text-gray-400 border-gray-400/30';
    if (rank === 3) return 'bg-amber-600/10 text-amber-600 border-amber-600/30';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto py-8 px-4 max-w-4xl"
    >
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <Button variant="outline" onClick={fetchLeaderboard} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <Card className="border-2 border-primary/20 shadow-xl">
        <CardHeader className="text-center border-b">
          <div className="flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <CardTitle className="text-2xl font-bold">
              Bảng Xếp Hạng Thử Thách 20 Ngày
            </CardTitle>
          </div>
          <p className="text-muted-foreground mt-2">
            Xem thành tích của tất cả người tham gia thử thách
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Đang tải dữ liệu...</span>
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Chưa có ai tham gia thử thách. Hãy là người đầu tiên!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 text-center">Hạng</TableHead>
                  <TableHead>Sinh viên</TableHead>
                  <TableHead className="text-center">Ngày</TableHead>
                  <TableHead className="text-center">Số bài</TableHead>
                  <TableHead className="text-center">Điểm TB</TableHead>
                  <TableHead className="text-center">Tổng điểm</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => (
                  <TableRow
                    key={entry.user_id}
                    className={index < 3 ? 'bg-primary/5' : ''}
                  >
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {getRankIcon(index + 1)}
                        <Badge variant="outline" className={getRankBadge(index + 1)}>
                          #{index + 1}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{entry.name}</p>
                        <p className="text-sm text-muted-foreground">
                          MSV: {entry.student_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.is_active ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                          Ngày {entry.current_day}/20
                        </Badge>
                      ) : entry.problems_completed > 0 ? (
                        <Badge variant="outline">
                          Ngày {entry.current_day}/20
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          Chưa bắt đầu
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{entry.problems_completed}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={entry.avg_score >= 70 ? 'default' : 'secondary'}
                        className={
                          entry.avg_score >= 80
                            ? 'bg-green-500'
                            : entry.avg_score >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }
                      >
                        {entry.avg_score}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-lg font-bold text-primary">
                        {entry.total_score}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Leaderboard;

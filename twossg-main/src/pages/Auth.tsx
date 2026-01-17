import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, LogIn, UserPlus, ArrowLeft } from 'lucide-react';
import { z } from 'zod';

const signUpSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100, 'Tên không được quá 100 ký tự'),
  studentId: z.string().min(5, 'Mã sinh viên phải có ít nhất 5 ký tự').max(20, 'Mã sinh viên không được quá 20 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

const loginSchema = z.object({
  studentId: z.string().min(5, 'Mã sinh viên phải có ít nhất 5 ký tự'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    try {
      if (isLogin) {
        loginSchema.parse({ studentId: formData.studentId, password: formData.password });
      } else {
        signUpSchema.parse(formData);
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Use student ID as email for simplicity
      const email = `${formData.studentId}@student.local`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Mã sinh viên hoặc mật khẩu không đúng');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Đăng nhập thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const email = `${formData.studentId}@student.local`;

      // Check if student ID already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('student_id')
        .eq('student_id', formData.studentId)
        .maybeSingle();

      if (existingProfile) {
        toast.error('Mã sinh viên đã được đăng ký');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Mã sinh viên đã được đăng ký');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            name: formData.name.trim(),
            student_id: formData.studentId.trim(),
          });

        if (profileError) {
          toast.error('Lỗi tạo hồ sơ: ' + profileError.message);
          return;
        }

        // Create initial progress record so user appears on leaderboard
        const { error: progressError } = await supabase
          .from('user_progress')
          .insert({
            user_id: data.user.id,
            is_active: false,
            current_day: 0,
            consecutive_days: 0,
            completed_days: 0,
          });

        if (progressError) {
          console.error('Error creating progress:', progressError);
        }

        toast.success('Đăng ký thành công!');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      handleLogin();
    } else {
      handleSignUp();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              {isLogin ? (
                <LogIn className="w-8 h-8 text-primary" />
              ) : (
                <UserPlus className="w-8 h-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold">
              {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? 'Nhập mã sinh viên và mật khẩu để tiếp tục'
                : 'Tạo tài khoản mới để tham gia thử thách'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Họ và tên
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="studentId" className="flex items-center gap-2">
                  <span className="text-lg">🎓</span>
                  Mã sinh viên
                </Label>
                <Input
                  id="studentId"
                  name="studentId"
                  type="text"
                  placeholder="VD: 2021001234"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  className={errors.studentId ? 'border-destructive' : ''}
                />
                {errors.studentId && (
                  <p className="text-sm text-destructive">{errors.studentId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <span className="text-lg">🔒</span>
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Đang xử lý...
                  </span>
                ) : isLogin ? (
                  'Đăng Nhập'
                ) : (
                  'Đăng Ký'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? (
                  <>
                    Chưa có tài khoản?{' '}
                    <span className="font-semibold text-primary">Đăng ký ngay</span>
                  </>
                ) : (
                  <>
                    Đã có tài khoản?{' '}
                    <span className="font-semibold text-primary">Đăng nhập</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại trang chủ
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;

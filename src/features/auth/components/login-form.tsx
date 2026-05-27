import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/auth-context';

type LoginFormProps = {
  onSuccess: () => void;
};

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setError('');

    try {
      const isSuccess = await login(values.email, values.password);

      if (!isSuccess) {
        setError('Email hoặc mật khẩu không đúng');
        return;
      }

      reset();
      onSuccess();
    } catch {
      setError('Email hoặc mật khẩu không đúng');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-bold text-gray-700">
          Email
        </label>
        <div className="relative">
          <User
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="email"
            {...register('email')}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-indigo-deep"
            placeholder="user@example.com"
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm font-medium text-red-500">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-gray-700">
          Mật khẩu
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-11 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-indigo-deep"
            placeholder="••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-2 text-sm font-medium text-red-500">
            {errors.password.message}
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm font-medium text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-indigo-deep py-4 text-lg font-bold text-white shadow-lg shadow-indigo-deep/20 transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
}

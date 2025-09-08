import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { UserPlus } from 'lucide-react';

interface SignUpFormProps {
  onBackToLogin: () => void;
}

export function SignUpForm({ onBackToLogin }: SignUpFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.fullName) {
      newErrors.fullName = 'Họ và tên là bắt buộc';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    if (!agreeTerms) {
      newErrors.terms = 'Bạn phải đồng ý với điều khoản sử dụng';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Handle sign up logic here
      console.log('Sign up attempt:', formData);
    }
  };

  const handleGoogleSignUp = () => {
    // Handle Google sign up
    console.log('Google sign up');
  };

  const handleFacebookSignUp = () => {
    // Handle Facebook sign up
    console.log('Facebook sign up');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* User Plus Icon */}
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Đăng ký tài khoản</h2>
        <p className="text-gray-600">Tạo tài khoản mới để sử dụng Farm Assistant</p>
      </div>

      {/* Sign Up Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="signup-fullname" className="text-gray-700 mb-2 block">
            Họ và tên *
          </Label>
          <Input
            id="signup-fullname"
            type="text"
            placeholder="Nhập họ và tên của bạn"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className={`w-full bg-gray-50 border-0 focus:bg-white ${errors.fullName ? 'border border-red-500' : ''}`}
            required
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <Label htmlFor="signup-email" className="text-gray-700 mb-2 block">
            Email *
          </Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="Nhập email của bạn"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full bg-gray-50 border-0 focus:bg-white ${errors.email ? 'border border-red-500' : ''}`}
            required
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="signup-phone" className="text-gray-700 mb-2 block">
            Số điện thoại *
          </Label>
          <Input
            id="signup-phone"
            type="tel"
            placeholder="Nhập số điện thoại"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full bg-gray-50 border-0 focus:bg-white ${errors.phone ? 'border border-red-500' : ''}`}
            required
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        <div>
          <Label htmlFor="signup-password" className="text-gray-700 mb-2 block">
            Mật khẩu *
          </Label>
          <Input
            id="signup-password"
            type="password"
            placeholder="Nhập mật khẩu"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={`w-full bg-gray-50 border-0 focus:bg-white ${errors.password ? 'border border-red-500' : ''}`}
            required
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <Label htmlFor="signup-confirm-password" className="text-gray-700 mb-2 block">
            Xác nhận mật khẩu *
          </Label>
          <Input
            id="signup-confirm-password"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={`w-full bg-gray-50 border-0 focus:bg-white ${errors.confirmPassword ? 'border border-red-500' : ''}`}
            required
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
              Tôi đồng ý với{' '}
              <button type="button" className="text-green-600 hover:text-green-700 underline">
                Điều khoản sử dụng
              </button>
              {' '}và{' '}
              <button type="button" className="text-green-600 hover:text-green-700 underline">
                Chính sách bảo mật
              </button>
              {' '}của Farm Assistant
            </Label>
          </div>
          {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}
        </div>

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
        >
          Đăng ký tài khoản
        </Button>
      </form>

      {/* Login Link */}
      <div className="text-center mt-6">
        <span className="text-gray-600">Đã có tài khoản? </span>
        <button
          onClick={onBackToLogin}
          className="text-green-600 hover:text-green-700 font-medium"
        >
          Đăng nhập ngay
        </button>
      </div>

      {/* Social Sign Up */}
      <div className="mt-8">
        <div className="text-center text-gray-500 mb-4">
          Hoặc đăng ký bằng
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignUp}
            className="flex items-center justify-center space-x-2 py-3 border-gray-300 hover:bg-gray-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Google</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleFacebookSignUp}
            className="flex items-center justify-center space-x-2 py-3 border-gray-300 hover:bg-gray-50"
          >
            <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Facebook</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
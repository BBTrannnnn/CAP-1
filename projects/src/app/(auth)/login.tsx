import { AntDesign, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform } from 'react-native';
import { Check } from 'lucide-react-native';
import { Button, Card, Checkbox, Input, Label, Separator, Text, Theme, XStack, YStack, Spinner } from 'tamagui';

// ⬇️ import API đã đóng gói
// ĐỔI đường dẫn này tới file users.js của bạn (ví dụ '@/api/users' hoặc '../../lib/users')
import { login, setBaseUrl } from './../../server/users';

// Logo app (đường dẫn đúng với cấu trúc bạn đang có)
const Logo = require('../../assets/images/FlowState.png');

// Tùy chọn: suy ra BASE_URL theo môi trường để test nhanh
const inferBaseUrl = () => {
  // Ưu tiên ENV (đặt trong app.json -> expo.extra.expoPublicApiUrl)
  // @ts-ignore
  const envBase = process.env.EXPO_PUBLIC_API_URL as string | undefined;
  if (envBase) return envBase;

  // Android emulator không dùng localhost
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';

  // iOS simulator / web dev
  return 'http://localhost:5000';
};

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [pw, setPw] = useState<string>('');
  const [remember, setRemember] = useState<boolean>(false);
  const [showPw, setShowPw] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Nhớ email (nếu user tick)
  useEffect(() => {
    (async () => {
      try {
        const url = inferBaseUrl();
        setBaseUrl(url);
        // Lazy-load remember email
        const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
        const saved = await AsyncStorage.getItem('remember_email');
        if (saved) {
          setEmail(saved);
          setRemember(true);
        }
      } catch { }
    })();
  }, []);

  const onSubmit = async () => {
    if (!email.trim() || !pw.trim()) {
      alert('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setLoading(true);
    try {
      const res = await login({ email: email.trim(), password: pw });

      if (__DEV__) console.log('[Login] API success:', res);

      // Ưu tiên message từ API (tùy backend có thể ở res.message hoặc res.data.message)
      const apiMessage =
        res?.message ||
        res?.data?.message ||
        'Đăng nhập thành công!';

      alert('Thành công');
      router.replace("/(tabs)/home");

      // (Tuỳ chọn) Lưu email nếu nhớ
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      if (remember) {
        await AsyncStorage.setItem('remember_email', email.trim());
      } else {
        await AsyncStorage.removeItem('remember_email');
      }
    } catch (err: any) {
      if (__DEV__) console.error('[Login] API error:', err?.status, err?.data || err);

      const msg =
        err?.response?.data?.message || // axios style
        err?.data?.message ||           // fetch wrapper tự gán
        err?.message ||                 // fallback chung
        'Đăng nhập thất bại. Vui lòng thử lại.';

      alert(String(msg));
    } finally {
      setLoading(false);
    }
  };


  return (
    <Theme name='light'>
      <YStack flex={1} alignItems='center' justifyContent='center' padding={16} backgroundColor='#9CD0E4'>
        <Image source={Logo} style={{ width: 120, height: 120, resizeMode: 'contain', marginBottom: 24 }} />

        <Card
          width='90%'
          maxWidth={420}
          paddingHorizontal={20}
          paddingVertical={20}
          borderRadius={16}
          elevation={2}
          bordered
        >
          <YStack>
            {/* Title + subtitle */}
            <Text fontSize={24} fontWeight='600' marginBottom={4}>
              Chào mừng trở lại!
            </Text>
            <Text fontSize={13} color='#585858' marginBottom={16}>
              Tiếp tục hành trình <Text fontWeight='700'>FlowState</Text> của bạn
            </Text>

            {/* Email */}
            <Label fontSize={14} fontWeight='500' color='#585858' marginBottom={8}>
              Email
            </Label>
            <XStack
              alignItems='center'
              height={56}
              borderRadius={12}
              borderWidth={1}
              backgroundColor='#F8F8F8'
              borderColor='#E4E4E4'
              paddingHorizontal={12}
              marginBottom={16}
            >
              <MaterialCommunityIcons name='email-outline' size={18} color='#8C8C8C' />
              <Input
                flex={1}
                height={56}
                fontSize={16}
                placeholder='Nhập email của bạn'
                value={email}
                onChangeText={setEmail}
                keyboardType='email-address'
                autoCapitalize='none'
                autoCorrect={false}
                backgroundColor='transparent'
                marginLeft={8}
              />
            </XStack>

            {/* Password */}
            <Label fontSize={14} fontWeight='500' color='#585858' marginBottom={8}>
              Mật khẩu
            </Label>
            <XStack
              alignItems='center'
              height={56}
              borderRadius={12}
              borderWidth={1}
              backgroundColor='#F8F8F8'
              borderColor='#E4E4E4'
              paddingHorizontal={12}
            >
              <MaterialCommunityIcons name='lock-outline' size={18} color='#8C8C8C' />
              <Input
                flex={1}
                height={56}
                fontSize={16}
                placeholder='Nhập mật khẩu'
                secureTextEntry={!showPw}
                value={pw}
                onChangeText={setPw}
                backgroundColor='transparent'
                marginLeft={8}
              />
              <Button onPress={() => setShowPw((v) => !v)} backgroundColor='transparent' height={36} width={36}>
                {showPw ? (
                  <MaterialCommunityIcons name='eye-off-outline' size={20} color='#8C8C8C' />
                ) : (
                  <MaterialCommunityIcons name='eye-outline' size={20} color='#8C8C8C' />
                )}
              </Button>
            </XStack>

            {/* Remember + Forgot */}
            <XStack alignItems="center" justifyContent="space-between" marginTop={8} marginBottom={12}>
              <XStack alignItems="center" gap="$3">
                <Checkbox
                  id="remember"
                  size="$3"
                  onCheckedChange={(val) => {
                    // Narrow the runtime type before comparisons to satisfy TypeScript unions
                    if (typeof val === 'boolean') {
                      setRemember(val);
                    } else if (typeof val === 'string') {
                      setRemember(val === 'true' || val === '$true');
                    } else {
                      setRemember(false);
                    }
                  }}   // val: boolean | 'indeterminate'
                  backgroundColor={remember ? '#085C9C' : '#FFFFFF'}
                  borderColor={remember ? '#085C9C' : '#E4E4E4'}
                  borderWidth={1}
                  borderRadius={6}
                  hitSlop={8}
                >
                  <Checkbox.Indicator>
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </Checkbox.Indicator>
                </Checkbox>

                {/* Nhấn vào chữ cũng toggle */}
                <Label
                  htmlFor="remember"
                  fontSize={13}
                  color="#585858"
                  onPress={() => setRemember((v) => !v)}
                >
                  Nhớ mật khẩu
                </Label>
              </XStack>

              <Link href='/(auth)/forgot_password' asChild>
                <Text fontSize={14} fontWeight="500" color="#085C9C">
                  Quên mật khẩu?
                </Text>
              </Link>
            </XStack>


            {/* Login button with icon */}
            <Button
              height={56}
              borderRadius={12}
              backgroundColor='#085C9C'
              pressStyle={{ backgroundColor: '#2870A8' }}
              hoverStyle={{ backgroundColor: '#2870A8' }}
              onPress={onSubmit}
              disabled={loading}
            >
              <XStack alignItems='center' space={8}>
                {loading ? (
                  <Spinner size='small' />
                ) : (
                  <MaterialIcons name='login' size={20} color='#FFFFFF' />
                )}
                <Text fontSize={16} fontWeight='600' color='white'>
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Text>
              </XStack>
            </Button>

            {/* Separator */}
            <XStack alignItems='center' marginVertical={12}>
              <Separator flex={1} backgroundColor='#E0E6EE' />
              <Text fontSize={12} color='#585858' style={{ marginHorizontal: 12 }}>
                Hoặc
              </Text>
              <Separator flex={1} backgroundColor='#E0E6EE' />
            </XStack>

            {/* Google button with icon */}


            {/* Register */}
            <Text textAlign='center' marginTop={12} color='#585858' fontSize={14}>
              Chưa có tài khoản?{' '}
              <Link href='/(auth)/register' asChild>
                <Text fontWeight='600' color='#085C9C'>
                  Đăng ký ngay
                </Text>
              </Link>
            </Text>
          </YStack>
        </Card>

        {/* Legal text */}
        <Text
          textAlign='center'
          color='#585858'
          fontSize={12}
          style={{ marginTop: 16, marginBottom: 16, opacity: 0.9 }}
        >
          Bằng cách đăng nhập bạn đồng ý với <Text style={{ color: '#085C9C' }}>điều khoản sử dụng</Text> và{' '}
          <Text style={{ color: '#085C9C' }}>chính sách bảo mật</Text> của chúng tôi
        </Text>
      </YStack>
    </Theme>
  );
}

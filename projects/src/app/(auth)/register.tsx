// app/(auth)/register.tsx
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform } from 'react-native';
import {
  Button,
  Card,
  Checkbox,
  Input,
  Label,
  ScrollView,
  Separator,
  Text,
  Theme,
  XStack,
  YStack,
  Spinner,
} from 'tamagui';

import { register as apiRegister, setBaseUrl } from './../../server/users';
import { Check } from 'lucide-react';

// Logo app
const Logo = require('../../assets/images/FlowState.png');

// Suy ra BASE_URL khi dev (có thể thay bằng ENV EXPO_PUBLIC_API_URL)
const inferBaseUrl = () => {
  const envBase = process.env.EXPO_PUBLIC_API_URL as string | undefined;
  if (envBase) return envBase;
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  return 'http://localhost:5000';
};

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const base = inferBaseUrl();
    setBaseUrl(base);
    if (__DEV__) {
      console.log('[Register] BASE_URL set to:', base);
    }
  }, []);

  const validate = () => {
    if (__DEV__) console.log('[Register] Validating form...');
    if (!fullName.trim()) return 'Vui lòng nhập họ và tên';
    if (!email.trim()) return 'Vui lòng nhập email';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) return 'Email không hợp lệ';
    if (!phone.trim()) return 'Vui lòng nhập số điện thoại';
    if (pw.length < 6) return 'Mật khẩu tối thiểu 6 ký tự';
    if (pw !== confirmPw) return 'Mật khẩu xác nhận không khớp';
    if (!agree) return 'Bạn cần đồng ý với điều khoản để tiếp tục';
    return '';
  };

  const onRegister = async () => {
    const msg = validate();
    if (msg) {
      if (__DEV__) console.warn('[Register] Validate failed:', msg);
      alert(msg);
      return;
    }

    // Chuẩn bị payload (mask mật khẩu khi log)
    const payload = {
      name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: pw,
      confirmPassword: confirmPw,
    };

    if (__DEV__) {
      console.log('[Register] Submitting payload:', {
        ...payload,
        password: '***',
        confirmPassword: '***',
      });
    }

    setLoading(true);
    try {
      console.time?.('[Register] apiRegister');
      const res = await apiRegister(payload);
      console.timeEnd?.('[Register] apiRegister');

      if (__DEV__) {
        console.log('[Register] API success:', res);
      }

      // Ưu tiên message từ API
      const apiMessage =
        res?.message ||
        res?.data?.message ||
        'Tạo tài khoản thành công. Vui lòng đăng nhập.';

      alert('Thành công', apiMessage, [
        {
          text: 'OK',
          onPress: () => {
            if (__DEV__) console.log('[Register] Navigating to /login');
           
          },
        },
      ]);
       router.replace('/(auth)/login');
    } catch (err: any) {
      if (__DEV__) {
        console.error('[Register] API error:', err?.status, err?.data || err);
      }
      const e =
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Đăng ký thất bại. Vui lòng thử lại.';

      alert(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Theme name="light">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          backgroundColor="#9CD0E4"
        >
          <Image source={Logo} style={{ width: 120, height: 120, resizeMode: 'contain', marginBottom: 24 }} />

          <Card width="90%" maxWidth={420} paddingHorizontal={20} paddingVertical={20} borderRadius={16} elevation={2} bordered>
            <YStack>
              <Text fontSize={24} fontWeight="600" marginBottom={4}>
                Tạo tài khoản mới
              </Text>
              <Text fontSize={13} color="#585858" marginBottom={16}>
                Tham gia cùng <Text fontWeight="700">FlowState</Text> ngay hôm nay
              </Text>

              {/* Full name */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>
                Họ và tên
              </Label>
              <XStack
                alignItems="center"
                height={56}
                borderRadius={12}
                borderWidth={1}
                backgroundColor="#F8F8F8"
                borderColor="#E4E4E4"
                paddingHorizontal={12}
                marginBottom={16}
              >
                <MaterialCommunityIcons name="account-outline" size={18} color="#8C8C8C" />
                <Input
                  flex={1}
                  height={56}
                  fontSize={16}
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChangeText={(v) => {
                    setFullName(v);
                    if (__DEV__) console.log('[Register] fullName changed:', v);
                  }}
                  autoCapitalize="words"
                  backgroundColor="transparent"
                  borderWidth={0}
                  marginLeft={8}
                />
              </XStack>

              {/* Email */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>
                Email
              </Label>
              <XStack
                alignItems="center"
                height={56}
                borderRadius={12}
                borderWidth={1}
                backgroundColor="#F8F8F8"
                borderColor="#E4E4E4"
                paddingHorizontal={12}
                marginBottom={16}
              >
                <MaterialCommunityIcons name="email-outline" size={18} color="#8C8C8C" />
                <Input
                  flex={1}
                  height={56}
                  fontSize={16}
                  placeholder="Nhập email"
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (__DEV__) console.log('[Register] email changed:', v);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  backgroundColor="transparent"
                  borderWidth={0}
                  marginLeft={8}
                />
              </XStack>

              {/* Phone */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>
                Số điện thoại
              </Label>
              <XStack
                alignItems="center"
                height={56}
                borderRadius={12}
                borderWidth={1}
                backgroundColor="#F8F8F8"
                borderColor="#E4E4E4"
                paddingHorizontal={12}
                marginBottom={16}
              >
                <MaterialCommunityIcons name="phone-outline" size={18} color="#8C8C8C" />
                <Input
                  flex={1}
                  height={56}
                  fontSize={16}
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChangeText={(v) => {
                    setPhone(v);
                    if (__DEV__) console.log('[Register] phone changed:', v);
                  }}
                  keyboardType="phone-pad"
                  backgroundColor="transparent"
                  borderWidth={0}
                  marginLeft={8}
                />
              </XStack>

              {/* Password */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>
                Mật khẩu
              </Label>
              <Input
                height={56}
                fontSize={16}
                placeholder="Nhập mật khẩu"
                secureTextEntry
                value={pw}
                onChangeText={(v) => {
                  setPw(v);
                  if (__DEV__) console.log('[Register] password changed: ***');
                }}
                borderRadius={12}
                borderWidth={1}
                backgroundColor="#F8F8F8"
                borderColor="#E4E4E4"
                paddingHorizontal={12}
                marginBottom={16}
              />

              {/* Confirm Password */}
              <Label fontSize={14} fontWeight="500" color="#585858" marginBottom={8}>
                Xác nhận mật khẩu
              </Label>
              <Input
                height={56}
                fontSize={16}
                placeholder="Nhập lại mật khẩu"
                secureTextEntry
                value={confirmPw}
                onChangeText={(v) => {
                  setConfirmPw(v);
                  if (__DEV__) console.log('[Register] confirmPassword changed: ***');
                }}
                borderRadius={12}
                borderWidth={1}
                backgroundColor="#F8F8F8"
                borderColor="#E4E4E4"
                paddingHorizontal={12}
                marginBottom={16}
              />

              {/* Agree terms */}
              <XStack alignItems="center" marginBottom={20} space="$3">
                <Checkbox
                  id="agree"
                  size="$3"
                  checked={agree}
                  onCheckedChange={(val) => {
                    const b = !!val;
                    setAgree(b);
                    if (__DEV__) console.log('[Register] agree toggled:', b);
                  }}
                  backgroundColor={agree ? '#085C9C' : '#FFFFFF'}
                  borderColor={agree ? '#085C9C' : '#E4E4E4'}
                  borderWidth={1}
                  borderRadius={6}
                  pressStyle={{ opacity: 0.85 }}
                  focusStyle={{ outlineWidth: 2, outlineColor: '#085C9C' }}
                  hitSlop={8}
                >
                  <Checkbox.Indicator>
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </Checkbox.Indicator>
                </Checkbox>

                <Label
                  htmlFor="agree"
                  fontSize={13}
                  color="#585858"
                  onPress={() => setAgree((v) => !v)}
                >
                  Tôi đồng ý với <Text style={{ color: '#085C9C' }}>Điều khoản</Text> &{' '}
                  <Text style={{ color: '#085C9C' }}>Chính sách bảo mật</Text>
                </Label>
              </XStack>

              {/* Register button */}
              <Button
                height={56}
                borderRadius={12}
                backgroundColor="#085C9C"
                pressStyle={{ backgroundColor: '#2870A8' }}
                hoverStyle={{ backgroundColor: '#2870A8' }}
                onPress={onRegister}
                disabled={loading}
              >
                <XStack alignItems="center" justifyContent="center" space={8}>
                  {loading ? <Spinner size="small" /> : null}
                  <Text fontSize={16} fontWeight="600" color="white">
                    {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
                  </Text>
                </XStack>
              </Button>

              {/* Separator */}
              <XStack alignItems="center" marginVertical={12}>
                <Separator flex={1} backgroundColor="#E0E6EE" />
                <Text fontSize={12} color="#585858" style={{ marginHorizontal: 12 }}>
                  Hoặc
                </Text>
                <Separator flex={1} backgroundColor="#E0E6EE" />
              </XStack>

              {/* Link back to login */}
              <Text textAlign="center" marginTop={12} color="#585858" fontSize={14}>
                Đã có tài khoản?{' '}
                <Link href="/(auth)/login" asChild>
                  <Text fontWeight="600" color="#085C9C">
                    Đăng nhập
                  </Text>
                </Link>
              </Text>
            </YStack>
          </Card>
        </ScrollView>
      </Theme>
    </>
  );
}

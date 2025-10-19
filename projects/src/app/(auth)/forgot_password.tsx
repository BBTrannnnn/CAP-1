// app/(auth)/forgot_password.tsx
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Card, Input, Label, Separator, Text, Theme, XStack, YStack } from 'tamagui';

// API client (đúng theo dự án của bạn)
import {
  forgotPassword,     // client đã xử lý gửi dạng query param/string theo BE của bạn
  verifyOTP,          // body: { email, otp }
  resetPassword,      // body: { email, otp, newPassword }
} from './../../server/users';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePasswordRules(pw: string, email?: string) {
  const errors: string[] = [];
  if (pw.length < 6) errors.push('Mật khẩu cần ít nhất 6 ký tự.');
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw)) errors.push('Mật khẩu cần kết hợp chữ hoa và chữ thường.');
  if (email) {
    const local = email.split('@')[0] || '';
    if (local && local.length >= 3 && pw.toLowerCase().includes(local.toLowerCase())) {
      errors.push('Mật khẩu không được chứa thông tin cá nhân (email).');
    }
  }
  return errors;
}

export default function ForgotPassword() {
  // step: 1 = nhập email, 2 = nhập mật khẩu mới, 3 = nhập mã OTP
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // common
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // password step
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // OTP step
  const [codeInput, setCodeInput] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const router = useRouter();

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  // STEP 1: gọi /forgotpassword để BE gửi mã OTP về email
  const handleSendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ.');
      return;
    }
    setLoading(true);
    try {
      if (__DEV__) console.log('[ForgotPw] POST /forgotpassword', cleanEmail);
      // forgotPassword nhận string, client sẽ tự build query param đúng theo BE
      const res = await forgotPassword(cleanEmail);
      if (__DEV__) console.log('[ForgotPw] forgotPassword res:', res);

      Alert.alert('Đã gửi mã', 'Mã xác nhận đã được gửi tới email của bạn.');
      setResendCountdown(60);
      setStep(2);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể gửi mã. Vui lòng thử lại.';
      Alert.alert('Lỗi', String(msg));
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: chỉ validate mật khẩu rồi chuyển bước 3 (KHÔNG gọi API)
  const handleSetPasswordAndContinue = () => {
    const cleanEmail = email.trim().toLowerCase();
    const errs = validatePasswordRules(newPassword, cleanEmail);
    if (errs.length) {
      Alert.alert('Mật khẩu không hợp lệ', errs.join('\n'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!resendCountdown) setResendCountdown(60);
    setStep(3);
  };

  // STEP 3: verify OTP -> nếu OK mới reset password
const handleVerifyAndFinish = async () => {
  const cleanEmail = email.trim().toLowerCase();
  const otp = codeInput.trim();

  if (otp.length !== 6) {
    Alert.alert('Lỗi', 'Nhập mã xác nhận 6 chữ số.');
    return;
  }

  setLoading(true);
  try {
    // 1) VERIFY OTP
    if (__DEV__) console.log('[ForgotPw] POST /verifyOTP', { email: cleanEmail, otp });
    const v = await verifyOTP({ email: cleanEmail, otp });
    if (__DEV__) console.log('[ForgotPw] verifyOTP res:', v);

    // 2) RESET PASSWORD (chỉ chạy nếu verify OTP không ném lỗi)
    const payload = { email: cleanEmail, password : newPassword, confirmPassword };
    if (__DEV__) console.log('[ForgotPw] POST /resetpassword', payload);
    const r = await resetPassword(payload);
    if (__DEV__) console.log('[ForgotPw] resetPassword res:', r);

    Alert.alert('Thành công', 'Mật khẩu của bạn đã được đặt lại. Bạn có thể đăng nhập.', [
      {
        text: 'OK',
        onPress: () => {
          setStep(1);
          setEmail('');
          setNewPassword('');
          setConfirmPassword('');
          setCodeInput('');
          router.replace('/(auth)/login');
        },
      },
    ]);
  } catch (err: any) {
    // Tách thông điệp để biết lỗi ở bước nào
    const apiMsg = err?.data?.message || err?.message || '';
    const isVerifyError = apiMsg?.toLowerCase().includes('otp') || apiMsg?.toLowerCase().includes('verify');
    const friendly = isVerifyError
      ? 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.'
      : 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
    Alert.alert('Lỗi', friendly + (apiMsg ? `\n\nChi tiết: ${apiMsg}` : ''));
    if (__DEV__) console.error('[ForgotPw] verify/reset error:', err);
  } finally {
    setLoading(false);
  }
};


  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      Alert.alert('Lỗi', 'Email không hợp lệ.');
      return;
    }
    setLoading(true);
    try {
      if (__DEV__) console.log('[ForgotPw] resend OTP /forgotpassword', cleanEmail);
      await forgotPassword(cleanEmail); // gửi lại OTP
      setResendCountdown(60);
      Alert.alert('Đã gửi lại', 'Mã xác nhận đã được gửi lại.');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể gửi lại mã.';
      Alert.alert('Lỗi', String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Theme name="light">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: '#9CD0E4' }}
          >
            <YStack alignItems="center" width="100%">
              <Card
                width="92%"
                maxWidth={520}
                paddingHorizontal={18}
                paddingVertical={18}
                borderRadius={12}
                elevation={2}
                bordered
              >
                <YStack space>
                  <Text fontSize={20} fontWeight="700" textAlign="center" marginBottom={6}>
                    Quên mật khẩu
                  </Text>

                  {/* STEP INDICATOR */}
                  <XStack alignItems="center" justifyContent="center" space>
                    <Text
                      width={32}
                      height={32}
                      borderRadius={16}
                      backgroundColor={step === 1 ? '#085C9C' : '#0685e5ff'}
                      alignItems="center"
                      justifyContent="center"
                      display="flex"
                      color="white"
                    >
                      1
                    </Text>
                    <Separator width={30} />
                    <Text
                      width={32}
                      height={32}
                      borderRadius={16}
                      backgroundColor={step === 2 ? '#085C9C' : '#0685e5ff'}
                      alignItems="center"
                      justifyContent="center"
                      display="flex"
                      color="white"
                    >
                      2
                    </Text>
                    <Separator width={30} />
                    <Text
                      width={32}
                      height={32}
                      borderRadius={16}
                      backgroundColor={step === 3 ? '#085C9C' : '#0685e5ff'}
                      alignItems="center"
                      justifyContent="center"
                      display="flex"
                      color="white"
                    >
                      3
                    </Text>
                  </XStack>

                  {/* --- STEP 1 --- */}
                  {step === 1 && (
                    <YStack space>
                      <Label fontSize={14} fontWeight="500" color="#585858">
                        Email đăng ký
                      </Label>
                      <FontAwesome name="envelope" size={200} color="#085C9C" style={{ margin: 'auto' }} />

                      <XStack
                        alignItems="center"
                        height={52}
                        borderRadius={10}
                        borderWidth={1}
                        backgroundColor="#F8F8F8"
                        borderColor="#E4E4E4"
                        paddingHorizontal={12}
                      >
                        <MaterialCommunityIcons name="email-outline" size={18} color="#8C8C8C" />
                        <Input
                          flex={1}
                          height={52}
                          placeholder="Nhập email của bạn"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          borderWidth={0}
                          backgroundColor="transparent"
                          marginLeft={8}
                        />
                      </XStack>

                      <Button
                        height={50}
                        borderRadius={10}
                        backgroundColor="#085C9C"
                        pressStyle={{ backgroundColor: '#2870A8' }}
                        hoverStyle={{ backgroundColor: '#0A6FBF' }}
                        focusStyle={{ borderColor: '#0A6FBF', borderWidth: 2 }}
                        onPress={handleSendCode}
                        disabled={loading}
                      >
                        <Text fontSize={15} color="white" fontWeight="600">
                          {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                        </Text>
                      </Button>
                    </YStack>
                  )}

                  {/* --- STEP 2 --- */}
                  {step === 2 && (
                    <YStack space>
                      <FontAwesome name="lock" size={200} color="#dddd00" style={{ margin: 'auto' }} />
                      <Label fontSize={14} fontWeight="500" color="#585858">
                        Mật khẩu mới
                      </Label>

                      <XStack
                        alignItems="center"
                        height={52}
                        borderRadius={10}
                        borderWidth={1}
                        backgroundColor="#F8F8F8"
                        borderColor="#E4E4E4"
                        paddingHorizontal={12}
                      >
                        <MaterialCommunityIcons name="lock-outline" size={18} color="#8C8C8C" />
                        <Input
                          flex={1}
                          height={52}
                          placeholder="Nhập mật khẩu mới"
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry={!showPw}
                          borderWidth={0}
                          backgroundColor="transparent"
                          marginLeft={8}
                          outlineWidth={0}
                        />
                        <Button
                          onPress={() => setShowPw((s) => !s)}
                          backgroundColor="transparent"
                          height={36}
                          width={36}
                        >
                          <MaterialCommunityIcons
                            name={showPw ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color="#8C8C8C"
                          />
                        </Button>
                      </XStack>

                      <Label fontSize={14} fontWeight="500" color="#585858">
                        Xác nhận mật khẩu
                      </Label>

                      <XStack
                        alignItems="center"
                        height={52}
                        borderRadius={10}
                        borderWidth={1}
                        backgroundColor="#F8F8F8"
                        borderColor="#E4E4E4"
                        paddingHorizontal={12}
                      >
                        <MaterialCommunityIcons name="lock-check-outline" size={18} color="#8C8C8C" />
                        <Input
                          flex={1}
                          height={52}
                          placeholder="Nhập lại mật khẩu"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry
                          borderWidth={0}
                          backgroundColor="transparent"
                          marginLeft={8}
                          outlineWidth={0}
                        />
                      </XStack>

                      <Text fontSize={12} color="#666" marginTop={6}>
                        Yêu cầu: ít nhất 6 ký tự, kết hợp chữ hoa + chữ thường, không dùng thông tin cá nhân.
                      </Text>

                      <XStack space alignItems="center" justifyContent="space-between">
                        <Button
                          height={48}
                          width="48%"
                          borderRadius={10}
                          backgroundColor="#E6EEF6"
                          onPress={() => setStep(1)}
                        >
                          <Text color="#085C9C" fontWeight="600">
                            Quay lại
                          </Text>
                        </Button>

                        <Button
                          height={48}
                          width="48%"
                          borderRadius={10}
                          backgroundColor="#085C9C"
                          onPress={handleSetPasswordAndContinue}
                        >
                          <Text color="white" fontWeight="600">
                            Tiếp tục
                          </Text>
                        </Button>
                      </XStack>
                    </YStack>
                  )}

                  {/* --- STEP 3 --- */}
                  {step === 3 && (
                    <YStack space>
                      <FontAwesome name="key" size={200} color="red" style={{ margin: 'auto' }} />
                      <Label fontSize={14} fontWeight="500" color="#585858">
                        Nhập mã xác nhận (6 chữ số)
                      </Label>

                      <XStack
                        alignItems="center"
                        height={52}
                        borderRadius={10}
                        borderWidth={1}
                        backgroundColor="#F8F8F8"
                        borderColor="#E4E4E4"
                        paddingHorizontal={12}
                      >
                        <MaterialCommunityIcons
                          name="message-text-outline"
                          size={18}
                          color="#8C8C8C"
                        />
                        <Input
                          flex={1}
                          height={52}
                          placeholder="123456"
                          value={codeInput}
                          onChangeText={(t) => setCodeInput(t.replace(/[^0-9]/g, '').slice(0, 6))}
                          keyboardType="numeric"
                          borderWidth={0}
                          backgroundColor="transparent"
                          marginLeft={8}
                        />
                      </XStack>

                      <XStack alignItems="center" justifyContent="space-between">
                        <Text fontSize={12} color="#666">
                          Mã sẽ được gửi tới email của bạn.
                        </Text>
                        <Button
                          height={36}
                          borderRadius={8}
                          backgroundColor={resendCountdown > 0 ? '#F1F1F1' : '#FFFFFF'}
                          borderWidth={1}
                          borderColor="#E4E4E4"
                          onPress={handleResendCode}
                          disabled={resendCountdown > 0 || loading}
                        >
                          <Text
                            fontSize={13}
                            color={resendCountdown > 0 ? '#8C8C8C' : '#085C9C'}
                          >
                            {resendCountdown > 0 ? `Gửi lại (${resendCountdown}s)` : 'Gửi lại mã'}
                          </Text>
                        </Button>
                      </XStack>

                      <XStack space alignItems="center" justifyContent="space-between">
                        <Button
                          height={48}
                          width="48%"
                          borderRadius={10}
                          backgroundColor="#E6EEF6"
                          onPress={() => setStep(2)}
                        >
                          <Text color="#085C9C" fontWeight="600">
                            Quay lại
                          </Text>
                        </Button>

                        <Button
                          height={48}
                          width="48%"
                          borderRadius={10}
                          backgroundColor="#085C9C"
                          onPress={handleVerifyAndFinish}
                          disabled={loading}
                        >
                          <Text color="white" fontWeight="600">
                            {loading ? 'Đang xử lý...' : 'Xác nhận'}
                          </Text>
                        </Button>
                      </XStack>
                    </YStack>
                  )}
                </YStack>
              </Card>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </Theme>
    </>
  );
}

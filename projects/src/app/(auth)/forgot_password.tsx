// app/(auth)/forgot_password.tsx
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Card, Input, Label, Separator, Text, Theme, XStack, YStack } from 'tamagui';

// API client
import {
  forgotPassword,
  verifyOTP,
  resetPassword,
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

/** ==== ALERT HELPERS (thống nhất hiển thị) ==== */
const showInfo = (msg: string, title = 'Thông báo') => alert(title, msg);
const showSuccess = (msg: string, title = 'Thành công') => alert(title, msg);
const showErr = (msg: string, title = 'Lỗi') => alert(title, msg);

export default function ForgotPassword() {
  // step: 1 = nhập email, 2 = nhập OTP, 3 = nhập mật khẩu mới
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // common
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // password step (step 3)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // OTP step (step 2)
  const [codeInput, setCodeInput] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  // STEP 1: gửi OTP
  const handleSendCode = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      showErr('Vui lòng nhập email hợp lệ.');
      return;
    }
    setLoading(true);
    try {
      if (__DEV__) console.log('[ForgotPw] POST /forgotpassword', cleanEmail);
      await forgotPassword(cleanEmail);
      showInfo('Mã xác nhận đã được gửi tới email của bạn.', 'Đã gửi mã');
      setOtpVerified(false);
      setResendCountdown(60);
      setStep(2);
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể gửi mã. Vui lòng thử lại.';
      showErr(String(msg));
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: verify OTP
  const handleVerifyOTPOnly = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const otp = codeInput.trim();

    if (!isValidEmail(cleanEmail)) {
      showErr('Email không hợp lệ.');
      return;
    }
    if (otp.length !== 6) {
      showErr('Nhập mã xác nhận 6 chữ số.');
      return;
    }

    setLoading(true);
    try {
      if (__DEV__) console.log('[ForgotPw] POST /verifyOTP', { email: cleanEmail, otp });
      const v = await verifyOTP({ email: cleanEmail, otp });
      if (__DEV__) console.log('[ForgotPw] verifyOTP res:', v);

      setOtpVerified(true);
      showSuccess('Mã OTP hợp lệ. Vui lòng đặt mật khẩu mới.');
      setStep(3);
    } catch (err: any) {
      const apiMsg = err?.data?.message || err?.message || '';
      const friendly = 'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.';
      showErr(friendly + (apiMsg ? `\n\nChi tiết: ${apiMsg}` : ''));
      if (__DEV__) console.error('[ForgotPw] verify error:', err);
    } finally {
      setLoading(false);
    }
  };

  // resend OTP
  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      showErr('Email không hợp lệ.');
      return;
    }
    setLoading(true);
    try {
      if (__DEV__) console.log('[ForgotPw] resend OTP /forgotpassword', cleanEmail);
      await forgotPassword(cleanEmail);
      setResendCountdown(60);
      showInfo('Mã xác nhận đã được gửi lại.', 'Đã gửi lại');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Không thể gửi lại mã.';
      showErr(String(msg));
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: reset password
  const handleResetPasswordOnly = async () => {
    if (!otpVerified) {
      showErr('Bạn cần xác thực OTP trước khi đặt mật khẩu.');
      setStep(2);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const errs = validatePasswordRules(newPassword, cleanEmail);
    if (errs.length) {
      showErr(errs.join('\n'), 'Mật khẩu không hợp lệ');
      return;
    }
    if (newPassword !== confirmPassword) {
      showErr('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const payload = { email: cleanEmail, password: newPassword, confirmPassword };
      if (__DEV__) console.log('[ForgotPw] POST /resetpassword', payload);
      const r = await resetPassword(payload);
      if (__DEV__) console.log('[ForgotPw] resetPassword res:', r);

      alert('Thành công', 'Mật khẩu của bạn đã được đặt lại. Bạn có thể đăng nhập.', [
        {
          text: 'OK',
          onPress: () => {
            setStep(1);
            setEmail('');
            setNewPassword('');
            setConfirmPassword('');
            setCodeInput('');
            setOtpVerified(false);
            router.replace('/(auth)/login');
          },
        },
      ]);
    } catch (err: any) {
      const apiMsg = err?.data?.message || err?.message || '';
      showErr('Đặt lại mật khẩu thất bại. Vui lòng thử lại.' + (apiMsg ? `\n\nChi tiết: ${apiMsg}` : ''));
      if (__DEV__) console.error('[ForgotPw] reset error:', err);
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

                  {/* --- STEP 1: EMAIL --- */}
                  {step === 1 && (
                    <YStack space>
                      <FontAwesome name="envelope" size={200} color="#085C9C" style={{ margin: 'auto' }} />

                      <Label fontSize={14} fontWeight="500" color="#585858">
                        Email đăng ký
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

                  {/* --- STEP 2: OTP --- */}
                  {step === 2 && (
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
                        <MaterialCommunityIcons name="message-text-outline" size={18} color="#8C8C8C" />
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
                          onPress={handleVerifyOTPOnly}
                          disabled={loading}
                        >
                          <Text color="white" fontWeight="600">
                            {loading ? 'Đang xử lý...' : 'Xác nhận OTP'}
                          </Text>
                        </Button>
                      </XStack>
                    </YStack>
                  )}

                  {/* --- STEP 3: NEW PASSWORD --- */}
                  {step === 3 && (
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
                          onPress={handleResetPasswordOnly}
                          disabled={loading}
                        >
                          <Text color="white" fontWeight="600">
                            {loading ? 'Đang xử lý...' : 'Đặt mật khẩu'}
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

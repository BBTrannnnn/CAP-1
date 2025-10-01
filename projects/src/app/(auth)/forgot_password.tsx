// app/(auth)/forgot_password.tsx
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Button, Card, Input, Label, Separator, Text, Theme, XStack, YStack } from 'tamagui';

function isValidEmail(email: string) {
  // basic email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePasswordRules(pw: string, email?: string) {
  const errors: string[] = [];
  if (pw.length < 6) errors.push('Mật khẩu cần ít nhất 6 ký tự.');
  if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw)) errors.push('Mật khẩu cần kết hợp chữ hoa và chữ thường.');
  if (email) {
    const local = email.split('@')[0] || '';
    if (local && local.length >= 3 && pw.toLowerCase().includes(local.toLowerCase()))
      errors.push('Mật khẩu không được chứa thông tin cá nhân (email).');
  }
  return errors;
}

function generateCode() {
  // 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function ForgotPassword() {
  // step: 1 = enter email, 2 = set new password, 3 = verify code
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // common states
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // for password step
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // for code verification
  const [codeInput, setCodeInput] = useState('');
  const sentCodeRef = useRef<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    let t: any = null;
    if (resendCountdown > 0) {
      t = setInterval(() => setResendCountdown((c) => Math.max(0, c - 1)), 1000);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [resendCountdown]);

  // STEP 1: request reset -> generates code and moves to step 3 OR step2 depending flow
  const handleSendCode = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Lỗi', 'Vui lòng nhập email hợp lệ.');
      return;
    }
    setLoading(true);
    try {
      // giả lập gửi mã: tạo mã và lưu vào sentCodeRef
      const code = '123456'; // generateCode();
      sentCodeRef.current = code;
      // trong thực tế: gọi API gửi mã về email
      // For demo: show alert (in production remove)
      Alert.alert('Mã đã được gửi', `Mã xác nhận (demo): ${code}`, [{ text: 'Ok' }]);

      // start resend cooldown
      setResendCountdown(60);

      // chuyển sang bước 3 để nhập mã — nhưng bạn muốn bước 2 trước khi verify?
      // theo yêu cầu: 1 nhập email -> nhảy sang 2 nhập mật khẩu mới -> 3 nhập mã xác nhận
      // nên chuyển sang step 2:
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: validate passwords and proceed to step 3
  const handleSetPasswordAndContinue = () => {
    const errs = validatePasswordRules(newPassword, email);
    if (errs.length) {
      Alert.alert('Mật khẩu không hợp lệ', errs.join('\n'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    // proceed to verification step
    // ensure a code is already sent; if not, send a new one
    if (!sentCodeRef.current) {
      const code = generateCode();
      sentCodeRef.current = code;
      setResendCountdown(60);
      Alert.alert('Mã đã được gửi', `Mã xác nhận (demo): ${code}`, [{ text: 'Ok' }]);
    }
    setStep(3);
  };

  // STEP 3: verify code and "reset" password
  const handleVerifyAndFinish = () => {
    if (!codeInput || codeInput.trim().length === 0) {
      Alert.alert('Lỗi', 'Nhập mã xác nhận.');
      return;
    }
    if (codeInput !== sentCodeRef.current) {
      Alert.alert('Lỗi', 'Mã xác nhận không đúng. Vui lòng kiểm tra lại.');
      return;
    }

    // ở đây gọi API đổi mật khẩu thật sự với (email, newPassword, code)
    // Giả lập thành công:
    Alert.alert('Thành công', 'Mật khẩu của bạn đã được đặt lại. Bạn có thể đăng nhập lại.', [
      {
        text: 'OK',
        onPress: () => {
          // reset local states and navigate back to login nếu cần
          setStep(1);
          setEmail('');
          setNewPassword('');
          setConfirmPassword('');
          setCodeInput('');
          sentCodeRef.current = null;
        },
      },
    ]);
  };

  const handleResendCode = () => {
    if (resendCountdown > 0) return;
    const code = generateCode();
    sentCodeRef.current = code;
    setResendCountdown(60);
    Alert.alert('Mã đã gửi lại', `Mã xác nhận (demo): ${code}`);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <Theme name="light"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              padding: 16,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: '#9CD0E4' }}
          >
            <YStack alignItems="center" width="100%">
              <Card width="92%" maxWidth={520} paddingHorizontal={18} paddingVertical={18} borderRadius={12} elevation={2} bordered>
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
                    color={'white'}
                    >1</Text>
                    <Separator width={30} />
                    <Text 
                    width={32}
                    height={32}
                    borderRadius={16}
                    backgroundColor={step === 2 ? '#085C9C' : '#0685e5ff'}
                    alignItems="center"
                    justifyContent="center"
                    display="flex"
                    color={'white'}
                    >2</Text>
                    <Separator width={30} />
                    <Text
                    width={32}
                    height={32}
                    borderRadius={16}
                    backgroundColor={step === 3 ? '#085C9C' : '#0685e5ff'}
                    alignItems="center"
                    justifyContent="center"
                    display="flex"
                    color={'white'}
                    >3</Text>
                  </XStack>

                  {/* --- STEP 1 --- */}
                  {step === 1 && (
                    <YStack space>
                      <Label fontSize={14} fontWeight="500" color="#585858">
                        Email đăng ký
                      </Label>
                      <FontAwesome
                        name="envelope"
                        size={200}
                        color="#085C9C"
                        style={{ margin: 'auto' }}
                      />

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
                          Gửi mã xác nhận
                        </Text>
                      </Button>
                    </YStack>
                  )}

                  {/* --- STEP 2 --- */}
                  {step === 2 && (
                    <YStack space>
                      <FontAwesome
                        name="lock"
                        size={200}
                        color="#dddd00"
                        style={{ margin: 'auto' }}
                      />
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
                        <Button onPress={() => setShowPw((s) => !s)} backgroundColor="transparent" height={36} width={36}>
                          <MaterialCommunityIcons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8C8C8C" />
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
                      <FontAwesome
                        name="key"
                        size={200}
                        color="red"
                        style={{ margin: 'auto' }}
                      />
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
                          disabled={resendCountdown > 0}
                        >
                          <Text fontSize={13} color={resendCountdown > 0 ? '#8C8C8C' : '#085C9C'}>
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

                        <Button height={48} width="48%" borderRadius={10} backgroundColor="#085C9C" onPress={handleVerifyAndFinish}>
                          <Text color="white" fontWeight="600">
                            Xác nhận
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

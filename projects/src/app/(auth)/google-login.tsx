import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, Card, Input, Label, Separator, Text, Theme, XStack, YStack } from 'tamagui';

export default function GoogleLogin() {
  const [gEmail, setGEmail] = useState('');
  const [gPw, setGPw] = useState('');
  const router = useRouter();

  const onContinue = () => {
    // TODO: Xử lý login Google
  };

  return (
    <Theme name='light'>
      <YStack flex={1} backgroundColor='#9CD0E4' paddingHorizontal={16} paddingVertical={12}>
        {/* AppBar */}
        <XStack alignItems='center' marginTop={8} marginBottom={8} space={12}>
          <Button height={36} width={36} borderRadius={18} backgroundColor='transparent' onPress={() => router.back()}>
            <Ionicons name='chevron-back' size={22} color='#1f1f1f' />
          </Button>
          <Text fontSize={18} fontWeight='700'>
            Đăng nhập Google
          </Text>
        </XStack>

        <YStack flex={1} alignItems='center' justifyContent='flex-start'>
          {/* Logo + tiêu đề */}
          <YStack alignItems='center' marginTop={8} marginBottom={12}>
            <AntDesign name='google' size={42} color='#4285F4' />
            <Text fontSize={22} fontWeight='700' marginTop={8}>
              Đăng nhập bằng Google
            </Text>
            <Text fontSize={13} color='#585858' textAlign='center' marginTop={4}>
              Nhập thông tin Google của bạn để tiếp tục
            </Text>
          </YStack>

          {/* Card form */}
          <Card
            width='100%'
            maxWidth={520}
            borderRadius={16}
            backgroundColor='#FFFFFF'
            paddingHorizontal={16}
            paddingVertical={16}
            marginTop={8}
          >
            <YStack>
              {/* Email */}
              <YStack marginBottom={16}>
                <Label fontSize={14} fontWeight='600' color='#1F1F1F'>
                  Tài khoản Google
                </Label>
                <XStack
                  alignItems='center'
                  height={56}
                  borderRadius={12}
                  borderWidth={1}
                  backgroundColor='#F8F8F8'
                  borderColor='#E4E4E4'
                  paddingHorizontal={12}
                  marginTop={8}
                >
                  <AntDesign name='google' size={18} color='#4285F4' />
                  <Input
                    flex={1}
                    height={56}
                    fontSize={16}
                    placeholder='Nhập tài khoản Google'
                    value={gEmail}
                    onChangeText={setGEmail}
                    keyboardType='email-address'
                    autoCapitalize='none'
                    autoCorrect={false}
                    backgroundColor='transparent'
                    marginLeft={8}
                  />
                </XStack>
              </YStack>

              {/* Password */}
              <YStack marginBottom={16}>
                <Label fontSize={14} fontWeight='600' color='#1F1F1F'>
                  Mật khẩu Google
                </Label>
                <XStack
                  alignItems='center'
                  height={56}
                  borderRadius={12}
                  borderWidth={1}
                  backgroundColor='#F8F8F8'
                  borderColor='#E4E4E4'
                  paddingHorizontal={12}
                  marginTop={8}
                >
                  <MaterialCommunityIcons name='lock-outline' size={18} color='#8C8C8C' />
                  <Input
                    flex={1}
                    height={56}
                    fontSize={16}
                    placeholder='Nhập mật khẩu Google'
                    value={gPw}
                    onChangeText={setGPw}
                    secureTextEntry
                    backgroundColor='transparent'
                    marginLeft={8}
                  />
                </XStack>
              </YStack>

              {/* Button Google */}
              <Button height={56} borderRadius={12} backgroundColor='#EA4335' onPress={onContinue}>
                <XStack alignItems='center' space={8}>
                  <AntDesign name='google' size={20} color='#fff' />
                  <Text fontSize={16} fontWeight='600' color='white'>
                    Tiếp tục với Google
                  </Text>
                </XStack>
              </Button>

              {/* Tips box */}
              <YStack
                borderRadius={12}
                borderWidth={1}
                backgroundColor='#DFF6F2'
                borderColor='#BFEDE2'
                paddingHorizontal={12}
                paddingVertical={12}
                marginTop={16}
              >
                <XStack alignItems='center' marginBottom={8} space={6}>
                  <Ionicons name='information-circle-outline' size={18} color='#078C7A' />
                  <Text fontWeight='700'>Lưu ý bảo mật</Text>
                </XStack>
                <Text fontSize={13} lineHeight={18} color='#1F1F1F'>
                  Đảm bảo bạn đang sử dụng mật khẩu Google chính thức. Nếu bạn có bật xác thực 2 bước vui lòng sử dụng
                  mật khẩu ứng dụng.
                </Text>
              </YStack>
            </YStack>
          </Card>

          <YStack alignItems='center' marginVertical={16}>
            <Separator width='60%' backgroundColor='#D0D8E0' />
          </YStack>
        </YStack>
      </YStack>
    </Theme>
  );
}

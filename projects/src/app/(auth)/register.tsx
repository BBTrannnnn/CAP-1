// app/(auth)/register.tsx
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link, Stack } from 'expo-router';
import React, { useState } from 'react';
import { Image } from 'react-native';
import { Button, Card, Checkbox, Input, Label, ScrollView, Separator, Text, Theme, XStack, YStack } from 'tamagui';

// Logo app
const Logo = require('../../assets/images/FlowState.png');

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [agree, setAgree] = useState(false);

  const onRegister = () => {
    if (!agree) {
      alert('Bạn cần đồng ý với điều khoản để tiếp tục');
      return;
    }
    console.log('Register:', fullName, email, phone, pw, confirmPw);
  };

  return (
    <>
    <Stack.Screen options={{ headerShown: false }} />  {/* 👈 tắt header */}
    <Theme name="light">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}
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
                onChangeText={setFullName}
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
                onChangeText={setEmail}
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
                onChangeText={setPhone}
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
              onChangeText={setPw}
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
              onChangeText={setConfirmPw}
              borderRadius={12}
              borderWidth={1}
              backgroundColor="#F8F8F8"
              borderColor="#E4E4E4"
              paddingHorizontal={12}
              marginBottom={16}
            />

            {/* Agree terms */}
            <XStack alignItems="center" marginBottom={20}>
              <Checkbox size="$2" checked={agree} onCheckedChange={(val) => setAgree(!!val)} />
              <Text fontSize={13} color="#585858" style={{ marginLeft: 8 }}>
                Tôi đồng ý với <Text style={{ color: '#085C9C' }}>Điều khoản</Text> &{' '}
                <Text style={{ color: '#085C9C' }}>Chính sách bảo mật</Text>
              </Text>
            </XStack>

            {/* Register button */}
            <Button
              height={56}
              borderRadius={12}
              backgroundColor="#085C9C"
              pressStyle={{ backgroundColor: '#2870A8' }}
              onPress={onRegister}
            >
              <Text fontSize={16} fontWeight="600" color="white">
                Đăng ký
              </Text>
            </Button>

            {/* Separator */}
            <XStack alignItems="center" marginVertical={12}>
              <Separator flex={1} backgroundColor="#E0E6EE" />
              <Text fontSize={12} color="#585858" style={{ marginHorizontal: 12 }}>
                Hoặc
              </Text>
              <Separator flex={1} backgroundColor="#E0E6EE" />
            </XStack>

            {/* Google sign up */}
            <Button
              height={56}
              borderRadius={12}
              backgroundColor="#FFFFFF"
              borderWidth={1}
              borderColor="#E4E4E4"
              pressStyle={{ backgroundColor: '#F1F1F1' }}
            >
              <XStack alignItems="center" space={8}>
                <AntDesign name="google" size={22} color="#DB4437" />
                <Text fontSize={16} style={{ color: '#111111' }}>
                  Đăng ký bằng Google
                </Text>
              </XStack>
            </Button>

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

import React, { useState, useRef } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, XStack, Card, Text, Input, Button, Theme } from 'tamagui';
import Ionicons from '@expo/vector-icons/Ionicons';
import LinearGradient from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const PRIMARY = '#9B59FF';
const GRADIENT = ['#9B59FF', '#7F00FF'];

type Msg = { id: string; role: 'user' | 'ai'; text: string };

export default function AIChatScreen() {
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: '1',
      role: 'ai',
      text: 'Xin chào 👋 Mình là trợ lý giấc ngủ AI FlowState. Hôm nay bạn muốn nghe chuyện, thiền hay cần lời khuyên để ngủ ngon hơn?',
    },
  ]);
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const sendMsg = () => {
    const content = text.trim();
    if (!content) return;

    const userMsg: Msg = { id: Date.now().toString(), role: 'user', text: content };
    setMsgs((m) => [...m, userMsg]);
    setText('');
    setTimeout(() => {
      const reply: Msg = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: suggest(content),
      };
      setMsgs((m) => [...m, reply]);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 800);
  };

  return (
    <Theme name="light">
      <YStack flex={1} backgroundColor="#F4F7FB">
        {/* Header */}
        <XStack alignItems="center" paddingHorizontal={16} paddingVertical={14}>
          <Button
            backgroundColor="transparent"
            height={40}
            width={40}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color="#1F1F1F" />
          </Button>
          <Text fontSize={18} fontWeight="700" color="#1F1F1F">
            Trò chuyện cùng AI
          </Text>
        </XStack>

        {/* Chat body */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            {msgs.map((m) => (
              <XStack
                key={m.id}
                justifyContent={m.role === 'user' ? 'flex-end' : 'flex-start'}
                marginBottom={12}
              >
                <Card
                  paddingHorizontal={14}
                  paddingVertical={10}
                  borderRadius={16}
                  maxWidth="80%"
                  borderWidth={0}
                  elevation={2}
                  backgroundColor={m.role === 'user' ? '#9B59FF' : '#FFFFFF'}
                >
                  <Text
                    fontSize={15}
                    color={m.role === 'user' ? '#FFFFFF' : '#1F1F1F'}
                    lineHeight={20}
                  >
                    {m.text}
                  </Text>
                </Card>
              </XStack>
            ))}
          </ScrollView>

          {/* Input bar */}
          <XStack
            paddingHorizontal={12}
            paddingVertical={10}
            gap={8}
            backgroundColor="#FFFFFF"
            borderTopWidth={1}
            borderColor="#E8ECF3"
            alignItems="center"
          >
            <Input
              flex={1}
              height={46}
              borderRadius={14}
              borderWidth={1}
              borderColor="#E4E4E4"
              backgroundColor="#F8F8F8"
              paddingHorizontal={12}
              placeholder="Nhập tin nhắn... (ví dụ: kể chuyện ru ngủ)"
              value={text}
              onChangeText={setText}
            />
            <Button
              height={46}
              width={46}
              borderRadius={14}
              backgroundColor={PRIMARY}
              pressStyle={{ backgroundColor: '#7F00FF' }}
              onPress={sendMsg}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Button>
          </XStack>
        </KeyboardAvoidingView>
      </YStack>
    </Theme>
  );
}

function suggest(q: string) {
  const s = q.toLowerCase();
  if (s.includes('kể') || s.includes('chuyện'))
    return '🌙 Chuyện ngắn: "Giấc mơ trên mây" — bạn đang trôi bồng bềnh giữa làn mây ấm, nghe gió ru nhẹ nhàng...';
  if (s.includes('thiền') || s.includes('thư giãn'))
    return '🧘 Thiền dẫn: Hít vào 4s... giữ 4s... thở ra 6s. Cảm nhận cơ thể nhẹ như khói tan.';
  if (s.includes('mẹo') || s.includes('khó ngủ'))
    return '💡 Mẹo ngủ nhanh: tránh màn hình 30 phút trước khi ngủ, phòng mát 22°C, ánh sáng vàng ấm.';
  return 'Mình có thể kể chuyện, hướng dẫn thiền, hoặc gợi ý mẹo ngủ. Bạn muốn thử kiểu nào?';
}

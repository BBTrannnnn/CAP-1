import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Check, AlertTriangle, X } from 'lucide-react-native';

const AUTO_CLOSE_TIME = 3000;

interface NotificationProps {
  type?: 'success' | 'warning' | 'error';
  message: string;
  onClose?: () => void;
  show?: boolean;
}

const Notification: React.FC<NotificationProps> = ({ type = 'success', message, onClose, show = true }) => {
  const [visible, setVisible] = useState(show);
  const slideAnim = useState(new Animated.Value(Dimensions.get('window').width))[0];

  useEffect(() => {
    if (show) {
      setVisible(true);
      // Slide in from right
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [show, slideAnim]);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      // Slide out to right
      Animated.timing(slideAnim, {
        toValue: Dimensions.get('window').width,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
        if (typeof onClose === 'function') {
          onClose();
        }
      });
    }, AUTO_CLOSE_TIME);

    return () => clearTimeout(timer);
  }, [visible, slideAnim, onClose]);

  if (!visible) return null;

  const configs = {
    success: {
      backgroundColor: '#dcfce7',
      borderColor: '#bbf7d0',
      iconBg: '#22c55e',
      textColor: '#166534',
      icon: <Check size={20} color="white" />
    },
    warning: {
      backgroundColor: '#fefce8',
      borderColor: '#fef08a',
      iconBg: '#eab308',
      textColor: '#854d0e',
      icon: <AlertTriangle size={20} color="white" />
    },
    error: {
      backgroundColor: '#fef2f2',
      borderColor: '#fecaca',
      iconBg: '#ef4444',
      textColor: '#991b1b',
      icon: <X size={20} color="white" />
    }
  };

  const config = configs[type as keyof typeof configs] || configs.success;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
        {config.icon}
      </View>

      <Text style={[styles.message, { color: config.textColor }]}>
        {message}
      </Text>

      {onClose && (
        <TouchableOpacity
          onPress={() => {
            Animated.timing(slideAnim, {
              toValue: Dimensions.get('window').width,
              duration: 250,
              useNativeDriver: true,
            }).start(() => {
              setVisible(false);
              if (typeof onClose === 'function') onClose();
            });
          }}
          style={styles.closeButton}
        >
          <X size={16} color={config.textColor} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});

export default Notification;

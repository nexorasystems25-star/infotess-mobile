import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '@/context/NetworkContext';

export function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetwork();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [bgColor, setBgColor] = useState('#F59E0B');
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    if (!isConnected || !isInternetReachable) {
      wasOffline.current = true;
      setMessage("You're offline — working from local data");
      setBgColor('#F59E0B');
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 200,
      }).start();
    } else if (wasOffline.current) {
      wasOffline.current = false;
      setMessage('Back online — syncing data...');
      setBgColor('#16A34A');
      setVisible(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
        stiffness: 200,
      }).start();

      hideTimer.current = setTimeout(() => {
        Animated.spring(slideAnim, {
          toValue: -80,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }).start(() => {
          setVisible(false);
        });
      }, 3000);
    }

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isConnected, isInternetReachable]);

  if (Platform.OS === 'web') return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top + 50,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 9999,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          backgroundColor: bgColor,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          gap: 8,
        }}
      >
        <Ionicons name="cloud-offline" size={16} color="#FFFFFF" />
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/context/ThemeContext';

type ToastType = 'success' | 'error' | 'info';

interface Props {
  message: string;
  type?: ToastType;
  visible: boolean;
  onDone?: () => void;
  duration?: number;
}

const ICON_MAP: Record<ToastType, { name: React.ComponentProps<typeof Ionicons>['name']; bg: string; color: string }> = {
  success: { name: 'checkmark-circle', bg: '#16a34a20', color: '#16a34a' },
  error:   { name: 'close-circle', bg: '#dc262620', color: '#dc2626' },
  info:    { name: 'information-circle', bg: '#2563eb20', color: '#2563eb' },
};

export default function Toast({ message, type = 'success', visible, onDone, duration = 2500 }: Props) {
  const { theme } = useThemeContext();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const style = ICON_MAP[type];

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    translateY.setValue(20);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 20, duration: 250, useNativeDriver: true }),
      ]).start(() => onDone?.());
    }, duration);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        zIndex: 9999,
        opacity,
        transform: [{ translateY }],
        backgroundColor: theme.isDark ? '#1e2a1e' : '#f0fdf4',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: style.color + '40',
        paddingHorizontal: 18,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        maxWidth: '88%',
      }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: style.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={style.name} size={18} color={style.color} />
      </View>
      <Text style={{ color: theme.colors.text, fontSize: 14, fontWeight: '600', flex: 1 }} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

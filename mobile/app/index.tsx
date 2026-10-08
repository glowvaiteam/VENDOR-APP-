/**
 * Screen 1: Splash Screen
 * Animates in and auto-navigates to login
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../src/theme';

export default function SplashScreen() {
  const router   = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim= useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 700, useNativeDriver: useNative,
      }),
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: useNative,
        tension: 80, friction: 10,
      }),
    ]).start(() => {
      const t = setTimeout(() => router.replace('/(auth)/login'), 1200);
      return () => clearTimeout(t);
    });
  }, []);

  return (
    <View style={s.root}>
      <Animated.View
        style={[s.content, {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }]}
      >
        <View style={s.logoDot}>
          <Text style={s.logoLetter}>g</Text>
        </View>
        <Text style={s.appName}>glowvai</Text>
        <Text style={s.tagline}>vendor command center</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  logoDot: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#0050ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0050ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  logoLetter: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '700',
    marginTop: -4,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0050ff',
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    letterSpacing: 0.4,
    textTransform: 'lowercase',
  },
});

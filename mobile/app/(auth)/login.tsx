/**
 * Screen 2: Login — Enter mobile number
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  KeyboardAvoidingView, Platform, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius } from '../../src/theme';
import { PrimaryButton } from '../../src/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) {
      Alert.alert('Invalid number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      // Store phone for OTP screen
      await AsyncStorage.setItem('vendor_phone', phone);
      // In production: call Firebase Auth signInWithPhoneNumber here
      // For dev: simulate OTP send
      await new Promise(r => setTimeout(r, 800));
      router.push('/(auth)/otp');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.topbar}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={s.brandLogo}>glowvai</Text>
              <Text style={s.title}>partner login</Text>
            </View>
          </View>

          <View style={s.body}>
            <Text style={s.heading}>Enter your mobile number</Text>
            <Text style={s.sub}>We'll send a one-time code to verify your dark store access.</Text>

            <View style={s.fieldWrap}>
              <Text style={s.label}>Mobile number</Text>
              <View style={s.inputRow}>
                <View style={s.flag}>
                  <Text style={s.flagText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={s.input}
                  placeholder="98765 43210"
                  placeholderTextColor={Colors.sub}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  autoFocus
                />
              </View>
            </View>

            <Text style={s.disclaimer}>
              By continuing, you agree to Glowvai's Terms of Service and Privacy Policy.
            </Text>
          </View>

          <View style={s.foot}>
            <PrimaryButton
              label={loading ? 'Sending…' : 'Send OTP'}
              onPress={handleSendOtp}
              loading={loading}
              disabled={phone.replace(/\D/g,'').length < 10}
            />
            <TouchableOpacity
              onPress={() => router.replace('/(vendor)/home')}
              style={{ marginTop: 14, alignItems: 'center' }}
            >
              <Text style={s.skipText}>Already a vendor? <Text style={s.skipBold}>Skip to home →</Text></Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.bg, alignItems: 'center' },
  container: { width: '100%', maxWidth: 480, flex: 1 },
  topbar:    { padding: Spacing.lg, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.line, backgroundColor: '#fff' },
  brandLogo: { fontSize: 24, fontWeight: '800', color: '#0050ff', letterSpacing: -0.6 },
  title:   { fontSize: 13, fontWeight: '600', color: Colors.sub, textTransform: 'lowercase' },
  body:    { flex: 1, padding: Spacing.lg },
  heading: { fontSize: 15, fontWeight: '600', color: Colors.ink, marginBottom: 4 },
  sub:     { fontSize: 13, color: Colors.sub, marginBottom: 24 },
  fieldWrap: { marginBottom: 14 },
  label:   { fontSize: 11, fontWeight: '600', color: Colors.sub, marginBottom: 6 },
  inputRow:{
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    overflow: 'hidden',
    backgroundColor: '#fcfcfc',
  },
  flag: {
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRightWidth: 1,
    borderRightColor: Colors.line,
    backgroundColor: Colors.card,
    justifyContent: 'center',
  },
  flagText: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  input:   { flex: 1, padding: 13, fontSize: 14, color: Colors.ink },
  disclaimer: { fontSize: 11, color: Colors.sub, lineHeight: 16 },
  foot:    { padding: Spacing.lg, paddingBottom: 32 },
  skipText:{ fontSize: 13, color: Colors.sub },
  skipBold:{ fontWeight: '700', color: Colors.ink },
});

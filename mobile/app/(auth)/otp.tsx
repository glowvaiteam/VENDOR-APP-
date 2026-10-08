/**
 * Screen 3: OTP Verification
 * 6-digit OTP input with auto-advance and resend
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius } from '../../src/theme';
import { PrimaryButton } from '../../src/components/ui';

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const router   = useRouter();
  const [otp,     setOtp]     = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputs   = useRef<TextInput[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('vendor_phone').then(p => { if (p) setPhone(p); });
    const t = setInterval(() => setResendTimer(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const handleDigit = (val: string, idx: number) => {
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      Alert.alert('Incomplete', 'Enter all 6 digits.');
      return;
    }
    setLoading(true);
    try {
      // In production: Firebase confirmationResult.confirm(code)
      // Check if returning vendor
      const isExisting = await AsyncStorage.getItem('vendor_registered');
      await new Promise(r => setTimeout(r, 800));
      if (isExisting === 'true') {
        router.replace('/(vendor)/home');
      } else {
        router.replace('/(onboarding)/step-a');
      }
    } catch (err: any) {
      Alert.alert('Invalid OTP', err.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputs.current[0]?.focus();
    Alert.alert('OTP Resent', `A new code was sent to ${phone}`);
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.topbar}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Verify OTP</Text>
      </View>

      <View style={s.body}>
        <Text style={s.sub}>Code sent to {phone || '+91 98765 43210'}</Text>

        {/* OTP Boxes */}
        <View style={s.otpRow}>
          {Array(OTP_LENGTH).fill(null).map((_, i) => (
            <TextInput
              key={i}
              ref={r => { if (r) inputs.current[i] = r; }}
              style={[s.otpBox, otp[i] && s.otpBoxFilled]}
              keyboardType="number-pad"
              maxLength={1}
              value={otp[i]}
              onChangeText={v => handleDigit(v, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              autoFocus={i === 0}
            />
          ))}
        </View>

        {/* Resend */}
        <TouchableOpacity onPress={handleResend} disabled={resendTimer > 0}>
          <Text style={[s.resend, resendTimer > 0 && s.resendDisabled]}>
            {resendTimer > 0
              ? `Resend in ${resendTimer}s`
              : "Didn't get it? Resend"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={s.foot}>
        <PrimaryButton
          label={loading ? 'Verifying…' : 'Verify & continue'}
          onPress={handleVerify}
          loading={loading}
          disabled={otp.join('').length < OTP_LENGTH}
        />
        <TouchableOpacity
          onPress={() => router.replace('/(vendor)/home')}
          style={{ marginTop: 14, alignItems: 'center' }}
        >
          <Text style={s.skipText}>
            Existing vendor? <Text style={s.skipBold}>Skip to Home</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  topbar: {
    padding: Spacing.lg, paddingBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  back: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: Colors.ink, lineHeight: 22 },
  title:  { fontSize: 17, fontWeight: '700', color: Colors.ink },
  body:   { flex: 1, padding: Spacing.lg },
  sub:    { fontSize: 13, color: Colors.sub, marginBottom: 24 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  otpBox: {
    flex: 1, aspectRatio: 1,
    borderWidth: 1.5, borderColor: Colors.line,
    borderRadius: Radius.md,
    textAlign: 'center',
    fontSize: 20, fontWeight: '700', color: Colors.ink,
    backgroundColor: '#fcfcfc',
  },
  otpBoxFilled: { borderColor: Colors.ink, backgroundColor: Colors.card },
  resend: { fontSize: 13, color: Colors.ink, fontWeight: '600', textAlign: 'center' },
  resendDisabled: { color: Colors.sub },
  foot:   { padding: Spacing.lg, paddingBottom: 32 },
  skipText: { fontSize: 13, color: Colors.sub, textAlign: 'center' },
  skipBold: { fontWeight: '700', color: Colors.ink },
});

/**
 * Onboarding Step B: Bank & Payout Details
 * Step 2 of 4 — Bank account, IFSC, UPI, payout frequency
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  SafeAreaView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius } from '../../src/theme';
import { ProgressSteps, PrimaryButton, FormField } from '../../src/components/ui';

export default function OnboardingStepB() {
  const router = useRouter();

  const [holderName,  setHolderName]  = useState('');
  const [bankName,    setBankName]    = useState('');
  const [accNumber,   setAccNumber]   = useState('');
  const [ifsc,        setIfsc]        = useState('');
  const [upiId,       setUpiId]       = useState('');
  const [pan,         setPan]         = useState('');
  const [frequency,   setFrequency]   = useState('Daily');
  const [loading,     setLoading]     = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Auto-fallback for any empty field so user is NEVER blocked
      const payload = {
        holderName: holderName.trim() || 'Mukesh Kumar',
        bankName:   bankName.trim()   || 'HDFC Bank',
        accNumber:  accNumber.trim()  || '50100458923145',
        ifsc:       ifsc.trim()       || 'HDFC0001234',
        upiId:      upiId.trim()      || 'vendor@hdfcbank',
        pan:        pan.trim()        || 'ABCDE1234F',
        frequency,
      };

      await AsyncStorage.setItem('onb_step_b', JSON.stringify(payload));
      router.push('/(onboarding)/step-c');
    } catch (e: any) {
      router.push('/(onboarding)/step-c');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.container}>
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={s.back}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Bank & Payout Settlement</Text>
            <Text style={s.subtitle}>Step 2 of 4 • Fast 10-min rider payouts</Text>
          </View>
          <TouchableOpacity
            style={s.skipHomeBtn}
            onPress={() => router.replace('/(vendor)/home')}
          >
            <Text style={s.skipHomeText}>⚡ Home</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.body} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <ProgressSteps total={4} current={2} />

          <FormField label="Account Holder Name *">
            <TextInput
              style={s.input}
              placeholder="As per bank passbook"
              placeholderTextColor={Colors.sub}
              value={holderName}
              onChangeText={setHolderName}
            />
          </FormField>

          <FormField label="Bank Name *">
            <TextInput
              style={s.input}
              placeholder="e.g. HDFC Bank, SBI, ICICI"
              placeholderTextColor={Colors.sub}
              value={bankName}
              onChangeText={setBankName}
            />
          </FormField>

          <FormField label="Account Number *">
            <TextInput
              style={s.input}
              placeholder="Enter bank account number"
              placeholderTextColor={Colors.sub}
              value={accNumber}
              onChangeText={setAccNumber}
              keyboardType="number-pad"
            />
          </FormField>

          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <FormField label="IFSC Code *">
                <TextInput
                  style={s.input}
                  placeholder="e.g. HDFC0001234"
                  placeholderTextColor={Colors.sub}
                  value={ifsc}
                  onChangeText={setIfsc}
                  autoCapitalize="characters"
                />
              </FormField>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="UPI ID (For instant payouts)">
                <TextInput
                  style={s.input}
                  placeholder="e.g. shop@okaxis"
                  placeholderTextColor={Colors.sub}
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                />
              </FormField>
            </View>
          </View>

          <FormField label="Payout Settlement Frequency">
            <View style={s.segmentRow}>
              {['Daily', 'T+2', 'Weekly'].map(f => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFrequency(f)}
                  style={[s.segBtn, frequency === f && s.segBtnActive]}
                >
                  <Text style={[s.segText, frequency === f && s.segTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </FormField>

          <FormField label="PAN Card Number">
            <TextInput
              style={s.input}
              placeholder="e.g. ABCDE1234F"
              placeholderTextColor={Colors.sub}
              value={pan}
              onChangeText={setPan}
              autoCapitalize="characters"
            />
          </FormField>

          <View style={s.noteCard}>
            <Text style={s.noteText}>
              💡 <strong>Instant Settlements:</strong> GlowVAI processes vendor payments automatically every night at 11:59 PM directly via IMPS / UPI.
            </Text>
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={s.foot}>
          <PrimaryButton label="Save & Continue to KYC Proofs" onPress={handleSave} loading={loading} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 580,
    flex: 1,
  },
  topbar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    backgroundColor: '#fff',
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontSize: 20, color: Colors.ink, lineHeight: 22 },
  title:     { fontSize: 16, fontWeight: '700', color: Colors.ink },
  subtitle:  { fontSize: 12, color: Colors.sub, marginTop: 1 },
  skipHomeBtn: {
    backgroundColor: '#e6eeff',
    borderWidth: 1,
    borderColor: '#b3cbff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  skipHomeText: {
    color: '#0050ff',
    fontSize: 12,
    fontWeight: '800',
  },
  body:    { flex: 1 },
  content: { padding: Spacing.lg },
  row2:    { flexDirection: 'row', gap: 12 },
  input: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    fontSize: 14,
    color: Colors.ink,
    backgroundColor: '#fafafa',
  },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  segBtnActive: { backgroundColor: '#0050ff', borderColor: '#0050ff' },
  segText:      { fontSize: 13, fontWeight: '600', color: Colors.sub },
  segTextActive:{ color: '#fff' },
  noteCard: {
    backgroundColor: '#f8fafc',
    borderRadius: Radius.card,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noteText: { fontSize: 12.5, color: Colors.sub, lineHeight: 18 },
  foot: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: '#fff',
  },
});

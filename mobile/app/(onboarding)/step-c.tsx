/**
 * Onboarding Step C: Proofs & KYC
 * Step 3 of 4 — GST, PAN, documents, shop photos
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  SafeAreaView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius } from '../../src/theme';
import {
  ProgressSteps, PrimaryButton, FormField, SectionHeader, UploadBox,
} from '../../src/components/ui';

export default function OnboardingStepC() {
  const router = useRouter();

  const [gst,     setGst]     = useState('');
  const [pan,     setPan]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        gst: gst.trim() || '37AAAAA0000A1Z5',
        pan: pan.trim() || 'ABCDE1234F',
      };
      await AsyncStorage.setItem('onb_step_c', JSON.stringify(payload));
      router.push('/(onboarding)/step-d');
    } catch (e: any) {
      router.push('/(onboarding)/step-d');
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
            <Text style={s.title}>Proofs & KYC Verification</Text>
            <Text style={s.subtitle}>Step 3 of 4 • Tax details & shop verification</Text>
          </View>
          <TouchableOpacity
            style={s.skipHomeBtn}
            onPress={() => router.replace('/(vendor)/home')}
          >
            <Text style={s.skipHomeText}>⚡ Home</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.body} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <ProgressSteps total={4} current={3} />

          <FormField label="GST Identification Number (GSTIN)">
            <TextInput
              style={s.input}
              placeholder="e.g. 37AAAAA0000A1Z5"
              placeholderTextColor={Colors.sub}
              value={gst}
              onChangeText={setGst}
              autoCapitalize="characters"
            />
          </FormField>

          <UploadBox label="Upload GST Certificate (PDF / Image)" />

          <FormField label="PAN (Individual / Business)">
            <TextInput
              style={s.input}
              placeholder="e.g. ABCDE1234F"
              placeholderTextColor={Colors.sub}
              value={pan}
              onChangeText={setPan}
              autoCapitalize="characters"
            />
          </FormField>

          <UploadBox label="Shop / Establishment Certificate (Optional)" />
          <UploadBox label="Owner ID Proof — Aadhaar / Passport / Driving License" />
          <UploadBox label="Address Proof — Electricity Bill / Rental Agreement" />

          <SectionHeader title="Shop Storefront & Shelving Photos" />
          <UploadBox label="Front view with shop signboard" />
          <UploadBox label="Interior storage racks & beauty counters" />

          <View style={{ height: 24 }} />
        </ScrollView>

        <View style={s.foot}>
          <PrimaryButton label="Save & Continue to Product Catalog" onPress={handleSave} loading={loading} />
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
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  skipHomeText: {
    color: '#facc15',
    fontSize: 12,
    fontWeight: '800',
  },
  body:    { flex: 1 },
  content: { padding: Spacing.lg },
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
  foot: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: '#fff',
  },
});

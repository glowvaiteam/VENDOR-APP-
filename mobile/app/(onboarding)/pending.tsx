/**
 * Pending Verification Screen
 * Features Instant Bypass / One-tap entry to Home Screen
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius } from '../../src/theme';
import { PrimaryButton, SecondaryButton, ListItem, StatusPill } from '../../src/components/ui';
import useVendorStore from '../../src/store/useVendorStore';

const SUBMITTED_STEPS = [
  'Business details & GPS location',
  'Bank & payout verification (UPI / Bank)',
  'Proofs & GST / PAN documents',
  'Product catalog & bulk SKU upload',
];

export default function PendingVerification() {
  const router = useRouter();
  const { setVendor } = useVendorStore();
  const [loading, setLoading] = useState(false);

  const handleInstantEnterHome = async () => {
    setLoading(true);
    try {
      // Mark vendor as verified & approved in local storage
      await AsyncStorage.setItem('vendor_registered', 'approved');
      await AsyncStorage.setItem('vendor_token', 'dev_vendor_token_approved');
      await AsyncStorage.setItem('vendor_id', 'VND-001');

      setVendor({
        vendorId: 'VND-001',
        name: 'GlowVAI Dark Store Vijayawada',
        storeId: 'DS-VIJ-01',
        phone: '8977855998',
        email: 'vendor@glowvai.com',
        isOnline: true,
      });

      // Direct seamless navigation to Vendor Home Dashboard
      router.replace('/(vendor)/home');
    } catch (e: any) {
      router.replace('/(vendor)/home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.container}>
        <View style={s.topbar}>
          <Text style={s.title}>Verification & Store Activation</Text>
        </View>

        <ScrollView style={s.body} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.statusCard}>
            <Text style={s.emoji}>⚡</Text>
            <Text style={s.heading}>Verification Instant Access</Text>
            <Text style={s.sub}>
              Your dark store KYC documents and catalog have been synchronized with the GlowVAI Admin Panel.
            </Text>
          </View>

          {/* Instant Home access banner */}
          <TouchableOpacity style={s.instantCard} onPress={handleInstantEnterHome} activeOpacity={0.85}>
            <View style={{ flex: 1 }}>
              <View style={s.badgeInstant}>
                <Text style={s.badgeInstantText}>⚡ INSTANT ACCESS ENABLED</Text>
              </View>
              <Text style={s.instantTitle}>Enter Live Vendor Home Screen</Text>
              <Text style={s.instantSub}>Skip the 24h wait and start managing real-time orders & inventory right now</Text>
            </View>
            <Text style={s.arrow}>➔</Text>
          </TouchableOpacity>

          <Text style={s.sec}>VERIFICATION STATUS</Text>

          {SUBMITTED_STEPS.map((step, i) => (
            <ListItem
              key={i}
              title={step}
              right={<StatusPill label="Ready / Approved" variant="green" />}
              noBorder={i === SUBMITTED_STEPS.length - 1}
            />
          ))}

          {/* Admin panel notice */}
          <View style={s.adminNotice}>
            <Text style={{ fontSize: 16 }}>🖥️</Text>
            <Text style={s.adminText}>
              Admin Panel is running at <Text style={{ fontWeight: '700' }}>http://localhost:4000/admin</Text> for store fleet review.
            </Text>
          </View>
        </ScrollView>

        <View style={s.foot}>
          <PrimaryButton
            label="🚀 Enter Vendor Home Dashboard"
            onPress={handleInstantEnterHome}
            loading={loading}
          />
          <View style={{ height: 10 }} />
          <SecondaryButton
            label="Edit Business Details"
            onPress={() => router.push('/(onboarding)/step-a')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center' },
  container: { width: '100%', maxWidth: 580, flex: 1 },
  topbar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
    backgroundColor: '#fff',
  },
  title:  { fontSize: 17, fontWeight: '700', color: Colors.ink },
  body:   { flex: 1 },
  content:{ padding: Spacing.lg },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.card,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  emoji:   { fontSize: 32, marginBottom: 8 },
  heading: { fontSize: 15, fontWeight: '700', color: Colors.ink, marginBottom: 4, textAlign: 'center' },
  sub:     { fontSize: 12.5, color: Colors.sub, textAlign: 'center', lineHeight: 18 },
  instantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: Radius.card,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  badgeInstant: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  badgeInstantText: { color: '#c084fc', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  instantTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  instantSub:   { fontSize: 11.5, color: '#94a3b8', marginTop: 2, lineHeight: 16 },
  arrow: { fontSize: 20, color: '#c084fc', fontWeight: '800' },
  sec: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 8,
  },
  adminNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: Radius.md,
    marginTop: 20,
  },
  adminText: { fontSize: 12, color: '#475569', flex: 1, lineHeight: 16 },
  foot: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: '#fff',
  },
});

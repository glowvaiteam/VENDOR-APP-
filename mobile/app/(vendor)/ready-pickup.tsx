/**
 * Ready for Pickup Screen
 * Shows OTP code and QR placeholder for delivery partner
 * Polls for rider assignment, then shows picked-up state
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Alert, Animated, Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useVendorStore from '../../src/store/useVendorStore';
import { ordersApi } from '../../src/services/api';
import { StatusPill, SecondaryButton, PrimaryButton } from '../../src/components/ui';
import { Colors, Spacing, Radius } from '../../src/theme';

const VENDOR_ID = process.env.EXPO_PUBLIC_VENDOR_ID || 'VND-001';

export default function ReadyPickupScreen() {
  const router   = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, updateOrder } = useVendorStore();

  const order      = orders.find(o => o.orderId === orderId);
  const [loading,  setLoading]  = useState(false);
  const [pickedUp, setPickedUp] = useState(false);

  // Pulsing QR animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Simulate rider scan (for dev/testing)
  const handleSimulatePickup = async () => {
    setLoading(true);
    try {
      await ordersApi.dispatch(orderId, {
        riderName: 'Ravi Kumar', riderPhone: '9876543210',
      });
      const updated = { ...order!, status: 'DISPATCHED' as const, dispatchedAt: Date.now() };
      updateOrder(orderId, updated);
      setPickedUp(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelivered = async () => {
    setLoading(true);
    try {
      await ordersApi.deliver(orderId, order?.otp || '');
      updateOrder(orderId, { status: 'DELIVERED' as const, deliveredAt: Date.now() } as any);
      router.replace({ pathname: '/(vendor)/order-detail', params: { orderId } });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  // ── Picked up state ────────────────────────────────────────────────────────
  if (pickedUp) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centered}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🛵</Text>
          <Text style={s.pickedTitle}>Picked up by delivery partner</Text>
          <Text style={s.pickedSub}>No further action needed from you.</Text>
          <View style={s.riderCard}>
            <Text style={s.riderName}>Ravi Kumar</Text>
            <Text style={s.riderPhone}>📞 9876543210</Text>
          </View>
        </View>
        <View style={s.foot}>
          <PrimaryButton
            label={loading ? 'Completing…' : 'Simulate: Delivered'}
            onPress={handleDelivered}
            loading={loading}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Ready state ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>Order #{order.orderId}</Text>
        <StatusPill label="Ready" variant="amber" />
      </View>

      <View style={s.body}>
        <Text style={s.sub}>Show this code to the delivery partner</Text>

        {/* QR placeholder */}
        <Animated.View style={[s.qrBox, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={s.qrLabel}>QR</Text>
          <Text style={s.qrSub}>Order #{order.orderId}</Text>
        </Animated.View>

        {/* OTP */}
        <Text style={s.otp}>{(order.otp || '0000').split('').join('  ')}</Text>
        <Text style={s.otpSub}>4-digit pickup OTP</Text>

        {/* Waiting */}
        <View style={s.waitingCard}>
          <View style={s.waitingDot} />
          <View>
            <Text style={s.waitingTitle}>Waiting for delivery partner…</Text>
            <Text style={s.waitingSub}>Assigning nearest rider</Text>
          </View>
        </View>

        {/* Pickup bay */}
        <View style={s.bayCard}>
          <Text style={s.bayLabel}>Pickup Bay</Text>
          <Text style={s.bayNum}>{order.pickupBay || 'Bay-01'}</Text>
        </View>
      </View>

      <View style={s.foot}>
        <SecondaryButton
          label={loading ? 'Processing…' : 'Simulate: Rider Scans OTP'}
          onPress={handleSimulatePickup}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  title:   { fontSize: 17, fontWeight: '700', color: Colors.ink },
  body:    { flex: 1, padding: Spacing.lg, alignItems: 'center' },
  sub:     { fontSize: 13, color: Colors.sub, marginBottom: 20 },
  qrBox: {
    width: 160, height: 160, backgroundColor: Colors.ink,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  qrLabel: { color: '#fff', fontSize: 22, fontWeight: '800' },
  qrSub:   { color: '#aaa', fontSize: 10, marginTop: 4 },
  otp:     { fontSize: 36, fontWeight: '800', letterSpacing: 8, color: Colors.ink, marginBottom: 6 },
  otpSub:  { fontSize: 12, color: Colors.sub, marginBottom: 20 },
  waitingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: Radius.card,
    padding: 14, width: '100%', marginBottom: 12,
  },
  waitingDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.amber,
  },
  waitingTitle: { fontSize: 13.5, fontWeight: '600', color: Colors.ink },
  waitingSub:   { fontSize: 12, color: Colors.sub, marginTop: 2 },
  bayCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', backgroundColor: Colors.greenBg,
    borderRadius: Radius.card, padding: 14,
  },
  bayLabel: { fontSize: 13, color: Colors.green },
  bayNum:   { fontSize: 16, fontWeight: '800', color: Colors.green },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, gap: 10 },
  pickedTitle: { fontSize: 18, fontWeight: '800', color: Colors.ink },
  pickedSub:   { fontSize: 13, color: Colors.sub },
  riderCard: {
    backgroundColor: Colors.card, borderRadius: Radius.card,
    padding: 14, marginTop: 16, alignItems: 'center', width: '100%',
  },
  riderName:  { fontSize: 15, fontWeight: '700', color: Colors.ink },
  riderPhone: { fontSize: 13, color: Colors.sub, marginTop: 4 },
  foot: { padding: Spacing.lg, paddingBottom: 32, borderTopWidth: 1, borderTopColor: Colors.line },
});

/**
 * Pack Order Screen
 * Checklist of items to pick, photo upload, expiry confirm
 * → marks order as PACKED → navigates to Ready for Pickup
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useVendorStore from '../../src/store/useVendorStore';
import { ordersApi } from '../../src/services/api';
import { PrimaryButton, UploadBox } from '../../src/components/ui';
import { Colors, Spacing, Radius } from '../../src/theme';
import type { Order } from '../../src/store/useVendorStore';

const VENDOR_ID = process.env.EXPO_PUBLIC_VENDOR_ID || 'VND-001';

export default function PackOrderScreen() {
  const router   = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, updateOrder } = useVendorStore();

  const [order,   setOrder]   = useState<Order | null>(null);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const o = orders.find(o => o.orderId === orderId);
    if (o) {
      setOrder(o);
      setChecked(new Array(o.items.length).fill(false));
    }
  }, [orderId, orders]);

  const toggleItem = (i: number) => {
    setChecked(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
  };

  const allChecked = checked.every(Boolean);

  const handleMarkPacked = async () => {
    if (!order) return;
    if (!allChecked) {
      Alert.alert('Check all items', 'Please confirm all items are picked before marking as packed.');
      return;
    }
    setLoading(true);
    try {
      await ordersApi.pack(order.orderId, VENDOR_ID, 'Bay-01');
      const updated = { ...order, status: 'PACKED' as const, packedAt: Date.now(), pickupBay: 'Bay-01' };
      updateOrder(order.orderId, updated);
      router.replace({ pathname: '/(vendor)/ready-pickup', params: { orderId: order.orderId } });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Pack order #{order.orderId}</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        {/* Pack timer reminder */}
        <View style={s.timerBanner}>
          <Text style={s.timerText}>📦 Pack within 10 min</Text>
        </View>

        {/* Item checklist */}
        <Text style={s.sec}>ITEM CHECKLIST</Text>
        {order.items.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => toggleItem(i)}
            style={s.checkRow}
            activeOpacity={0.8}
          >
            <View style={[s.checkbox, checked[i] && s.checkboxDone]}>
              {checked[i] && <Text style={s.checkMark}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.itemName}>{item.productName}</Text>
              <Text style={s.itemQty}>Qty {item.quantity}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Progress indicator */}
        <View style={s.progressRow}>
          <Text style={s.progressText}>
            {checked.filter(Boolean).length} / {checked.length} items checked
          </Text>
          <View style={s.progressBar}>
            <View
              style={[
                s.progressFill,
                { width: `${(checked.filter(Boolean).length / Math.max(checked.length, 1)) * 100}%` }
              ]}
            />
          </View>
        </View>

        {/* Photo upload */}
        <Text style={[s.sec, { marginTop: 20 }]}>PACK CONFIRMATION</Text>
        <UploadBox label="Upload photo of packed order (order ID visible)" />

        {/* Expiry */}
        <Text style={s.sec}>EXPIRY CHECK</Text>
        <View style={s.noteCard}>
          <Text style={s.noteText}>
            ⚠️ Verify all products are within their expiry date before packing.
          </Text>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.foot}>
        <PrimaryButton
          label={loading ? 'Marking packed…' : 'Mark ready for pickup'}
          onPress={handleMarkPacked}
          loading={loading}
          disabled={!allChecked}
        />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: Spacing.lg, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  back:      { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: Colors.ink, lineHeight: 22 },
  title:     { fontSize: 17, fontWeight: '700', color: Colors.ink },
  body:      { flex: 1, padding: Spacing.lg },
  timerBanner: {
    backgroundColor: Colors.ink, borderRadius: Radius.card,
    padding: 14, alignItems: 'center', marginBottom: 20,
  },
  timerText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  sec:       { fontSize: 11, fontWeight: '700', color: Colors.sub, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  checkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 14, marginBottom: 8,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxDone: { backgroundColor: Colors.green, borderColor: Colors.green },
  checkMark:    { color: '#fff', fontSize: 12, fontWeight: '800' },
  itemName:     { fontSize: 13.5, fontWeight: '600', color: Colors.ink },
  itemQty:      { fontSize: 12, color: Colors.sub, marginTop: 2 },
  progressRow:  { marginTop: 12, gap: 8 },
  progressText: { fontSize: 12, color: Colors.sub },
  progressBar:  { height: 4, backgroundColor: Colors.line, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: Colors.green, borderRadius: 2 },
  noteCard: {
    backgroundColor: '#fffbeb', borderRadius: Radius.lg,
    padding: 12, borderWidth: 1, borderColor: '#fde68a',
  },
  noteText: { fontSize: 12.5, color: Colors.amber },
  foot: { padding: Spacing.lg, paddingBottom: 32, borderTopWidth: 1, borderTopColor: Colors.line },
});

/**
 * Order Detail Screen
 * Full order view with item list, customer map, payout breakdown, timeline
 * Action buttons based on current status
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useVendorStore from '../../src/store/useVendorStore';
import { ordersApi } from '../../src/services/api';
import {
  StatusPill, orderStatusPill, SectionHeader,
  PrimaryButton, SecondaryButton, DangerButton, Card,
} from '../../src/components/ui';
import { Colors, Spacing, Radius } from '../../src/theme';
import type { Order } from '../../src/store/useVendorStore';

const VENDOR_ID = process.env.EXPO_PUBLIC_VENDOR_ID || 'VND-001';

function timeStr(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function OrderDetailScreen() {
  const router   = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders, updateOrder } = useVendorStore();

  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const local = orders.find(o => o.orderId === orderId);
    if (local) { setOrder(local); return; }
    ordersApi.getById(orderId).then(r => { if (r?.order) setOrder(r.order); }).catch(() => {});
  }, [orderId, orders]);

  const handleAccept = async () => {
    if (!order) return;
    setLoading(true);
    try {
      await ordersApi.accept(order.orderId, VENDOR_ID);
      const updated = { ...order, status: 'ACCEPTED' as const, acceptedAt: Date.now() };
      setOrder(updated);
      updateOrder(order.orderId, updated);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePack = () => {
    router.push({ pathname: '/(vendor)/pack-order', params: { orderId: order?.orderId } });
  };

  const handleCancel = () => {
    Alert.alert('Cancel order?', 'This will cancel the order and it cannot be undone.', [
      { text: 'No' },
      {
        text: 'Cancel order', style: 'destructive', onPress: async () => {
          if (!order) return;
          await ordersApi.cancel(order.orderId, 'Cancelled by vendor');
          updateOrder(order.orderId, { ...order, status: 'CANCELLED' as const });
          router.back();
        },
      },
    ]);
  };

  const callCustomer = () => {
    if (order?.customerPhone) Linking.openURL(`tel:${order.customerPhone}`);
  };

  if (!order) {
    return (
      <SafeAreaView style={s.root}>
        <View style={[s.header]}>
          <TouchableOpacity onPress={() => router.back()} style={s.back}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.title}>Order</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.sub }}>Loading order…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { label: pillLabel, variant: pillVariant } = orderStatusPill(order.status);
  const totalPayout = Math.round((order.pricing?.grandTotal || 0) * 0.08) + 50;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Order #{order.orderId}</Text>
        <StatusPill label={pillLabel} variant={pillVariant} style={{ marginLeft: 'auto' }} />
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        {/* Customer */}
        <SectionHeader title="Customer" />
        <Card outlined>
          <View style={s.custRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.custName}>{order.customerName}</Text>
              <Text style={s.custPhone}>{order.customerPhone}</Text>
            </View>
            <TouchableOpacity onPress={callCustomer} style={s.callBtn}>
              <Text style={s.callText}>📞 Call</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.custAddr}>{order.shippingAddress?.fullAddress}</Text>
        </Card>

        {/* Items */}
        <SectionHeader title="Items" />
        {order.items.map((item, i) => (
          <View key={i} style={s.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.itemName}>{item.productName}</Text>
            </View>
            <Text style={s.itemQty}>Qty {item.quantity}</Text>
            <Text style={s.itemPrice}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</Text>
          </View>
        ))}

        {/* Map placeholder */}
        <SectionHeader title="Customer Location" />
        <View style={s.mapMock}>
          <Text style={{ fontSize: 28 }}>📍</Text>
          <Text style={{ color: Colors.sub, fontSize: 12, marginTop: 4 }}>{order.shippingAddress?.fullAddress}</Text>
        </View>

        {/* Payment */}
        <SectionHeader title="Payment" />
        <Card outlined>
          <Text style={s.payMethod}>{order.payment?.method}</Text>
          <Text style={[s.payStatus, { color: order.payment?.status === 'PAID' ? Colors.green : Colors.amber }]}>
            {order.payment?.status === 'PAID' ? '✅ Paid online' : '⚠️ Collect at delivery'}
          </Text>
        </Card>

        {/* Payout */}
        <SectionHeader title="Payout Breakdown" />
        <View style={s.itemRow}>
          <Text style={{ flex: 1, fontSize: 14, color: Colors.ink }}>Item payout (8%)</Text>
          <Text style={s.itemPrice}>₹{Math.round((order.pricing?.grandTotal || 0) * 0.08).toLocaleString('en-IN')}</Text>
        </View>
        <View style={s.itemRow}>
          <Text style={{ flex: 1, fontSize: 14, color: Colors.ink }}>Handling bonus</Text>
          <Text style={s.itemPrice}>₹50</Text>
        </View>
        <View style={[s.itemRow, { borderBottomWidth: 0 }]}>
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '800', color: Colors.ink }}>Total</Text>
          <Text style={[s.itemPrice, { fontSize: 16 }]}>₹{totalPayout.toLocaleString('en-IN')}</Text>
        </View>

        {/* OTP */}
        {order.otp && (
          <>
            <SectionHeader title="Delivery OTP" />
            <Card>
              <Text style={s.otpText}>{order.otp.split('').join('  ')}</Text>
              <Text style={s.otpSub}>Share with customer when delivering</Text>
            </Card>
          </>
        )}

        {/* Timeline */}
        <SectionHeader title="Timeline" />
        <View style={s.timeline}>
          {[
            { label: 'Placed',     ts: order.createdAt },
            { label: 'Accepted',   ts: order.acceptedAt },
            { label: 'Packed',     ts: order.packedAt },
            { label: 'Dispatched', ts: order.dispatchedAt },
            { label: 'Delivered',  ts: (order as any).deliveredAt },
          ].map(({ label, ts }, i) => (
            <Text key={i} style={s.timelineRow}>
              {label} · <Text style={ts ? s.timelineTs : s.timelineBlank}>{timeStr(ts)}</Text>
            </Text>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Action Footer */}
      <View style={s.foot}>
        {order.status === 'PENDING' && (
          <>
            <PrimaryButton label={loading ? 'Accepting…' : 'Accept Order'} onPress={handleAccept} loading={loading} />
            <DangerButton label="Cancel" onPress={handleCancel} style={{ marginTop: 10 }} />
          </>
        )}
        {order.status === 'ACCEPTED' && (
          <PrimaryButton label="Start Packing" onPress={handlePack} />
        )}
        {order.status === 'PACKED' && (
          <PrimaryButton label="View pickup QR" onPress={() =>
            router.push({ pathname: '/(vendor)/ready-pickup', params: { orderId: order.orderId } })
          } />
        )}
        {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
          <SecondaryButton label="View in Earnings" onPress={() => router.push('/(vendor)/earnings')} />
        )}
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
  custRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  custName:  { fontSize: 14, fontWeight: '700', color: Colors.ink },
  custPhone: { fontSize: 12, color: Colors.sub, marginTop: 2 },
  custAddr:  { fontSize: 12.5, color: Colors.sub },
  callBtn:   { backgroundColor: Colors.greenBg, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 7 },
  callText:  { fontSize: 12, fontWeight: '700', color: Colors.green },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  itemName:  { fontSize: 13.5, fontWeight: '600', color: Colors.ink },
  itemQty:   { fontSize: 12, color: Colors.sub },
  itemPrice: { fontSize: 13.5, fontWeight: '700', color: Colors.ink },
  mapMock: {
    height: 120, borderRadius: Radius.lg, backgroundColor: '#eeeeee',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  payMethod: { fontSize: 13.5, fontWeight: '600', color: Colors.ink },
  payStatus: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  otpText:   { fontSize: 28, fontWeight: '800', letterSpacing: 8, textAlign: 'center', color: Colors.ink },
  otpSub:    { fontSize: 11, color: Colors.sub, textAlign: 'center', marginTop: 6 },
  timeline:  { gap: 6 },
  timelineRow: { fontSize: 13, color: Colors.sub, lineHeight: 22 },
  timelineTs:  { color: Colors.ink, fontWeight: '600' },
  timelineBlank: { color: Colors.sub },
  foot: { padding: Spacing.lg, paddingBottom: 32, borderTopWidth: 1, borderTopColor: Colors.line },
});

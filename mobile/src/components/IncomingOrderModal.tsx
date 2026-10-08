/**
 * GlowVAI Vendor — Incoming Order Modal
 * Rapido / Zepto Captain-style 60-second countdown acceptance popup
 * Auto-dismisses on timeout, pulses to grab attention
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, Modal, Animated, TouchableOpacity,
  StyleSheet, Vibration, Easing, ScrollView,
} from 'react-native';
import { Colors, Radius, Spacing } from '../theme';
import type { Order } from '../store/useVendorStore';

interface Props {
  order: Order | null;
  visible: boolean;
  onAccept: (order: Order) => void;
  onReject: (order: Order) => void;
  timeoutSeconds?: number;
}

export default function IncomingOrderModal({
  order, visible, onAccept, onReject, timeoutSeconds = 60,
}: Props) {
  const [countdown, setCountdown] = useState(timeoutSeconds);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Pulse animation
  useEffect(() => {
    if (visible && order) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.current.start();
      setCountdown(timeoutSeconds);
      Vibration.vibrate([0, 400, 200, 400], false);
    } else {
      pulseLoop.current?.stop();
    }
    return () => { pulseLoop.current?.stop(); };
  }, [visible, order]);

  // Countdown timer
  useEffect(() => {
    if (!visible || !order) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject(order!);
          return timeoutSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, order]);

  const handleAccept = useCallback(() => {
    if (order) onAccept(order);
  }, [order, onAccept]);

  const handleReject = useCallback(() => {
    if (order) onReject(order);
  }, [order, onReject]);

  if (!order) return null;

  const timerColor = countdown <= 10 ? Colors.red : countdown <= 20 ? Colors.amber : Colors.ink;
  const totalPayout = Math.round((order.pricing?.grandTotal || 0) * 0.08) + 50;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={s.overlay}>
        <Animated.View style={[s.sheet, { transform: [{ scale: pulseAnim }] }]}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>🛍️ New Order Request</Text>
            <View style={[s.timerPill, { backgroundColor: timerColor }]}>
              <Text style={s.timerText}>
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
              </Text>
            </View>
          </View>

          <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
            {/* Order ID */}
            <Text style={s.orderId}>Order #{order.orderId}</Text>

            {/* Timer bar */}
            <View style={s.timerBarBg}>
              <View
                style={[
                  s.timerBarFill,
                  {
                    width: `${(countdown / timeoutSeconds) * 100}%`,
                    backgroundColor: timerColor,
                  },
                ]}
              />
            </View>

            {/* Items */}
            <Text style={s.sectionTitle}>ITEMS</Text>
            {(order.items || []).map((item, i) => (
              <View key={i} style={s.itemRow}>
                <Text style={s.itemName}>{item.productName}</Text>
                <Text style={s.itemQty}>Qty {item.quantity}</Text>
              </View>
            ))}

            {/* Customer info */}
            <Text style={s.sectionTitle}>CUSTOMER</Text>
            <View style={s.infoCard}>
              <Text style={s.infoText}>📍 {order.shippingAddress?.fullAddress || 'Nearby'}</Text>
              <Text style={s.infoSub}>Expected pickup in ~10 min</Text>
            </View>

            {/* Payment */}
            <Text style={s.sectionTitle}>PAYMENT</Text>
            <View style={s.infoCard}>
              <Text style={s.infoText}>{order.payment?.method || 'Cash on Delivery'}</Text>
              <Text style={s.infoSub}>
                {order.payment?.status === 'PAID' ? '✅ Already paid' : '⚠️ Collect at delivery'}
              </Text>
            </View>

            {/* Payout */}
            <Text style={s.sectionTitle}>YOUR PAYOUT</Text>
            <View style={s.payoutCard}>
              <Text style={s.payoutLabel}>Total payout</Text>
              <Text style={s.payoutAmount}>₹{totalPayout}</Text>
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={s.footer}>
            <TouchableOpacity style={s.acceptBtn} onPress={handleAccept} activeOpacity={0.85}>
              <Text style={s.acceptText}>✓ Accept Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.rejectBtn} onPress={handleReject} activeOpacity={0.85}>
              <Text style={s.rejectText}>✕ Reject</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.ink },
  timerPill: {
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timerText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  body: { padding: Spacing.lg },

  orderId: { fontSize: 12, color: Colors.sub, marginBottom: 10 },

  timerBarBg: {
    height: 4,
    backgroundColor: Colors.line,
    borderRadius: 2,
    marginBottom: 20,
    overflow: 'hidden',
  },
  timerBarFill: { height: 4, borderRadius: 2 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.sub,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.ink, flex: 1 },
  itemQty:  { fontSize: 12, color: Colors.sub },

  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 12,
    marginBottom: 4,
  },
  infoText: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  infoSub:  { fontSize: 12, color: Colors.sub, marginTop: 4 },

  payoutCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payoutLabel:  { fontSize: 15, fontWeight: '700', color: Colors.ink },
  payoutAmount: { fontSize: 18, fontWeight: '800', color: Colors.ink },

  footer: {
    padding: Spacing.lg,
    paddingBottom: 32,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  acceptBtn: {
    backgroundColor: Colors.ink,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  acceptText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  rejectBtn: {
    backgroundColor: Colors.bg,
    borderRadius: Radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0d0cd',
  },
  rejectText: { color: Colors.red, fontSize: 15, fontWeight: '700' },
});

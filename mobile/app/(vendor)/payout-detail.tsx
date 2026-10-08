/**
 * Payout Detail Screen — Breakdown of a single payout cycle
 */
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';

const MOCK_ORDERS = {
  P1: [
    { id: '#GV4802', amount: 1120 },
    { id: '#GV4788', amount: 640 },
    { id: '#GV4771', amount: 1180 },
  ],
  P2: [
    { id: '#GV4755', amount: 980 },
    { id: '#GV4741', amount: 1000 },
  ],
};

export default function PayoutDetailScreen() {
  const router = useRouter();
  const { payoutId } = useLocalSearchParams<{ payoutId: string }>();

  const orders  = (MOCK_ORDERS as any)[payoutId] || [];
  const gross   = orders.reduce((s: number, o: any) => s + o.amount, 0);
  const deduct  = 50;
  const net     = gross - deduct;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Payout · Sep 22–24</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.sec}>ORDERS IN THIS PAYOUT</Text>
        {orders.map((o: any, i: number) => (
          <View key={i} style={s.row}>
            <Text style={s.rowLabel}>{o.id}</Text>
            <Text style={s.rowAmt}>₹{o.amount.toLocaleString('en-IN')}</Text>
          </View>
        ))}

        <Text style={[s.sec, { marginTop: 20 }]}>SUMMARY</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Gross</Text>
          <Text style={s.rowAmt}>₹{gross.toLocaleString('en-IN')}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Deductions</Text>
          <Text style={[s.rowAmt, { color: Colors.red }]}>−₹{deduct}</Text>
        </View>
        <View style={[s.row, { borderBottomWidth: 0 }]}>
          <Text style={[s.rowLabel, { fontWeight: '800' }]}>Net amount</Text>
          <Text style={[s.rowAmt, { fontSize: 16 }]}>₹{net.toLocaleString('en-IN')}</Text>
        </View>

        <View style={s.bankCard}>
          <Text style={s.bankText}>✅ Paid to HDFC ••••4821</Text>
          <Text style={s.bankDate}>Sep 25, 2024 · 11:20 AM</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: Spacing.lg, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  back:      { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: Colors.ink, lineHeight: 22 },
  title:     { fontSize: 17, fontWeight: '700', color: Colors.ink },
  body:      { flex: 1, padding: Spacing.lg },
  sec:       { fontSize: 11, fontWeight: '700', color: Colors.sub, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  rowLabel: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  rowAmt:   { fontSize: 14, fontWeight: '700', color: Colors.ink },
  bankCard: {
    backgroundColor: Colors.greenBg, borderRadius: Radius.card,
    padding: 14, marginTop: 20,
  },
  bankText: { fontSize: 13.5, fontWeight: '700', color: Colors.green },
  bankDate: { fontSize: 12, color: Colors.green, marginTop: 4 },
});

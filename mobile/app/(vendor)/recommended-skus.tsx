/**
 * Recommended SKUs Screen
 * High-demand products in the vendor's locality to add to catalog
 */
import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import useVendorStore from '../../src/store/useVendorStore';
import { inventoryApi } from '../../src/services/api';
import { StatusPill } from '../../src/components/ui';
import { Colors, Spacing, Radius } from '../../src/theme';

const RECOMMENDED = [
  { id: 'REC1', name: 'Cetaphil Gentle Cleanser 250ml',   mrp: 599, payout: 479, demand: 'Very High' },
  { id: 'REC2', name: 'The Ordinary Niacinamide 10% 30ml', mrp: 690, payout: 552, demand: 'High' },
  { id: 'REC3', name: 'Dot & Key Vitamin C+E Serum 20ml',  mrp: 449, payout: 359, demand: 'High' },
  { id: 'REC4', name: 'Lakme Absolute Serum Foundation',   mrp: 975, payout: 780, demand: 'High' },
  { id: 'REC5', name: 'WOW Skin Apple Cider Shampoo 300ml',mrp: 599, payout: 479, demand: 'Medium' },
];

const STORE_ID = process.env.EXPO_PUBLIC_STORE_ID || 'DS-VIJ-01';

export default function RecommendedSkusScreen() {
  const router = useRouter();
  const { addInventoryItem } = useVendorStore();

  const handleAdd = async (rec: typeof RECOMMENDED[0]) => {
    try {
      const res = await inventoryApi.add({
        name: rec.name,
        category: 'Skincare',
        sku: 'REC-' + rec.id,
        mrp: rec.mrp,
        sellingPrice: rec.payout,
        stock: 0,
        bin: 'BIN-UNASSIGNED',
        storeId: STORE_ID,
        gstPercent: 18,
      });
      if (res?.item) addInventoryItem(res.item);
      Alert.alert('Added! ✅', `${rec.name} added to your catalog. Set stock quantity to start selling.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Recommended for you</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        <Text style={s.sub}>High-demand products in your locality. Add them to start earning more.</Text>

        {RECOMMENDED.map(rec => (
          <View key={rec.id} style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.prodName}>{rec.name}</Text>
              <StatusPill
                label={rec.demand === 'Very High' ? '🔥 Very High' : rec.demand === 'High' ? 'High demand' : 'Medium'}
                variant={rec.demand === 'Very High' ? 'red' : rec.demand === 'High' ? 'amber' : 'neutral'}
              />
            </View>
            <Text style={s.prodMeta}>MRP ₹{rec.mrp} · You'd earn ₹{rec.payout} per unit</Text>
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => handleAdd(rec)}
              activeOpacity={0.85}
            >
              <Text style={s.addBtnText}>+ Add to catalog</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 32 }} />
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
  sub:       { fontSize: 13, color: Colors.sub, marginBottom: 16, lineHeight: 18 },
  card: {
    borderWidth: 1, borderColor: Colors.line, borderRadius: Radius.card,
    padding: 14, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  prodName:   { fontSize: 13.5, fontWeight: '700', color: Colors.ink, flex: 1 },
  prodMeta:   { fontSize: 12, color: Colors.sub, marginBottom: 12 },
  addBtn: {
    borderWidth: 1, borderColor: Colors.ink, borderRadius: Radius.md,
    paddingVertical: 9, alignItems: 'center',
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: Colors.ink },
});

/**
 * GlowVAI Vendor App — Add / Edit Verified SKU to Dark Store Inventory
 * ═══════════════════════════════════════════════════════════════════════════
 * Features:
 *   • Master Verified Catalog Picker (Fixed Brand MRP)
 *   • 12% Transparent GlowVAI Fee / 88% Direct Bank Payout Breakdown
 *   • Real-Time Stock Stepper & Quick Batch Chips (+5, +10, +25, +50)
 *   • Dark Store Shelf / Bin Allocation
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useVendorStore from '../../src/store/useVendorStore';
import { inventoryApi } from '../../src/services/api';
import {
  MASTER_BEAUTY_CATALOG,
  calculateVendorPayout,
  type MasterProduct,
} from '../../src/data/masterCatalog';
import { Colors, Spacing, Radius } from '../../src/theme';

const STORE_ID = process.env.EXPO_PUBLIC_STORE_ID || 'DS-VIJ-01';

export default function AddSkuScreen() {
  const router = useRouter();
  const { productId, sku: incomingSku } = useLocalSearchParams<{ productId?: string; sku?: string }>();
  const { inventory, addInventoryItem, updateInventoryItem } = useVendorStore();

  const existing = productId ? inventory.find(i => i.productId === productId) : null;
  const isEditing = !!existing;

  const initialMasterProduct = MASTER_BEAUTY_CATALOG.find(
    m => m.sku === (incomingSku || existing?.sku || 'MIN-NIAC-30ML')
  ) || MASTER_BEAUTY_CATALOG[0];

  const [selectedProduct, setSelectedProduct] = useState<MasterProduct>(initialMasterProduct);
  const [stock, setStock] = useState<number>(existing?.stock ?? 20);
  const [bin, setBin] = useState<string>(existing?.bin || initialMasterProduct.shelfBin);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (incomingSku) {
      const match = MASTER_BEAUTY_CATALOG.find(m => m.sku === incomingSku);
      if (match) {
        setSelectedProduct(match);
        setBin(match.shelfBin);
      }
    }
  }, [incomingSku]);

  // Financial calculations with flat 12% fee
  const { mrp, platformFee, vendorPayout } = calculateVendorPayout(selectedProduct.mrp);

  const changeStock = (delta: number) => {
    setStock(prev => Math.max(1, prev + delta));
  };

  const handleBatchAdd = (amount: number) => {
    setStock(prev => prev + amount);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        name: selectedProduct.name,
        category: selectedProduct.category,
        sku: selectedProduct.sku,
        mrp: selectedProduct.mrp,
        sellingPrice: vendorPayout,
        stock,
        bin,
        storeId: STORE_ID,
        gstPercent: 18,
        brand: selectedProduct.brand,
      };

      if (isEditing && productId) {
        await inventoryApi.update(productId, payload);
        updateInventoryItem(productId, payload);
      } else {
        const res = await inventoryApi.add(payload);
        if (res?.item) addInventoryItem(res.item);
      }

      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save product to catalog');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.container}>
        {/* Top Header */}
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{isEditing ? 'Edit Store Stock' : 'Add Verified Beauty SKU'}</Text>
            <Text style={s.subtitle}>Standardized brand pricing & 88% direct bank payout</Text>
          </View>
          <TouchableOpacity onPress={() => router.replace('/(vendor)/home')} style={s.homeBtn}>
            <Text style={s.homeBtnText}>⚡ Home</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.body} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Quick Select from Master Catalog Strip */}
          {!isEditing && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>1. Pick Verified Product from Master Catalog</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catalogScroll}>
                {MASTER_BEAUTY_CATALOG.map(item => {
                  const active = selectedProduct.sku === item.sku;
                  return (
                    <TouchableOpacity
                      key={item.sku}
                      style={[s.catalogChip, active && s.catalogChipActive]}
                      onPress={() => {
                        setSelectedProduct(item);
                        setBin(item.shelfBin);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={s.chipTop}>
                        <Text style={{ fontSize: 20 }}>{item.image}</Text>
                        <Text style={[s.chipBrand, active && { color: '#09090b' }]}>{item.brand}</Text>
                      </View>
                      <Text style={[s.chipName, active && { color: '#09090b' }]} numberOfLines={2}>{item.name}</Text>
                      <Text style={[s.chipMrp, active && { color: '#09090b' }]}>MRP ₹{item.mrp}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Selected Product Card */}
          <View style={s.card}>
            <View style={s.selectedHeader}>
              <View style={s.productIconBox}>
                <Text style={{ fontSize: 28 }}>{selectedProduct.image}</Text>
              </View>
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <View style={s.tagRow}>
                  <Text style={s.brandBadge}>{selectedProduct.brand}</Text>
                  <Text style={s.skuCodeText}>SKU: {selectedProduct.sku}</Text>
                </View>
                <Text style={s.productTitle}>{selectedProduct.name}</Text>
                <Text style={s.categorySub}>{selectedProduct.category} · {selectedProduct.volume}</Text>
              </View>
            </View>

            <View style={s.shelfBinRow}>
              <Text style={s.shelfLabel}>📍 Dark Store Shelf Bin:</Text>
              <TextInput
                style={s.binInput}
                value={bin}
                onChangeText={setBin}
                placeholder="RACK-A-01"
                placeholderTextColor="#71717a"
              />
            </View>
          </View>

          {/* Transparent 12% Platform Fee & 88% Payout Breakdown */}
          <View style={s.pricingCard}>
            <Text style={s.cardHeading}>💰 Fixed Consumer MRP & Net Payout</Text>
            <Text style={s.pricingNotice}>
              Customer retail price is fixed by the brand. GlowVAI charges a flat 12% fulfillment fee for 10-minute delivery.
            </Text>

            <View style={s.payoutBreakdown}>
              <View style={s.payoutRow}>
                <Text style={s.payoutRowLabel}>Customer Retail Price (MRP):</Text>
                <Text style={s.payoutRowVal}>₹{mrp.toFixed(2)}</Text>
              </View>
              <View style={s.payoutRow}>
                <Text style={s.payoutRowLabel}>GlowVAI Platform & Dispatch Fee (12%):</Text>
                <Text style={[s.payoutRowVal, { color: '#f87171' }]}>−₹{platformFee.toFixed(2)}</Text>
              </View>
              <View style={s.payoutDivider} />
              <View style={s.payoutRow}>
                <Text style={s.payoutFinalLabel}>Your Net Bank Payout (88%):</Text>
                <Text style={s.payoutFinalVal}>₹{vendorPayout.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          {/* Real-Time Stock Stepper Card */}
          <View style={s.stockCard}>
            <View style={s.stockHeader}>
              <View>
                <Text style={s.stockTitle}>🔢 Initial Stock Quantity</Text>
                <Text style={s.stockSub}>Units available in your dark store for immediate dispatch</Text>
              </View>
              <View style={s.inStockTag}>
                <Text style={s.inStockTagText}>IN STOCK</Text>
              </View>
            </View>

            <View style={s.stepperRow}>
              <TouchableOpacity
                style={[s.stepBtn, stock <= 1 && s.stepBtnDisabled]}
                onPress={() => changeStock(-1)}
                disabled={stock <= 1}
              >
                <Text style={s.stepBtnText}>−</Text>
              </TouchableOpacity>

              <View style={s.stepValBox}>
                <Text style={s.stepCount}>{stock}</Text>
                <Text style={s.stepUnit}>units staged</Text>
              </View>

              <TouchableOpacity
                style={s.stepBtn}
                onPress={() => changeStock(1)}
              >
                <Text style={s.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Batch Increments */}
            <View style={s.batchRow}>
              <Text style={s.batchLabel}>Quick add batch:</Text>
              <View style={s.batchChips}>
                {[5, 10, 25, 50].map(inc => (
                  <TouchableOpacity
                    key={inc}
                    style={s.batchChip}
                    onPress={() => handleBatchAdd(inc)}
                  >
                    <Text style={s.batchChipText}>+{inc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Total Staged Revenue */}
            <View style={s.stagedSummary}>
              <Text style={s.stagedLabel}>Total Batch Gross Payout:</Text>
              <Text style={s.stagedVal}>₹{(vendorPayout * stock).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Bottom Save Action */}
        <View style={s.foot}>
          <TouchableOpacity
            style={[s.saveButton, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={s.saveButtonText}>
              {loading ? '⏳ Updating Inventory…' : isEditing ? 'Save Stock Changes' : '✨ Add Product to Live Store Catalog'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090b',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 640,
    flex: 1,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: '#121215',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181b',
  },
  backArrow: { fontSize: 20, color: '#f4f4f5', lineHeight: 22 },
  title:     { fontSize: 16, fontWeight: '800', color: '#f4f4f5' },
  subtitle:  { fontSize: 11.5, color: '#a1a1aa', marginTop: 1 },
  homeBtn: {
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  homeBtnText: {
    color: '#facc15',
    fontSize: 12,
    fontWeight: '800',
  },
  body:    { flex: 1 },
  content: { padding: Spacing.lg },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#f4f4f5',
    marginBottom: 8,
  },
  catalogScroll: { gap: 10, paddingVertical: 2 },
  catalogChip: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
    width: 170,
  },
  catalogChipActive: {
    backgroundColor: '#facc15',
    borderColor: '#facc15',
  },
  chipTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chipBrand: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38bdf8',
    textTransform: 'uppercase',
  },
  chipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f4f4f5',
    lineHeight: 16,
    marginBottom: 6,
  },
  chipMrp: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4ade80',
  },
  card: {
    backgroundColor: '#121215',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  brandBadge: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#38bdf8',
    textTransform: 'uppercase',
  },
  skuCodeText: {
    fontSize: 10,
    color: '#71717a',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  productTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#f4f4f5',
    lineHeight: 18,
  },
  categorySub: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 2,
  },
  shelfBinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  shelfLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#a1a1aa',
    marginRight: 8,
  },
  binInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#facc15',
  },
  pricingCard: {
    backgroundColor: '#121215',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 16,
    marginBottom: 16,
  },
  cardHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#f4f4f5',
    marginBottom: 4,
  },
  pricingNotice: {
    fontSize: 11.5,
    color: '#a1a1aa',
    lineHeight: 16,
    marginBottom: 12,
  },
  payoutBreakdown: {
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  payoutRowLabel: {
    fontSize: 11.5,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  payoutRowVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#f4f4f5',
  },
  payoutDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 6,
  },
  payoutFinalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4ade80',
  },
  payoutFinalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#4ade80',
  },
  stockCard: {
    backgroundColor: '#121215',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#facc15',
    padding: 16,
    marginBottom: 16,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  stockTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#f4f4f5',
  },
  stockSub: {
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 1,
  },
  inStockTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inStockTagText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '800',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: '#18181b',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    backgroundColor: '#27272a',
    opacity: 0.5,
  },
  stepBtnText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#09090b',
  },
  stepValBox: {
    alignItems: 'center',
    minWidth: 90,
  },
  stepCount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#f4f4f5',
  },
  stepUnit: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '600',
  },
  batchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  batchLabel: {
    fontSize: 11.5,
    color: '#a1a1aa',
    fontWeight: '700',
  },
  batchChips: {
    flexDirection: 'row',
    gap: 6,
  },
  batchChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  batchChipText: {
    color: '#facc15',
    fontSize: 11,
    fontWeight: '800',
  },
  stagedSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 10,
  },
  stagedLabel: {
    fontSize: 11.5,
    color: '#a1a1aa',
    fontWeight: '700',
  },
  stagedVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#4ade80',
  },
  foot: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#121215',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  saveButton: {
    backgroundColor: '#facc15',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#09090b',
    fontSize: 14,
    fontWeight: '900',
  },
});

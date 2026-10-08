/**
 * Real-Time Catalog & Product Inventory Dashboard
 * Inspired by Blinkit / Zepto / Swiggy Instamart / Nykaa Dark Store Fleet Systems
 * Features:
 *  - 1-tap In Stock / Out of Stock / Active toggle
 *  - Instant + / - stock adjustment with live socket push
 *  - Real-time category filtering & fast SKU search
 *  - In-app Bulk CSV Importer modal with live backend & admin sync
 *  - Real-time stock alerts & bin locations
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, RefreshControl,
  Modal, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import useVendorStore from '../../src/store/useVendorStore';
import { inventoryApi } from '../../src/services/api';
import { StatusPill } from '../../src/components/ui';
import { Colors, Spacing, Radius } from '../../src/theme';

const STORE_ID = process.env.EXPO_PUBLIC_STORE_ID || 'DS-VIJ-01';

const CATEGORIES = ['All', 'Skincare', 'Makeup', 'Haircare', 'Face Wash', 'Sunscreen', 'Serums', 'Samples'];

const SAMPLE_CSV = `SKU,Product Name,Category,MRP,Stock
SKU-GLOW-101,Dot & Key Watermelon Cooling Sunscreen SPF 50,Sunscreen,595,35
SKU-GLOW-102,Minimalist 2% Alpha Arbutin Serum 30ml,Serums,549,20
SKU-GLOW-103,Nykaa Matte to Last Liquid Lipstick - Chai,Makeup,675,18
SKU-GLOW-104,Plum Green Tea Pore Cleansing Face Wash 100ml,Face Wash,349,25
SKU-GLOW-105,Minimalist Salicylic Acid Cleanser 100ml,Face Wash,299,30`;

export default function CatalogScreen() {
  const router = useRouter();
  const { inventory, setInventory, updateInventoryItem } = useVendorStore();

  const [search,        setSearch]        = useState('');
  const [selectedCat,   setSelectedCat]   = useState('All');
  const [filterMode,    setFilterMode]    = useState<'all' | 'low' | 'out'>('all');
  const [refreshing,    setRefreshing]    = useState(false);
  const [csvModalOpen,  setCsvModalOpen]  = useState(false);
  const [csvText,       setCsvText]       = useState('');
  const [importing,     setImporting]     = useState(false);

  const loadInventory = async () => {
    try {
      const res = await inventoryApi.getAll(STORE_ID);
      if (res?.items) {
        setInventory(res.items);
      }
    } catch (_) {}
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventory();
    setRefreshing(false);
  };

  // Filter products by category, status, and search query
  const filtered = inventory.filter(item => {
    // Search
    const matchSearch =
      search === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(search.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(search.toLowerCase()));

    // Category
    const matchCat = selectedCat === 'All' || item.category === selectedCat;

    // Status filter
    let matchStatus = true;
    if (filterMode === 'low') matchStatus = item.stock > 0 && item.stock < 5;
    if (filterMode === 'out') matchStatus = item.stock === 0 || !item.active;

    return matchSearch && matchCat && matchStatus;
  });

  // Real-time stock adjustment with socket push
  const handleQuickStockAdjust = async (productId: string, delta: number) => {
    const currentItem = inventory.find(i => i.productId === productId);
    if (!currentItem) return;
    const newStock = Math.max(0, currentItem.stock + delta);

    // Optimistic UI update
    updateInventoryItem(productId, { stock: newStock, active: newStock > 0 });

    try {
      await inventoryApi.adjustStock(productId, delta, 'Quick instant adjust');
    } catch (e: any) {
      // Revert if error
      updateInventoryItem(productId, { stock: currentItem.stock, active: currentItem.active });
      Alert.alert('Error', e.message);
    }
  };

  // 1-tap Active / Inactive toggle
  const handleToggleActive = async (productId: string, current: boolean) => {
    updateInventoryItem(productId, { active: !current });
    try {
      await inventoryApi.update(productId, { active: !current });
    } catch (e: any) {
      updateInventoryItem(productId, { active: current });
      Alert.alert('Error', e.message);
    }
  };

  // Process Bulk CSV Import
  const handleProcessCsv = async () => {
    if (!csvText.trim()) {
      Alert.alert('Empty CSV', 'Please enter or paste CSV lines.');
      return;
    }
    setImporting(true);
    try {
      const res = await inventoryApi.bulkUpload([], csvText, STORE_ID);
      Alert.alert('🚀 Real-Time Bulk Sync Complete', `Added/Updated ${res.count || 'all'} products in live store catalog & Admin console.`);
      setCsvModalOpen(false);
      setCsvText('');
      await loadInventory();
    } catch (e: any) {
      Alert.alert('Import Failed', e.message || 'Check CSV format');
    } finally {
      setImporting(false);
    }
  };

  const lowStockCount = inventory.filter(i => i.stock < 5).length;

  return (
    <SafeAreaView style={s.root}>
      <View style={s.container}>
        {/* Top Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.back}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Real-Time Catalog & Stock</Text>
            <Text style={s.subtitle}>Store ID: {STORE_ID} • {inventory.length} SKUs live</Text>
          </View>
          <TouchableOpacity
            style={s.bulkHeaderBtn}
            onPress={() => setCsvModalOpen(true)}
          >
            <Text style={s.bulkHeaderBtnText}>⚡ CSV Bulk</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={s.searchWrap}>
          <View style={s.searchInputRow}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput
              style={s.search}
              placeholder="Search products by name, SKU or category…"
              placeholderTextColor={Colors.sub}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ color: Colors.sub, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Filter Status Badges */}
        <View style={s.statusPillsRow}>
          <TouchableOpacity
            onPress={() => setFilterMode('all')}
            style={[s.statusFilterPill, filterMode === 'all' && s.statusFilterPillActive]}
          >
            <Text style={[s.statusFilterText, filterMode === 'all' && s.statusFilterTextActive]}>
              All ({inventory.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterMode('low')}
            style={[s.statusFilterPill, filterMode === 'low' && s.statusFilterPillActive, { borderColor: '#f59e0b' }]}
          >
            <Text style={[s.statusFilterText, filterMode === 'low' && s.statusFilterTextActive]}>
              ⚠️ Low Stock ({lowStockCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilterMode('out')}
            style={[s.statusFilterPill, filterMode === 'out' && s.statusFilterPillActive, { borderColor: '#ef4444' }]}
          >
            <Text style={[s.statusFilterText, filterMode === 'out' && s.statusFilterTextActive]}>
              🚫 Out of Stock
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Category Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catScroll}
        >
          {CATEGORIES.map(cat => {
            const active = selectedCat === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCat(cat)}
                style={[s.catPill, active && s.catPillActive]}
              >
                <Text style={[s.catText, active && s.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Action Row */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={s.actionBtn}
            onPress={() => router.push('/(vendor)/add-sku')}
          >
            <Text style={s.actionText}>+ Add Single SKU</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: Colors.line }]}
            onPress={() => router.push('/(vendor)/recommended-skus')}
          >
            <Text style={[s.actionText, { color: Colors.ink }]}>⭐ High-Demand SKUs</Text>
          </TouchableOpacity>
        </View>

        {/* Product Inventory List */}
        <ScrollView
          style={s.list}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Text style={{ fontSize: 36 }}>📦</Text>
              <Text style={s.emptyTitle}>No matching products</Text>
              <Text style={s.emptySub}>Try adjusting your search or category filter</Text>
            </View>
          ) : (
            filtered.map(item => {
              const isLow = item.stock < 5 && item.stock > 0;
              const isOut = item.stock === 0 || !item.active;
              const margin = item.mrp ? Math.round(((item.mrp - (item.sellingPrice || item.mrp * 0.8)) / item.mrp) * 100) : 20;

              return (
                <View key={item.productId} style={[s.skuCard, isLow && s.skuCardLow, isOut && s.skuCardOut]}>
                  <View style={s.cardTop}>
                    <View style={{ flex: 1 }}>
                      <View style={s.badgeRow}>
                        <Text style={s.categoryTag}>{item.category || 'Beauty'}</Text>
                        <Text style={s.skuCode}>{item.sku || item.productId}</Text>
                        {item.bin && <Text style={s.binTag}>📍 {item.bin}</Text>}
                      </View>
                      <Text style={s.productName}>{item.name}</Text>
                    </View>

                    {/* Active toggle button */}
                    <TouchableOpacity
                      onPress={() => handleToggleActive(item.productId, item.active)}
                      style={[s.toggleBtn, item.active && s.toggleBtnActive]}
                    >
                      <Text style={[s.toggleBtnText, item.active && s.toggleBtnTextActive]}>
                        {item.active ? 'LIVE' : 'OFF'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={s.cardBottom}>
                    <View style={s.priceBlock}>
                      <Text style={s.mrp}>Fixed MRP ₹{item.mrp}</Text>
                      <View style={s.payoutRow}>
                        <Text style={s.payoutText}>Net Payout (88%): <Text style={s.payoutBold}>₹{Math.round(item.mrp * 0.88)}</Text></Text>
                        <Text style={[s.marginTag, { color: '#f59e0b', backgroundColor: '#fffbeb' }]}>12% GlowVAI Fee</Text>
                      </View>
                    </View>

                    {/* Quick Real-Time Stock Stepper */}
                    <View style={s.stockControls}>
                      <TouchableOpacity
                        onPress={() => handleQuickStockAdjust(item.productId, -1)}
                        style={s.stepBtn}
                        disabled={item.stock === 0}
                      >
                        <Text style={s.stepBtnText}>−</Text>
                      </TouchableOpacity>

                      <View style={s.stockNumberBox}>
                        <Text style={[s.stockNumber, isLow && { color: '#d97706' }, isOut && { color: '#dc2626' }]}>
                          {item.stock}
                        </Text>
                        <Text style={s.stockUnit}>in stock</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleQuickStockAdjust(item.productId, 1)}
                        style={s.stepBtn}
                      >
                        <Text style={s.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Bulk CSV Importer Modal */}
        <Modal
          visible={csvModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCsvModalOpen(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              <View style={s.modalHeader}>
                <View>
                  <Text style={s.modalTitle}>⚡ Real-Time CSV Bulk Importer</Text>
                  <Text style={s.modalSub}>Sync hundreds of beauty SKUs into live catalog</Text>
                </View>
                <TouchableOpacity onPress={() => setCsvModalOpen(false)} style={s.closeBtn}>
                  <Text style={s.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={s.loadSampleBtn}
                onPress={() => setCsvText(SAMPLE_CSV)}
              >
                <Text style={s.loadSampleText}>📋 Load 5 Popular Beauty SKUs</Text>
              </TouchableOpacity>

              <TextInput
                style={s.modalCsvInput}
                placeholder="SKU,Product Name,Category,MRP,Stock&#10;SKU-01,Minimalist Niacinamide,Serums,599,25"
                placeholderTextColor={Colors.sub}
                value={csvText}
                onChangeText={setCsvText}
                multiline
                numberOfLines={6}
              />

              <View style={s.modalActions}>
                <TouchableOpacity
                  style={[s.modalBtn, { backgroundColor: '#e2e8f0' }]}
                  onPress={() => setCsvModalOpen(false)}
                >
                  <Text style={[s.modalBtnText, { color: Colors.ink }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.modalBtn, { backgroundColor: Colors.green }]}
                  onPress={handleProcessCsv}
                  disabled={importing}
                >
                  <Text style={[s.modalBtnText, { color: '#fff' }]}>
                    {importing ? 'Processing…' : '🚀 Sync Live Catalog'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center' },
  container: { width: '100%', maxWidth: 580, flex: 1 },
  header: {
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
  subtitle:  { fontSize: 11.5, color: Colors.sub, marginTop: 1 },
  bulkHeaderBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bulkHeaderBtnText: { color: '#c084fc', fontSize: 11, fontWeight: '800' },

  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  search: { flex: 1, fontSize: 13, color: Colors.ink },

  statusPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: 8,
  },
  statusFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: '#fff',
  },
  statusFilterPillActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  statusFilterText:       { fontSize: 11.5, fontWeight: '600', color: Colors.sub },
  statusFilterTextActive: { color: '#fff' },

  catScroll: { paddingHorizontal: Spacing.lg, gap: 6, paddingBottom: 10 },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catPillActive: { backgroundColor: Colors.ink },
  catText:       { fontSize: 12, fontWeight: '600', color: Colors.sub },
  catTextActive: { color: '#fff' },

  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.ink,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontSize: 12.5, fontWeight: '700' },

  list: { flex: 1, paddingHorizontal: Spacing.lg },
  skuCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.card,
    padding: 14,
    marginBottom: 10,
  },
  skuCardLow: { borderColor: '#fde68a', backgroundColor: '#fffbeb' },
  skuCardOut: { borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginBottom: 4 },
  categoryTag: {
    backgroundColor: '#f1f5f9',
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  skuCode: { fontSize: 10, color: Colors.sub, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  binTag:  { fontSize: 10, color: '#64748b' },
  productName: { fontSize: 14, fontWeight: '700', color: Colors.ink, lineHeight: 18 },

  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
  },
  toggleBtnActive: { backgroundColor: 'rgba(34,197,94,0.15)' },
  toggleBtnText:   { fontSize: 10, fontWeight: '800', color: Colors.sub },
  toggleBtnTextActive: { color: Colors.green },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceBlock: { flex: 1 },
  mrp: { fontSize: 11, color: Colors.sub, textDecorationLine: 'line-through' },
  payoutRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payoutText: { fontSize: 12.5, color: Colors.ink },
  payoutBold: { fontWeight: '800', color: Colors.green },
  marginTag: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    color: Colors.green,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },

  stockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    padding: 4,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 16, fontWeight: '700', color: Colors.ink, lineHeight: 18 },
  stockNumberBox: { alignItems: 'center', minWidth: 44 },
  stockNumber: { fontSize: 14, fontWeight: '800', color: Colors.ink },
  stockUnit:   { fontSize: 8.5, color: Colors.sub },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink, marginTop: 8 },
  emptySub:   { fontSize: 12, color: Colors.sub, marginTop: 2 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: Radius.card,
    padding: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalTitle:  { fontSize: 16, fontWeight: '700', color: Colors.ink },
  modalSub:    { fontSize: 12, color: Colors.sub, marginTop: 2 },
  closeBtn:    { padding: 4 },
  closeBtnText:{ fontSize: 18, color: Colors.sub, fontWeight: '700' },
  loadSampleBtn: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: 10,
  },
  loadSampleText: { fontSize: 12, fontWeight: '700', color: Colors.ink },
  modalCsvInput: {
    height: 120,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    padding: 10,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Colors.ink,
    textAlignVertical: 'top',
    marginBottom: 14,
    backgroundColor: '#fafafa',
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center' },
  modalBtnText: { fontSize: 13, fontWeight: '700' },
});

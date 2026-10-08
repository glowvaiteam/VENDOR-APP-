/**
 * GlowVAI Vendor App — Step D: Inventory & Dark Store Catalog Setup
 * ═══════════════════════════════════════════════════════════════════════════
 * Industry-Grade Quick-Commerce Merchant Onboarding (Blinkit / Swiggy Instamart):
 *   • Brand Color: Vibrant Electric Royal Blue (#0050ff)
 *   • Includes OwlLoader (popular-owl-27 animation) for smooth state transitions
 *   • Includes CustomerAppRedirectButton (short-lion-13 style) in top bar
 *   • "Simply click here to add products instantly without manual filling" Quick-Add Engine
 *   • Product selection modal with individual toggles (OFF by default) & live stock steppers
 *   • Fully responsive on ultra-narrow (320px) to tablet viewports
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  SafeAreaView, TouchableOpacity, Alert, Platform,
  Modal, Image, Switch, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { inventoryApi } from '../../src/services/api';
import useVendorStore from '../../src/store/useVendorStore';
import { soundService } from '../../src/services/sound';
import OwlLoader from '../../src/components/OwlLoader';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STORE_ID = process.env.EXPO_PUBLIC_STORE_ID || 'DS-VIJ-01';

const POPULAR_CATALOG_PRESETS = [
  {
    id: 'SKU-SER-001',
    name: 'Minimalist 10% Niacinamide Face Serum (30ml)',
    category: 'Serums',
    brand: 'Minimalist',
    unitType: 'bottle',
    packSize: '30 ml',
    sellingPrice: 599,
    mrp: 649,
    defaultStock: 24,
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80',
    description: '10% Niacinamide serum with Zinc for oil control and skin barrier repair.',
  },
  {
    id: 'SKU-CLN-002',
    name: 'CeraVe Hydrating Cleanser for Dry Skin (237ml)',
    category: 'Cleanser',
    brand: 'CeraVe',
    unitType: 'bottle',
    packSize: '237 ml',
    sellingPrice: 999,
    mrp: 1199,
    defaultStock: 18,
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
    description: 'Gentle ceramide cleanser with hyaluronic acid for deep hydration.',
  },
  {
    id: 'SKU-SUN-003',
    name: 'Re\'equil Ultra Matte Dry Touch Sunscreen SPF 50',
    category: 'Sunscreen',
    brand: 'Re\'equil',
    unitType: 'tube',
    packSize: '50 g',
    sellingPrice: 699,
    mrp: 795,
    defaultStock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80',
    description: 'Broad spectrum UVA/UVB shield with velvet matte dry-touch finish.',
  },
  {
    id: 'SKU-GRO-004',
    name: 'Aashirvaad Superior MP Whole Wheat Atta (5kg)',
    category: 'Groceries',
    brand: 'Aashirvaad',
    unitType: 'pack',
    packSize: '5 kg',
    sellingPrice: 280,
    mrp: 310,
    defaultStock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    description: '100% pure whole wheat grain flour with natural dietary fiber.',
  },
  {
    id: 'SKU-SER-005',
    name: 'Dot & Key 10% Vitamin C + E Glow Serum (20ml)',
    category: 'Serums',
    brand: 'Dot & Key',
    unitType: 'bottle',
    packSize: '20 ml',
    sellingPrice: 449,
    mrp: 495,
    defaultStock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-bb6e4b9d044f?w=400&q=80',
    description: 'Triple vitamin C glow serum with Sicilian blood orange for radiant skin.',
  },
  {
    id: 'SKU-MOI-006',
    name: 'Laneige Water Sleeping Mask (70ml)',
    category: 'Skincare',
    brand: 'Laneige',
    unitType: 'tub',
    packSize: '70 ml',
    sellingPrice: 1450,
    mrp: 1600,
    defaultStock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80',
    description: 'Overnight hydrating probiotic mask for supple, radiant skin.',
  },
];

const CATEGORY_OPTIONS = ['All', 'Serums', 'Sunscreen', 'Cleanser', 'Groceries', 'Skincare'];

export default function OnboardingStepD() {
  const router = useRouter();
  const { inventory, setInventory, addInventoryItem, updateInventoryItem } = useVendorStore();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Quick-Add Modal
  const [isPopularModalOpen, setIsPopularModalOpen] = useState(false);
  const [popularSelections, setPopularSelections] = useState<Record<string, { selected: boolean; stock: number }>>({});

  // Manual Add Modal
  const [isManualDrawerOpen, setIsManualDrawerOpen] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState('Serums');
  const [manualBrand, setManualBrand] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualStock, setManualStock] = useState('24');

  useEffect(() => {
    loadExistingInventory();
    const initSel: Record<string, { selected: boolean; stock: number }> = {};
    POPULAR_CATALOG_PRESETS.forEach(p => {
      initSel[p.id] = { selected: false, stock: p.defaultStock };
    });
    setPopularSelections(initSel);
  }, []);

  const loadExistingInventory = async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.getAll(STORE_ID).catch(() => null);
      if (res?.items && res.items.length > 0) {
        setItems(res.items);
        setInventory(res.items);
      }
    } catch (_) {}
    setLoading(false);
  };

  const togglePopularItem = (id: string) => {
    setPopularSelections(prev => {
      const current = prev[id] || { selected: false, stock: 24 };
      return {
        ...prev,
        [id]: { ...current, selected: !current.selected },
      };
    });
  };

  const updatePopularStock = (id: string, delta: number) => {
    setPopularSelections(prev => {
      const current = prev[id] || { selected: true, stock: 24 };
      const nextStock = Math.max(1, current.stock + delta);
      return {
        ...prev,
        [id]: { ...current, stock: nextStock },
      };
    });
  };

  const handleImportSelectedPopular = async () => {
    const selectedKeys = Object.keys(popularSelections).filter(k => popularSelections[k]?.selected);
    if (selectedKeys.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one product to import into your inventory.');
      return;
    }

    setLoading(true);
    const newItemsToAdd: any[] = [];

    for (const id of selectedKeys) {
      const preset = POPULAR_CATALOG_PRESETS.find(p => p.id === id);
      if (!preset) continue;
      const stock = popularSelections[id].stock;

      const itemPayload = {
        productId: `SKU-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
        name: preset.name,
        category: preset.category,
        categoryId: preset.category.toLowerCase(),
        brand: preset.brand,
        unitType: preset.unitType,
        packSize: preset.packSize,
        sellingPrice: preset.sellingPrice,
        price: preset.sellingPrice,
        mrp: preset.mrp,
        stockOnHand: stock,
        availableStock: stock,
        reservedStock: 0,
        lowStockThreshold: 5,
        isAvailable: true,
        status: 'active',
        storeId: STORE_ID,
        description: preset.description,
        imageUrl: preset.imageUrl,
        updatedAt: Date.now(),
      };

      try {
        await inventoryApi.add(itemPayload).catch(() => null);
      } catch (_) {}

      newItemsToAdd.push(itemPayload);
    }

    setItems(prev => [...newItemsToAdd, ...prev]);
    setInventory([...newItemsToAdd, ...items]);
    setIsPopularModalOpen(false);
    setLoading(false);
    soundService.playSuccessDing();
    Alert.alert('Catalog Updated 🎉', `Added ${newItemsToAdd.length} products to your active dark store inventory.`);
  };

  const handleSaveManualProduct = async () => {
    if (!manualName.trim()) {
      Alert.alert('Product Title Required', 'Please enter a name for the product.');
      return;
    }
    const price = parseFloat(manualPrice) || 0;
    if (price <= 0) {
      Alert.alert('Price Required', 'Please enter a valid selling price in ₹.');
      return;
    }
    const stock = parseInt(manualStock) || 0;

    const newItem = {
      productId: `SKU-${Date.now().toString().slice(-6)}`,
      name: manualName.trim(),
      category: manualCategory,
      categoryId: manualCategory.toLowerCase(),
      brand: manualBrand.trim() || 'General',
      unitType: 'unit',
      packSize: '1 unit',
      sellingPrice: price,
      price: price,
      mrp: Math.round(price * 1.15),
      stockOnHand: stock,
      availableStock: stock,
      reservedStock: 0,
      lowStockThreshold: 5,
      isAvailable: true,
      status: 'active',
      storeId: STORE_ID,
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80',
      updatedAt: Date.now(),
    };

    try {
      await inventoryApi.add(newItem).catch(() => null);
    } catch (_) {}

    setItems(prev => [newItem, ...prev]);
    setInventory([newItem, ...items]);
    setIsManualDrawerOpen(false);
    setManualName('');
    setManualPrice('');
    soundService.playSuccessDing();
  };

  const handleToggleItemAvailability = async (productId: string, currentVal: boolean) => {
    const nextVal = !currentVal;
    setItems(prev => prev.map(it => it.productId === productId ? { ...it, isAvailable: nextVal } : it));
    updateInventoryItem(productId, { isAvailable: nextVal });
    try {
      await inventoryApi.toggleAvailability(productId, nextVal).catch(() => null);
    } catch (_) {}
  };

  const handleStepExistingStock = async (productId: string, delta: number) => {
    soundService.playSuccessDing();
    setItems(prev => prev.map(it => {
      if (it.productId === productId) {
        const current = it.stockOnHand ?? it.stock ?? 0;
        const next = Math.max(0, current + delta);
        return { ...it, stockOnHand: next, availableStock: next, stock: next, isAvailable: next > 0 };
      }
      return it;
    }));
    try {
      await inventoryApi.adjustStock(productId, delta, 'Step adjustment').catch(() => null);
    } catch (_) {}
  };

  const handleLaunchStore = async () => {
    setSubmitting(true);
    try {
      await AsyncStorage.setItem('vendor_onboarded', 'true');
      await AsyncStorage.setItem('store_active_status', 'true');
      router.replace('/(vendor)/home');
    } catch (_) {
      router.replace('/(vendor)/home');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(it => {
      const matchSearch = !searchQuery || it.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'All' || it.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [items, searchQuery, selectedCategory]);

  const selectedCount = Object.keys(popularSelections).filter(k => popularSelections[k]?.selected).length;

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.container}>
        
        {/* ── Top Navigation Bar with short-lion-13 Customer App Button ──────── */}
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={18} color="#0050ff" />
          </TouchableOpacity>
          
          <View style={{ flex: 1, paddingHorizontal: 4 }}>
            <Text style={s.headerTitle} numberOfLines={1}>Set Up Your Inventory</Text>
            <Text style={s.headerSubtitle} numberOfLines={1}>Step 4 of 4 • Configure sellable stock</Text>
          </View>

          {/* short-lion-13 Style Storefront Button */}
          <CustomerAppRedirectButton storeName="GlowVAI Merchant" />
        </View>

        {/* ── Step Progress Indicator ───────────────────────────────────────── */}
        <View style={s.progressRow}>
          <Text style={s.progressLabel} numberOfLines={1}>
            A Details → B Bank → C KYC → <Text style={{ color: '#0050ff', fontWeight: '800' }}>D Inventory</Text>
          </Text>
          <View style={s.progressBadge}>
            <Text style={s.progressBadgeText}>4 of 4</Text>
          </View>
        </View>

        <ScrollView style={s.scrollBody} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* 1. BRAND HERO QUICK-ADD ENGINE BANNER (#0050ff)                      */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <TouchableOpacity
            style={s.quickAddBanner}
            activeOpacity={0.88}
            onPress={() => setIsPopularModalOpen(true)}
          >
            <View style={s.bannerGlowIcon}>
              <Ionicons name="flash" size={20} color="#ffffff" />
            </View>
            <View style={{ flex: 1, paddingRight: 4 }}>
              <Text style={s.bannerHeading}>
                ✨ Simply click here to add products instantly without any manual filling
              </Text>
              <Text style={s.bannerSubheading}>
                1-tap import for top beauty serums, cleansers, sunscreens & daily groceries.
              </Text>
            </View>
            <View style={s.bannerArrow}>
              <Feather name="arrow-right" size={16} color="#0050ff" />
            </View>
          </TouchableOpacity>

          {/* ── Manual Add Custom Product Button ─────────────────────────────── */}
          <View style={s.manualActionRow}>
            <TouchableOpacity
              style={s.manualAddBtn}
              activeOpacity={0.8}
              onPress={() => setIsManualDrawerOpen(true)}
            >
              <Ionicons name="add-circle" size={18} color="#0050ff" />
              <Text style={s.manualAddBtnText}>+ Add Custom Product Manually</Text>
            </TouchableOpacity>
          </View>

          {/* ── Search & Category Filter ─────────────────────────────────────── */}
          <View style={s.searchBox}>
            <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
            <TextInput
              style={s.searchInput}
              placeholder="Search catalog, brands, or categories..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoryScroll}>
            {CATEGORY_OPTIONS.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[s.categoryChip, selectedCategory === cat && s.categoryChipActive]}
              >
                <Text style={[s.categoryChipText, selectedCategory === cat && s.categoryChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Inventory List Count Header ──────────────────────────────────── */}
          <View style={s.listHeaderRow}>
            <Text style={s.listCountText}>
              <Text style={{ fontWeight: '800', color: '#0050ff' }}>{items.length}</Text> Products Configured
            </Text>
            <Text style={s.listHelpText}>Toggle switch for availability</Text>
          </View>

          {/* ── Loader or Empty / Items ──────────────────────────────────────── */}
          {loading && items.length === 0 ? (
            <View style={{ paddingVertical: 32 }}>
              <OwlLoader label="Syncing catalog with dark store..." color="#0050ff" />
            </View>
          ) : items.length === 0 ? (
            <View style={s.emptyBox}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="cube-outline" size={34} color="#0050ff" />
              </View>
              <Text style={s.emptyTitle}>No Products Added Yet</Text>
              <Text style={s.emptyDesc}>
                Tap the blue banner above to import popular items instantly, or add custom products manually.
              </Text>
              <TouchableOpacity
                style={s.emptyActionBtn}
                onPress={() => setIsPopularModalOpen(true)}
              >
                <Text style={s.emptyActionBtnText}>⚡ Browse Popular Catalog</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Active Items Grid ──────────────────────────────────────────── */
            filteredItems.map((item) => {
              const stock = item.stockOnHand ?? item.stock ?? 0;
              const isAvailable = item.isAvailable ?? true;

              return (
                <View key={item.productId} style={s.itemCard}>
                  <View style={s.itemMainRow}>
                    <Image
                      source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80' }}
                      style={s.itemThumb}
                    />
                    <View style={{ flex: 1, paddingHorizontal: 10 }}>
                      <Text style={s.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={s.itemCategory}>{item.category} • {item.packSize || 'Standard'}</Text>
                      <View style={s.itemPriceRow}>
                        <Text style={s.itemPrice}>₹{item.sellingPrice || item.price}</Text>
                        {item.mrp && item.mrp > (item.sellingPrice || item.price) && (
                          <Text style={s.itemMrp}>₹{item.mrp}</Text>
                        )}
                      </View>
                    </View>

                    {/* Duty Availability Switch */}
                    <View style={s.toggleCol}>
                      <Switch
                        value={isAvailable}
                        onValueChange={() => handleToggleItemAvailability(item.productId, isAvailable)}
                        trackColor={{ false: '#e2e8f0', true: '#b3cbff' }}
                        thumbColor={isAvailable ? '#0050ff' : '#94a3b8'}
                      />
                      <Text style={[s.toggleLabel, { color: isAvailable ? '#0050ff' : '#94a3b8' }]}>
                        {isAvailable ? 'ON' : 'OFF'}
                      </Text>
                    </View>
                  </View>

                  {/* Stock Management Row */}
                  <View style={s.itemStockFooter}>
                    <View style={s.stockStatusPill}>
                      <View style={[s.statusDot, { backgroundColor: stock > 0 ? '#10b981' : '#dc2626' }]} />
                      <Text style={[s.stockStatusText, { color: stock > 0 ? '#059669' : '#dc2626' }]}>
                        {stock > 0 ? `${stock} in stock` : 'Out of Stock'}
                      </Text>
                    </View>

                    <View style={s.stepperRow}>
                      <TouchableOpacity
                        style={s.stepperBtn}
                        onPress={() => handleStepExistingStock(item.productId, -1)}
                      >
                        <Text style={s.stepperBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={s.stepperValText}>{stock}</Text>
                      <TouchableOpacity
                        style={s.stepperBtn}
                        onPress={() => handleStepExistingStock(item.productId, 1)}
                      >
                        <Text style={s.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* ── Sticky Launch Footer ─────────────────────────────────────────── */}
        <View style={s.launchFooter}>
          <TouchableOpacity
            style={[s.launchBtn, submitting && { opacity: 0.7 }]}
            activeOpacity={0.88}
            onPress={handleLaunchStore}
            disabled={submitting}
          >
            {submitting ? (
              <OwlLoader label="Launching Store..." color="#ffffff" size="small" />
            ) : (
              <Text style={s.launchBtnText}>
                Complete Setup & Launch Store ({items.length} SKUs) →
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* MODAL: POPULAR PRODUCTS INSTANT PICKER                               */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Modal
          visible={isPopularModalOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsPopularModalOpen(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              <View style={s.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalTitle}>⚡ Instant Popular Products</Text>
                  <Text style={s.modalSubtitle}>Select items to import & customize stock counts</Text>
                </View>
                <TouchableOpacity onPress={() => setIsPopularModalOpen(false)} style={s.modalCloseBtn}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={s.modalScroll} showsVerticalScrollIndicator={false}>
                {POPULAR_CATALOG_PRESETS.map((preset) => {
                  const isChecked = popularSelections[preset.id]?.selected ?? false;
                  const stock = popularSelections[preset.id]?.stock ?? preset.defaultStock;

                  return (
                    <View
                      key={preset.id}
                      style={[s.popularPickCard, isChecked && s.popularPickCardSelected]}
                    >
                      <TouchableOpacity
                        style={s.popularPickHeader}
                        activeOpacity={0.8}
                        onPress={() => togglePopularItem(preset.id)}
                      >
                        <View style={[s.checkboxCircle, isChecked && s.checkboxCircleActive]}>
                          {isChecked && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                        </View>
                        <Image source={{ uri: preset.imageUrl }} style={s.popularThumb} />
                        <View style={{ flex: 1, paddingHorizontal: 8 }}>
                          <Text style={s.popularName} numberOfLines={1}>{preset.name}</Text>
                          <Text style={s.popularCat}>{preset.category} • {preset.brand}</Text>
                          <Text style={s.popularPrice}>₹{preset.sellingPrice}</Text>
                        </View>
                      </TouchableOpacity>

                      {isChecked && (
                        <View style={s.popularStockControl}>
                          <Text style={s.stockControlLabel}>Initial Stock Units:</Text>
                          <View style={s.stepperRow}>
                            <TouchableOpacity
                              style={s.stepperBtn}
                              onPress={() => updatePopularStock(preset.id, -1)}
                            >
                              <Text style={s.stepperBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={s.stepperValText}>{stock}</Text>
                            <TouchableOpacity
                              style={s.stepperBtn}
                              onPress={() => updatePopularStock(preset.id, 1)}
                            >
                              <Text style={s.stepperBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <View style={s.modalFooter}>
                <TouchableOpacity
                  style={[s.importConfirmBtn, selectedCount === 0 && { opacity: 0.5 }]}
                  onPress={handleImportSelectedPopular}
                  disabled={selectedCount === 0 || loading}
                >
                  <Text style={s.importConfirmText}>
                    {loading ? 'Adding Products…' : `Add Selected (${selectedCount}) Products to Catalog 🚀`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* MODAL: MANUAL PRODUCT ADDITION                                       */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        <Modal
          visible={isManualDrawerOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setIsManualDrawerOpen(false)}
        >
          <View style={s.modalOverlay}>
            <View style={s.manualModalBox}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>+ Add Custom Product SKU</Text>
                <TouchableOpacity onPress={() => setIsManualDrawerOpen(false)} style={s.modalCloseBtn}>
                  <Ionicons name="close" size={22} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 14 }}>
                <Text style={s.inputLabel}>Product Title *</Text>
                <TextInput
                  style={s.formInput}
                  placeholder="e.g. Minimalist Vitamin C 10%"
                  placeholderTextColor="#94a3b8"
                  value={manualName}
                  onChangeText={setManualName}
                />

                <Text style={s.inputLabel}>Selling Price (₹) *</Text>
                <TextInput
                  style={s.formInput}
                  placeholder="e.g. 599"
                  placeholderTextColor="#94a3b8"
                  value={manualPrice}
                  onChangeText={setManualPrice}
                  keyboardType="numeric"
                />

                <Text style={s.inputLabel}>Stock Quantity *</Text>
                <TextInput
                  style={s.formInput}
                  placeholder="e.g. 24"
                  placeholderTextColor="#94a3b8"
                  value={manualStock}
                  onChangeText={setManualStock}
                  keyboardType="numeric"
                />

                <TouchableOpacity style={s.manualSaveBtn} onPress={handleSaveManualProduct}>
                  <Text style={s.manualSaveBtnText}>Save Product to Inventory 💾</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e6eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 10.5,
    color: '#64748b',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  progressLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    flex: 1,
  },
  progressBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#e6eeff',
  },
  progressBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0050ff',
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },

  // ── Quick Add Hero Banner (#0050ff) ──────────────────────────────────────
  quickAddBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    borderWidth: 1.5,
    borderColor: '#0050ff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#0050ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  bannerGlowIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0050ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#003ecc',
    lineHeight: 18,
  },
  bannerSubheading: {
    fontSize: 11,
    color: '#0050ff',
    marginTop: 2,
    lineHeight: 15,
  },
  bannerArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Manual Add Row ───────────────────────────────────────────────────────
  manualActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  manualAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#b3cbff',
    gap: 6,
  },
  manualAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0050ff',
  },

  // ── Search & Chips ───────────────────────────────────────────────────────
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
    padding: 0,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#0050ff',
    borderColor: '#0050ff',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // ── List Header ──────────────────────────────────────────────────────────
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listCountText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  listHelpText: {
    fontSize: 10.5,
    color: '#94a3b8',
  },

  // ── Empty State ──────────────────────────────────────────────────────────
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 8,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6eeff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyDesc: {
    fontSize: 11.5,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 260,
  },
  emptyActionBtn: {
    marginTop: 14,
    backgroundColor: '#0050ff',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },

  // ── Item Cards ───────────────────────────────────────────────────────────
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 10,
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumb: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  itemName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 16,
  },
  itemCategory: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  itemMrp: {
    fontSize: 10.5,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  toggleCol: {
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 1,
  },
  itemStockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  stockStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  stepperBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0050ff',
  },
  stepperValText: {
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },

  // ── Launch Sticky Footer ─────────────────────────────────────────────────
  launchFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 12,
  },
  launchBtn: {
    backgroundColor: '#0050ff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0050ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  launchBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // ── Modal Styles ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  manualModalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    margin: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 12,
  },
  popularPickCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginBottom: 8,
  },
  popularPickCardSelected: {
    borderColor: '#0050ff',
    backgroundColor: '#f0f4ff',
  },
  popularPickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxCircleActive: {
    backgroundColor: '#0050ff',
    borderColor: '#0050ff',
  },
  popularThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  popularName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  popularCat: {
    fontSize: 10.5,
    color: '#64748b',
  },
  popularPrice: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0050ff',
    marginTop: 1,
  },
  popularStockControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#b3cbff',
  },
  stockControlLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#003ecc',
  },
  modalFooter: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  importConfirmBtn: {
    backgroundColor: '#0050ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importConfirmText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 3,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
    marginBottom: 10,
  },
  manualSaveBtn: {
    backgroundColor: '#0050ff',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  manualSaveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});

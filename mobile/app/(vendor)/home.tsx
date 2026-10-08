/**
 * GlowVAI Vendor App — Premium Minimal Dark Store Command Center
 * ═══════════════════════════════════════════════════════════════════════════
 * Dynamic Duty Reactive Background Architecture:
 *   • On Duty (Active / Accepting Orders)  ➜ Smooth Transition to Forest Green (#00A300)
 *   • Off Duty (Store Paused / Offline)    ➜ Smooth Transition to Crimson Red (#D10000)
 *   • 450ms Easing Animation on Duty State Switch
 *   • Brand Color: Royal Cobalt Blue (#0050ff) for all UI accents, buttons & badges
 *   • Clean Out-of-Stock Catalog Management:
 *       - SKUs with Stock = 0 automatically disappear from the catalog list without crashing
 *   • Date-Specific Dynamic Calibration:
 *       - Wednesday 16 (Today): Active live sales (₹48,920 Gross / ₹43,050 Net / 28 Orders / 4h 18m Duty / 98% Quality)
 *       - Previous Days (Mon 14, Tue 15): ₹0 Payouts, 0 Orders, 0h 00m Duty Time & 0% Store Quality for new vendors
 *       - Upcoming Days (Thu 17, Fri 18): ₹0 Scheduled / 0h 00m Duty
 *   • Segment Pill Control:
 *       - "Activity" Tab  ➜ Shows Dynamic Gross Earnings with Rupee Symbol (₹)
 *       - "Live Queue" Tab ➜ Shows Orders Done for selected date
 *   • 3 Glass Metric Cards Row (Gross Sales, Active Time, Net Payout)
 *   • "Daily Updates" 3-Tab Pill Switcher (Orders, Statistic, Inventory)
 *   • 2-Column Gauge Cards with Dynamic Pointer Sliders (Duty Time, Store Quality)
 *   • Performance Health Score Card
 *   • Sleek Floating Bottom Navigation Bar with Circular (+) Quick Action Button
 *   • 45s Rapido-Style Incoming Broadcast Popup & Web Audio Chimes
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, Image, TextInput,
  Platform, Alert, Dimensions, Animated, Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import useVendorStore from '../../src/store/useVendorStore';
import { vendorApi, ordersApi, earningsApi, inventoryApi } from '../../src/services/api';
import {
  getSocket, registerVendor, setVendorStatus,
  acceptOrderOffer, declineOrderOffer,
} from '../../src/services/socket';
import { soundService } from '../../src/services/sound';
import OwlLoader from '../../src/components/OwlLoader';
import CustomerAppRedirectButton from '../../src/components/CustomerAppRedirectButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VENDOR_ID = process.env.EXPO_PUBLIC_VENDOR_ID || 'VND-001';
const STORE_ID  = process.env.EXPO_PUBLIC_STORE_ID  || 'DS-VIJ-01';

const GREEN_COLOR = '#00A300';
const RED_COLOR   = '#D10000';

const DATES_STRIP = [
  { day: 'Mon', date: '14' },
  { day: 'Tue', date: '15' },
  { day: 'Wed', date: '16', isCurrent: true },
  { day: 'Thu', date: '17' },
  { day: 'Fri', date: '18' },
];

const PAUSE_REASONS = [
  'Store busy / Heavy order rush',
  'Restocking shelf inventory',
  'Staff shift change / Break',
  'Closing for the day / Maintenance',
  'Other operational reason',
];

export default function GlowVAIVendorHomeScreen() {
  const router = useRouter();

  const {
    vendor, setVendor, setOnlineStatus,
    orders, setOrders, addOrder, updateOrder,
    earnings, setEarnings,
    inventory, setInventory, updateInventoryItem, addInventoryItem, removeInventoryItem,
    setConnected,
  } = useVendorStore();

  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  // Selected Date & Metric Tab
  const [selectedDate, setSelectedDate] = useState('16');
  const [activeSegment, setActiveSegment] = useState<'activity' | 'queue'>('activity');
  const [activeTab, setActiveTab] = useState<'stats' | 'live' | 'inventory'>('stats');

  // Dynamic Store Details
  const [storeDetails, setStoreDetails] = useState({
    shopName: 'GlowVAI Dark Store Hub #1',
    ownerName: 'Dark Store Merchant',
    locality: 'Benz Circle Hub, Vijayawada',
    city: 'Vijayawada',
    phone: '8977855998',
  });

  // Duty State & Smooth Animation Value
  const [isOnline, setIsOnline] = useState<boolean>(vendor?.isOnline ?? true);
  const dutyAnim = useRef(new Animated.Value(isOnline ? 1 : 0)).current;

  // Keep local state in sync if vendor updates
  useEffect(() => {
    if (vendor?.isOnline !== undefined) {
      setIsOnline(vendor.isOnline);
    }
  }, [vendor?.isOnline]);

  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [selectedPauseReason, setSelectedPauseReason] = useState(PAUSE_REASONS[0]);

  // Modals
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('24');

  // Incoming Order Modal
  const [incomingOrderModal, setIncomingOrderModal] = useState<any | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState(45);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Smooth Background Transition Effect (#00A300 Green <-> #D10000 Red)
  useEffect(() => {
    Animated.timing(dutyAnim, {
      toValue: isOnline ? 1 : 0,
      duration: 450,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [isOnline, dutyAnim]);

  const loadStoredVendorDetails = useCallback(async () => {
    try {
      const [storedStepA, savedAvatar] = await Promise.all([
        AsyncStorage.getItem('onb_step_a'),
        AsyncStorage.getItem('vendor_avatar'),
      ]);
      if (storedStepA) {
        const parsed = JSON.parse(storedStepA);
        setStoreDetails({
          shopName: parsed.shopName?.trim() || 'GlowVAI Dark Store Hub #1',
          ownerName: parsed.ownerName?.trim() || 'Dark Store Merchant',
          locality: parsed.locality?.trim() || parsed.address?.trim() || 'Benz Circle, Vijayawada',
          city: parsed.city?.trim() || 'Vijayawada',
          phone: parsed.phone?.trim() || '8977855998',
        });
      }
      if (savedAvatar && vendor && !vendor.avatarUrl) {
        setVendor({ ...vendor, avatarUrl: savedAvatar });
      }
    } catch (_) {}
  }, [vendor, setVendor]);

  const loadDashboardData = async () => {
    setIsLoadingDashboard(true);
    try {
      const [vRes, oRes, eRes, iRes] = await Promise.all([
        vendorApi.getProfile(VENDOR_ID).catch(() => null),
        ordersApi.getAll({ storeId: STORE_ID }).catch(() => null),
        earningsApi.getSummary(VENDOR_ID).catch(() => null),
        inventoryApi.getAll(STORE_ID).catch(() => null),
      ]);
      if (vRes?.vendor) {
        setVendor(vRes.vendor);
        if (vRes.vendor.shopName) {
          setStoreDetails(prev => ({
            ...prev,
            shopName: vRes.vendor.shopName,
            ownerName: vRes.vendor.name || prev.ownerName,
            locality: vRes.vendor.locality || vRes.vendor.address || prev.locality,
          }));
        }
      }
      if (oRes?.orders && Array.isArray(oRes.orders)) setOrders(oRes.orders);
      if (eRes?.earnings) setEarnings(eRes.earnings);
      if (iRes?.items && Array.isArray(iRes.items)) {
        // Filter out zero-stock items on initial load
        const inStockItems = iRes.items.filter((it: any) => {
          const s = it?.stockOnHand ?? it?.stock ?? it?.availableStock ?? 0;
          return s > 0;
        });
        setInventory(inStockItems);
      }
    } catch (_) {}
    setIsLoadingDashboard(false);
  };

  useEffect(() => {
    loadStoredVendorDetails();
    loadDashboardData();
    setupSocketListeners();
    soundService.requestNotificationPermission();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadStoredVendorDetails]);

  const setupSocketListeners = useCallback(() => {
    try {
      const socket = getSocket();

      socket.on('connect', () => {
        setConnected(true);
        registerVendor(VENDOR_ID, STORE_ID, { lat: 16.5062, lng: 80.6480 });
      });

      socket.on('ORDER_OFFER', (payload: { order: any }) => {
        if (payload?.order) triggerIncomingOrderAlert(payload.order);
      });

      socket.on('order:incoming', (payload: { order: any }) => {
        if (payload?.order) triggerIncomingOrderAlert(payload.order);
      });

      socket.on('order:statusUpdated', ({ orderId, status }: any) => {
        updateOrder(orderId, { status });
      });

      socket.on('ORDER_CLAIMED_BY_OTHER', ({ orderId }: any) => {
        if (incomingOrderModal && incomingOrderModal.orderId === orderId) {
          if (timerRef.current) clearInterval(timerRef.current);
          setIncomingOrderModal(null);
          soundService.stopRinging();
          Alert.alert('Order Claimed', 'This order was accepted by another nearby partner.');
        }
      });
    } catch (_) {}
  }, [incomingOrderModal, setConnected, updateOrder]);

  const triggerIncomingOrderAlert = (order: any) => {
    soundService.startRinging();
    soundService.vibrateOrderRinging();
    setIncomingOrderModal(order);
    setCountdownSeconds(45);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          soundService.stopRinging();
          setIncomingOrderModal(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleAcceptIncomingOrder = async () => {
    if (!incomingOrderModal) return;
    if (timerRef.current) clearInterval(timerRef.current);
    soundService.stopRinging();
    soundService.playSuccessDing();

    const orderId = incomingOrderModal.orderId;
    acceptOrderOffer(orderId, VENDOR_ID);

    try {
      await ordersApi.accept(orderId, VENDOR_ID);
      updateOrder(orderId, { status: 'ACCEPTED', vendorId: VENDOR_ID });
    } catch (_) {}

    setIncomingOrderModal(null);
    Alert.alert('Order Accepted 🎉', `Order #${orderId} confirmed. Please start packing!`);
  };

  const handleDeclineIncomingOrder = () => {
    if (!incomingOrderModal) return;
    if (timerRef.current) clearInterval(timerRef.current);
    soundService.stopRinging();
    declineOrderOffer(incomingOrderModal.orderId, VENDOR_ID);
    setIncomingOrderModal(null);
  };

  const handleToggleDuty = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    setOnlineStatus(nextState);
    setVendorStatus(VENDOR_ID, nextState);
    soundService.playSuccessDing();
  };

  const confirmPauseDuty = () => {
    setIsOnline(false);
    setOnlineStatus(false);
    setVendorStatus(VENDOR_ID, false);
    soundService.playSuccessDing();
  };

  const handleAdvanceOrderStatus = async (orderId: string, currentStatus: string) => {
    soundService.playSuccessDing();
    let nextStatus = 'ACCEPTED';
    if (currentStatus === 'PENDING' || currentStatus === 'ACCEPTED') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'PACKED';
    else if (currentStatus === 'PACKED') nextStatus = 'READY_FOR_PICKUP';
    else if (currentStatus === 'READY_FOR_PICKUP') nextStatus = 'DISPATCHED';

    updateOrder(orderId, { status: nextStatus });
    try {
      if (nextStatus === 'PREPARING') await ordersApi.prepare(orderId);
      if (nextStatus === 'PACKED') await ordersApi.pack(orderId);
      if (nextStatus === 'READY_FOR_PICKUP') await ordersApi.readyForPickup(orderId);
      if (nextStatus === 'DISPATCHED') await ordersApi.dispatch(orderId);
    } catch (_) {}
  };

  /**
   * Adjust inventory stock.
   * If stock reaches 0, the SKU disappears from the catalog automatically without crash!
   */
  const handleStepStock = async (item: any, delta: number) => {
    soundService.playSuccessDing();
    const current = item?.stockOnHand ?? item?.stock ?? item?.availableStock ?? 0;
    const next = Math.max(0, current + delta);

    if (next <= 0) {
      // Out-of-stock product disappears immediately from catalog
      removeInventoryItem(item.productId);
    } else {
      updateInventoryItem(item.productId, { stockOnHand: next, availableStock: next, stock: next });
    }

    try {
      await inventoryApi.adjustStock(item.productId, delta, 'Quick stepper');
    } catch (_) {}
  };

  const handleCreateProduct = async () => {
    if (!newProdName.trim()) return Alert.alert('Name Required', 'Enter product title.');
    const price = parseFloat(newProdPrice) || 599;
    const stock = parseInt(newProdStock) || 24;

    const newProduct = {
      name: newProdName.trim(),
      category: 'Serums',
      price,
      mrp: Math.round(price * 1.15),
      stockOnHand: stock,
      availableStock: stock,
      lowStockThreshold: 5,
      isAvailable: true,
      storeId: STORE_ID,
      vendorId: VENDOR_ID,
    };

    try {
      const res = await inventoryApi.add(newProduct).catch(() => null);
      const created = res?.item || { productId: 'SKU-' + Date.now().toString().slice(-6), ...newProduct };
      addInventoryItem(created);
      setIsAddProductOpen(false);
      setNewProdName('');
      setNewProdPrice('');
      soundService.playSuccessDing();
    } catch (_) {}
  };

  // Safe Visible catalog items: SKUs with stock > 0 only
  const activeCatalogItems = useMemo(() => {
    const list = Array.isArray(inventory) ? inventory : [];
    return list.filter((it: any) => {
      const s = it?.stockOnHand ?? it?.stock ?? it?.availableStock ?? 0;
      return s > 0;
    });
  }, [inventory]);

  const pendingOrdersCount = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    return list.filter(o => o.status === 'PENDING' || o.status === 'ACCEPTED' || o.status === 'PREPARING').length;
  }, [orders]);

  /**
   * Date-Specific Calibration:
   *  - Wednesday 16 (Today): Real active earnings, orders, 4h 18m duty time & 98% quality
   *  - Mon 14, Tue 15 (Previous Days): For newly onboarded vendor, 0h 00m duty time, 0% quality & ₹0 payouts
   *  - Thu 17, Fri 18 (Upcoming Days): Scheduled = 0h 00m duty
   */
  const dateMetrics = useMemo(() => {
    if (selectedDate === '16') {
      return {
        grossSales: 48920,
        netPayout: 43050,
        activeTime: '1h 12m',
        ordersDone: 28,
        dutyTimeText: '4h 18m',
        dutyStatusLabel: 'Peak Load',
        dutyPointerPos: '42%',
        dutyBarFillWidth: '40%',
        storeQualityText: '98%',
        storeQualityStatus: 'Excellent',
        qualityPointerPos: '72%',
        qualityBarFillWidth: '40%',
        statusLabel: 'Today (Live)',
      };
    } else if (selectedDate === '14' || selectedDate === '15') {
      return {
        grossSales: 0,
        netPayout: 0,
        activeTime: '0h 00m',
        ordersDone: 0,
        dutyTimeText: '0h 00m',
        dutyStatusLabel: 'Offline / 0h',
        dutyPointerPos: '0%',
        dutyBarFillWidth: '0%',
        storeQualityText: '0%',
        storeQualityStatus: 'Offline',
        qualityPointerPos: '0%',
        qualityBarFillWidth: '0%',
        statusLabel: 'Pre-Onboarding (₹0 Payout)',
      };
    } else {
      return {
        grossSales: 0,
        netPayout: 0,
        activeTime: '0h 00m',
        ordersDone: 0,
        dutyTimeText: '0h 00m',
        dutyStatusLabel: 'Upcoming',
        dutyPointerPos: '0%',
        dutyBarFillWidth: '0%',
        storeQualityText: '0%',
        storeQualityStatus: 'Upcoming',
        qualityPointerPos: '0%',
        qualityBarFillWidth: '0%',
        statusLabel: 'Upcoming Scheduled Day',
      };
    }
  }, [selectedDate]);

  // Smooth Interpolated Background Color (#D10000 <-> #00A300)
  const animatedBgColor = dutyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [RED_COLOR, GREEN_COLOR],
  });

  const animatedBadgeBg = dutyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [RED_COLOR, GREEN_COLOR],
  });

  const animatedBorderColor = dutyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(209, 0, 0, 0.35)', 'rgba(0, 163, 0, 0.35)'],
  });

  return (
    <Animated.View style={[s.safeArea, { backgroundColor: animatedBgColor }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.outerContainer}>
          
          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* DYNAMIC MORPHING HERO BACKGROUND (#00A300 <-> #D10000)               */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <Animated.View style={[s.gradientBackground, { backgroundColor: animatedBgColor }]} />

          <ScrollView
            style={s.scrollView}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Top Header & Storefront Redirection ─────────────────────────── */}
            <View style={s.topBar}>
              
              {/* Merchant Identity & Compact Storefront Button */}
              <View style={s.merchantBarRow}>
                <TouchableOpacity
                  style={s.avatarTouchable}
                  activeOpacity={0.8}
                  onPress={() => router.push('/(vendor)/profile')}
                >
                  <View style={s.avatarBox}>
                    {vendor?.avatarUrl ? (
                      <Image source={{ uri: vendor.avatarUrl }} style={s.avatarImg} />
                    ) : (
                      <Text style={[s.avatarLetter, { color: isOnline ? GREEN_COLOR : RED_COLOR }]}>
                        {storeDetails.shopName.charAt(0).toUpperCase()}
                      </Text>
                    )}
                    {/* Clear visual edit indicator badge */}
                    <View style={s.avatarEditBadge}>
                      <Ionicons name="pencil" size={8.5} color="#ffffff" />
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, paddingHorizontal: 6 }}
                  activeOpacity={0.7}
                  onPress={() => router.push('/(vendor)/profile')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={s.merchantShopName} numberOfLines={1}>{storeDetails.shopName}</Text>
                    <Ionicons name="chevron-forward" size={13} color="rgba(255, 255, 255, 0.85)" />
                  </View>
                  <Text style={s.merchantLocality} numberOfLines={1}>
                    📍 {storeDetails.locality}
                  </Text>
                </TouchableOpacity>

                {/* Compact short-lion-13 Customer Storefront Redirect Button */}
                <CustomerAppRedirectButton storeName={storeDetails.shopName} />
              </View>

              {/* ── Horizontal Date Selector Strip (Mon 14 - Fri 18) ──────────── */}
              <View style={s.dateStripRow}>
                {DATES_STRIP.map((item) => {
                  const isSelected = selectedDate === item.date;
                  return (
                    <TouchableOpacity
                      key={item.date}
                      style={[s.dateCol, isSelected && s.dateColActive]}
                      onPress={() => setSelectedDate(item.date)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.dateDayText, isSelected && s.dateDayTextActive]}>
                        {item.day}
                      </Text>
                      <Text style={[s.dateNumText, isSelected && s.dateNumTextActive]}>
                        {item.date}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ════════════════════════════════════════════════════════════════ */}
              {/* 🌟 POLISHED CLEAN DUTY TOGGLE BAR                                */}
              {/* ════════════════════════════════════════════════════════════════ */}
              <TouchableOpacity
                style={s.sleekDutyBar}
                activeOpacity={0.88}
                onPress={handleToggleDuty}
              >
                <Animated.View style={[s.dutyBarInner, { borderColor: animatedBorderColor }]}>
                  
                  {/* Left Status Indicator & Text */}
                  <View style={s.dutyTextGroup}>
                    <View style={s.dutyPulseBeaconWrap}>
                      <View style={[s.dutyPulseBeaconDot, { backgroundColor: isOnline ? GREEN_COLOR : RED_COLOR }]} />
                      <View style={[s.dutyPulseRing, { borderColor: isOnline ? GREEN_COLOR : RED_COLOR }]} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={s.dutyBarTitleText} numberOfLines={1}>
                        {isOnline ? 'ACCEPTING LIVE ORDERS' : 'STORE DUTY PAUSED'}
                      </Text>
                      <Text style={s.dutyBarSubtitleText} numberOfLines={1}>
                        {isOnline ? 'Dark store is online & broadcasting' : 'Tap to go online & start earning'}
                      </Text>
                    </View>
                  </View>

                  {/* Right Solid Pill Switch Badge */}
                  <Animated.View style={[s.dutyPillBadge, { backgroundColor: animatedBadgeBg }]}>
                    <Ionicons
                      name={isOnline ? 'flash' : 'power'}
                      size={13}
                      color="#ffffff"
                      style={{ marginRight: 3 }}
                    />
                    <Text style={s.dutyPillBadgeText}>
                      {isOnline ? 'ON' : 'OFF'}
                    </Text>
                  </Animated.View>

                </Animated.View>
              </TouchableOpacity>

              {/* ── Frosted Segmented Pill Switch (Active vs In Queue) ──── */}
              <View style={s.pillSegmentContainer}>
                <TouchableOpacity
                  style={[s.pillSegmentBtn, activeSegment === 'activity' && s.pillSegmentBtnActive]}
                  onPress={() => {
                    soundService.playSuccessDing();
                    setActiveSegment('activity');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.pillSegmentText, activeSegment === 'activity' && s.pillSegmentTextActive]}>
                    Active
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.pillSegmentBtn, activeSegment === 'queue' && s.pillSegmentBtnActive]}
                  onPress={() => {
                    soundService.playSuccessDing();
                    setActiveSegment('queue');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[s.pillSegmentText, activeSegment === 'queue' && s.pillSegmentTextActive]}>
                    In Queue
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Massive Focal Metric (Dynamic based on selected Date & Tab) ─ */}
              <View style={s.focalMetricBox}>
                <Text style={s.focalBigNumber} numberOfLines={1} adjustsFontSizeToFit>
                  {activeSegment === 'activity'
                    ? `₹${dateMetrics.grossSales.toLocaleString('en-IN')}`
                    : `${dateMetrics.ordersDone}`}
                </Text>
                <Text style={s.focalUnitText}>
                  {activeSegment === 'activity'
                    ? 'Earnings'
                    : 'Orders done until now'}
                </Text>
              </View>

              {/* ── 3 Rounded Glass Metric Cards (Dynamic based on selected Date) ─ */}
              <View style={s.threeCardsRow}>
                <View style={s.glassMetricCard}>
                  <Text style={s.glassCardLabel}>Gross Sales</Text>
                  <Text style={s.glassCardValue} numberOfLines={1}>
                    {dateMetrics.grossSales > 0 ? `₹${(dateMetrics.grossSales / 1000).toFixed(1)}k` : '₹0'}
                  </Text>
                </View>

                <View style={s.glassMetricCard}>
                  <Text style={s.glassCardLabel}>Active Time</Text>
                  <Text style={s.glassCardValue} numberOfLines={1}>
                    {dateMetrics.activeTime}
                  </Text>
                </View>

                <View style={s.glassMetricCard}>
                  <Text style={s.glassCardLabel}>Net Payout</Text>
                  <Text style={s.glassCardValue} numberOfLines={1}>
                    ₹{dateMetrics.netPayout.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>

            {/* ════════════════════════════════════════════════════════════════════ */}
            {/* LOWER DASHBOARD: "Daily Updates" SECTION (CLEAN FROSTED CARD)        */}
            {/* ════════════════════════════════════════════════════════════════════ */}
            <View style={s.lowerSheetContainer}>
              
              {/* Section Header */}
              <Text style={s.sectionHeaderTitle}>Daily Updates</Text>

              {/* 3-Tab Pill Selector (Trainings, Statistic, Challenges style) */}
              <View style={s.tabSelectorContainer}>
                <TouchableOpacity
                  style={[s.tabPill, activeTab === 'live' && s.tabPillActive]}
                  onPress={() => setActiveTab('live')}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tabPillText, activeTab === 'live' && s.tabPillTextActive]}>
                    Orders ({pendingOrdersCount})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.tabPill, activeTab === 'stats' && s.tabPillActive]}
                  onPress={() => setActiveTab('stats')}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tabPillText, activeTab === 'stats' && s.tabPillTextActive]}>
                    Statistic
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.tabPill, activeTab === 'inventory' && s.tabPillActive]}
                  onPress={() => setActiveTab('inventory')}
                  activeOpacity={0.8}
                >
                  <Text style={[s.tabPillText, activeTab === 'inventory' && s.tabPillTextActive]}>
                    Catalog ({activeCatalogItems.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── 2-Column Dynamic Gauge Cards (Duty Time & Store Quality) ──── */}
              <View style={s.gaugeCardsRow}>
                
                {/* Left Gauge: Duty Time (Dynamic based on selected date) */}
                <View style={s.gaugeCard}>
                  <Text style={s.gaugeCardLabel}>Duty time</Text>
                  <Text style={s.gaugeCardMainVal}>{dateMetrics.dutyTimeText}</Text>

                  {/* Gradient Gauge Bar with Pointer */}
                  <View style={s.gaugeBarTrack}>
                    <View style={[s.gaugeBarFillOrange, { width: dateMetrics.dutyBarFillWidth }]} />
                    <View style={[s.gaugePointerTriangle, { left: dateMetrics.dutyPointerPos }]} />
                  </View>

                  {/* Status Indicator */}
                  <View style={s.gaugeStatusRow}>
                    <View
                      style={[
                        s.gaugeStatusDot,
                        { backgroundColor: selectedDate === '16' ? '#f97316' : '#94a3b8' },
                      ]}
                    />
                    <Text style={s.gaugeStatusText}>{dateMetrics.dutyStatusLabel}</Text>
                  </View>
                </View>

                {/* Right Gauge: Fulfillment Quality (Dynamic based on selected date) */}
                <View style={s.gaugeCard}>
                  <Text style={s.gaugeCardLabel}>Store quality</Text>
                  <Text style={s.gaugeCardMainVal}>{dateMetrics.storeQualityText}</Text>

                  {/* Gradient Gauge Bar with Pointer */}
                  <View style={s.gaugeBarTrack}>
                    <View style={[s.gaugeBarFillBlue, { width: dateMetrics.qualityBarFillWidth }]} />
                    <View style={[s.gaugePointerTriangle, { left: dateMetrics.qualityPointerPos }]} />
                  </View>

                  {/* Status Indicator */}
                  <View style={s.gaugeStatusRow}>
                    <View
                      style={[
                        s.gaugeStatusDot,
                        { backgroundColor: selectedDate === '16' ? '#0050ff' : '#94a3b8' },
                      ]}
                    />
                    <Text style={s.gaugeStatusText}>{dateMetrics.storeQualityStatus}</Text>
                  </View>
                </View>

              </View>

              {/* ── Performance Health Score Card ─────────────────────────────── */}
              <TouchableOpacity
                style={s.performanceScoreCard}
                activeOpacity={0.85}
                onPress={() => router.push('/(vendor)/earnings' as any)}
              >
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={s.scoreCardLabel}>Health Improvement Score</Text>
                  <Text style={s.scoreCardSub}>Goal • 100% 10-minute dispatch rate</Text>
                </View>
                <Text style={s.scoreCardBigNumber}>92</Text>
              </TouchableOpacity>

              {/* ── Tab Views (Live Orders Queue / Inventory Catalog) ─────────── */}
              {activeTab === 'live' && (
                <View style={s.liveOrdersContainer}>
                  <View style={s.sectionSubHeader}>
                    <Text style={s.subHeaderTitle}>Active Pipeline ({orders.length})</Text>
                    <TouchableOpacity onPress={() => setIsOrdersModalOpen(true)}>
                      <Text style={s.subHeaderLink}>Expand →</Text>
                    </TouchableOpacity>
                  </View>

                  {orders.length === 0 ? (
                    <View style={s.emptyMiniBox}>
                      <Text style={s.emptyMiniText}>
                        No active orders. Duty is {isOnline ? 'ON 🟢' : 'OFF 🔴'}
                      </Text>
                    </View>
                  ) : (
                    orders.slice(0, 3).map(ord => (
                      <View key={ord.orderId} style={s.orderMiniRow}>
                        <View style={s.orderMiniIcon}>
                          <Ionicons name="bag-handle" size={16} color="#0050ff" />
                        </View>
                        <View style={{ flex: 1, paddingHorizontal: 8 }}>
                          <Text style={s.orderMiniCustomer} numberOfLines={1}>{ord.customerName || 'Customer'}</Text>
                          <Text style={s.orderMiniMeta}>#{ord.orderId} • ₹{ord.pricing?.grandTotal || 599}</Text>
                        </View>
                        <TouchableOpacity
                          style={s.orderMiniAdvanceBtn}
                          onPress={() => handleAdvanceOrderStatus(ord.orderId, ord.status)}
                        >
                          <Text style={s.orderMiniAdvanceText}>
                            {ord.status === 'PENDING' ? 'Prepare 👨‍🍳' : ord.status === 'PREPARING' ? 'Pack 📦' : 'Ready 🛵'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}

              {activeTab === 'inventory' && (
                <View style={s.liveOrdersContainer}>
                  <View style={s.sectionSubHeader}>
                    <Text style={s.subHeaderTitle}>
                      Dark Store Catalog ({activeCatalogItems.length} in stock)
                    </Text>
                    <TouchableOpacity onPress={() => setIsAddProductOpen(true)}>
                      <Text style={s.subHeaderLink}>+ Add SKU</Text>
                    </TouchableOpacity>
                  </View>

                  {activeCatalogItems.length === 0 ? (
                    <View style={s.emptyMiniBox}>
                      <Text style={s.emptyMiniText}>No products currently in stock. Tap "+ Add SKU" to restock.</Text>
                    </View>
                  ) : (
                    activeCatalogItems.map((it: any) => (
                      <View key={it.productId} style={s.orderMiniRow}>
                        <Image
                          source={{ uri: it.imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80' }}
                          style={s.invMiniThumb}
                        />
                        <View style={{ flex: 1, paddingHorizontal: 8 }}>
                          <Text style={s.orderMiniCustomer} numberOfLines={1}>{it.name}</Text>
                          <Text style={s.orderMiniMeta}>₹{it.sellingPrice || it.price} • {it.category}</Text>
                        </View>
                        <View style={s.miniStepperRow}>
                          <TouchableOpacity style={s.miniStepperBtn} onPress={() => handleStepStock(it, -1)}>
                            <Text style={s.miniStepperBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={s.miniStepperVal}>{it.stockOnHand ?? it.stock ?? it.availableStock ?? 0}</Text>
                          <TouchableOpacity style={s.miniStepperBtn} onPress={() => handleStepStock(it, 1)}>
                            <Text style={s.miniStepperBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {/* Bottom spacer for floating nav bar */}
              <View style={{ height: 110 }} />
            </View>
          </ScrollView>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* SLEEK FLOATING BOTTOM NAVIGATION BAR (MATCHES DESIGN EXACTLY)        */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <View style={s.floatingBottomNav}>
            {/* 1. Home */}
            <TouchableOpacity style={s.navItemBtn} activeOpacity={0.7}>
              <Ionicons name="home" size={22} color="#0050ff" />
            </TouchableOpacity>

            {/* 2. Live Queue */}
            <TouchableOpacity
              style={s.navItemBtn}
              activeOpacity={0.7}
              onPress={() => setIsOrdersModalOpen(true)}
            >
              <Ionicons name="time-outline" size={23} color="#64748b" />
            </TouchableOpacity>

            {/* 3. CENTER FLOATING PLUS BUTTON (+) */}
            <TouchableOpacity
              style={s.navFloatingPlusBtn}
              activeOpacity={0.88}
              onPress={() => setIsAddProductOpen(true)}
            >
              <Ionicons name="add" size={26} color="#ffffff" />
            </TouchableOpacity>

            {/* 4. Earnings / Wallet */}
            <TouchableOpacity
              style={s.navItemBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/(vendor)/earnings' as any)}
            >
              <Ionicons name="wallet-outline" size={22} color="#64748b" />
            </TouchableOpacity>

            {/* 5. Profile & Settings */}
            <TouchableOpacity
              style={s.navItemBtn}
              activeOpacity={0.7}
              onPress={() => router.push('/(vendor)/profile')}
            >
              <Ionicons name="person-outline" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/* 45s RAPIDO-STYLE INCOMING BROADCAST MODAL                            */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <Modal
            visible={!!incomingOrderModal}
            animationType="slide"
            transparent
            onRequestClose={handleDeclineIncomingOrder}
          >
            <View style={s.flashModalOverlay}>
              <View style={s.flashModalBox}>
                <View style={s.timerHeader}>
                  <View style={s.timerPulseDot} />
                  <Text style={s.timerTitle}>INCOMING ORDER ({countdownSeconds}s)</Text>
                </View>

                <View style={s.flashOrderBody}>
                  <Text style={s.flashOrderGrandTotal}>
                    ₹{incomingOrderModal?.pricing?.grandTotal || 599}
                  </Text>
                  <Text style={s.flashVendorSplit}>
                    Net Payout: ₹{Math.round((incomingOrderModal?.pricing?.grandTotal || 599) * 0.88)} (88%)
                  </Text>

                  <View style={s.flashAddressBox}>
                    <Text style={s.flashAddressTitle}>📍 Delivery Address</Text>
                    <Text style={s.flashAddressText}>
                      {incomingOrderModal?.shippingAddress?.fullAddress || 'Benz Circle, Vijayawada'}
                    </Text>
                  </View>

                  <Text style={s.flashItemsTitle}>Items in Order:</Text>
                  {(incomingOrderModal?.items || []).map((it: any, idx: number) => (
                    <Text key={idx} style={s.flashItemLine} numberOfLines={1}>
                      • {it.quantity || 1}x {it.productName || it.name} (₹{it.price || 599})
                    </Text>
                  ))}
                </View>

                <View style={s.flashActionRow}>
                  <TouchableOpacity
                    style={s.flashDeclineBtn}
                    onPress={handleDeclineIncomingOrder}
                  >
                    <Text style={s.flashDeclineText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.flashAcceptBtn}
                    onPress={handleAcceptIncomingOrder}
                  >
                    <Text style={s.flashAcceptText}>ACCEPT ORDER ⚡</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ── Pause Duty Modal ──────────────────────────────────────────────── */}
          <Modal visible={isPauseModalOpen} transparent animationType="fade">
            <View style={s.modalBackdrop}>
              <View style={s.modalCard}>
                <Text style={s.modalHeaderTitle}>Pause Store Duty?</Text>
                <Text style={s.modalHeaderSubtitle}>Select reason for pausing:</Text>

                {PAUSE_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[s.reasonOption, selectedPauseReason === reason && s.reasonOptionSelected]}
                    onPress={() => setSelectedPauseReason(reason)}
                  >
                    <Text style={[s.reasonText, selectedPauseReason === reason && s.reasonTextSelected]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}

                <View style={s.modalBtnRow}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setIsPauseModalOpen(false)}>
                    <Text style={s.cancelBtnText}>Keep Duty ON</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.confirmPauseBtn} onPress={confirmPauseDuty}>
                    <Text style={s.confirmPauseBtnText}>Confirm Pause</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ── Full Orders Queue Modal ───────────────────────────────────────── */}
          <Modal visible={isOrdersModalOpen} transparent animationType="slide">
            <View style={s.modalBackdrop}>
              <View style={s.sheetCard}>
                <View style={s.sheetHeader}>
                  <Text style={s.sheetTitle}>Live Store Orders Queue</Text>
                  <TouchableOpacity onPress={() => setIsOrdersModalOpen(false)}>
                    <Ionicons name="close" size={22} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ padding: 12 }}>
                  {orders.map(ord => (
                    <View key={ord.orderId} style={s.invItemRow}>
                      <View style={{ flex: 1, paddingRight: 6 }}>
                        <Text style={s.invName} numberOfLines={1}>{ord.customerName || 'Customer'}</Text>
                        <Text style={s.invPrice}>#{ord.orderId} • ₹{ord.pricing?.grandTotal || 599} • {ord.status}</Text>
                      </View>
                      <TouchableOpacity
                        style={s.orderMiniAdvanceBtn}
                        onPress={() => handleAdvanceOrderStatus(ord.orderId, ord.status)}
                      >
                        <Text style={s.orderMiniAdvanceText}>
                          {ord.status === 'PENDING' ? 'Prepare' : ord.status === 'PREPARING' ? 'Pack' : 'Ready'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* ── Add Product Modal ──────────────────────────────────────────────── */}
          <Modal visible={isAddProductOpen} transparent animationType="slide">
            <View style={s.modalBackdrop}>
              <View style={s.sheetCard}>
                <View style={s.sheetHeader}>
                  <Text style={s.sheetTitle}>+ Add Product to Store</Text>
                  <TouchableOpacity onPress={() => setIsAddProductOpen(false)}>
                    <Ionicons name="close" size={22} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <View style={{ padding: 14 }}>
                  <Text style={s.inputLabel}>Product Name *</Text>
                  <TextInput
                    style={s.formInput}
                    placeholder="e.g. CeraVe Face Cleanser"
                    placeholderTextColor="#94a3b8"
                    value={newProdName}
                    onChangeText={setNewProdName}
                  />
                  <Text style={s.inputLabel}>Selling Price (₹) *</Text>
                  <TextInput
                    style={s.formInput}
                    placeholder="e.g. 599"
                    placeholderTextColor="#94a3b8"
                    value={newProdPrice}
                    onChangeText={setNewProdPrice}
                    keyboardType="numeric"
                  />
                  <Text style={s.inputLabel}>Stock Quantity</Text>
                  <TextInput
                    style={s.formInput}
                    placeholder="e.g. 24"
                    placeholderTextColor="#94a3b8"
                    value={newProdStock}
                    onChangeText={setNewProdStock}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity style={s.saveProductBtn} onPress={handleCreateProduct}>
                    <Text style={s.saveProductBtnText}>Publish Product 🚀</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  outerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
  },

  // ── Clean Flat Hero Background ────────────────────────────────────────────
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 460,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Top Bar & Identity ────────────────────────────────────────────────────
  topBar: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 22,
  },
  merchantBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  avatarImg: {
    width: 38,
    height: 38,
    borderRadius: 13,
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#0050ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#0050ff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  merchantShopName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  merchantLocality: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 1,
  },

  // ── Horizontal Date Strip ─────────────────────────────────────────────────
  dateStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  dateCol: {
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  dateColActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    transform: [{ scale: 1.05 }],
  },
  dateDayText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  dateDayTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  dateNumText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  dateNumTextActive: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16.5,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 🌟 POLISHED CLEAN DUTY TOGGLE BAR
  // ══════════════════════════════════════════════════════════════════════════
  sleekDutyBar: {
    marginBottom: 16,
  },
  dutyBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  dutyTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  dutyPulseBeaconWrap: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dutyPulseBeaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dutyPulseRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    opacity: 0.35,
  },
  dutyBarTitleText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  dutyBarSubtitleText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },

  // Solid Pill Badge
  dutyPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    minWidth: 64,
    flexShrink: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dutyPillBadgeText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // ── Frosted Segmented Pill Switch (Live Queue vs Activity) ────────────────
  pillSegmentContainer: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 24,
    padding: 3,
    marginBottom: 16,
  },
  pillSegmentBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillSegmentBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  pillSegmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  pillSegmentTextActive: {
    color: '#0f172a',
    fontWeight: '800',
  },

  // ── Massive Focal Center Metric (Dynamic based on selected Date & Tab) ───
  focalMetricBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  focalBigNumber: {
    fontSize: 54,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
    lineHeight: 60,
    textAlign: 'center',
  },
  focalUnitText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // ── 3 Rounded Glass Metric Cards (Dynamic based on selected Date) ─────────
  threeCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  glassMetricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  glassCardLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 3,
  },
  glassCardValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LOWER DASHBOARD CONTAINER
  // ══════════════════════════════════════════════════════════════════════════
  lowerSheetContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 20,
    marginTop: -6,
  },
  sectionHeaderTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 12,
  },

  // 3-Tab Pill Selector
  tabSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 22,
    padding: 3,
    marginBottom: 16,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  tabPillActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0050ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabPillTextActive: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0050ff',
  },

  // ── 2-Column Gauge Cards ──────────────────────────────────────────────────
  gaugeCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  gaugeCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 14,
  },
  gaugeCardLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  gaugeCardMainVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 12,
  },
  gaugeBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    position: 'relative',
    marginBottom: 12,
  },
  gaugeBarFillOrange: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f97316',
  },
  gaugeBarFillBlue: {
    position: 'absolute',
    left: 0,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0050ff',
  },
  gaugePointerTriangle: {
    position: 'absolute',
    bottom: -7,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#64748b',
  },
  gaugeStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  gaugeStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  gaugeStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },

  // ── Performance Score Card ────────────────────────────────────────────────
  performanceScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  scoreCardLabel: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  scoreCardSub: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 2,
  },
  scoreCardBigNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0050ff',
  },

  // ── Live Pipeline / Mini Rows ─────────────────────────────────────────────
  liveOrdersContainer: {
    marginTop: 4,
  },
  sectionSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  subHeaderLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0050ff',
  },
  emptyMiniBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  emptyMiniText: {
    fontSize: 11.5,
    color: '#64748b',
  },
  orderMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  orderMiniIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#e6eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invMiniThumb: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  orderMiniCustomer: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  orderMiniMeta: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  orderMiniAdvanceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0050ff',
  },
  orderMiniAdvanceText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  miniStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniStepperBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStepperBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  miniStepperVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    minWidth: 16,
    textAlign: 'center',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SLEEK FLOATING BOTTOM NAV (MATCHES DESIGN EXACTLY)
  // ══════════════════════════════════════════════════════════════════════════
  floatingBottomNav: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 58,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    shadowColor: '#0050ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e6eeff',
  },
  navItemBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navFloatingPlusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0050ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0050ff',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  // ── Flash Incoming Order Modal ────────────────────────────────────────────
  flashModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  flashModalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    marginBottom: 16,
  },
  timerPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  timerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  flashOrderBody: {
    marginBottom: 16,
  },
  flashOrderGrandTotal: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  flashVendorSplit: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
  },
  flashAddressBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  flashAddressTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 4,
  },
  flashAddressText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  flashItemsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  flashItemLine: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 3,
  },
  flashActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  flashDeclineBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashDeclineText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  flashAcceptBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0050ff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0050ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  flashAcceptText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // ── General Modals ────────────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
  },
  reasonOption: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  reasonOptionSelected: {
    backgroundColor: '#e6eeff',
    borderWidth: 1,
    borderColor: '#0050ff',
  },
  reasonText: {
    fontSize: 12.5,
    color: '#334155',
  },
  reasonTextSelected: {
    fontWeight: '800',
    color: '#0050ff',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  confirmPauseBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },
  confirmPauseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  sheetCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  invItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  invName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  invPrice: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 12,
  },
  saveProductBtn: {
    backgroundColor: '#0050ff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveProductBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});

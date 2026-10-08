/**
 * Orders Screen — Tabbed list of New / Accepted / Ready / Completed / Cancelled
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import useVendorStore from '../../src/store/useVendorStore';
import { ordersApi } from '../../src/services/api';
import { StatusPill, orderStatusPill, SectionHeader } from '../../src/components/ui';
import { Colors, Spacing, Radius } from '../../src/theme';
import type { Order } from '../../src/store/useVendorStore';

const STORE_ID = process.env.EXPO_PUBLIC_STORE_ID || 'DS-VIJ-01';

const TABS = [
  { key: 'PENDING',    label: 'New' },
  { key: 'ACCEPTED',   label: 'Accepted' },
  { key: 'PACKED',     label: 'Ready' },
  { key: 'DELIVERED',  label: 'Completed' },
  { key: 'CANCELLED',  label: 'Cancelled' },
];

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000)   return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, setOrders } = useVendorStore();

  const [activeTab,  setActiveTab]  = useState('PENDING');
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const res = await ordersApi.getAll({ storeId: STORE_ID });
      if (res?.orders) setOrders(res.orders);
    } catch (_) {}
  }, []);

  useEffect(() => { loadOrders(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const filteredOrders = orders.filter(o =>
    activeTab === 'PACKED'
      ? o.status === 'PACKED' || o.status === 'DISPATCHED'
      : o.status === activeTab
  );

  return (
    <SafeAreaView style={s.root}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.back}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.title}>Orders Queue</Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll}>
          <View style={s.tabsRow}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={s.tabBtn}
              >
                <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
                  {tab.label}
                  {tab.key === 'PENDING' && orders.filter(o => o.status === 'PENDING').length > 0
                    ? ` (${orders.filter(o => o.status === 'PENDING').length})`
                    : ''}
                </Text>
                {activeTab === tab.key && <View style={s.tabUnderline} />}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* List */}
        <ScrollView
          style={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filteredOrders.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyEmoji}>📭</Text>
              <Text style={s.emptyText}>No {TABS.find(t => t.key === activeTab)?.label.toLowerCase()} orders</Text>
            </View>
          ) : (
            filteredOrders.map(order => (
              <TouchableOpacity
                key={order.orderId}
                style={s.orderRow}
                onPress={() => router.push({
                  pathname: '/(vendor)/order-detail',
                  params: { orderId: order.orderId },
                })}
                activeOpacity={0.75}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.orderId}>
                    #{order.orderId} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </Text>
                  <Text style={s.orderSub}>{timeAgo(order.createdAt)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={s.amount}>₹{order.pricing?.grandTotal?.toLocaleString('en-IN')}</Text>
                  <StatusPill {...orderStatusPill(order.status)} />
                </View>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.bg, alignItems: 'center' },
  container: { width: '100%', maxWidth: 580, flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: Spacing.lg, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.line,
    backgroundColor: '#fff',
  },
  back:      { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: Colors.line, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: Colors.ink, lineHeight: 22 },
  title:     { fontSize: 17, fontWeight: '700', color: Colors.ink },
  tabsScroll:{ borderBottomWidth: 1, borderBottomColor: Colors.line, maxHeight: 46 },
  tabsRow:   { flexDirection: 'row', paddingHorizontal: Spacing.lg, gap: 4 },
  tabBtn:    { paddingHorizontal: 6, paddingVertical: 12, alignItems: 'center' },
  tabText:   { fontSize: 12.5, fontWeight: '600', color: Colors.sub, whiteSpace: 'nowrap' },
  tabTextActive: { color: Colors.ink },
  tabUnderline:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: Colors.ink },
  list: { flex: 1, padding: Spacing.lg, paddingTop: 12 },
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  orderId:   { fontSize: 14, fontWeight: '600', color: Colors.ink },
  orderSub:  { fontSize: 12, color: Colors.sub, marginTop: 2 },
  amount:    { fontSize: 14, fontWeight: '700', color: Colors.ink },
  empty: { flex: 1, alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji:{ fontSize: 36 },
  emptyText: { fontSize: 14, color: Colors.sub },
});

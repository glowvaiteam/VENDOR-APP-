/**
 * Notifications Screen — All real-time alerts for the vendor
 */
import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import useVendorStore from '../../src/store/useVendorStore';
import { notificationsApi } from '../../src/services/api';
import { Colors, Spacing, Radius } from '../../src/theme';

const VENDOR_ID = process.env.EXPO_PUBLIC_VENDOR_ID || 'VND-001';

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  if (d < 60000)   return 'Just now';
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000)return `${Math.floor(d / 3600000)}h ago`;
  return `${Math.floor(d / 86400000)}d ago`;
}

function notifIcon(type: string) {
  switch (type) {
    case 'NEW_ORDER':       return '🛍️';
    case 'ORDER_CANCELLED': return '❌';
    case 'PAYOUT':          return '💰';
    case 'SYSTEM':          return 'ℹ️';
    default:                return '🔔';
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications, setNotifications, markNotificationRead,
  } = useVendorStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const loadNotifs = async () => {
    try {
      const res = await notificationsApi.getAll(VENDOR_ID);
      if (res?.notifications) setNotifications(res.notifications);
    } catch (_) {}
  };

  useEffect(() => { loadNotifs(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifs();
    setRefreshing(false);
  };

  const handlePress = async (n: any) => {
    if (!n.read) {
      markNotificationRead(n.id);
      await notificationsApi.markRead(n.id).catch(() => {});
    }
    if (n.orderId) {
      router.push({ pathname: '/(vendor)/order-detail', params: { orderId: n.orderId } });
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Notifications</Text>
      </View>

      <ScrollView
        style={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notifications.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 34 }}>🔔</Text>
            <Text style={{ color: Colors.sub, marginTop: 10 }}>No notifications yet</Text>
          </View>
        ) : notifications.map(n => (
          <TouchableOpacity
            key={n.id}
            style={[s.notifRow, !n.read && s.notifRowUnread]}
            onPress={() => handlePress(n)}
            activeOpacity={0.75}
          >
            <View style={s.iconBox}>
              <Text style={s.icon}>{notifIcon(n.type)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.notifTitle, !n.read && s.unreadTitle]}>{n.title}</Text>
              <Text style={s.notifBody}>{n.body}</Text>
              <Text style={s.notifTime}>{timeAgo(n.createdAt)}</Text>
            </View>
            {!n.read && <View style={s.dot} />}
          </TouchableOpacity>
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
  list:      { flex: 1 },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.line,
  },
  notifRowUnread: { backgroundColor: '#fafafa' },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center', justifyContent: 'center',
  },
  icon:        { fontSize: 18 },
  notifTitle:  { fontSize: 14, fontWeight: '600', color: Colors.ink },
  unreadTitle: { fontWeight: '700' },
  notifBody:   { fontSize: 12.5, color: Colors.sub, marginTop: 2, lineHeight: 17 },
  notifTime:   { fontSize: 11, color: Colors.sub, marginTop: 4 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.ink, marginTop: 6,
  },
  empty: { alignItems: 'center', paddingVertical: 80 },
});

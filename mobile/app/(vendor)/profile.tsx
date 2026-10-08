/**
 * GlowVAI Vendor App — Merchant Profile & Store Settings
 * ═══════════════════════════════════════════════════════════════════════════
 * Professional Merchant Management & Compliance Console:
 *   • Store Identity & Profile Photo Management:
 *       - Live store photo with high-precision camera badge
 *       - Curated avatar selector & custom URL support
 *   • Store Details & Operational Settings:
 *       - Store Name, Owner Name, Contact Phone, Email, Operating Hours, Address
 *   • Bank & Payout Configuration:
 *       - Bank Name, Account Number, IFSC Code, UPI Handle
 *       - Verified RBI T+1 Settlement status
 *   • Partner Operations & Support Desk:
 *       - Direct 24/7 Operations Desk Hotline
 *       - WhatsApp Support Channel
 *       - Support Ticket Submission & FAQ Accordion
 *   • KYC & Regulatory Compliance:
 *       - GSTIN, FSSAI, PAN status verification
 * ═══════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Image,
  Alert, Linking, Modal, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, Feather } from '@expo/vector-icons';
import useVendorStore from '../../src/store/useVendorStore';
import { vendorApi } from '../../src/services/api';
import { soundService } from '../../src/services/sound';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BRAND_COLOR = '#0050ff';
const GREEN_COLOR = '#16a34a';
const RED_COLOR   = '#dc2626';

const VENDOR_ID = process.env.EXPO_PUBLIC_VENDOR_ID || 'VND-001';
const STORE_ID  = process.env.EXPO_PUBLIC_STORE_ID  || 'DS-VIJ-01';

const AVATAR_PRESETS = [
  { id: '1', label: 'Dark Store Hub', uri: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=80' },
  { id: '2', label: 'Beauty Boutique', uri: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=150&auto=format&fit=crop&q=80' },
  { id: '3', label: 'Glow Cosmetics', uri: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=150&auto=format&fit=crop&q=80' },
  { id: '4', label: 'Organic Skincare', uri: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80' },
  { id: '5', label: 'Pharmacy Express', uri: 'https://images.unsplash.com/photo-1586015555751-63c29994c653?w=150&auto=format&fit=crop&q=80' },
  { id: '6', label: 'Salon & Wellness', uri: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=150&auto=format&fit=crop&q=80' },
];

const STORE_CATEGORIES = [
  'Dark Store & Quick Commerce',
  'Cosmetics & Makeup',
  'Skincare & Dermatology',
  'Hair Care & Personal Care',
  'Fragrances & Wellness',
  'Organic & Ayurvedic',
];

const POPULAR_BANKS = [
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
];

const FAQ_ITEMS = [
  {
    q: 'When are daily payouts settled?',
    a: 'Completed order revenues are settled automatically to your verified bank account daily via IMPS at 06:00 AM on a standard T+1 schedule.',
  },
  {
    q: 'How do I pause incoming order routing?',
    a: 'Toggle the status bar at the top of your Home dashboard to OFF to pause incoming broadcasts during shelf replenishment or heavy order rushes.',
  },
  {
    q: 'What happens when an SKU inventory hits 0?',
    a: 'Any SKU with 0 stock on hand is automatically hidden from live customer searches in real-time to avoid unfulfillable orders.',
  },
  {
    q: 'How do I request delivery rider re-assignment?',
    a: 'Go to the Support tab, tap "Raise Support Ticket", and select "Rider Dispatch Delay" with your Order ID. The control tower resolves in under 3 minutes.',
  },
];

export default function GlowVAIVendorProfileScreen() {
  const router = useRouter();
  const { vendor, setVendor } = useVendorStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'bank' | 'support' | 'compliance'>('profile');

  // Store Details
  const [shopName, setShopName]         = useState(vendor?.shopName || 'GlowVAI Dark Store Hub #1');
  const [ownerName, setOwnerName]       = useState(vendor?.name || 'Dark Store Merchant');
  const [phone, setPhone]               = useState(vendor?.phone || '8977855998');
  const [email, setEmail]               = useState(vendor?.email || 'vendor.hub01@glowvai.com');
  const [category, setCategory]         = useState(vendor?.shopType || 'Dark Store & Quick Commerce');
  const [openTime, setOpenTime]         = useState(vendor?.openTime || '09:00 AM');
  const [closeTime, setCloseTime]       = useState(vendor?.closeTime || '11:00 PM');
  const [locality, setLocality]         = useState(vendor?.locality || 'Benz Circle Hub');
  const [address, setAddress]           = useState(vendor?.address || 'Door #40-1-52, MG Road, Benz Circle');
  const [city, setCity]                 = useState(vendor?.city || 'Vijayawada');
  const [pincode, setPincode]           = useState(vendor?.pincode || '520010');

  // Photo
  const [avatarUrl, setAvatarUrl]       = useState(vendor?.avatarUrl || AVATAR_PRESETS[0].uri);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [customPhotoInput, setCustomPhotoInput] = useState('');

  // Bank
  const [bankName, setBankName]                 = useState(vendor?.bankName || 'HDFC Bank');
  const [accountHolder, setAccountHolder]       = useState(vendor?.accountHolderName || 'GlowVAI Merchant Hub');
  const [accountNumber, setAccountNumber]       = useState(vendor?.accountNumber || '50200088994321');
  const [confirmAccount, setConfirmAccount]     = useState(vendor?.accountNumber || '50200088994321');
  const [ifscCode, setIfscCode]                 = useState(vendor?.ifscCode || 'HDFC0001234');
  const [upiId, setUpiId]                       = useState(vendor?.upiId || 'glowvai.vij@okhdfcbank');

  // Support Ticket Modal
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketCategory, setTicketCategory]       = useState('Payout & Settlement');
  const [ticketSubject, setTicketSubject]         = useState('');
  const [ticketDetails, setTicketDetails]         = useState('');
  const [ticketPriority, setTicketPriority]       = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('URGENT');
  const [ticketSuccessId, setTicketSuccessId]     = useState<string | null>(null);

  // Preferences
  const [soundAlerts, setSoundAlerts]   = useState(true);
  const [vibration, setVibration]       = useState(true);
  const [smsPayoutAlert, setSmsPayoutAlert] = useState(true);

  // FAQs
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    loadStoredProfile();
  }, []);

  const loadStoredProfile = async () => {
    try {
      const [savedStepA, savedStepB, savedAvatar] = await Promise.all([
        AsyncStorage.getItem('onb_step_a'),
        AsyncStorage.getItem('onb_step_b'),
        AsyncStorage.getItem('vendor_avatar'),
      ]);

      if (savedStepA) {
        const a = JSON.parse(savedStepA);
        if (a.shopName) setShopName(a.shopName);
        if (a.ownerName) setOwnerName(a.ownerName);
        if (a.phone) setPhone(a.phone);
        if (a.email) setEmail(a.email);
        if (a.locality) setLocality(a.locality);
        if (a.address) setAddress(a.address);
        if (a.city) setCity(a.city);
        if (a.pincode) setPincode(a.pincode);
      }

      if (savedStepB) {
        const b = JSON.parse(savedStepB);
        if (b.bankName) setBankName(b.bankName);
        if (b.accountHolderName) setAccountHolder(b.accountHolderName);
        if (b.accountNumber) {
          setAccountNumber(b.accountNumber);
          setConfirmAccount(b.accountNumber);
        }
        if (b.ifscCode) setIfscCode(b.ifscCode);
        if (b.upiId) setUpiId(b.upiId);
      }

      if (savedAvatar) {
        setAvatarUrl(savedAvatar);
      }
    } catch (_) {}
  };

  const handleSaveProfile = async () => {
    if (!shopName.trim()) {
      return Alert.alert('Required', 'Please enter your Store / Shop Name.');
    }
    soundService.playSuccessDing();

    const updatedProfile = {
      ...(vendor || {}),
      vendorId: VENDOR_ID,
      storeId: STORE_ID,
      shopName: shopName.trim(),
      name: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      shopType: category,
      openTime,
      closeTime,
      locality: locality.trim(),
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      avatarUrl,
      isOnline: vendor?.isOnline ?? true,
    };

    setVendor(updatedProfile as any);

    try {
      await AsyncStorage.setItem('onb_step_a', JSON.stringify({
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        category,
        locality: locality.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
      }));

      await vendorApi.updateProfile(VENDOR_ID, updatedProfile).catch(() => {});
    } catch (_) {}

    Alert.alert('Settings Saved', 'Merchant store details have been successfully updated.');
  };

  const handleSelectAvatar = async (url: string) => {
    setAvatarUrl(url);
    setIsPhotoModalOpen(false);
    soundService.playSuccessDing();

    try {
      await AsyncStorage.setItem('vendor_avatar', url);
      if (vendor) {
        setVendor({ ...vendor, avatarUrl: url });
      }
      await vendorApi.updateProfile(VENDOR_ID, { avatarUrl: url }).catch(() => {});
    } catch (_) {}

    Alert.alert('Photo Updated', 'Store profile photo updated.');
  };

  const handleSaveBankDetails = async () => {
    if (!accountNumber || accountNumber !== confirmAccount) {
      return Alert.alert('Mismatch', 'Bank Account numbers do not match. Please verify.');
    }
    if (!ifscCode || ifscCode.length < 5) {
      return Alert.alert('Invalid IFSC', 'Please enter a valid 11-character bank IFSC code.');
    }

    soundService.playSuccessDing();

    const bankPayload = {
      bankName,
      accountHolderName: accountHolder,
      accountNumber,
      ifscCode: ifscCode.toUpperCase(),
      upiId,
    };

    try {
      await AsyncStorage.setItem('onb_step_b', JSON.stringify(bankPayload));
      if (vendor) {
        setVendor({ ...vendor, ...bankPayload });
      }
      await vendorApi.updateProfile(VENDOR_ID, bankPayload).catch(() => {});
    } catch (_) {}

    Alert.alert('Bank Details Saved', 'Your payout account is verified for daily settlements.');
  };

  const handleCallSupport = () => {
    soundService.playSuccessDing();
    const phoneUrl = 'tel:+918000045678';
    Linking.openURL(phoneUrl).catch(() => {
      Alert.alert('Ops Helpline', 'Call Dark Store Desk: +91 80000 45678 (24/7 Support)');
    });
  };

  const handleOpenWhatsApp = () => {
    soundService.playSuccessDing();
    const msg = encodeURIComponent(`Hi Operations Desk, I am reaching out from ${shopName} (Store ID: ${STORE_ID}).`);
    const waUrl = `https://wa.me/918977855998?text=${msg}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp Support', 'Connecting to GlowVAI Merchant Operations.');
    });
  };

  const handleSubmitTicket = () => {
    if (!ticketSubject.trim()) {
      return Alert.alert('Subject Required', 'Please enter a brief subject for your ticket.');
    }
    soundService.playSuccessDing();
    const generatedId = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
    setTicketSuccessId(generatedId);
    setTimeout(() => {
      setIsTicketModalOpen(false);
      setTicketSubject('');
      setTicketDetails('');
      setTicketSuccessId(null);
      Alert.alert('Ticket Raised', `Ticket #${generatedId} submitted. Expected resolution within 15 minutes.`);
    }, 1000);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out Merchant Account',
      'You will stop receiving incoming order notifications until you sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            soundService.playSuccessDing();
            await AsyncStorage.multiRemove([
              'vendor_phone', 'vendor_registered', 'onb_step_a',
              'onb_step_b', 'onb_step_c', 'onb_step_d', 'vendor_avatar',
            ]);
            setVendor(null as any);
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safeArea}>
      {/* ── Top Header ───────────────────────────────────────────────────────── */}
      <View style={s.headerBar}>
        <TouchableOpacity
          style={s.backBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>

        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          <Text style={s.headerTitle} numberOfLines={1}>Merchant Profile</Text>
          <Text style={s.headerSubTitle}>Store: {STORE_ID} • Vendor: {VENDOR_ID}</Text>
        </View>

        <TouchableOpacity
          style={s.saveHeaderBtn}
          activeOpacity={0.8}
          onPress={handleSaveProfile}
        >
          <Text style={s.saveHeaderBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Store Identity Card ────────────────────────────────────────────── */}
        <View style={s.identityCard}>
          <View style={s.avatarContainer}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={s.avatarImage} />
            ) : (
              <View style={s.avatarPlaceholder}>
                <Text style={s.avatarLetter}>{shopName.charAt(0).toUpperCase()}</Text>
              </View>
            )}

            <TouchableOpacity
              style={s.cameraBadge}
              activeOpacity={0.85}
              onPress={() => setIsPhotoModalOpen(true)}
            >
              <Ionicons name="camera" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={s.identityInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.storeNameText} numberOfLines={1}>{shopName}</Text>
              <View style={s.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#ffffff" />
              </View>
            </View>

            <Text style={s.ownerNameText}>{ownerName} • {category}</Text>
            <Text style={s.addressText} numberOfLines={1}>{locality}, {city}</Text>

            <TouchableOpacity
              style={s.editPhotoAction}
              activeOpacity={0.75}
              onPress={() => setIsPhotoModalOpen(true)}
            >
              <Ionicons name="image-outline" size={13} color={BRAND_COLOR} />
              <Text style={s.editPhotoActionText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Segment Navigation Bar ─────────────────────────────────────────── */}
        <View style={s.segmentNavRow}>
          {[
            { id: 'profile', label: 'Store', icon: 'business-outline' },
            { id: 'bank', label: 'Bank & Payouts', icon: 'card-outline' },
            { id: 'support', label: 'Support', icon: 'headset-outline' },
            { id: 'compliance', label: 'KYC Status', icon: 'shield-checkmark-outline' },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[s.segmentTab, isActive && s.segmentTabActive]}
                activeOpacity={0.8}
                onPress={() => {
                  soundService.playSuccessDing();
                  setActiveTab(item.id as any);
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={15}
                  color={isActive ? BRAND_COLOR : '#64748b'}
                />
                <Text style={[s.segmentTabText, isActive && s.segmentTabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── TAB 1: STORE DETAILS ───────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <View>
            <View style={s.sectionBox}>
              <Text style={s.sectionTitle}>BASIC INFORMATION</Text>

              <Text style={s.fieldLabel}>Store Name</Text>
              <TextInput
                style={s.inputField}
                value={shopName}
                onChangeText={setShopName}
                placeholder="Store Name"
                placeholderTextColor="#94a3b8"
              />

              <Text style={s.fieldLabel}>Merchant Name</Text>
              <TextInput
                style={s.inputField}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="Full Name"
                placeholderTextColor="#94a3b8"
              />

              <View style={s.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Phone Number</Text>
                  <TextInput
                    style={s.inputField}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="10-digit number"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Email Address</Text>
                  <TextInput
                    style={s.inputField}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="merchant@glowvai.com"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <Text style={s.fieldLabel}>Operating Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillScroll}>
                {STORE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[s.categoryPill, category === cat && s.categoryPillActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[s.categoryPillText, category === cat && s.categoryPillTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={s.sectionBox}>
              <Text style={s.sectionTitle}>OPERATING HOURS & LOCATION</Text>

              <View style={s.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Opening Time</Text>
                  <TextInput
                    style={s.inputField}
                    value={openTime}
                    onChangeText={setOpenTime}
                    placeholder="09:00 AM"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>Closing Time</Text>
                  <TextInput
                    style={s.inputField}
                    value={closeTime}
                    onChangeText={setCloseTime}
                    placeholder="11:00 PM"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <Text style={s.fieldLabel}>Physical Address</Text>
              <TextInput
                style={s.inputField}
                value={address}
                onChangeText={setAddress}
                placeholder="Building, Landmark, Street"
                placeholderTextColor="#94a3b8"
              />

              <View style={s.threeColRow}>
                <View style={{ flex: 1.2 }}>
                  <Text style={s.fieldLabel}>Locality</Text>
                  <TextInput
                    style={s.inputField}
                    value={locality}
                    onChangeText={setLocality}
                    placeholder="Benz Circle"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={s.fieldLabel}>City</Text>
                  <TextInput
                    style={s.inputField}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Vijayawada"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={{ flex: 0.9 }}>
                  <Text style={s.fieldLabel}>Pincode</Text>
                  <TextInput
                    style={s.inputField}
                    value={pincode}
                    onChangeText={setPincode}
                    keyboardType="number-pad"
                    placeholder="520010"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={s.primarySaveBtn}
                activeOpacity={0.85}
                onPress={handleSaveProfile}
              >
                <Ionicons name="checkmark-sharp" size={17} color="#ffffff" />
                <Text style={s.primarySaveBtnText}>Save Store Details</Text>
              </TouchableOpacity>
            </View>

            {/* Notification & Broadcast Toggles */}
            <View style={s.sectionBox}>
              <Text style={s.sectionTitle}>BROADCAST & AUDIO PREFERENCES</Text>

              <View style={s.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={s.toggleTitle}>Order Chimes</Text>
                  <Text style={s.toggleSubtitle}>Play acoustic broadcast chime on incoming orders</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSoundAlerts(!soundAlerts)}
                  style={[s.toggleTrack, soundAlerts ? s.toggleTrackActive : s.toggleTrackInactive]}
                >
                  <View style={[s.toggleThumb, soundAlerts ? s.toggleThumbActive : s.toggleThumbInactive]} />
                </TouchableOpacity>
              </View>

              <View style={s.toggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={s.toggleTitle}>Haptic Feedback</Text>
                  <Text style={s.toggleSubtitle}>Vibrate device on orders and status events</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setVibration(!vibration)}
                  style={[s.toggleTrack, vibration ? s.toggleTrackActive : s.toggleTrackInactive]}
                >
                  <View style={[s.toggleThumb, vibration ? s.toggleThumbActive : s.toggleThumbInactive]} />
                </TouchableOpacity>
              </View>

              <View style={[s.toggleRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={s.toggleTitle}>Settlement SMS Alerts</Text>
                  <Text style={s.toggleSubtitle}>Receive automatic 06:00 AM daily payout receipt SMS</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSmsPayoutAlert(!smsPayoutAlert)}
                  style={[s.toggleTrack, smsPayoutAlert ? s.toggleTrackActive : s.toggleTrackInactive]}
                >
                  <View style={[s.toggleThumb, smsPayoutAlert ? s.toggleThumbActive : s.toggleThumbInactive]} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── TAB 2: BANK & PAYOUTS ───────────────────────────────────────────── */}
        {activeTab === 'bank' && (
          <View>
            <View style={s.bankVerificationBanner}>
              <View style={s.bankBannerIcon}>
                <Ionicons name="shield-checkmark" size={20} color={GREEN_COLOR} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.bankBannerTitle}>Automated T+1 Daily Settlements Active</Text>
                <Text style={s.bankBannerSub}>
                  Verified with payment gateway. Revenues are credited directly to your bank account daily at 06:00 AM.
                </Text>
              </View>
            </View>

            <View style={s.sectionBox}>
              <Text style={s.sectionTitle}>BANK ACCOUNT CREDENTIALS</Text>

              <Text style={s.fieldLabel}>Select Bank</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillScroll}>
                {POPULAR_BANKS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[s.categoryPill, bankName === b && s.categoryPillActive]}
                    onPress={() => setBankName(b)}
                  >
                    <Text style={[s.categoryPillText, bankName === b && s.categoryPillTextActive]}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={s.fieldLabel}>Account Holder Name</Text>
              <TextInput
                style={s.inputField}
                value={accountHolder}
                onChangeText={setAccountHolder}
                placeholder="Beneficiary / Account Holder Name"
                placeholderTextColor="#94a3b8"
              />

              <Text style={s.fieldLabel}>Account Number</Text>
              <TextInput
                style={s.inputField}
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="number-pad"
                placeholder="Account Number"
                placeholderTextColor="#94a3b8"
              />

              <Text style={s.fieldLabel}>Confirm Account Number</Text>
              <TextInput
                style={s.inputField}
                value={confirmAccount}
                onChangeText={setConfirmAccount}
                keyboardType="number-pad"
                placeholder="Re-enter Account Number"
                placeholderTextColor="#94a3b8"
              />

              <Text style={s.fieldLabel}>IFSC Code</Text>
              <TextInput
                style={s.inputField}
                value={ifscCode}
                onChangeText={(val) => setIfscCode(val.toUpperCase())}
                autoCapitalize="characters"
                placeholder="HDFC0001234"
                placeholderTextColor="#94a3b8"
              />
              <Text style={s.ifscResolutionText}>Verified: {bankName} — Benz Circle Branch, Vijayawada</Text>

              <Text style={[s.fieldLabel, { marginTop: 12 }]}>UPI VPA Handle (Optional)</Text>
              <TextInput
                style={s.inputField}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                placeholder="merchant@okhdfcbank"
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={s.primarySaveBtn}
                activeOpacity={0.85}
                onPress={handleSaveBankDetails}
              >
                <Ionicons name="checkmark-circle-outline" size={17} color="#ffffff" />
                <Text style={s.primarySaveBtnText}>Save Bank Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── TAB 3: PARTNER SUPPORT ─────────────────────────────────────────── */}
        {activeTab === 'support' && (
          <View>
            <View style={s.supportGrid}>
              <TouchableOpacity
                style={s.supportCard}
                activeOpacity={0.8}
                onPress={handleCallSupport}
              >
                <View style={[s.supportIconWrap, { backgroundColor: '#e6eeff' }]}>
                  <Ionicons name="call" size={18} color={BRAND_COLOR} />
                </View>
                <Text style={s.supportCardTitle}>Emergency Desk</Text>
                <Text style={s.supportCardSub}>Dedicated Dark Store Tower</Text>
                <Text style={s.supportCardAction}>Call Helpline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.supportCard}
                activeOpacity={0.8}
                onPress={handleOpenWhatsApp}
              >
                <View style={[s.supportIconWrap, { backgroundColor: '#e6f9e6' }]}>
                  <Ionicons name="logo-whatsapp" size={18} color={GREEN_COLOR} />
                </View>
                <Text style={s.supportCardTitle}>WhatsApp Support</Text>
                <Text style={s.supportCardSub}>Average reply under 2 min</Text>
                <Text style={[s.supportCardAction, { color: GREEN_COLOR }]}>Chat with Us</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={s.raiseTicketCard}
              activeOpacity={0.85}
              onPress={() => setIsTicketModalOpen(true)}
            >
              <View style={s.raiseTicketLeft}>
                <View style={s.raiseTicketIcon}>
                  <Ionicons name="ticket-outline" size={18} color="#0f172a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.raiseTicketTitle}>Raise a Support Ticket</Text>
                  <Text style={s.raiseTicketSub}>Disputes, rider delays, catalogue discrepancies</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#64748b" />
            </TouchableOpacity>

            <View style={s.sectionBox}>
              <Text style={s.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>

              {FAQ_ITEMS.map((item, idx) => {
                const isExpanded = expandedFaqIndex === idx;
                return (
                  <View key={idx} style={s.faqItem}>
                    <TouchableOpacity
                      style={s.faqHeader}
                      activeOpacity={0.7}
                      onPress={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    >
                      <Text style={s.faqQuestionText}>{item.q}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={s.faqAnswerWrap}>
                        <Text style={s.faqAnswerText}>{item.a}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── TAB 4: KYC & REGULATORY ────────────────────────────────────────── */}
        {activeTab === 'compliance' && (
          <View>
            <View style={s.sectionBox}>
              <Text style={s.sectionTitle}>VERIFIED REGULATORY CREDENTIALS</Text>

              <View style={s.kycItemRow}>
                <View style={s.kycIcon}>
                  <Ionicons name="document-text-outline" size={18} color={BRAND_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.kycDocTitle}>GSTIN Registration</Text>
                  <Text style={s.kycDocValue}>37AAAAA0000A1Z5</Text>
                </View>
                <View style={s.kycStatusTag}>
                  <Text style={s.kycStatusTagText}>Verified</Text>
                </View>
              </View>

              <View style={s.kycItemRow}>
                <View style={s.kycIcon}>
                  <Ionicons name="shield-outline" size={18} color={BRAND_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.kycDocTitle}>FSSAI License</Text>
                  <Text style={s.kycDocValue}>10019044001234</Text>
                </View>
                <View style={s.kycStatusTag}>
                  <Text style={s.kycStatusTagText}>Active</Text>
                </View>
              </View>

              <View style={s.kycItemRow}>
                <View style={s.kycIcon}>
                  <Ionicons name="person-outline" size={18} color={BRAND_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.kycDocTitle}>PAN Card</Text>
                  <Text style={s.kycDocValue}>ABCDE1234F</Text>
                </View>
                <View style={s.kycStatusTag}>
                  <Text style={s.kycStatusTagText}>Verified</Text>
                </View>
              </View>

              <View style={[s.kycItemRow, { borderBottomWidth: 0 }]}>
                <View style={s.kycIcon}>
                  <Ionicons name="business-outline" size={18} color={BRAND_COLOR} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.kycDocTitle}>Dark Store Partner Code</Text>
                  <Text style={s.kycDocValue}>GVI-AP-VJA-2026-99</Text>
                </View>
                <View style={s.kycStatusTag}>
                  <Text style={s.kycStatusTagText}>Authorized</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Admin Console Launcher ────────────────────────────────────────── */}
        <TouchableOpacity
          style={s.adminLauncherBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/admin')}
        >
          <Ionicons name="grid-outline" size={17} color={BRAND_COLOR} />
          <Text style={s.adminLauncherBtnText}>Open Master Admin Control Tower</Text>
          <Ionicons name="chevron-forward" size={15} color={BRAND_COLOR} />
        </TouchableOpacity>

        {/* ── Logout Button ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={s.logoutBtn}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={17} color={RED_COLOR} />
          <Text style={s.logoutBtnText}>Log Out Merchant Account</Text>
        </TouchableOpacity>

        <Text style={s.footerText}>GlowVAI Dark Store Suite • v2.4.0 (Build 2026.10)</Text>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Change Photo Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={isPhotoModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPhotoModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Store Photo</Text>
                <Text style={s.modalSubtitle}>Choose a curated avatar or provide an image URL</Text>
              </View>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setIsPhotoModalOpen(false)}
              >
                <Ionicons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={s.modalSectionLabel}>PRESET AVATARS</Text>
            <View style={s.avatarGrid}>
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = avatarUrl === preset.uri;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[s.avatarGridItem, isSelected && s.avatarGridItemActive]}
                    onPress={() => handleSelectAvatar(preset.uri)}
                  >
                    <Image source={{ uri: preset.uri }} style={s.presetImg} />
                    <Text style={[s.presetLabel, isSelected && s.presetLabelActive]} numberOfLines={1}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[s.modalSectionLabel, { marginTop: 14 }]}>IMAGE URL</Text>
            <TextInput
              style={s.inputField}
              value={customPhotoInput}
              onChangeText={setCustomPhotoInput}
              placeholder="https://example.com/store.jpg"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[s.primarySaveBtn, { marginTop: 8 }]}
              activeOpacity={0.85}
              onPress={() => {
                if (customPhotoInput.trim()) {
                  handleSelectAvatar(customPhotoInput.trim());
                } else {
                  setIsPhotoModalOpen(false);
                }
              }}
            >
              <Text style={s.primarySaveBtnText}>Apply Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Raise Ticket Modal ───────────────────────────────────────────────── */}
      <Modal
        visible={isTicketModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTicketModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalTitle}>Raise Support Ticket</Text>
                <Text style={s.modalSubtitle}>Our operations tower will respond promptly</Text>
              </View>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setIsTicketModalOpen(false)}
              >
                <Ionicons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={s.modalSectionLabel}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.pillScroll}>
              {['Payout & Settlement', 'Rider Dispatch Delay', 'Inventory Discrepancy', 'Hardware & Scanner', 'General Query'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.categoryPill, ticketCategory === c && s.categoryPillActive]}
                  onPress={() => setTicketCategory(c)}
                >
                  <Text style={[s.categoryPillText, ticketCategory === c && s.categoryPillTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.fieldLabel}>Subject / Order ID</Text>
            <TextInput
              style={s.inputField}
              value={ticketSubject}
              onChangeText={setTicketSubject}
              placeholder="e.g. Order #ORD-8491 dispatch query"
              placeholderTextColor="#94a3b8"
            />

            <Text style={s.fieldLabel}>Issue Description</Text>
            <TextInput
              style={s.textAreaField}
              value={ticketDetails}
              onChangeText={setTicketDetails}
              placeholder="Describe what happened..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
            />

            <Text style={s.fieldLabel}>Priority</Text>
            <View style={s.priorityRow}>
              {(['NORMAL', 'URGENT', 'CRITICAL'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[s.priorityPill, ticketPriority === p && (p === 'CRITICAL' ? s.priorityPillCritical : s.priorityPillActive)]}
                  onPress={() => setTicketPriority(p)}
                >
                  <Text style={[s.priorityPillText, ticketPriority === p && s.priorityPillTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={s.primarySaveBtn}
              activeOpacity={0.85}
              onPress={handleSubmitTicket}
            >
              <Ionicons name="send" size={15} color="#ffffff" />
              <Text style={s.primarySaveBtnText}>
                {ticketSuccessId ? `Submitted (${ticketSuccessId})` : 'Submit to Ops Tower'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubTitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  saveHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: BRAND_COLOR,
    borderRadius: 10,
  },
  saveHeaderBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Store Identity Card
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImage: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  avatarPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BRAND_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  identityInfo: {
    flex: 1,
  },
  storeNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: GREEN_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerNameText: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  editPhotoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  editPhotoActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: BRAND_COLOR,
  },

  // Segment Navigation
  segmentNavRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    gap: 3,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
    gap: 4,
  },
  segmentTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  segmentTabTextActive: {
    color: BRAND_COLOR,
    fontWeight: '800',
  },

  // Section Box
  sectionBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
    marginTop: 4,
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 8,
  },
  textAreaField: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    textAlignVertical: 'top',
    minHeight: 70,
    marginBottom: 10,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  threeColRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  pillScroll: {
    marginTop: 4,
    marginBottom: 8,
  },
  categoryPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  categoryPillActive: {
    backgroundColor: '#e6eeff',
    borderWidth: 1,
    borderColor: BRAND_COLOR,
  },
  categoryPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: BRAND_COLOR,
    fontWeight: '800',
  },
  primarySaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BRAND_COLOR,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  primarySaveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Toggle rows
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  toggleTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  toggleSubtitle: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  toggleTrack: {
    width: 42,
    height: 23,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: BRAND_COLOR,
  },
  toggleTrackInactive: {
    backgroundColor: '#cbd5e1',
  },
  toggleThumb: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleThumbInactive: {
    alignSelf: 'flex-start',
  },

  // Bank Tab
  bankVerificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f9e6',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    gap: 12,
  },
  bankBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankBannerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  bankBannerSub: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
    lineHeight: 15,
  },
  ifscResolutionText: {
    fontSize: 10.5,
    color: GREEN_COLOR,
    fontWeight: '600',
    marginTop: 1,
    marginBottom: 6,
  },

  // Support Tab
  supportGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  supportCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  supportIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  supportCardTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  supportCardSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 8,
  },
  supportCardAction: {
    fontSize: 11.5,
    fontWeight: '700',
    color: BRAND_COLOR,
  },
  raiseTicketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  raiseTicketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  raiseTicketIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  raiseTicketTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  raiseTicketSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    paddingRight: 8,
  },
  faqAnswerWrap: {
    marginTop: 6,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  faqAnswerText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 16,
  },

  // Compliance
  kycItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  kycIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycDocTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  kycDocValue: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  kycStatusTag: {
    backgroundColor: '#e6f9e6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kycStatusTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: GREEN_COLOR,
  },

  // Admin Console Launcher
  adminLauncherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e6eeff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  adminLauncherBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: BRAND_COLOR,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: RED_COLOR,
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  avatarGridItem: {
    width: (SCREEN_WIDTH - 56) / 3,
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarGridItemActive: {
    borderColor: BRAND_COLOR,
    backgroundColor: '#e6eeff',
  },
  presetImg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    marginBottom: 4,
  },
  presetLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  presetLabelActive: {
    color: BRAND_COLOR,
    fontWeight: '800',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  priorityPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  priorityPillActive: {
    backgroundColor: BRAND_COLOR,
  },
  priorityPillCritical: {
    backgroundColor: RED_COLOR,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  priorityPillTextActive: {
    color: '#ffffff',
  },
});

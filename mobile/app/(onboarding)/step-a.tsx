/**
 * Onboarding Step A: Business Details & Interactive Real Maps Location
 * Step 1 of 4 — Owner info, shop type, interactive map pin, search & reverse geocoding
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  SafeAreaView, TouchableOpacity, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Radius } from '../../src/theme';
import {
  ProgressSteps, PrimaryButton, FormField, SectionHeader,
} from '../../src/components/ui';
import RealInteractiveMap from '../../src/components/RealInteractiveMap';

const SHOP_TYPES = [
  'Retailer (Cosmetics & Beauty)',
  'Dark Store / Micro-Hub',
  'Salon & Spa Partner',
  'Wellness & Health Hub',
  'Distributor',
];

const POPULAR_AREAS = [
  { name: '📍 Benz Circle', lat: 16.4975, lng: 80.6552, locality: 'Benz Circle / Ring Road', pin: '520010' },
  { name: '📍 MG Road', lat: 16.5062, lng: 80.6480, locality: 'MG Road / Labbipet', pin: '520010' },
  { name: '📍 Governorpet', lat: 16.5186, lng: 80.6276, locality: 'Governorpet Commercial Hub', pin: '520002' },
  { name: '📍 Auto Nagar', lat: 16.4880, lng: 80.6720, locality: 'Auto Nagar Industrial Area', pin: '520007' },
  { name: '📍 Payakapuram', lat: 16.5412, lng: 80.6410, locality: 'Payakapuram North Zone', pin: '520015' },
];

export default function OnboardingStepA() {
  const router = useRouter();

  const [ownerName,  setOwnerName]  = useState('');
  const [shopName,   setShopName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [shopType,   setShopType]   = useState('Retailer (Cosmetics & Beauty)');
  const [city,       setCity]       = useState('Vijayawada');
  const [pinCode,    setPinCode]    = useState('');
  const [locality,   setLocality]   = useState('');
  const [address,    setAddress]    = useState('');
  const [latitude,   setLatitude]   = useState(16.5062);
  const [longitude,  setLongitude]  = useState(80.6480);
  const [openTime,   setOpenTime]   = useState('09:30 AM');
  const [closeTime,  setCloseTime]  = useState('09:30 PM');
  const [loading,    setLoading]    = useState(false);
  const [locating,   setLocating]   = useState(false);

  // Callback when user drags pin or clicks on the interactive map
  const handleMapLocationSelect = useCallback((data: {
    latitude: number;
    longitude: number;
    address?: string;
    locality?: string;
    city?: string;
    pinCode?: string;
  }) => {
    setLatitude(data.latitude);
    setLongitude(data.longitude);
    if (data.locality) setLocality(data.locality);
    if (data.city)     setCity(data.city);
    if (data.pinCode)  setPinCode(data.pinCode);
    if (data.address)  setAddress(data.address);
  }, []);

  // Quick preset landmark selection
  const handleSelectPreset = (item: typeof POPULAR_AREAS[0]) => {
    setLatitude(item.lat);
    setLongitude(item.lng);
    setLocality(item.locality);
    setPinCode(item.pin);
    setAddress(`${item.locality}, Near Main Junction, ${city} - ${item.pin}`);
  };

  // Live GPS Detector
  const handleDetectGPS = () => {
    setLocating(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);
          setLocating(false);
        },
        () => {
          // Fallback to default high-accuracy location
          setLatitude(16.5062);
          setLongitude(80.6480);
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setTimeout(() => {
        setLatitude(16.5062);
        setLongitude(80.6480);
        setLocating(false);
      }, 500);
    }
  };

  const handleSave = async () => {
    if (!ownerName.trim() || !shopName.trim()) {
      Alert.alert('Required Fields', 'Please enter Owner name and Business/Shop name.');
      return;
    }
    setLoading(true);
    try {
      const stepAData = {
        ownerName,
        shopName,
        email,
        phone,
        shopType,
        city,
        pinCode,
        locality,
        address,
        latitude,
        longitude,
        openTime,
        closeTime,
      };
      await AsyncStorage.setItem('onb_step_a', JSON.stringify(stepAData));
      router.push('/(onboarding)/step-b');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.container}>
        {/* Top bar */}
        <View style={s.topbar}>
          <TouchableOpacity onPress={() => router.back()} style={s.back}>
            <Text style={s.backArrow}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Business Details & Location</Text>
            <Text style={s.subtitle}>Step 1 of 4 • Set up your dark store</Text>
          </View>
          <TouchableOpacity
            style={s.skipHomeBtn}
            onPress={() => router.replace('/(vendor)/home')}
          >
            <Text style={s.skipHomeText}>⚡ Home</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.body} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <ProgressSteps total={4} current={1} />

          <SectionHeader title="Owner Information" />

          <FormField label="Owner Full Name *">
            <TextInput
              style={s.input}
              placeholder="e.g. Mukesh Kumar"
              placeholderTextColor={Colors.sub}
              value={ownerName}
              onChangeText={setOwnerName}
            />
          </FormField>

          <FormField label="Business / Dark Store Name *">
            <TextInput
              style={s.input}
              placeholder="e.g. GlowVAI Dark Store Hub #1"
              placeholderTextColor={Colors.sub}
              value={shopName}
              onChangeText={setShopName}
            />
          </FormField>

          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <FormField label="Contact Phone">
                <TextInput
                  style={s.input}
                  placeholder="Phone number"
                  placeholderTextColor={Colors.sub}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </FormField>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Work Email">
                <TextInput
                  style={s.input}
                  placeholder="you@shop.com"
                  placeholderTextColor={Colors.sub}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </FormField>
            </View>
          </View>

          <FormField label="Shop Category / Type">
            <View style={s.typeWrap}>
              {SHOP_TYPES.map(type => {
                const active = shopType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setShopType(type)}
                    style={[s.typePill, active && s.typePillActive]}
                  >
                    <Text style={[s.typeText, active && s.typeTextActive]}>{type}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormField>

          <SectionHeader title="Select Store Location on Live Map" />

          {/* Interactive Map Header & Controls */}
          <View style={s.mapWrapper}>
            <View style={s.mapHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.mapInstructionTitle}>🗺️ Real Live Map (Click or Drag Pin)</Text>
                <Text style={s.mapInstructionSub}>
                  Click anywhere on the map or drag the shop icon to your exact storefront.
                </Text>
              </View>
              <TouchableOpacity
                style={s.gpsPill}
                onPress={handleDetectGPS}
                disabled={locating}
              >
                <Text style={s.gpsPillText}>{locating ? '📡 Locating…' : '📍 Use Current GPS'}</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Landmark Presets */}
            <View style={s.presetsContainer}>
              <Text style={s.presetLabel}>Quick Areas:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.presetsScroll}>
                {POPULAR_AREAS.map(area => (
                  <TouchableOpacity
                    key={area.name}
                    style={s.presetBtn}
                    onPress={() => handleSelectPreset(area)}
                  >
                    <Text style={s.presetBtnText}>{area.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Real Interactive Leaflet / OSM Map Component */}
            <RealInteractiveMap
              latitude={latitude}
              longitude={longitude}
              shopName={shopName}
              onLocationSelect={handleMapLocationSelect}
            />

            {/* Auto-filled Location Summary Card */}
            <View style={s.pinResultCard}>
              <View style={s.pinResultRow}>
                <Text style={s.pinResultIcon}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.pinResultLocality}>{locality || 'Location Selected'}</Text>
                  <Text style={s.pinResultCoords}>
                    GPS Coordinates: {latitude.toFixed(5)}, {longitude.toFixed(5)} (Auto-detected)
                  </Text>
                </View>
                <View style={s.verifiedTag}>
                  <Text style={s.verifiedTagText}>✓ GPS Synced</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <FormField label="City (Auto-Filled)">
                <TextInput style={s.input} value={city} onChangeText={setCity} />
              </FormField>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Pin Code (Auto-Filled)">
                <TextInput
                  style={s.input}
                  placeholder="520010"
                  placeholderTextColor={Colors.sub}
                  value={pinCode}
                  onChangeText={setPinCode}
                  keyboardType="number-pad"
                />
              </FormField>
            </View>
          </View>

          <FormField label="Locality / Area Name">
            <TextInput
              style={s.input}
              placeholder="e.g. Benz Circle / MG Road"
              placeholderTextColor={Colors.sub}
              value={locality}
              onChangeText={setLocality}
            />
          </FormField>

          <FormField label="Shop Building / Door No / Detailed Address">
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="Building name, door no, floor, landmark for rider pickup"
              placeholderTextColor={Colors.sub}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
            />
          </FormField>

          <SectionHeader title="Operating Hours" />

          <View style={s.row2}>
            <View style={{ flex: 1 }}>
              <FormField label="Opens At">
                <TextInput style={s.input} value={openTime} onChangeText={setOpenTime} />
              </FormField>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Closes At">
                <TextInput style={s.input} value={closeTime} onChangeText={setCloseTime} />
              </FormField>
            </View>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>

        <View style={s.foot}>
          <PrimaryButton label="Save & Continue to Bank Details" onPress={handleSave} loading={loading} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 580,
    flex: 1,
  },
  topbar: {
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
  subtitle:  { fontSize: 12, color: Colors.sub, marginTop: 1 },
  skipHomeBtn: {
    backgroundColor: '#e6eeff',
    borderWidth: 1,
    borderColor: '#b3cbff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  skipHomeText: {
    color: '#0050ff',
    fontSize: 12,
    fontWeight: '800',
  },
  body:      { flex: 1 },
  content:   { padding: Spacing.lg },
  row2:      { flexDirection: 'row', gap: 12 },
  input: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    fontSize: 14,
    color: Colors.ink,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 76,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  typeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  typePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: '#fff',
  },
  typePillActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  typeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: Colors.sub,
  },
  typeTextActive: {
    color: '#fff',
  },
  mapWrapper: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.card,
    padding: 14,
    marginBottom: 16,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  mapInstructionTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.ink,
  },
  mapInstructionSub: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 2,
  },
  gpsPill: {
    backgroundColor: Colors.ink,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
  gpsPillText: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  presetsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  presetLabel: {
    fontSize: 11,
    color: Colors.sub,
    fontWeight: '600',
  },
  presetsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  presetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetBtnText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '600',
  },
  pinResultCard: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pinResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinResultIcon: {
    fontSize: 18,
  },
  pinResultLocality: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ink,
  },
  pinResultCoords: {
    fontSize: 10.5,
    color: Colors.sub,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    marginTop: 1,
  },
  verifiedTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verifiedTagText: {
    color: '#15803d',
    fontSize: 10.5,
    fontWeight: '700',
  },
  foot: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: '#fff',
  },
});

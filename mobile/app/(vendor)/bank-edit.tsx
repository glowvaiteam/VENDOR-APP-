/**
 * Bank Details Edit Screen
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Radius } from '../../src/theme';
import { PrimaryButton, FormField } from '../../src/components/ui';

export default function BankEditScreen() {
  const router = useRouter();

  const [holderName, setHolderName] = useState('Lakshmi Devi');
  const [bankName,   setBankName]   = useState('HDFC Bank');
  const [accNumber,  setAccNumber]  = useState('');
  const [ifsc,       setIfsc]       = useState('HDFC0001234');
  const [upiId,      setUpiId]      = useState('');
  const [loading,    setLoading]    = useState(false);

  const handleSave = async () => {
    if (!holderName || !bankName || !ifsc) {
      Alert.alert('Required', 'Please fill all mandatory fields.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API call
    setLoading(false);
    Alert.alert('Saved ✅', 'Bank details updated. Verification may take 1-2 business days.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Bank details</Text>
      </View>

      <ScrollView style={s.body} showsVerticalScrollIndicator={false}>
        <View style={s.note}>
          <Text style={s.noteText}>
            ℹ️ Changes to bank details will require re-verification. Payouts continue to the existing account during this period.
          </Text>
        </View>

        <FormField label="Account holder name">
          <TextInput style={s.input} value={holderName} onChangeText={setHolderName} />
        </FormField>

        <FormField label="Bank name">
          <TextInput style={s.input} value={bankName} onChangeText={setBankName} />
        </FormField>

        <FormField label="Account number">
          <TextInput
            style={s.input}
            placeholder="Enter new account number"
            value={accNumber}
            onChangeText={setAccNumber}
            keyboardType="number-pad"
            secureTextEntry
          />
          <Text style={s.hint}>Current: •••• •••• 4821</Text>
        </FormField>

        <View style={s.row2}>
          <FormField label="IFSC code" style={{ flex: 1 }}>
            <TextInput style={s.input} value={ifsc} onChangeText={setIfsc} autoCapitalize="characters" />
          </FormField>
          <FormField label="UPI ID (optional)" style={{ flex: 1 }}>
            <TextInput style={s.input} placeholder="name@bank" value={upiId} onChangeText={setUpiId} autoCapitalize="none" />
          </FormField>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={s.foot}>
        <PrimaryButton label={loading ? 'Saving…' : 'Save & verify'} onPress={handleSave} loading={loading} />
      </View>
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
  note: {
    backgroundColor: '#eff6ff', borderRadius: Radius.lg,
    padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  noteText: { fontSize: 12.5, color: '#1e40af', lineHeight: 18 },
  input: {
    width: '100%', padding: 12, borderWidth: 1,
    borderColor: Colors.line, borderRadius: Radius.md,
    fontSize: 14, color: Colors.ink, backgroundColor: '#fcfcfc',
  },
  hint:  { fontSize: 11, color: Colors.sub, marginTop: 5 },
  row2:  { flexDirection: 'row', gap: 10 },
  foot:  { padding: Spacing.lg, paddingBottom: 32, borderTopWidth: 1, borderTopColor: Colors.line },
});

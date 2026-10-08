import { Stack } from 'expo-router';

export default function VendorLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="order-detail" />
      <Stack.Screen name="pack-order" />
      <Stack.Screen name="ready-pickup" />
      <Stack.Screen name="catalog" />
      <Stack.Screen name="add-sku" />
      <Stack.Screen name="recommended-skus" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="payout-detail" />
      <Stack.Screen name="bank-edit" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}

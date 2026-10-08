/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(auth)/otp` | `/(onboarding)` | `/(onboarding)/approved` | `/(onboarding)/pending` | `/(onboarding)/step-a` | `/(onboarding)/step-b` | `/(onboarding)/step-c` | `/(onboarding)/step-d` | `/(vendor)` | `/(vendor)/add-sku` | `/(vendor)/bank-edit` | `/(vendor)/catalog` | `/(vendor)/earnings` | `/(vendor)/home` | `/(vendor)/notifications` | `/(vendor)/order-detail` | `/(vendor)/orders` | `/(vendor)/pack-order` | `/(vendor)/payout-detail` | `/(vendor)/profile` | `/(vendor)/ready-pickup` | `/(vendor)/recommended-skus` | `/_sitemap` | `/add-sku` | `/admin` | `/approved` | `/bank-edit` | `/catalog` | `/earnings` | `/home` | `/login` | `/notifications` | `/order-detail` | `/orders` | `/otp` | `/pack-order` | `/payout-detail` | `/pending` | `/profile` | `/ready-pickup` | `/recommended-skus` | `/step-a` | `/step-b` | `/step-c` | `/step-d`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}

// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/manifest.json
// Generator: tools/generate_router.ts

import 'package:go_router/go_router.dart';
import '../screens/splash_screen.dart';
import '../screens/phone_input_screen.dart';
import '../screens/home_screen.dart';
import '../screens/payment_screen.dart';
import '../screens/add_balance_screen.dart';
import '../screens/add_vehicle_screen.dart';
import '../screens/brand_search_screen.dart';
import '../screens/country_select_screen.dart';
import '../screens/edit_ad_screen.dart';
import '../screens/final_report_screen.dart';
import '../screens/inspected_vehicles_screen.dart';
import '../screens/inspection_screen.dart';
import '../screens/inspection_saved_screen.dart';
import '../screens/language_sheet_screen.dart';
import '../screens/my_ads_screen.dart';
import '../screens/my_fahs_screen.dart';
import '../screens/my_orders_screen.dart';
import '../screens/my_vehicles_screen.dart';
import '../screens/order_details_screen.dart';
import '../screens/otp_verification_screen.dart';
import '../screens/ownership_payment_screen.dart';
import '../screens/ownership_transfer_screen.dart';
import '../screens/personal_data_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/select_dealer_screen.dart';
import '../screens/service_centers_screen.dart';
import '../screens/support_screen.dart';
import '../screens/track_inspection_screen.dart';
import '../screens/vehicle_detail_screen.dart';
import '../screens/vehicle_photos_screen.dart';
import '../screens/wallet_screen.dart';
import '../screens/withdraw_balance_screen.dart';

class GeneratedScreenEntry {
  const GeneratedScreenEntry({
    required this.screenId,
    required this.title,
    required this.route,
  });

  final String screenId;
  final String title;
  final String route;
}

final generatedInitialLocation = '/splash';

const generatedScreenEntries = <GeneratedScreenEntry>[
  GeneratedScreenEntry(screenId: 'splash', title: 'Splash', route: '/splash'),
  GeneratedScreenEntry(screenId: 'phone_input', title: 'Phone Input', route: '/auth/phone'),
  GeneratedScreenEntry(screenId: 'home', title: 'Home', route: '/home'),
  GeneratedScreenEntry(screenId: 'payment', title: 'Payment', route: '/payment'),
  GeneratedScreenEntry(screenId: 'add_balance', title: 'Add Balance', route: '/add-balance'),
  GeneratedScreenEntry(screenId: 'add_vehicle', title: 'Add Vehicle', route: '/add-vehicle'),
  GeneratedScreenEntry(screenId: 'brand_search', title: 'Brand Search', route: '/brand-search'),
  GeneratedScreenEntry(screenId: 'country_select', title: 'Country Select', route: '/country-select'),
  GeneratedScreenEntry(screenId: 'edit_ad', title: 'Edit Ad', route: '/edit-ad'),
  GeneratedScreenEntry(screenId: 'final_report', title: 'Final Report', route: '/final-report'),
  GeneratedScreenEntry(screenId: 'inspected_vehicles', title: 'Inspected Vehicles', route: '/inspected-vehicles'),
  GeneratedScreenEntry(screenId: 'inspection', title: 'Inspection', route: '/inspection'),
  GeneratedScreenEntry(screenId: 'inspection_saved', title: 'Inspection Saved', route: '/inspection-saved'),
  GeneratedScreenEntry(screenId: 'language_sheet', title: 'Language Sheet', route: '/language-sheet'),
  GeneratedScreenEntry(screenId: 'my_ads', title: 'My Ads', route: '/my-ads'),
  GeneratedScreenEntry(screenId: 'my_fahs', title: 'My Fahs', route: '/my-fahs'),
  GeneratedScreenEntry(screenId: 'my_orders', title: 'My Orders', route: '/my-orders'),
  GeneratedScreenEntry(screenId: 'my_vehicles', title: 'My Vehicles', route: '/my-vehicles'),
  GeneratedScreenEntry(screenId: 'order_details', title: 'Order Details', route: '/order-details'),
  GeneratedScreenEntry(screenId: 'otp_verification', title: 'Otp Verification', route: '/otp-verification'),
  GeneratedScreenEntry(screenId: 'ownership_payment', title: 'Ownership Payment', route: '/ownership-payment'),
  GeneratedScreenEntry(screenId: 'ownership_transfer', title: 'Ownership Transfer', route: '/ownership-transfer'),
  GeneratedScreenEntry(screenId: 'personal_data', title: 'Personal Data', route: '/personal-data'),
  GeneratedScreenEntry(screenId: 'profile', title: 'Profile', route: '/profile'),
  GeneratedScreenEntry(screenId: 'select_dealer', title: 'Select Dealer', route: '/select-dealer'),
  GeneratedScreenEntry(screenId: 'service_centers', title: 'Service Centers', route: '/service-centers'),
  GeneratedScreenEntry(screenId: 'support', title: 'Support', route: '/support'),
  GeneratedScreenEntry(screenId: 'track_inspection', title: 'Track Inspection', route: '/track-inspection'),
  GeneratedScreenEntry(screenId: 'vehicle_detail', title: 'Vehicle Detail', route: '/vehicle-detail'),
  GeneratedScreenEntry(screenId: 'vehicle_photos', title: 'Vehicle Photos', route: '/vehicle-photos'),
  GeneratedScreenEntry(screenId: 'wallet', title: 'Wallet', route: '/wallet'),
  GeneratedScreenEntry(screenId: 'withdraw_balance', title: 'Withdraw Balance', route: '/withdraw-balance'),
];

final generatedRoutes = <RouteBase>[
    GoRoute(
      path: '/splash',
      name: 'splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/auth/phone',
      name: 'phone_input',
      builder: (context, state) => const PhoneInputScreen(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/payment',
      name: 'payment',
      builder: (context, state) => const PaymentScreen(),
    ),
    GoRoute(
      path: '/add-balance',
      name: 'add_balance',
      builder: (context, state) => const AddBalanceScreen(),
    ),
    GoRoute(
      path: '/add-vehicle',
      name: 'add_vehicle',
      builder: (context, state) => const AddVehicleScreen(),
    ),
    GoRoute(
      path: '/brand-search',
      name: 'brand_search',
      builder: (context, state) => const BrandSearchScreen(),
    ),
    GoRoute(
      path: '/country-select',
      name: 'country_select',
      builder: (context, state) => const CountrySelectScreen(),
    ),
    GoRoute(
      path: '/edit-ad',
      name: 'edit_ad',
      builder: (context, state) => const EditAdScreen(),
    ),
    GoRoute(
      path: '/final-report',
      name: 'final_report',
      builder: (context, state) => const FinalReportScreen(),
    ),
    GoRoute(
      path: '/inspected-vehicles',
      name: 'inspected_vehicles',
      builder: (context, state) => const InspectedVehiclesScreen(),
    ),
    GoRoute(
      path: '/inspection',
      name: 'inspection',
      builder: (context, state) => const InspectionScreen(),
    ),
    GoRoute(
      path: '/inspection-saved',
      name: 'inspection_saved',
      builder: (context, state) => const InspectionSavedScreen(),
    ),
    GoRoute(
      path: '/language-sheet',
      name: 'language_sheet',
      builder: (context, state) => const LanguageSheetScreen(),
    ),
    GoRoute(
      path: '/my-ads',
      name: 'my_ads',
      builder: (context, state) => const MyAdsScreen(),
    ),
    GoRoute(
      path: '/my-fahs',
      name: 'my_fahs',
      builder: (context, state) => const MyFahsScreen(),
    ),
    GoRoute(
      path: '/my-orders',
      name: 'my_orders',
      builder: (context, state) => const MyOrdersScreen(),
    ),
    GoRoute(
      path: '/my-vehicles',
      name: 'my_vehicles',
      builder: (context, state) => const MyVehiclesScreen(),
    ),
    GoRoute(
      path: '/order-details',
      name: 'order_details',
      builder: (context, state) => const OrderDetailsScreen(),
    ),
    GoRoute(
      path: '/otp-verification',
      name: 'otp_verification',
      builder: (context, state) => const OtpVerificationScreen(),
    ),
    GoRoute(
      path: '/ownership-payment',
      name: 'ownership_payment',
      builder: (context, state) => const OwnershipPaymentScreen(),
    ),
    GoRoute(
      path: '/ownership-transfer',
      name: 'ownership_transfer',
      builder: (context, state) => const OwnershipTransferScreen(),
    ),
    GoRoute(
      path: '/personal-data',
      name: 'personal_data',
      builder: (context, state) => const PersonalDataScreen(),
    ),
    GoRoute(
      path: '/profile',
      name: 'profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/select-dealer',
      name: 'select_dealer',
      builder: (context, state) => const SelectDealerScreen(),
    ),
    GoRoute(
      path: '/service-centers',
      name: 'service_centers',
      builder: (context, state) => const ServiceCentersScreen(),
    ),
    GoRoute(
      path: '/support',
      name: 'support',
      builder: (context, state) => const SupportScreen(),
    ),
    GoRoute(
      path: '/track-inspection',
      name: 'track_inspection',
      builder: (context, state) => const TrackInspectionScreen(),
    ),
    GoRoute(
      path: '/vehicle-detail',
      name: 'vehicle_detail',
      builder: (context, state) => const VehicleDetailScreen(),
    ),
    GoRoute(
      path: '/vehicle-photos',
      name: 'vehicle_photos',
      builder: (context, state) => const VehiclePhotosScreen(),
    ),
    GoRoute(
      path: '/wallet',
      name: 'wallet',
      builder: (context, state) => const WalletScreen(),
    ),
    GoRoute(
      path: '/withdraw-balance',
      name: 'withdraw_balance',
      builder: (context, state) => const WithdrawBalanceScreen(),
    ),
];

final generatedAppRouter = GoRouter(
  initialLocation: generatedInitialLocation,
  routes: generatedRoutes,
);

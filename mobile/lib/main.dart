import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'core/api/graphql_client.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
    await Firebase.initializeApp();
    await FirebaseAnalytics.instance.setAnalyticsCollectionEnabled(true);
    await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);
    FirebaseMessaging.onBackgroundMessage(
      _firebaseMessagingBackgroundHandler,
    );
    FirebaseMessaging.onMessage.listen((message) {
      final notification = message.notification;
      if (notification == null) return;
      scaffoldMessengerKey.currentState?.showSnackBar(
        SnackBar(
          content: Text(
            [notification.title, notification.body]
                .whereType<String>()
                .where((value) => value.isNotEmpty)
                .join('\n'),
          ),
        ),
      );
    });
    FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };
  }
  await initHiveForFlutter();
  runApp(const ProviderScope(child: SECompassApp()));
}

class SECompassApp extends ConsumerWidget {
  const SECompassApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final graphqlClient = buildGraphQLClient();

    return GraphQLProvider(
      client: graphqlClient,
      child: MaterialApp.router(
        scaffoldMessengerKey: scaffoldMessengerKey,
        title: 'SECompass',
        theme: buildAppTheme(),
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

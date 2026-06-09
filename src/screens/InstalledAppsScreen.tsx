import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  NativeModules,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDERS } from '../utils/theme';

const { InstalledApps } = NativeModules as { InstalledApps?: { getInstalledApps: () => Promise<any>; openApp: (pkg: string) => Promise<any>; } };

export const InstalledAppsScreen = () => {
  const [apps, setApps] = useState<Array<{ packageName: string; label: string; isSystem: boolean; launchable: boolean; icon?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'android' || !InstalledApps) {
      setApps([]);
      setLoading(false);
      return;
    }

    InstalledApps.getInstalledApps()
      .then((result: any) => {
        const sorted = Array.isArray(result)
          ? result.sort((a, b) => a.label.localeCompare(b.label))
          : [];
        setApps(sorted);
      })
      .catch(() => {
        setApps([]);
        Alert.alert('Apps unavailable', 'Unable to load installed applications.');
      })
      .finally(() => setLoading(false));
  }, []);

  const launchApp = (packageName: string, label: string) => {
    if (!InstalledApps) {
      Alert.alert('Not available', 'Installed apps are only available on Android.');
      return;
    }

    InstalledApps.openApp(packageName).catch(() => {
      Alert.alert('Unable to open app', `Could not launch ${label}.`);
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Installed Apps</Text>
        <Text style={styles.subtext}>Swipe back or use the dock to return home.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.inkMid} style={styles.loader} />
      ) : apps.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No apps found.</Text>
          <Text style={styles.emptySubtext}>This feature is available only on Android devices.</Text>
        </View>
      ) : (
        <FlatList
          data={apps}
          keyExtractor={item => item.packageName}
          contentContainerStyle={styles.list}
          numColumns={4}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => {
            const isLaunchable = item.launchable !== false;
            const displayLabel = item.label?.trim() ? item.label : item.packageName;
            const iconSource = item.icon ? { uri: `data:image/png;base64,${item.icon}` } : undefined;
            return (
              <TouchableOpacity
                style={[styles.gridItem, !isLaunchable && styles.disabledItem]}
                onPress={() => isLaunchable && launchApp(item.packageName, item.label)}
                disabled={!isLaunchable}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  {iconSource ? (
                    <Image source={iconSource} style={styles.iconImage} resizeMode="contain" />
                  ) : (
                    <Text style={styles.iconLetter}>{displayLabel.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <Text style={styles.gridLabel} numberOfLines={2}>{displayLabel}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.paperWhite,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.xlarge,
    color: COLORS.inkBlack,
    marginBottom: SPACING.xs,
  },
  subtext: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostMid,
    letterSpacing: 0.4,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginBottom: SPACING.lg,
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: COLORS.ghostLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLetter: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: 28,
    color: COLORS.inkDark,
  },
  iconImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  gridLabel: {
    marginTop: SPACING.sm,
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.inkDark,
    textAlign: 'center',
  },
  disabledItem: {
    opacity: 0.5,
  },
  loader: {
    marginTop: SPACING.xxxl,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: BORDERS.hairline,
    borderBottomColor: COLORS.borderLight,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accentSoft,
    marginRight: SPACING.md,
  },
  appInfo: {
    flex: 1,
  },
  appLabel: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.body,
    color: COLORS.inkDark,
  },
  appPackage: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.micro,
    color: COLORS.ghostMid,
    marginTop: SPACING.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.serif,
    fontSize: TYPOGRAPHY.sizes.large,
    color: COLORS.inkMid,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontFamily: TYPOGRAPHY.sansSerif,
    fontSize: TYPOGRAPHY.sizes.small,
    color: COLORS.ghostMid,
    textAlign: 'center',
    lineHeight: 20,
  },
});
import { MaterialIcons } from '@expo/vector-icons';
import { Slot, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * macOS variant of the (tabs) layout — Metro resolves this file instead
 * of _layout.tsx for platform === 'macos'; iOS/Android/web are
 * untouched.
 *
 * NativeTabs (Liquid Glass) is iOS-only and has no macOS renderer, so
 * the desktop window gets a plain left SIDEBAR instead: the same four
 * tabs, same labels/icons (the Material icon names the phone layout
 * already uses), rendered as a vertical nav next to the matched screen
 * (<Slot />). Plainer than the phone UI by design — a functional
 * desktop window over the same screens and the same on-device data.
 */

interface TabDef {
  href: string;
  match: (pathname: string) => boolean;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const TABS: TabDef[] = [
  {
    href: '/(tabs)',
    match: (p) => p === '/' || p === '/index',
    label: 'Fly',
    icon: 'flight',
  },
  {
    href: '/(tabs)/aircraft',
    match: (p) => p.startsWith('/aircraft'),
    label: 'Aircraft',
    icon: 'flight-takeoff',
  },
  {
    href: '/(tabs)/airports',
    match: (p) => p.startsWith('/airports'),
    label: 'Airports',
    icon: 'map',
  },
  {
    href: '/(tabs)/pro',
    match: (p) => p.startsWith('/pro'),
    label: 'Pro',
    icon: 'workspace-premium',
  },
];

export default function TabsLayoutMacOS() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.root}>
      <View style={styles.sidebar}>
        <Text style={styles.brand}>HorizonFS</Text>
        {TABS.map((tab) => {
          const focused = tab.match(pathname);
          return (
            <Pressable
              key={tab.href}
              onPress={() => router.navigate(tab.href as never)}
              style={[styles.item, focused && styles.itemActive]}
            >
              <MaterialIcons
                name={tab.icon}
                size={19}
                color={focused ? '#FFFFFF' : '#666666'}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.content}>
        <Slot />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#050914' },
  sidebar: {
    width: 216,
    backgroundColor: '#0C1B33',
    borderRightColor: '#1E293B',
    borderRightWidth: 1,
    paddingTop: 28,
    paddingHorizontal: 12,
    gap: 4,
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingBottom: 18,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 9,
  },
  itemActive: { backgroundColor: '#0284C7' },
  label: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  labelActive: { color: '#FFFFFF', fontWeight: '700' },
  content: { flex: 1, backgroundColor: '#050914' },
});

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

/**
 * Bottom navigation is the OS's OWN tab bar (UITabBar on iOS, the
 * Material navigation bar on Android) instead of a hand-drawn pill.
 * On iOS 26 the system draws it as the floating Liquid Glass capsule —
 * the genuine article, rendered by Apple, not an imitation.
 * (Copied 1:1 from the proven Snugbug/Rewards setup, same
 * expo-router/react-native-screens versions; tab names adapted.)
 *
 * tvOS (Nov 27, 2026, replicating the Flight Journal pilot): NativeTabs
 * (Liquid Glass UITabBar) is not the tvOS navigation model — Apple TV
 * needs a focus-driven bar the Siri Remote can move through. The JS
 * Tabs bar below is built from Pressables, which the react-native-tvos
 * fork makes focusable with native focus events, so the same four tabs
 * render and are reachable by remote. iOS/Android never take this
 * branch (Platform.isTV is false there); macOS uses
 * _layout.macos.tsx and is untouched.
 */

const TAB_ACTIVE = '#ffffff';
const TAB_INACTIVE = '#666666';
const BAR_BG = '#050914';

interface TabDef {
  name: string;
  label: string;
  title: string;
  ion: { focused: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap };
}

const TABS: TabDef[] = [
  { name: 'index', label: 'Fly', title: 'Fly', ion: { focused: 'paper-plane', outline: 'paper-plane-outline' } },
  { name: 'aircraft', label: 'Aircraft', title: 'Aircraft', ion: { focused: 'airplane', outline: 'airplane-outline' } },
  { name: 'airports', label: 'Airports', title: 'Airports', ion: { focused: 'map', outline: 'map-outline' } },
  { name: 'pro', label: 'Pro', title: 'Pro', ion: { focused: 'ribbon', outline: 'ribbon-outline' } },
];

function NativeTabsLayout() {
  return (
    <NativeTabs
      tintColor="#ffffff"
      iconColor={{ default: '#666666', selected: '#ffffff' }}
      labelStyle={{
        default: { color: '#666666', fontWeight: '500' },
        selected: { color: '#ffffff', fontWeight: '700' },
      }}
    >
      <NativeTabs.Trigger
        name="index"
        contentStyle={{ backgroundColor: '#050914' }}
        disableTransparentOnScrollEdge
      >
        <NativeTabs.Trigger.Label>Fly</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'paperplane', selected: 'paperplane.fill' }}
          md="flight"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="aircraft"
        contentStyle={{ backgroundColor: '#050914' }}
        disableTransparentOnScrollEdge
      >
        <NativeTabs.Trigger.Label>Aircraft</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'airplane', selected: 'airplane' }}
          md="flight_takeoff"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="airports"
        contentStyle={{ backgroundColor: '#050914' }}
        disableTransparentOnScrollEdge
      >
        <NativeTabs.Trigger.Label>Airports</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'map', selected: 'map.fill' }}
          md="map"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="pro"
        contentStyle={{ backgroundColor: '#050914' }}
        disableTransparentOnScrollEdge
      >
        <NativeTabs.Trigger.Label>Pro</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'crown', selected: 'crown.fill' }}
          md="workspace_premium"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

/* ------------------------------------------------------------------ */
/* JS Tabs bar (tvOS focus-driven fallback)                            */
/* ------------------------------------------------------------------ */

interface JsBarProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (e: { type: string; target: string; canPreventDefault: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
  insets: { top: number; right: number; bottom: number; left: number };
}

function JsTabBar({ state, navigation, insets }: JsBarProps) {
  const barStyle: ViewStyle = {
    paddingBottom: Math.max(insets.bottom, 8),
  };
  return (
    <View style={[styles.jsBar, barStyle]}>
      {state.routes.map((route, i) => {
        const def = TABS.find((t) => t.name === route.name) ?? TABS[0];
        const focused = state.index === i;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return (
          <Pressable key={route.key} onPress={onPress} style={styles.jsTab}>
            <Ionicons
              name={focused ? def.ion.focused : def.ion.outline}
              size={22}
              color={focused ? TAB_ACTIVE : TAB_INACTIVE}
            />
            <Text style={[styles.jsLabel, focused && styles.jsLabelActive]}>{def.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function JsTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <JsTabBar {...(props as unknown as JsBarProps)} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: BAR_BG },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  );
}

export default function TabsLayout() {
  // tvOS: NativeTabs is not the Apple TV navigation model — use the
  // focus-driven JS Tabs bar. iOS/Android never take this branch.
  if ((Platform as unknown as { isTV?: boolean }).isTV) {
    return <JsTabsLayout />;
  }
  return <NativeTabsLayout />;
}

const styles = StyleSheet.create({
  jsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(5, 9, 20, 0.92)',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  jsTab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 2 },
  jsLabel: { color: TAB_INACTIVE, fontSize: 10, fontWeight: '500' },
  jsLabelActive: { color: TAB_ACTIVE, fontWeight: '700' },
});

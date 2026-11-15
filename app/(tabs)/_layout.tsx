import React from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

/**
 * Bottom navigation is the OS's OWN tab bar (UITabBar on iOS, the
 * Material navigation bar on Android) instead of a hand-drawn pill.
 * On iOS 26 the system draws it as the floating Liquid Glass capsule —
 * the genuine article, rendered by Apple, not an imitation.
 * (Copied 1:1 from the proven Snugbug/Rewards setup, same
 * expo-router/react-native-screens versions; tab names adapted.)
 */
export default function TabsLayout() {
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

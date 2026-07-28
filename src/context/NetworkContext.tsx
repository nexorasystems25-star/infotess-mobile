import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Platform, DeviceEventEmitter } from 'react-native';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  netInfo: NetInfoState | null;
}

const NetworkContext = createContext<NetworkState>({
  isConnected: true,
  isInternetReachable: true,
  netInfo: null,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [netInfo, setNetInfo] = useState<NetInfoState | null>(null);
  const prevConnected = useRef<boolean>(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setNetInfo({
        type: 'wifi',
        isConnected: true,
        isInternetReachable: true,
        details: null,
      } as unknown as NetInfoState);
      return;
    }

    NetInfo.fetch().then((state) => {
      setNetInfo(state);
      prevConnected.current = state.isConnected ?? true;
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasConnected = prevConnected.current;
      const isNowConnected = state.isConnected ?? false;
      const isNowReachable = state.isInternetReachable ?? false;

      setNetInfo(state);

      if (!wasConnected && isNowConnected && isNowReachable) {
        DeviceEventEmitter.emit('infotess-online');
      }

      if (wasConnected && !isNowConnected) {
        DeviceEventEmitter.emit('infotess-offline');
      }

      prevConnected.current = isNowConnected;
    });

    return () => unsubscribe();
  }, []);

  const isConnected = netInfo?.isConnected ?? true;
  const isInternetReachable = netInfo?.isInternetReachable ?? true;

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable, netInfo }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkState {
  return useContext(NetworkContext);
}

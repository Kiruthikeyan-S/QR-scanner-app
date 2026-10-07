import { useState, useEffect, useCallback } from 'react';
import * as Network from 'expo-network';

export interface NetworkInfo {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  networkType: string;
  ipAddress: string;
  loading: boolean;
}

export function useNetwork() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isConnected: true,
    isInternetReachable: true,
    networkType: 'UNKNOWN',
    ipAddress: '',
    loading: true,
  });

  const checkNetwork = useCallback(async () => {
    try {
      setNetworkInfo((prev) => ({ ...prev, loading: true }));
      const state = await Network.getNetworkStateAsync();
      let ip = '';
      try {
        ip = await Network.getIpAddressAsync();
      } catch (e) {}

      let typeStr = 'UNKNOWN';
      if (state.type === Network.NetworkStateType.WIFI) typeStr = 'Wi-Fi';
      else if (state.type === Network.NetworkStateType.CELLULAR) typeStr = 'Cellular (Mobile Data)';
      else if (state.type === Network.NetworkStateType.NONE) typeStr = 'None (Offline)';

      setNetworkInfo({
        isConnected: Boolean(state.isConnected),
        isInternetReachable: state.isInternetReachable !== false,
        networkType: typeStr,
        ipAddress: ip || 'Unavailable',
        loading: false,
      });
    } catch (e) {
      setNetworkInfo({
        isConnected: false,
        isInternetReachable: false,
        networkType: 'NONE',
        ipAddress: '',
        loading: false,
      });
    }
  }, []);

  useEffect(() => {
    checkNetwork();
    const interval = setInterval(checkNetwork, 8000);
    return () => clearInterval(interval);
  }, [checkNetwork]);

  return { ...networkInfo, refresh: checkNetwork };
}

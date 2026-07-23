import { RewardedAd as OriginalRewardedAd, RewardedAdEventType, TestIds, AdEventType } from 'react-native-google-mobile-ads';

export const isWeb = false;
export const adUnitId = __DEV__
  ? (TestIds && TestIds.REWARDED ? TestIds.REWARDED : 'ca-app-pub-3940256099942544/5224354917')
  : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID || 'ca-app-pub-3940256099942544/5224354917');

// Provide a custom wrapper so BoostScreen can invoke createForAdUnit exactly as requested,
// mapping it under the hood to the library's native createForAdRequest.
export const RewardedAd = {
  createForAdUnit(adUnitId: string, options?: any) {
    return OriginalRewardedAd.createForAdRequest(adUnitId, options);
  }
};

export { RewardedAdEventType, TestIds, AdEventType };

const { withProjectBuildGradle } = require('@expo/config-plugins');

try {
  require('dotenv').config();
} catch (e) {
  // Fallback if dotenv package is not explicitly installed in node_modules
}

// Config plugin to inject kotlinVersion in root Project ext context
const withAndroidKotlinVersion = (config) => {
  return withProjectBuildGradle(config, (gradleConfig) => {
    let contents = gradleConfig.modResults.contents;
    const kotlinVersionSetting = `ext.kotlinVersion = '2.1.20'\n`;
    if (!contents.includes("ext.kotlinVersion")) {
      contents = kotlinVersionSetting + contents;
    }
    gradleConfig.modResults.contents = contents;
    return gradleConfig;
  });
};

module.exports = ({ config }) => {
  const updatedConfig = {
    ...config,
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMobileAdsAppId: process.env.EXPO_PUBLIC_ADMOB_APP_ID || "ca-app-pub-3940256099942544~3347511713"
      }
    },
    plugins: [
      // Filter out duplicate react-native-google-mobile-ads plugin configuration from app.json
      ...(config.plugins || []).filter(p => 
        Array.isArray(p) ? p[0] !== 'react-native-google-mobile-ads' : p !== 'react-native-google-mobile-ads'
      ),
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: process.env.EXPO_PUBLIC_ADMOB_APP_ID || "ca-app-pub-3940256099942544~3347511713",
          iosAppId: "ca-app-pub-3940256099942544~1458002511"
        }
      ]
    ],
    extra: {
      ...config.extra,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
      buildType: "apk"
    }
  };

  return withAndroidKotlinVersion(updatedConfig);
};

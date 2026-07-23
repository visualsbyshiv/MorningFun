const { withProjectBuildGradle, withSettingsGradle } = require('@expo/config-plugins');

try {
  require('dotenv').config();
} catch (e) {
  // Fallback if dotenv package is not explicitly installed in node_modules
}

// Config plugin to inject resolutionStrategy in settings.gradle
const withAndroidSettingsKotlinVersion = (config) => {
  return withSettingsGradle(config, (settingsConfig) => {
    let contents = settingsConfig.modResults.contents;
    const strategy = `
  resolutionStrategy {
    eachPlugin {
      if (requested.id.id.startsWith("org.jetbrains.kotlin")) {
        useVersion("2.1.20")
      }
    }
  }
`;
    if (!contents.includes("org.jetbrains.kotlin")) {
      contents = contents.replace("pluginManagement {", "pluginManagement {" + strategy);
    }
    settingsConfig.modResults.contents = contents;
    return settingsConfig;
  });
};

// Config plugin to inject kotlinVersion in root Project ext context and buildscript classpath
const withAndroidKotlinVersion = (config) => {
  return withProjectBuildGradle(config, (gradleConfig) => {
    let contents = gradleConfig.modResults.contents;
    const kotlinVersionSetting = `ext.kotlinVersion = '2.1.20'\n`;
    if (!contents.includes("ext.kotlinVersion")) {
      contents = kotlinVersionSetting + contents;
    }
    // Replace the versionless Kotlin Gradle plugin declaration to force version 2.1.20
    contents = contents.replace(
      "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin')",
      "classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:2.1.20')"
    );
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

  return withAndroidSettingsKotlinVersion(withAndroidKotlinVersion(updatedConfig));
};

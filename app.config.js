const { withProjectBuildGradle, withSettingsGradle } = require('@expo/config-plugins');

try {
  require('dotenv').config();
} catch (e) {
  // Fallback if dotenv package is not explicitly installed in node_modules
}

// Config plugin to inject settings buildscript classpath to break classloader version lock
const withAndroidSettingsKotlinVersion = (config) => {
  return withSettingsGradle(config, (settingsConfig) => {
    let contents = settingsConfig.modResults.contents;
    const settingsBuildscript = `
buildscript {
  repositories {
    google()
    mavenCentral()
  }
  dependencies {
    classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:2.1.20'
  }
}
`;
    // Clean up if it was prepended to start of file previously
    if (contents.startsWith("buildscript {")) {
      const closingBraceIndex = contents.indexOf("}\npluginManagement {");
      if (closingBraceIndex !== -1) {
        contents = contents.substring(closingBraceIndex + 2);
      }
    }
    if (!contents.includes("kotlin-gradle-plugin:")) {
      contents = contents.replace("includeBuild(expoPluginsPath)\n}", "includeBuild(expoPluginsPath)\n}\n" + settingsBuildscript);
    }
    settingsConfig.modResults.contents = contents;
    return settingsConfig;
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

  return withAndroidSettingsKotlinVersion(updatedConfig);
};

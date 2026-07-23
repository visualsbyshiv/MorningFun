const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', 'react-native-google-mobile-ads', 'android', 'src', 'main', 'java', 'io', 'invertase', 'googlemobileads', 'ReactNativeGoogleMobileAdsModule.kt');

if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Comment out import com.google.android.gms.ads.AgeRestrictedTreatment
  content = content.replace(
    'import com.google.android.gms.ads.AgeRestrictedTreatment',
    '// import com.google.android.gms.ads.AgeRestrictedTreatment'
  );
  
  // Comment out the ageRestrictedTreatment when block
  const targetBlock = `    if (requestConfiguration.hasKey("ageRestrictedTreatment")) {
      val ageRestrictedTreatment = requestConfiguration.getString("ageRestrictedTreatment")

      when (ageRestrictedTreatment) {
        "CHILD" -> builder.setAgeRestrictedTreatment(AgeRestrictedTreatment.CHILD)
        "TEEN" -> builder.setAgeRestrictedTreatment(AgeRestrictedTreatment.TEEN)
        "UNSPECIFIED" -> builder.setAgeRestrictedTreatment(AgeRestrictedTreatment.UNSPECIFIED)
      }
    }`;
  
  const replacementBlock = `    // AgeRestrictedTreatment commented out for compatibility with older Play Services Ads SDK
    /*
    if (requestConfiguration.hasKey("ageRestrictedTreatment")) {
      val ageRestrictedTreatment = requestConfiguration.getString("ageRestrictedTreatment")

      when (ageRestrictedTreatment) {
        "CHILD" -> builder.setAgeRestrictedTreatment(AgeRestrictedTreatment.CHILD)
        "TEEN" -> builder.setAgeRestrictedTreatment(AgeRestrictedTreatment.TEEN)
        "UNSPECIFIED" -> builder.setAgeRestrictedTreatment(AgeRestrictedTreatment.UNSPECIFIED)
      }
    }
    */`;
    
  if (content.includes(targetBlock)) {
    content = content.replace(targetBlock, replacementBlock);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched ReactNativeGoogleMobileAdsModule.kt');
  } else {
    console.log('Target block not found or already patched');
  }
} else {
  console.log('File not found:', filePath);
}

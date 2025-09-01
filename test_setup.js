const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 Testing Mockup Generator Setup\n');

// Test 1: Check if ImageMagick is installed
console.log('1. Testing ImageMagick installation...');
try {
  execSync('magick -version', { stdio: 'pipe' });
  console.log('✅ ImageMagick is installed and working!\n');
} catch (error) {
  console.log('❌ ImageMagick is not installed or not in PATH');
  console.log('   Please install ImageMagick from: https://imagemagick.org/script/download.php#windows');
  console.log('   Make sure to check "Add to system PATH" during installation\n');
  process.exit(1);
}

// Test 2: Check if required files exist
console.log('2. Checking required files...');
const requiredFiles = [
  'base_images/template.jpg',
  'base_images/mask.png',
  'swatches/art11.jpg'
];

let allFilesExist = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} (missing)`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please check the repository structure.\n');
  process.exit(1);
}

console.log('\n✅ All required files found!\n');

// Test 3: Try to generate maps using the shell script
console.log('3. Testing map generation...');
try {
  console.log('   Running: sh create_maps.sh base_images/template.jpg base_images/mask.png');
  execSync('sh create_maps.sh base_images/template.jpg base_images/mask.png', { 
    stdio: 'pipe',
    cwd: process.cwd()
  });
  console.log('   ✅ Maps generated successfully!\n');
} catch (error) {
  console.log('   ❌ Failed to generate maps');
  console.log('   Error:', error.message);
  console.log('   This might be because the shell script is for Unix/Linux systems\n');
}

// Test 4: Try to run the fixed Node.js script
console.log('4. Testing Node.js mockup generation...');
try {
  console.log('   Running: node create_mockup_fixed.js');
  execSync('node create_mockup_fixed.js', { stdio: 'inherit' });
  console.log('   ✅ Node.js mockup generation completed!\n');
} catch (error) {
  console.log('   ❌ Node.js mockup generation failed');
  console.log('   Error:', error.message);
  console.log('   This might be because the maps were not generated properly\n');
}

console.log('🎉 Setup test completed!');
console.log('\nNext steps:');
console.log('1. If all tests passed, your setup is working correctly');
console.log('2. If some tests failed, check the error messages above');
console.log('3. You can now integrate this into your TypeScript website');

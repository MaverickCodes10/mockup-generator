const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require("os");

function execShellCommand(command) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Executing:', command);
      execSync(command);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

async function testArtworkPlacement() {
  console.log('🧪 Testing Artwork Placement...\n');
  
  const artwork = "swatches/art9.jpg";
  const template = "base_images/template.jpg";
  const mask = "base_images/mask.png";
  const output = "test_placement.jpg";
  
  // Test 1: Simple perspective transform
  console.log('1. Testing perspective transform...');
  const coordinates = [0,0,100,0,0,3000,100,4000,1500,3000,1700,4000,1500,0,1700,0].join(',');
  const tempPerspective = path.join(os.tmpdir(), `test_perspective_${Math.random().toString(36).substring(7)}.png`);
  
  try {
    // Apply perspective transform to artwork
    await execShellCommand(`magick "${artwork}" +distort perspective ${coordinates} "${tempPerspective}"`);
    console.log('✓ Perspective transform applied');
    
    // Apply mask to the perspective-transformed artwork
    const tempMasked = path.join(os.tmpdir(), `test_masked_${Math.random().toString(36).substring(7)}.png`);
    await execShellCommand(`magick "${tempPerspective}" "${mask}" -compose CopyOpacity -composite "${tempMasked}"`);
    console.log('✓ Mask applied');
    
    // Composite onto template
    await execShellCommand(`magick "${template}" "${tempMasked}" -compose over -composite "${output}"`);
    console.log('✓ Composed onto template');
    
    // Clean up temp files
    if (fs.existsSync(tempPerspective)) fs.unlinkSync(tempPerspective);
    if (fs.existsSync(tempMasked)) fs.unlinkSync(tempMasked);
    
    console.log(`✅ Test completed! Check ${output} for results.\n`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    // Clean up on error
    if (fs.existsSync(tempPerspective)) fs.unlinkSync(tempPerspective);
  }
}

testArtworkPlacement();

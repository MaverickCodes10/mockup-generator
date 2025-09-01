const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require("os");

async function addBorder(params) {
  const { artwork, out } = params;
  await execShellCommand(`magick "${artwork}" -bordercolor transparent -border 1 "${out}"`);
}

async function perspectiveTransform(params) {
  const { template, artwork, out } = params;
  const coordinates = [0,0,100,0,0,3000,100,4000,1500,3000,1700,4000,1500,0,1700,0].join(',');
  const transform = `magick "${template}" -alpha transparent \\( "${artwork}" +distort perspective ${coordinates} \\) -background transparent -layers merge +repage "${out}"`;
  await execShellCommand(transform);
}

async function addDisplacement(params) {
  const { artwork, displacementMap, out, dx = 20, dy = 20 } = params;
  const displace = `magick "${artwork}" "${displacementMap}" -compose displace -set option:compose:args ${dx}x${dy} -composite "${out}"`;
  await execShellCommand(displace);
}

async function addHighlights(params) {
  const { artwork, lightingMap, out, mode = 'hardlight' } = params;
  const highlight = `magick "${artwork}" \\( -clone 0 "${lightingMap}" -compose ${mode} -composite \\) +swap -compose CopyOpacity -composite "${out}"`;
  await execShellCommand(highlight);
}

async function adjustColors(params) {
  const { artwork, adjustmentMap, out } = params;
  const adjust = `magick "${artwork}" \\( -clone 0 "${adjustmentMap}" -compose multiply -composite \\) +swap -compose CopyOpacity -composite "${out}"`;
  await execShellCommand(adjust);
}

async function composeArtwork(params) {
  const { template, artwork, mask, out, mode = 'over' } = params;
  const compose = `magick "${template}" "${artwork}" "${mask}" -compose ${mode} -composite "${out}"`;
  await execShellCommand(compose);
}

async function generateMockup(params) {
  const { artwork, template, displacementMap, lightingMap, adjustmentMap, mask, out } = params;
  const tmp = path.join(os.tmpdir(), `${Math.random().toString(36).substring(7)}.png`);
  
  console.log('Starting mockup generation...');
  console.log('Artwork:', artwork);
  console.log('Template:', template);
  console.log('Output:', out);
  
  try {
    await addBorder({ artwork, out: tmp });
    console.log('✓ Added border');
    
    await perspectiveTransform({ template, artwork: tmp, out: tmp });
    console.log('✓ Applied perspective transform');
    
    await addDisplacement({ artwork: tmp, displacementMap, out: tmp });
    console.log('✓ Added displacement');
    
    await addHighlights({ artwork: tmp, lightingMap, out: tmp });
    console.log('✓ Added highlights');
    
    await adjustColors({ artwork: tmp, adjustmentMap, out: tmp });
    console.log('✓ Adjusted colors');
    
    await composeArtwork({ template, artwork: tmp, mask, out });
    console.log('✓ Composed final artwork');
    
    // Clean up temp file
    if (fs.existsSync(tmp)) {
      fs.unlinkSync(tmp);
    }
    
    console.log('✅ Mockup generated successfully!');
    console.log('Output file:', out);
    
  } catch (error) {
    console.error('❌ Error generating mockup:', error.message);
    // Clean up temp file on error
    if (fs.existsSync(tmp)) {
      fs.unlinkSync(tmp);
    }
    throw error;
  }
}

function execShellCommand(command) {
  return new Promise((resolve, reject) => {
    try {
      console.log('Executing:', command);
      execSync(command, { stdio: 'pipe' });
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Test configuration using the actual files in the repository
const mockupConfig = {
  'out': "test_mockup_output.jpg",
  'artwork': "swatches/art11.jpg",  // Using one of the available swatches
  'template': 'base_images/template.jpg',
  'mask': 'base_images/mask.png',
  'displacementMap': 'maps/displacement_map.png',
  'lightingMap': 'maps/lighting_map.png',
  'adjustmentMap': 'maps/adjustment_map.jpg'
};

// Check if required files exist
console.log('Checking required files...');
const requiredFiles = [
  mockupConfig.artwork,
  mockupConfig.template,
  mockupConfig.mask
];

for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
}

// Check if maps directory and files exist
if (!fs.existsSync('maps')) {
  console.log('Creating maps directory...');
  fs.mkdirSync('maps', { recursive: true });
}

// Generate mockup
console.log('\nStarting mockup generation...');
generateMockup(mockupConfig)
  .then(() => {
    console.log('🎉 Test completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Test failed:', error.message);
    console.log('\nMake sure ImageMagick is installed and accessible via "magick" command');
  });

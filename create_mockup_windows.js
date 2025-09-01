const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require("os")

// Function to get incremental filename
function getIncrementalFilename(basePath) {
  const dir = path.dirname(basePath);
  const ext = path.extname(basePath);
  const name = path.basename(basePath, ext);
  
  let counter = 1;
  let newPath = basePath;
  
  while (fs.existsSync(newPath)) {
    newPath = path.join(dir, `${name}_${counter}${ext}`);
    counter++;
  }
  
  return newPath;
}

async function addBorder(params) {
  const { artwork, out } = params;
  await execShellCommand(`magick "${artwork}" -bordercolor transparent -border 1 "${out}"`);
}

async function perspectiveTransform(params) {
  const { template, artwork, out } = params;
  
  // First, get the dimensions of the mask to properly scale the artwork
  const maskInfo = await getImageInfo("base_images/mask.png");
  const maskWidth = maskInfo.width;
  const maskHeight = maskInfo.height;
  
  console.log(`Mask dimensions: ${maskWidth}x${maskHeight}`);
  
  // Scale the artwork to match the mask dimensions before perspective transform
  const tempScaled = path.join(os.tmpdir(), `scaled_${Math.random().toString(36).substring(7)}.png`);
  await execShellCommand(`magick "${artwork}" -resize ${maskWidth}x${maskHeight}! "${tempScaled}"`);
  console.log(`✓ Scaled artwork to ${maskWidth}x${maskHeight}`);
  
  const coordinates = [0,0,100,0,0,3000,100,4000,1500,3000,1700,4000,1500,0,1700,0].join(',');
  
  // Create a temporary file for the perspective transform
  const tempPerspective = path.join(os.tmpdir(), `perspective_${Math.random().toString(36).substring(7)}.png`);
  
  // Apply perspective transform to the scaled artwork
  const perspectiveCmd = `magick "${tempScaled}" +distort perspective ${coordinates} "${tempPerspective}"`;
  await execShellCommand(perspectiveCmd);
  
  // Then composite it onto the template with transparency
  const compositeCmd = `magick "${template}" -alpha transparent "${tempPerspective}" -background transparent -layers merge +repage "${out}"`;
  await execShellCommand(compositeCmd);
  
  // Clean up temp files
  if (fs.existsSync(tempPerspective)) {
    fs.unlinkSync(tempPerspective);
  }
  if (fs.existsSync(tempScaled)) {
    fs.unlinkSync(tempScaled);
  }
}

// Function to get image dimensions
async function getImageInfo(imagePath) {
  return new Promise((resolve, reject) => {
    try {
      const result = execSync(`magick identify -format "%wx%h" "${imagePath}"`, { encoding: 'utf8' });
      const [width, height] = result.trim().split('x').map(Number);
      resolve({ width, height });
    } catch (error) {
      reject(error);
    }
  });
}

async function setBackgroundColor(params) {
  const { artwork, color = 'transparent', out } = params;
  const setBackground = `magick "${artwork}" -background "${color}" -alpha remove "${out}"`;
  await execShellCommand(setBackground);
}

async function addDisplacement(params) {
  const { artwork, displacementMap, out, dx = 20, dy = 20 } = params;
  const displace = `magick "${artwork}" "${displacementMap}" -compose displace -set option:compose:args ${dx}x${dy} -composite "${out}"`;
  await execShellCommand(displace);
}

async function addHighlights(params) {
  const { artwork, lightingMap, out, mode = 'hardlight' } = params;
  // Create a temporary file for the highlight effect
  const tempHighlight = path.join(os.tmpdir(), `highlight_${Math.random().toString(36).substring(7)}.png`);
  
  // Apply lighting effect
  const highlightCmd = `magick "${artwork}" "${lightingMap}" -compose ${mode} -composite "${tempHighlight}"`;
  await execShellCommand(highlightCmd);
  
  // Copy the result back to the original file
  const copyCmd = `magick "${tempHighlight}" "${out}"`;
  await execShellCommand(copyCmd);
  
  // Clean up temp file
  if (fs.existsSync(tempHighlight)) {
    fs.unlinkSync(tempHighlight);
  }
}

async function adjustColors(params) {
  const { artwork, adjustmentMap, out } = params;
  // Create a temporary file for the color adjustment
  const tempAdjust = path.join(os.tmpdir(), `adjust_${Math.random().toString(36).substring(7)}.png`);
  
  // Apply color adjustment
  const adjustCmd = `magick "${artwork}" "${adjustmentMap}" -compose multiply -composite "${tempAdjust}"`;
  await execShellCommand(adjustCmd);
  
  // Copy the result back to the original file
  const copyCmd = `magick "${tempAdjust}" "${out}"`;
  await execShellCommand(copyCmd);
  
  // Clean up temp file
  if (fs.existsSync(tempAdjust)) {
    fs.unlinkSync(tempAdjust);
  }
}

async function composeArtwork(params) {
  const { template, artwork, mask, out, mode = 'over' } = params;
  
  // Create a temporary file for the masked artwork
  const tempMasked = path.join(os.tmpdir(), `masked_${Math.random().toString(36).substring(7)}.png`);
  
  // Apply mask to the artwork
  const maskCmd = `magick "${artwork}" "${mask}" -compose CopyOpacity -composite "${tempMasked}"`;
  await execShellCommand(maskCmd);
  
  // Composite the masked artwork onto the template
  const composeCmd = `magick "${template}" "${tempMasked}" -compose ${mode} -composite "${out}"`;
  await execShellCommand(composeCmd);
  
  // Clean up temp file
  if (fs.existsSync(tempMasked)) {
    fs.unlinkSync(tempMasked);
  }
}

async function generateMockup(params) {
  const { artwork, template, displacementMap, lightingMap, adjustmentMap, mask, out } = params;
  
  // Get incremental filename to prevent overwriting
  const finalOutput = getIncrementalFilename(out);
  
  const tmp = path.join(os.tmpdir(), `${Math.random().toString(36).substring(7)}.png`);
  
  console.log('Starting mockup generation...');
  console.log('Artwork:', artwork);
  console.log('Template:', template);
  console.log('Output:', finalOutput);
  
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
    
    await composeArtwork({ template, artwork: tmp, mask, out: finalOutput });
    console.log('✓ Composed final artwork');
    
    // Clean up temp file
    if (fs.existsSync(tmp)) {
      fs.unlinkSync(tmp);
    }
    
    console.log('✅ Mockup generated successfully!');
    console.log('Output file:', finalOutput);
    
    return finalOutput;
    
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
      execSync(command);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Export the function for use in other modules
module.exports = { generateMockup };

// Example usage
if (require.main === module) {
  const mockups = {
    'out': "final_js2.jpg",
    'artwork': "swatches/art6.jpg",
    'template': 'base_images/template.jpg',
    'mask': 'base_images/mask.png',
    'displacementMap': 'maps/displacement_map.png',
    'lightingMap': 'maps/lighting_map.png',
    'adjustmentMap': 'maps/adjustment_map.jpg'
  };

  generateMockup(mockups)
    .then((result) => {
      console.log('🎉 Mockup generation completed!');
    })
    .catch((error) => {
      console.error('💥 Mockup generation failed:', error.message);
    });
}

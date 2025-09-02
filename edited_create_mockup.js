const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require("os")
async function addBorder(params) {
  const { artwork, out } = params;
  await execShellCommand(`convert ${artwork} -bordercolor transparent -border 1 ${out}`);
}

async function perspectiveTransform(params) {
  const { template, artwork, out } = params;
  const coordinates = [0,0,100,0,0,3000,100,4000,1500,3000,1700,4000,1500,0,1700,0].join(',');
  // const transform = `sh perspective_transform.sh ${template} ${artwork} ${coordinates} ${out}`;
  // const transform = `convert ${template} -alpha transparent \( ${artwork} +distort perspective ${coordinates} \) -background transparent -layers merge +repage ${out}`
  const transform = `convert ${template} -alpha transparent -compose over ${artwork} +distort perspective ${coordinates} -background transparent -layers merge +repage ${out}`;
  await execShellCommand(transform);
}

async function setBackgroundColor(params) {
  const { artwork, color = 'transparent', out } = params;
  const setBackground = `convert ${artwork} -background "${color}" -alpha remove ${out}`;
  await execShellCommand(setBackground);
}

// async function addDisplacement(params) {
//   const { artwork, displacementMap, out, dx = 20, dy = 20 } = params;
//   const displace = `convert ${artwork} ${displacementMap} -compose displace -set option:compose:args ${dx}x${dy} -composite ${out}`;
//   await execShellCommand(displace);
// }
async function addDisplacement(params) {
  const { artwork, displacementMap, out, dx = 20, dy = 20 } = params;
  
  console.log('addDisplacement called with:');
  console.log('  artwork:', artwork);
  console.log('  displacementMap:', displacementMap);
  console.log('  out:', out);
  console.log('  dx:', dx, 'dy:', dy);
  
  // Check if input files exist
  if (!fs.existsSync(artwork)) {
    throw new Error(`Artwork file does not exist: ${artwork}`);
  }
  if (!fs.existsSync(displacementMap)) {
    throw new Error(`Displacement map does not exist: ${displacementMap}`);
  }
  
  const displace = `convert ${artwork} ${displacementMap} -compose displace -set option:compose:args ${dx}x${dy} -composite ${out}`;
  console.log('Displacement command:', displace);
  
  try {
    await execShellCommand(displace);
    console.log('Displacement command executed successfully');
    
    // Check if output file was created
    if (!fs.existsSync(out)) {
      throw new Error(`Output file was not created: ${out}`);
    }
    
    console.log('Output file exists:', fs.existsSync(out));
    console.log('Output file size:', fs.statSync(out).size, 'bytes');
  } catch (error) {
    console.error('Displacement command failed:', error.message);
    throw error;
  }
}

async function addHighlights(params) {
  const { artwork, lightingMap, out, mode = 'hardlight' } = params;
  // const highlight = `convert ${artwork} \( -clone 0 ${lightingMap} -compose ${mode} -composite \) +swap -compose CopyOpacity -composite ${out}`;
  const highlight = `convert ${artwork} -clone 0 ${lightingMap} -compose ${mode} -composite +swap -compose CopyOpacity -composite ${out}`;
  await execShellCommand(highlight);
}

async function adjustColors(params) {
  const { artwork, adjustmentMap, out } = params;
  // const adjust = `convert ${artwork} \( -clone 0 ${adjustmentMap} -compose multiply -composite \) +swap -compose CopyOpacity -composite ${out}`;
  const adjust = `convert ${artwork} -clone 0 ${adjustmentMap} -compose multiply -composite +swap -compose CopyOpacity -composite ${out}`;
  await execShellCommand(adjust);
}

async function composeArtwork(params) {
  const { template, artwork, mask, out, mode = 'over' } = params;
  const compose = `convert ${template} ${artwork} ${mask} -compose ${mode} -composite ${out}`;
  await execShellCommand(compose);
}

// async function generateMockup(params) {
//   const { artwork, template, displacementMap, lightingMap, adjustmentMap, mask, out } = params;
//   const tmp = path.join(os.tmpdir(), `${Math.random().toString(36).substring(7)}.mpc`);
//   await addBorder({ artwork, out: tmp });
//   await perspectiveTransform({ template, artwork: tmp, out: tmp });
//   // await setBackgroundColor({ artwork: tmp, color: 'black', out: tmp });
//   await addDisplacement({ artwork: tmp, displacementMap, out: tmp });
//   await addHighlights({ artwork: tmp, lightingMap, out: tmp });
//   await adjustColors({ artwork: tmp, adjustmentMap, out: tmp });
//   await composeArtwork({ template, artwork: tmp, mask, out });
//   fs.unlinkSync(tmp);
// }
async function generateMockup(params) {
  // const { artwork, template, mask, out } = params;
  const { artwork, template, mask, out, displacementMap, lightingMap, adjustmentMap } = params;
  const tmp = path.join(os.tmpdir(), `${Math.random().toString(36).substring(7)}.mpc`);
  
  console.log('Starting mockup generation...');
  console.log('Artwork:', artwork);
  console.log('Template:', template);
  console.log('Mask:', mask);
  console.log('Output:', out);
  console.log('Temp file:', tmp);
  
  try {
    await addBorder({ artwork, out: tmp });
    console.log('Border added successfully');
    
    // Skip the problematic steps for now
    await perspectiveTransform({ template, artwork: tmp, out: tmp });
    await addDisplacement({ artwork: tmp, displacementMap, out: tmp });
    await addHighlights({ artwork: tmp, lightingMap, out: tmp });
    // await adjustColors({ artwork: tmp, adjustmentMap, out: tmp });
    
    await composeArtwork({ template, artwork: tmp, mask, out });
    console.log('Mockup created successfully');
    
    fs.unlinkSync(tmp);
  } catch (error) {
    console.error('Error in mockup generation:', error.message);
    throw error;
  }
}

function execShellCommand(command) {
  return new Promise((resolve, reject) => {
    try {
      execSync(command);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function getUniqueFilename(baseName) {
  const fs = require('fs');
  const path = require('path');
  
  let counter = 1;
  let filename = baseName;
  const ext = path.extname(baseName);
  const nameWithoutExt = path.basename(baseName, ext);
  
  while (fs.existsSync(filename)) {
    filename = `${nameWithoutExt}_${counter}${ext}`;
    counter++;
  }
  
  return filename;
}

mockups = {
  'out': getUniqueFilename("final_js3.jpg"),
  'artwork': "swatches/art11.jpg",
  'template': 'base_images/template.jpg',
  'mask': 'base_images/mask.png',
  'displacementMap': 'maps/displacement_map.png',
  'lightingMap': 'maps/lighting_map.png',
  'adjustmentMap': 'maps/adjustment_map.jpg'}

generateMockup(mockups)
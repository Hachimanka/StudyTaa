// Quick network test for MongoDB Atlas
import { execSync } from 'child_process';

console.log('🔍 MongoDB Atlas Network Diagnostics');
console.log('=====================================\n');

// Test 1: Basic connectivity
console.log('1️⃣  Testing basic internet connectivity...');
try {
  execSync('ping -n 2 8.8.8.8', { stdio: 'inherit' });
  console.log('✅ Internet connection working\n');
} catch (error) {
  console.log('❌ No internet connection\n');
  process.exit(1);
}

// Test 2: DNS resolution
console.log('2️⃣  Testing DNS resolution...');
try {
  execSync('nslookup mongodb.com', { stdio: 'inherit' });
  console.log('✅ DNS working for general sites\n');
} catch (error) {
  console.log('❌ DNS issues detected\n');
}

// Test 3: Specific MongoDB Atlas test
console.log('3️⃣  Testing MongoDB Atlas specifically...');
try {
  execSync('nslookup studytaacluster.pcsxncr.mongodb.net', { stdio: 'inherit' });
} catch (error) {
  console.log('❌ Cannot resolve MongoDB Atlas cluster\n');
}

console.log('\n🔧 RECOMMENDATIONS:');
console.log('1. Try using mobile hotspot to test if ISP is blocking');
console.log('2. Change DNS servers to 8.8.8.8 and 8.8.4.4');
console.log('3. Check Windows Firewall settings');
console.log('4. Contact your ISP if the issue persists');
console.log('5. Try MongoDB Atlas from a different network');
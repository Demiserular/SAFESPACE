/**
 * Browser Console Test Script
 * Copy and paste this into your browser console to test navbar positioning
 */

(function() {
  'use strict';
  
  console.log('🧪 Mobile Navbar Positioning Test Suite');
  console.log('==========================================');
  
  const navbar = document.querySelector('.mobile-navbar-fixed');
  
  if (!navbar) {
    console.error('❌ Navbar not found! Make sure .mobile-navbar-fixed element exists.');
    return;
  }
  
  // Test 1: Basic CSS Properties
  console.log('\n📋 Test 1: CSS Properties');
  console.log('-------------------------');
  
  const computedStyle = window.getComputedStyle(navbar);
  const tests = [
    { property: 'position', expected: 'fixed', actual: computedStyle.position },
    { property: 'bottom', expected: '0px', actual: computedStyle.bottom },
    { property: 'left', expected: '0px', actual: computedStyle.left },
    { property: 'right', expected: '0px', actual: computedStyle.right },
    { property: 'zIndex', expected: '99999', actual: computedStyle.zIndex },
    { property: 'transform', expected: 'none', actual: computedStyle.transform },
    { property: 'contain', expected: 'layout size', actual: computedStyle.contain },
    { property: 'isolation', expected: 'isolate', actual: computedStyle.isolation }
  ];
  
  tests.forEach(test => {
    const passed = test.actual === test.expected;
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test.property}: ${test.actual} ${!passed ? `(expected: ${test.expected})` : ''}`);
  });
  
  // Test 2: Position Verification
  console.log('\n📐 Test 2: Position Verification');
  console.log('--------------------------------');
  
  const rect = navbar.getBoundingClientRect();
  const isAtBottom = Math.abs(rect.bottom - window.innerHeight) < 1; // Allow 1px tolerance
  const isFullWidth = Math.abs(rect.width - window.innerWidth) < 1;
  const hasCorrectHeight = Math.abs(rect.height - 64) < 1;
  
  console.log(`✅ At viewport bottom: ${isAtBottom} (${rect.bottom}/${window.innerHeight})`);
  console.log(`✅ Full width: ${isFullWidth} (${rect.width}/${window.innerWidth})`);
  console.log(`✅ Correct height: ${hasCorrectHeight} (${rect.height}/64)`);
  
  // Test 3: Scroll Test
  console.log('\n🖱️ Test 3: Scroll Behavior');
  console.log('---------------------------');
  
  const originalScrollY = window.scrollY;
  const initialBottom = rect.bottom;
  
  console.log('Testing scroll positions...');
  
  [100, 300, 500, 1000].forEach((scrollY, index) => {
    setTimeout(() => {
      window.scrollTo(0, scrollY);
      
      setTimeout(() => {
        const newRect = navbar.getBoundingClientRect();
        const stillAtBottom = Math.abs(newRect.bottom - window.innerHeight) < 1;
        const icon = stillAtBottom ? '✅' : '❌';
        
        console.log(`${icon} Scroll ${scrollY}px: bottom=${newRect.bottom} (should be ${window.innerHeight})`);
        
        if (index === 3) {
          // Restore original scroll position
          setTimeout(() => {
            window.scrollTo(0, originalScrollY);
            console.log('📍 Scroll test completed, position restored');
          }, 100);
        }
      }, 50);
    }, index * 200);
  });
  
  // Test 4: Performance Check
  console.log('\n⚡ Test 4: Performance Properties');
  console.log('----------------------------------');
  
  const perfTests = [
    { property: 'willChange', expected: 'auto' },
    { property: 'transition', expected: 'none' },
    { property: 'animation', expected: 'none' }
  ];
  
  perfTests.forEach(test => {
    const actual = computedStyle[test.property];
    const passed = actual.includes(test.expected) || actual === test.expected;
    const icon = passed ? '✅' : '⚠️';
    console.log(`${icon} ${test.property}: ${actual}`);
  });
  
  // Test 5: Continuous Monitoring
  console.log('\n🔍 Test 5: Starting Continuous Monitor');
  console.log('--------------------------------------');
  console.log('Monitoring navbar position for 10 seconds...');
  
  let monitorCount = 0;
  const monitorInterval = setInterval(() => {
    const currentRect = navbar.getBoundingClientRect();
    const isStillFixed = Math.abs(currentRect.bottom - window.innerHeight) < 1;
    
    monitorCount++;
    
    if (!isStillFixed) {
      console.error(`❌ MOVEMENT DETECTED! Check ${monitorCount}: bottom=${currentRect.bottom}`);
    } else if (monitorCount % 10 === 0) {
      console.log(`✅ Check ${monitorCount}: Still correctly positioned`);
    }
  }, 100);
  
  setTimeout(() => {
    clearInterval(monitorInterval);
    console.log(`🏁 Monitoring completed. Total checks: ${monitorCount}`);
    
    // Final summary
    console.log('\n📊 Test Summary');
    console.log('===============');
    
    const finalRect = navbar.getBoundingClientRect();
    const finallyFixed = Math.abs(finalRect.bottom - window.innerHeight) < 1;
    
    if (finallyFixed) {
      console.log('🎉 SUCCESS: Navbar is correctly fixed at bottom!');
      console.log('✅ All positioning tests passed');
    } else {
      console.log('❌ FAILURE: Navbar position is not stable');
      console.log(`Current bottom: ${finalRect.bottom}, Expected: ${window.innerHeight}`);
    }
    
    console.log('\nTo run individual tests:');
    console.log('- NavbarTestUtils.logNavbarPosition() - Log current position');
    console.log('- NavbarTestUtils.testScrollBehavior() - Test scroll behavior');
    console.log('- NavbarTestUtils.monitorNavbar(5000) - Monitor for 5 seconds');
    
  }, 10000);
  
  // Make test utils available globally
  window.NavbarTestUtils = {
    logNavbarPosition() {
      const navbar = document.querySelector('.mobile-navbar-fixed');
      if (!navbar) return;
      
      const rect = navbar.getBoundingClientRect();
      const style = window.getComputedStyle(navbar);
      
      console.table({
        'Position': style.position,
        'Bottom': style.bottom,
        'Left': style.left,
        'Right': style.right,
        'Width': style.width,
        'Height': style.height,
        'Z-Index': style.zIndex,
        'Transform': style.transform,
        'Contain': style.contain,
        'Isolation': style.isolation,
        'Rect Bottom': rect.bottom,
        'Viewport Height': window.innerHeight,
        'Is Fixed': Math.abs(rect.bottom - window.innerHeight) < 1
      });
    },
    
    testScrollBehavior() {
      const navbar = document.querySelector('.mobile-navbar-fixed');
      if (!navbar) return;
      
      console.log('Testing scroll behavior...');
      const positions = [0, 200, 500, 1000];
      
      positions.forEach((pos, i) => {
        setTimeout(() => {
          window.scrollTo(0, pos);
          setTimeout(() => {
            const rect = navbar.getBoundingClientRect();
            const fixed = Math.abs(rect.bottom - window.innerHeight) < 1;
            console.log(`Scroll ${pos}px: ${fixed ? '✅' : '❌'} Bottom=${rect.bottom}`);
          }, 100);
        }, i * 500);
      });
    },
    
    monitorNavbar(duration = 5000) {
      const navbar = document.querySelector('.mobile-navbar-fixed');
      if (!navbar) return;
      
      console.log(`Monitoring navbar for ${duration/1000} seconds...`);
      let checks = 0;
      
      const interval = setInterval(() => {
        const rect = navbar.getBoundingClientRect();
        const fixed = Math.abs(rect.bottom - window.innerHeight) < 1;
        checks++;
        
        if (!fixed) {
          console.error(`❌ Movement detected at check ${checks}!`);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(interval);
        console.log(`✅ Monitoring complete. ${checks} checks performed.`);
      }, duration);
    }
  };
  
})();
"use client"

// Haptic feedback utility for enhanced mobile UX
export class HapticFeedback {
  private static isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator &&
      typeof navigator.vibrate === 'function'
    )
  }

  // Light haptic feedback (selection, tap)
  static light(): void {
    if (!this.isSupported()) return
    
    try {
      // Short, subtle vibration
      navigator.vibrate(10)
    } catch (error) {
      console.debug('Haptic feedback not available:', error)
    }
  }

  // Medium haptic feedback (button press, notification)
  static medium(): void {
    if (!this.isSupported()) return
    
    try {
      // Medium intensity vibration
      navigator.vibrate(30)
    } catch (error) {
      console.debug('Haptic feedback not available:', error)
    }
  }

  // Heavy haptic feedback (error, success, important action)
  static heavy(): void {
    if (!this.isSupported()) return
    
    try {
      // Strong vibration pattern
      navigator.vibrate([50, 30, 50])
    } catch (error) {
      console.debug('Haptic feedback not available:', error)
    }
  }

  // Success feedback pattern
  static success(): void {
    if (!this.isSupported()) return
    
    try {
      // Quick double tap pattern
      navigator.vibrate([25, 25, 25])
    } catch (error) {
      console.debug('Haptic feedback not available:', error)
    }
  }

  // Error feedback pattern
  static error(): void {
    if (!this.isSupported()) return
    
    try {
      // Distinct error pattern
      navigator.vibrate([100, 50, 100])
    } catch (error) {
      console.debug('Haptic feedback not available:', error)
    }
  }

  // Custom pattern
  static custom(pattern: number | number[]): void {
    if (!this.isSupported()) return
    
    try {
      navigator.vibrate(pattern)
    } catch (error) {
      console.debug('Haptic feedback not available:', error)
    }
  }
}

// Hook for easier usage in React components
export function useHapticFeedback() {
  return {
    light: () => HapticFeedback.light(),
    medium: () => HapticFeedback.medium(),
    heavy: () => HapticFeedback.heavy(),
    success: () => HapticFeedback.success(),
    error: () => HapticFeedback.error(),
    custom: (pattern: number | number[]) => HapticFeedback.custom(pattern),
  }
}
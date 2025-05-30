import { useLanguage } from '../contexts/LanguageContext';

/**
 * RTL-aware utility to conditionally apply left/right based classes
 * 
 * @example
 * // In a component:
 * const { rtl } = useRtl();
 * return <div className={rtl('mr-4', 'ml-4')}>Content</div>;
 * // Outputs 'ml-4' in RTL mode, 'mr-4' in LTR mode
 */
export function useRtl() {
  const { direction } = useLanguage();
  const isRtl = direction === 'rtl';
  
  /**
   * Returns the appropriate class based on text direction
   * @param ltrClass - Class to use in left-to-right mode
   * @param rtlClass - Class to use in right-to-left mode
   */
  const rtl = (ltrClass: string, rtlClass: string): string => {
    return isRtl ? rtlClass : ltrClass;
  };
  
  /**
   * Returns appropriate padding/margin classes for consistent spacing in RTL/LTR
   * @param side - 'start' or 'end' (logical direction)
   * @param property - 'p' (padding) or 'm' (margin)
   * @param size - Size value (1, 2, 3, 4, etc.)
   */
  const space = (side: 'start' | 'end', property: 'p' | 'm', size: number): string => {
    const physical = side === 'start' 
      ? (isRtl ? 'r' : 'l') 
      : (isRtl ? 'l' : 'r');
      
    return `${property}${physical}-${size}`;
  };
  
  return {
    isRtl,
    rtl,
    space
  };
}

/** Primary readable font — all body text, buttons, rules, labels */
export const uiFontFamily = '"Kingthings Clarity", system-ui, sans-serif'

/** Playful title font — game names, section headers, score displays */
export const titleFontFamily = '"Si Kancil", fantasy, sans-serif'

/** Decorative accent font — short decorative headings only, never long text */
export const accentFontFamily = '"Waterlily", cursive, serif'

/** Number font — any element displaying a numeric value (scores, timers, counters) */
export const numberFontFamily = uiFontFamily

// Legacy aliases — updated to the new hierarchy for backward compatibility
export const bodyFontFamily    = uiFontFamily    // was Si Kancil
export const headingFontFamily = titleFontFamily  // was Waterlily

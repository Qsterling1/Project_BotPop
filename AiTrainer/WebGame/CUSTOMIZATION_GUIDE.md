# WebGame Customization Guide

## Quick Start

All customizable values in `main.js` are marked with `// ADJUST:` comments. Simply search for "ADJUST" in your code editor to find every adjustable parameter.

---

## How to Find Adjustments

**Search in VS Code:**
1. Open `main.js`
2. Press `Ctrl+F` (Windows) or `Cmd+F` (Mac)
3. Type "ADJUST"
4. Press Enter to jump through ~80 adjustment points

---

## Sections You Can Customize

### 1. **Main Menu Screen** (Lines 414-459)
- Play button position and size (anchored bottom-right)
- Back button position and size (anchored top-left)
- Button colors and borders

### 2. **Challenge Acceptance Screen** (Lines 349-412)
- Challenge text positioning
- "Bring it on!" button (left side)
- "Not right now" button (right side)
- Overlay darkness

### 3. **Battle Screen - Characters** (Lines 461-527)
- Tabia (player character) - anchored bottom-left
- Player bot (MarqueeBot) - anchored bottom-center-left
- Enemy bot - anchored bottom-center-right
- All character sizes (scale multipliers)

### 4. **Battle Screen - UI Panels** (Lines 528-627)
- Player stat panel (top-left)
- Enemy stat panel (top-right)
- All text sizes and colors
- Icon positions
- Heat bar dimensions

### 5. **Hit/Miss Animations** (Lines 629-662)
- Animation sprite size
- Position on screen
- Duration (frames)

### 6. **Command Interface** (Lines 664-728)
- Panel height and position (anchored bottom)
- Button dimensions and spacing
- Colors and borders
- Text sizes

### 7. **Move Selection Panel** (Lines 730-804)
- Panel width (anchored right)
- Move button dimensions
- Text positioning
- Back button position

### 8. **Post-Battle Screen** (Lines 806-860)
- Result sprite size and position
- Summary text positioning
- Line spacing
- Return prompt

---

## Common Adjustments

### Moving a Character
```javascript
// Find the character section (search for character name)
const tabiaX = 200;                    // ADJUST: X position from left edge
const tabiaY = canvas.height - tabiaH - 80;  // ADJUST: -80 = distance from bottom
```

### Changing Text Size
```javascript
drawPixelText('TEXT', x, y, 16, '#FFFFFF', 'center', true);  // ADJUST: 16 = size
//                            ^^
//                            Change this number
```

### Changing Colors
```javascript
ctx.fillStyle = 'rgba(78, 205, 196, 0.8)';  // ADJUST: (R, G, B, opacity)
//                     ^^  ^^^ ^^^  ^^^
//                     Change these numbers (0-255 for RGB, 0.0-1.0 for opacity)
```

### Changing Button Position
```javascript
const btnX = 30;   // ADJUST: Distance from left edge
const btnY = 30;   // ADJUST: Distance from top edge
const btnW = 200;  // ADJUST: Button width
const btnH = 40;   // ADJUST: Button height
```

---

## Understanding Anchors

**Anchor points tell you how an element is positioned:**

- **ANCHORED TOP-LEFT** = Position is measured from top-left corner
- **ANCHORED TOP-RIGHT** = Position is measured from top-right corner
- **ANCHORED BOTTOM** = Position is measured from bottom edge
- **ANCHORED BOTTOM-LEFT** = Position is measured from bottom-left corner
- **ANCHORED BOTTOM-RIGHT** = Position is measured from bottom-right corner

**Example:**
```javascript
// ANCHORED TOP-LEFT
const panelX = 10;   // 10 pixels from left edge
const panelY = 10;   // 10 pixels from top edge

// ANCHORED BOTTOM-RIGHT
const btnX = canvas.width - btnW - 120;   // 120 pixels from right edge
const btnY = canvas.height - btnH - 120;  // 120 pixels from bottom edge
```

---

## Testing Your Changes

1. Save `main.js`
2. Open `index.html` in your browser (or refresh if already open)
3. Test your changes
4. Repeat until satisfied

---

## Tips

- **Start small:** Adjust one value at a time
- **Use Ctrl+Z:** Undo if something breaks
- **Keep notes:** Write down original values before changing
- **Test frequently:** Refresh browser after each change
- **Character sizes:** 0.5 = 50%, 1.0 = 100%, 1.5 = 150%

---

## Need Help?

If you get stuck, search for the section name in the code:
- "MAIN MENU SCREEN"
- "CHALLENGE ACCEPTANCE SCREEN"
- "CHARACTER POSITIONS"
- "COMMAND INTERFACE"
- etc.

Each section has a clear header with `// ============` borders.

---

**Happy customizing!**

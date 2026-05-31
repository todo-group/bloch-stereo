# Bloch Stereo Stream Deck MK.2 Icons

Generated files for assigning Stream Deck keys to Bloch Stereo keyboard shortcuts.

## Suggested Layout

```txt
[   ] [Prev] [   ] [Next] [   ]
[   ] [Reset][Edit ][Add ] [   ]
[   ] [Rotate][   ][Zoom] [   ]
```

## Hotkeys

| Action | Hotkey | Icon |
| --- | --- | --- |
| Prev Step | `ArrowLeft` | `prev.svg` |
| Next Step | `ArrowRight` | `next.svg` |
| Reset Run | `R or Home` | `reset.svg` |
| Editor Toggle | `E` | `editor.svg` |
| Add Gate | `+` | `add.svg` |
| Rotate Hold | `C` | `rotate.svg` |
| Zoom Hold | `Z` | `zoom.svg` |

## Setup

### macOS

1. Install the macOS Stream Deck app from Elgato:

   ```txt
   https://www.elgato.com/downloads
   ```

2. Generate these assets from the repository root:

   ```sh
   npm run streamdeck:mk2
   ```

3. Open the Stream Deck app.

4. Drag **System > Hotkey** onto each Stream Deck key.

5. Use this suggested MK.2 layout:

   ```txt
   [   ] [Prev] [   ] [Next] [   ]
   [   ] [Reset][Edit ][Add ] [   ]
   [   ] [Rotate][   ][Zoom] [   ]
   ```

6. Set each Hotkey action:

   - Prev: `ArrowLeft`
   - Next: `ArrowRight`
   - Reset: `R` or `Home`
   - Editor: `E`
   - Add: `+`
   - Rotate: `C`
   - Zoom: `Z`

7. Set each key image:

   - Prev: `streamdeck/mk2/prev.svg`
   - Next: `streamdeck/mk2/next.svg`
   - Reset: `streamdeck/mk2/reset.svg`
   - Editor: `streamdeck/mk2/editor.svg`
   - Add: `streamdeck/mk2/add.svg`
   - Rotate: `streamdeck/mk2/rotate.svg`
   - Zoom: `streamdeck/mk2/zoom.svg`

8. Start Bloch Stereo:

   ```sh
   npm run dev
   ```

9. Open the Vite URL, usually:

   ```txt
   http://localhost:5173/
   ```

10. Keep the browser page focused when pressing Stream Deck keys.

Shortcuts are ignored while an input, select, textarea, QASM editor, or content-editable element has focus. This prevents accidental edits while entering angles, probabilities, or QASM text.

Hold Rotate while moving the mouse to rotate the Bloch view. Hold Zoom while moving the mouse up or down to zoom the Bloch view.

Direct Stream Deck SDK integration is not required for these keys.

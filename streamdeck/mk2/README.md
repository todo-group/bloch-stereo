# Bloch Stereo Stream Deck MK.2 Icons

Generated files for assigning Stream Deck keys to Bloch Stereo keyboard shortcuts.

## Suggested Layout

```txt
[   ] [Prev] [Stereo][Next] [   ]
[   ] [Reset][Edit ][Add ] [   ]
[Top] [Rotate][View ][Zoom] [Bottom]
```

## Actions

| Action | Stream Deck action | Value | Icon |
| --- | --- | --- | --- |
| Prev Step | Hotkey | `ArrowLeft` | `prev.svg` |
| Stereo Mode | Hotkey | `S` | `stereo.svg` |
| Next Step | Hotkey | `ArrowRight` | `next.svg` |
| Reset Run | Hotkey | `R or Home` | `reset.svg` |
| Editor Toggle | Hotkey | `E` | `editor.svg` |
| Add Gate | Hotkey | `+` | `add.svg` |
| Top View | Hotkey | `T` | `top.svg` |
| Rotate Hold | Hotkey | `C` | `rotate.svg` |
| View Restore | Hotkey | `V` | `view.svg` |
| Zoom Hold | Hotkey | `Z` | `zoom.svg` |
| Bottom View | Hotkey | `B` | `bottom.svg` |

## Manual Setup

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

4. Drag **System > Hotkey** onto each Stream Deck key, matching the table below.

5. Use this suggested MK.2 layout:

   ```txt
   [   ] [Prev] [Stereo][Next] [   ]
   [   ] [Reset][Edit ][Add ] [   ]
   [Top] [Rotate][View ][Zoom] [Bottom]
   ```

6. Set each key action:

   - Prev: **System > Hotkey**, `ArrowLeft`
   - Stereo: **System > Hotkey**, `S`
   - Next: **System > Hotkey**, `ArrowRight`
   - Reset: **System > Hotkey**, `R` or `Home`
   - Editor: **System > Hotkey**, `E`
   - Add: **System > Hotkey**, `+`
   - Top: **System > Hotkey**, `T`
   - Rotate: **System > Hotkey**, `C`
   - View: **System > Hotkey**, `V`
   - Zoom: **System > Hotkey**, `Z`
   - Bottom: **System > Hotkey**, `B`

7. Set each key image:

   - Prev: `streamdeck/mk2/prev.svg`
   - Stereo: `streamdeck/mk2/stereo.svg`
   - Next: `streamdeck/mk2/next.svg`
   - Reset: `streamdeck/mk2/reset.svg`
   - Editor: `streamdeck/mk2/editor.svg`
   - Add: `streamdeck/mk2/add.svg`
   - Top: `streamdeck/mk2/top.svg`
   - Rotate: `streamdeck/mk2/rotate.svg`
   - View: `streamdeck/mk2/view.svg`
   - Zoom: `streamdeck/mk2/zoom.svg`
   - Bottom: `streamdeck/mk2/bottom.svg`

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

Hold Rotate while moving the mouse to rotate the Bloch view. Hold Zoom while moving the mouse up or down to zoom the Bloch view. Press Top, View, or Bottom to move the Bloch camera to that preset view.

Direct Stream Deck SDK integration is not required for these keys.

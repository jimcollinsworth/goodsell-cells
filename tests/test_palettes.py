import re
import pytest
from playwright.sync_api import sync_playwright

HEX_REGEX = re.compile(r"^#[0-9a-fA-F]{6}$")

def launch_browser(p, headless=True):
    for channel in ["msedge", "chrome", None]:
        try:
            if channel:
                return p.chromium.launch(channel=channel, headless=headless)
            else:
                return p.chromium.launch(headless=headless)
        except Exception:
            continue
    raise RuntimeError("Could not launch browser")

def test_palette_definitions_structure(server):
    """Verify palette data structure directly in Python by fetching/evaluating in browser context."""
    with sync_playwright() as p:
        browser = launch_browser(p)
        page = browser.new_page()
        page.goto(f"{server}/index.html")
        page.wait_for_function("() => window.app && window.app.scene")

        palettes_data = page.evaluate("""
            async () => {
                const mod = await import('./js/palettes.js');
                return {
                    GOODSELL_PALETTES: mod.GOODSELL_PALETTES,
                    sampleColor0: mod.getPaletteColor('ecoli', 'nucleic', 0),
                    sampleColorModulo: mod.getPaletteColor('ecoli', 'nucleic', 7),
                    sampleFallbackColor: mod.getPaletteColor('unknown_palette', 'unknown_cat', 0)
                };
            }
        """)
        browser.close()

    palettes = palettes_data["GOODSELL_PALETTES"]
    assert "ecoli" in palettes
    assert "mycoplasma" in palettes
    assert "sarscov2" in palettes
    assert "blood" in palettes

    expected_categories = {"nucleic", "enzyme", "membrane", "structural", "plasma"}

    for key, palette in palettes.items():
        assert "name" in palette and isinstance(palette["name"], str)
        assert "description" in palette and isinstance(palette["description"], str)
        assert "bg" in palette and HEX_REGEX.match(palette["bg"]), f"Invalid bg hex in {key}"
        assert "inkColor" in palette and HEX_REGEX.match(palette["inkColor"]), f"Invalid inkColor hex in {key}"

        categories = palette.get("categories", {})
        assert set(categories.keys()) == expected_categories, f"Missing categories in {key}"

        for cat_name, colors in categories.items():
            assert isinstance(colors, list) and len(colors) > 0, f"Category {cat_name} in {key} must be non-empty list"
            for color in colors:
                assert HEX_REGEX.match(color), f"Invalid color {color} in category {cat_name} of palette {key}"

    # Test getPaletteColor logic results
    assert HEX_REGEX.match(palettes_data["sampleColor0"])
    assert HEX_REGEX.match(palettes_data["sampleColorModulo"])
    assert HEX_REGEX.match(palettes_data["sampleFallbackColor"])


def test_palette_python_parsing():
    """Parse js/palettes.js directly in Python to ensure static file integrity."""
    from pathlib import Path
    palettes_file = Path(__file__).parent.parent / "js" / "palettes.js"
    content = palettes_file.read_text(encoding="utf-8")

    assert "GOODSELL_PALETTES" in content
    assert "export function getPaletteColor" in content

    # Check that all palette names appear in source
    for name in ["ecoli", "mycoplasma", "sarscov2", "blood"]:
        assert name in content

    # Check categories
    for cat in ["nucleic", "enzyme", "membrane", "structural", "plasma"]:
        assert cat in content

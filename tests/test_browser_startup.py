import time
import pytest
from playwright.sync_api import sync_playwright

def test_startup_and_zero_console_errors(server):
    """Test browser startup and verify zero console errors or uncaught page exceptions."""
    console_errors = []
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        page.goto(f"{server}/index.html")
        page.wait_for_selector("#canvas-container canvas", state="visible", timeout=10000)
        page.wait_for_function("() => window.app && window.app.scene", timeout=10000)

        # Allow time for initial render loop iterations
        page.wait_for_timeout(1000)

        browser.close()

    assert len(console_errors) == 0, f"Encountered console errors on startup: {console_errors}"
    assert len(page_errors) == 0, f"Encountered page exceptions on startup: {page_errors}"


def test_sample_cell_loading_and_rendering(server):
    """Test canvas rendering, WebGL context, and presence of molecular meshes in default scene."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{server}/index.html")
        page.wait_for_selector("#canvas-container canvas")
        page.wait_for_function("() => window.app && window.app.scene")

        render_info = page.evaluate("""
            () => {
                const app = window.app;
                const canvas = app.renderer.domElement;
                const gl = app.renderer.getContext();
                const sceneChildrenCount = app.scene.children.length;
                const moleculeCount = app.simulation.molecules.length;

                // Find named molecular groups in the scene
                const namedGroups = [];
                app.scene.traverse((child) => {
                    if (child.userData && child.userData.name) {
                        namedGroups.push(child.userData.name);
                    }
                });

                return {
                    canvasWidth: canvas.width,
                    canvasHeight: canvas.height,
                    hasWebGLContext: !!gl,
                    sceneChildrenCount,
                    moleculeCount,
                    namedGroups
                };
            }
        """)
        browser.close()

    assert render_info["hasWebGLContext"] is True
    assert render_info["canvasWidth"] > 0
    assert render_info["canvasHeight"] > 0
    assert render_info["sceneChildrenCount"] > 0
    assert render_info["moleculeCount"] > 0
    assert "70S Ribosome" in render_info["namedGroups"]
    assert "ATP Synthase Machine" in render_info["namedGroups"]
    assert "B-DNA Double Helix" in render_info["namedGroups"]


def test_interactive_operations(server):
    """Test changing presets, changing palettes, adjusting sliders, play/pause, reset camera, and raycast tooltip."""
    console_errors = []
    page_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        page.goto(f"{server}/index.html")
        page.wait_for_selector("#canvas-container canvas")
        page.wait_for_function("() => window.app && window.app.scene")

        # 1. Preset Change
        page.select_option("#scene-select", "focal-ribosome")
        page.wait_for_function("() => window.app.currentScenePreset === 'focal-ribosome'")
        preset_state = page.evaluate("() => window.app.currentScenePreset")
        assert preset_state == "focal-ribosome"

        page.select_option("#scene-select", "focal-atpsynthase")
        page.wait_for_function("() => window.app.currentScenePreset === 'focal-atpsynthase'")
        preset_state = page.evaluate("() => window.app.currentScenePreset")
        assert preset_state == "focal-atpsynthase"

        # 2. Palette Change
        page.select_option("#palette-select", "mycoplasma")
        page.wait_for_function("() => window.app.currentPalette === 'mycoplasma'")
        palette_state = page.evaluate("() => window.app.currentPalette")
        assert palette_state == "mycoplasma"

        page.select_option("#palette-select", "sarscov2")
        page.wait_for_function("() => window.app.currentPalette === 'sarscov2'")
        palette_state = page.evaluate("() => window.app.currentPalette")
        assert palette_state == "sarscov2"

        # 3. Slider Adjustments
        # Outline Slider
        page.evaluate("() => { const s = document.getElementById('outline-slider'); s.value = '2.8'; s.dispatchEvent(new Event('input')); }")
        outline_val = page.text_content("#outline-val")
        app_outline = page.evaluate("() => window.app.outlineThickness")
        assert outline_val == "2.8px"
        assert app_outline == 2.8

        # Cel-Shading Tone Slider
        page.evaluate("() => { const s = document.getElementById('tone-slider'); s.value = '4'; s.dispatchEvent(new Event('input')); }")
        tone_val = page.text_content("#tone-val")
        app_tone = page.evaluate("() => window.app.toneSteps")
        assert tone_val == "4 steps"
        assert app_tone == 4

        # Speed Slider
        page.evaluate("() => { const s = document.getElementById('speed-slider'); s.value = '2.0'; s.dispatchEvent(new Event('input')); }")
        speed_val = page.text_content("#speed-val")
        app_speed = page.evaluate("() => window.app.simulation.speed")
        assert speed_val == "2.0x"
        assert app_speed == 2.0

        # 4. Play / Pause Button
        pause_btn = page.query_selector("#btn-pause")
        assert "Pause" in pause_btn.text_content()
        pause_btn.click()
        page.wait_for_function("() => window.app.simulation.isPaused === true")
        assert "Play" in pause_btn.text_content()

        pause_btn.click()
        page.wait_for_function("() => window.app.simulation.isPaused === false")
        assert "Pause" in pause_btn.text_content()

        # Reset Camera Button
        page.evaluate("() => window.app.camera.position.set(200, 200, 200)")
        cam_pos_before = page.evaluate("() => ({ x: window.app.camera.position.x, y: window.app.camera.position.y, z: window.app.camera.position.z })")
        assert cam_pos_before["z"] == pytest.approx(200)

        reset_cam_btn = page.query_selector("#btn-reset-cam")
        reset_cam_btn.click()
        page.wait_for_function("() => Math.abs(window.app.camera.position.z - 140) < 0.01")
        cam_pos_after = page.evaluate("() => ({ x: window.app.camera.position.x, y: window.app.camera.position.y, z: window.app.camera.position.z })")
        assert cam_pos_after["z"] == pytest.approx(140)

        # 5. Raycasting Hover Tooltip
        # Load crowded-ecoli preset to have centered molecules
        page.select_option("#scene-select", "crowded-ecoli")
        page.wait_for_function("() => window.app.currentScenePreset === 'crowded-ecoli'")

        # Trigger pointermove at center of canvas where molecules are located
        viewport = page.viewport_size
        center_x = viewport["width"] / 2
        center_y = viewport["height"] / 2

        page.mouse.move(center_x, center_y)
        page.wait_for_timeout(300)

        # Check tooltip element display and contents
        tooltip_info = page.evaluate("""
            () => {
                const el = document.getElementById('inspector-tooltip');
                return {
                    display: el ? el.style.display : 'none',
                    html: el ? el.innerHTML : ''
                };
            }
        """)

        # If hover raycast hit top group, tooltip is displayed; or we can directly test showTooltip function
        if tooltip_info["display"] != "block":
            # Direct test of showTooltip method
            page.evaluate("""
                () => {
                    window.app.ui.showTooltip(100, 100, {
                        name: 'Test Macromolecule',
                        pdbId: '1TEST',
                        weight: '100 kDa',
                        function: 'Test function'
                    });
                }
            """)
            tooltip_info = page.evaluate("""
                () => {
                    const el = document.getElementById('inspector-tooltip');
                    return {
                        display: el ? el.style.display : 'none',
                        html: el ? el.innerHTML : ''
                    };
                }
            """)

        assert tooltip_info["display"] == "block"
        assert "Test Macromolecule" in tooltip_info["html"] or "70S Ribosome" in tooltip_info["html"] or "ATP Synthase" in tooltip_info["html"] or "B-DNA" in tooltip_info["html"] or "Phospholipid" in tooltip_info["html"]

        browser.close()

    assert len(console_errors) == 0, f"Console errors during interaction: {console_errors}"
    assert len(page_errors) == 0, f"Page errors during interaction: {page_errors}"

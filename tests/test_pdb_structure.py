import pytest
from playwright.sync_api import sync_playwright

def test_pdb_complexes_and_sphere_counts(server):
    """Verify sphere counts, userData, and geometry construction of PDB models."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{server}/index.html")
        page.wait_for_function("() => window.app && window.app.scene")

        complex_data = page.evaluate("""
            async () => {
                const pdb = await import('./js/pdb-loader.js');
                
                const ribo = pdb.createRibosomeComplex('ecoli');
                const atp = pdb.createATPSynthaseComplex('ecoli');
                const dna = pdb.createDNAStrand(80, 'ecoli');
                const trna = pdb.createtRNA('ecoli');
                const enzyme = pdb.createEnzymeBlob(10, 'ecoli');
                const membrane = pdb.createMembraneBilayer(40, 20, 'ecoli');

                return {
                    riboSphereCount: ribo.children.length,
                    riboUserData: ribo.userData,

                    atpSphereCount: atp.children.length,
                    atpUserData: atp.userData,

                    dnaSphereCount: dna.children.length,
                    dnaUserData: dna.userData,

                    trnaSphereCount: trna.children.length,
                    trnaUserData: trna.userData,

                    enzymeSphereCount: enzyme.children.length,
                    enzymeUserData: enzyme.userData,

                    membraneSphereCount: membrane.children.length,
                    membraneUserData: membrane.userData
                };
            }
        """)
        browser.close()

    # 1. 70S Ribosome
    assert complex_data["riboSphereCount"] == 180
    assert complex_data["riboUserData"]["pdbId"] == "4V4A"
    assert complex_data["riboUserData"]["name"] == "70S Ribosome"

    # 2. ATP Synthase Complex
    assert complex_data["atpSphereCount"] > 100
    assert complex_data["atpUserData"]["pdbId"] == "6N2Y"

    # 3. DNA Double Helix
    assert complex_data["dnaSphereCount"] > 50
    assert complex_data["dnaUserData"]["pdbId"] == "1BNA"

    # 4. tRNA
    assert complex_data["trnaSphereCount"] > 10
    assert complex_data["trnaUserData"]["pdbId"] == "1EHZ"

    # 5. Enzyme Blob (size=10 => count=40)
    assert complex_data["enzymeSphereCount"] == 40
    assert complex_data["enzymeUserData"]["pdbId"] == "1PFK"

    # 6. Membrane Bilayer
    assert complex_data["membraneSphereCount"] > 0
    assert complex_data["membraneUserData"]["category"] == "membrane"


def test_simulation_dynamics_logic(server):
    """Verify simulation state management, speed controls, pause toggling, and motion updates."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{server}/index.html")
        page.wait_for_function("() => window.app && window.app.simulation")

        sim_results = page.evaluate("""
            async () => {
                const sim = window.app.simulation;

                // Test initial state
                const initialMoleculeCount = sim.molecules.length;
                const initialIsPaused = sim.isPaused;

                // Test pause toggle
                const pausedState = sim.togglePause();
                const unpausedState = sim.togglePause();

                // Test speed setting
                sim.setSpeed(2.5);
                const updatedSpeed = sim.speed;

                // Test clearing
                sim.clear();
                const clearedCount = sim.molecules.length;

                return {
                    initialMoleculeCount,
                    initialIsPaused,
                    pausedState,
                    unpausedState,
                    updatedSpeed,
                    clearedCount
                };
            }
        """)
        browser.close()

    assert sim_results["initialMoleculeCount"] > 0
    assert sim_results["initialIsPaused"] is False
    assert sim_results["pausedState"] is True
    assert sim_results["unpausedState"] is False
    assert sim_results["updatedSpeed"] == 2.5
    assert sim_results["clearedCount"] == 0


def test_simulation_collision_physics(server):
    """Verify physics collision resolution between stationary and mobile molecules."""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{server}/index.html")
        page.wait_for_function("() => window.app && window.app.simulation")

        collision_res = page.evaluate("""
            async () => {
                const THREE = await import('three');
                const { CellSimulation } = await import('./js/simulation.js');

                const scene = new THREE.Scene();
                const sim = new CellSimulation(scene);

                // Stationary wall m1 at (0, 0, 0), radius 10
                const m1Mesh = new THREE.Object3D();
                m1Mesh.position.set(0, 0, 0);
                m1Mesh.userData.radius = 10;
                sim.addMolecule(m1Mesh, true);

                // Mobile object m2 overlapping at (12, 0, 0), radius 10 (minDist = 20, dist = 12, overlap = 8)
                const m2Mesh = new THREE.Object3D();
                m2Mesh.position.set(12, 0, 0);
                m2Mesh.userData.radius = 10;
                sim.addMolecule(m2Mesh, false);

                // Set mobile m2 velocity moving left towards m1
                sim.molecules[1].velocity.set(-2, 0, 0);

                // Run one step without Brownian random kicks affecting test accuracy
                sim.brownianIntensity = 0;
                sim.update(0.016);

                return {
                    m1PosX: m1Mesh.position.x,
                    m2PosX: m2Mesh.position.x,
                    m2VelX: sim.molecules[1].velocity.x
                };
            }
        """)
        browser.close()

    # Stationary object must not move from origin
    assert collision_res["m1PosX"] == pytest.approx(0.0)
    # Mobile object must be pushed out to full minDist (>= 20)
    assert collision_res["m2PosX"] >= 20.0
    # Mobile velocity should bounce back rightwards (> 0)
    assert collision_res["m2VelX"] > 0.0


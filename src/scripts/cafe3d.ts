// Escena 3D de Café Jardón: vasos con la etiqueta de la marca, granos flotantes y el grano que se parte en la intro.
// Todo se modela por código (sin modelos externos) para que pese poco y la marca sea la nuestra.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap } from "gsap";
import { LJ } from "../data/logoLJ";
import { crearRecipiente, type Arte, type TipoRecipiente } from "./recipientes3d";

export interface Diseno {
  nombre: string;   // texto lateral del vaso
  etiqueta: string; // línea pequeña sobre la marca
  manga: string;    // color del papel
  tinta: string;    // color del texto impreso
  acento: string;   // franja y logo
  tapa: string;     // color de la tapa
}

const FUENTE = '"Bricolage Grotesque Variable", system-ui, sans-serif';
const SERIF = '"Instrument Serif", Georgia, serif';

/* ---------- Etiqueta del vaso, dibujada en un canvas ---------- */
export function texturaEtiqueta(d: Diseno, aniso: number) {
  const W = 2048, H = 940;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")! as CanvasRenderingContext2D & { letterSpacing: string; fontStretch: string };
  g.fillStyle = d.manga;
  g.fillRect(0, 0, W, H);
  // Grano del papel.
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${Math.random() * 0.05})` : `rgba(255,255,255,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  const cx = W / 2;
  // Franja inferior con el lugar de tueste.
  g.fillStyle = d.acento;
  g.fillRect(0, H - 150, W, 62);
  g.fillStyle = d.manga;
  g.textAlign = "center";
  g.letterSpacing = "10px";
  g.font = `600 36px ${FUENTE}`;
  g.fillText("TOSTADO EN GIJÓN", cx, H - 106);

  // Logo LJ de la tarjeta: L en el color de la tinta, J en el acento.
  const [vx, vy, vw, vh] = LJ.viewBox;
  const alto = 290, esc = alto / vh;
  g.save();
  g.translate(cx - (vw * esc) / 2 - vx * esc, 70 - vy * esc);
  g.scale(esc, esc);
  g.fillStyle = d.tinta; g.fill(new Path2D(LJ.L));
  g.fillStyle = d.acento; g.fill(new Path2D(LJ.J));
  g.restore();

  // Nombre, con la misma tipografía que la tarjeta.
  g.fillStyle = d.tinta;
  g.letterSpacing = "0px";
  g.font = `italic 110px ${SERIF}`;
  g.fillText("Café", cx, 490);
  g.font = `italic 210px ${SERIF}`;
  g.fillText("Jardón", cx, 660);
  g.letterSpacing = "10px";
  g.globalAlpha = 0.8;
  g.font = `600 40px ${FUENTE}`;
  g.fillText(d.etiqueta.toUpperCase(), cx, 735);
  g.globalAlpha = 1;
  // Textos laterales: se ven cuando el vaso gira.
  for (const x of [W * 0.17, W * 0.83]) {
    g.save();
    g.translate(x, H / 2 - 50);
    g.rotate(-Math.PI / 2);
    g.font = `700 66px ${FUENTE}`;
    g.fillText(d.nombre.toUpperCase(), 0, 22);
    g.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

/* ---------- Vaso de papel con tapa ---------- */
export function crearVaso(d: Diseno, aniso: number) {
  const vaso = new THREE.Group(); // lo mueve GSAP (posición, giro, escala)
  const vaiven = new THREE.Group(); // balanceo continuo, independiente del scroll
  vaso.add(vaiven);

  const papel = new THREE.MeshPhysicalMaterial({ map: texturaEtiqueta(d, aniso), roughness: 0.6, clearcoat: 0.12, clearcoatRoughness: 0.6 });
  // thetaStart = PI deja la costura detrás y el centro de la etiqueta mirando a cámara.
  const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.76, 2.5, 96, 1, true, Math.PI), papel);
  const fondo = new THREE.Mesh(new THREE.CircleGeometry(0.76, 48), new THREE.MeshStandardMaterial({ color: d.manga, roughness: 0.7 }));
  fondo.rotation.x = Math.PI / 2;
  fondo.position.y = -1.25;

  const perfil = [
    [0, 1.64], [0.4, 1.64], [0.48, 1.62], [0.54, 1.55], [0.9, 1.48], [1.04, 1.44],
    [1.09, 1.38], [1.09, 1.28], [1.05, 1.22], [1, 1.21],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const tapa = new THREE.Mesh(
    new THREE.LatheGeometry(perfil, 96),
    new THREE.MeshPhysicalMaterial({ color: d.tapa, roughness: 0.3, clearcoat: 0.6, side: THREE.DoubleSide }),
  );

  for (const m of [cuerpo, fondo, tapa]) { m.castShadow = true; vaiven.add(m); }
  vaiven.position.y = -0.2; // centra el vaso (va de -1.25 a 1.64)
  return { vaso, vaiven, papel, fondo: fondo.material as THREE.MeshStandardMaterial, tapa: tapa.material as THREE.MeshPhysicalMaterial };
}

/* ---------- Grano de café ---------- */
// Esfera deformada: aplanada por delante y con el surco central.
function deformar(x: number, y: number, z: number): [number, number, number] {
  const zf = z > 0 ? z * 0.6 : z;
  const d = x - 0.05 * Math.sin(y * 2.6);
  const surco = Math.exp(-(d * d) / 0.01) * Math.max(0, z);
  return [x * 0.66, y * 0.92, (zf - surco * 0.5) * 0.52];
}
function geoGrano(phiStart = 0, phiLen = Math.PI * 2) {
  const g = new THREE.SphereGeometry(1, 64, 40, phiStart, phiLen);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = deformar(p.getX(i), p.getY(i), p.getZ(i));
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}
// Cara interior que queda al partir el grano (lado 1 = mitad derecha).
function geoCorte(lado: 1 | -1) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const [, y, z] = deformar(0, Math.cos(a), Math.sin(a));
    pts.push(new THREE.Vector2(lado === 1 ? z : -z, y));
  }
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts));
  g.rotateY(lado === 1 ? -Math.PI / 2 : Math.PI / 2);
  return g;
}

export interface PiezaProducto { tipo: TipoRecipiente; arte: Arte; leche?: string }

export function crearEscena(canvas: HTMLCanvasElement, disenos: Diseno[], piezasDef: PiezaProducto[], opciones: { movil: boolean }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  // En móvil se dibuja a menos resolución: la pantalla es pequeña y la GPU lo agradece (va fluido).
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, opciones.movil ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // Luz principal cálida desde arriba a la izquierda: proyecta sombras hacia abajo a la derecha.
  const sol = new THREE.DirectionalLight("#fff0dc", 2.4);
  sol.position.set(-5, 7, 9);
  sol.castShadow = true;
  sol.shadow.mapSize.setScalar(opciones.movil ? 512 : 1024);
  Object.assign(sol.shadow.camera, { left: -12, right: 12, top: 9, bottom: -9, near: 1, far: 40 });
  sol.shadow.radius = 6;
  sol.shadow.bias = -0.0005;
  scene.add(sol);
  const relleno = new THREE.DirectionalLight("#ffd2a8", 0.5);
  relleno.position.set(6, -2, 6);
  scene.add(relleno);

  // Plano invisible que solo recoge sombras: así parecen caer sobre el fondo de la página.
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(80, 50), new THREE.ShadowMaterial({ opacity: 0.12 }));
  suelo.position.z = -3;
  suelo.receiveShadow = true;
  scene.add(suelo);

  const raiz = new THREE.Group(); // inclinación con el ratón
  scene.add(raiz);

  const aniso = renderer.capabilities.getMaxAnisotropy();
  const vasos = disenos.map((d) => crearVaso(d, aniso));
  vasos.forEach((v) => raiz.add(v.vaso));

  // Cada café de la sección de productos, en su recipiente real y centrado en su soporte.
  const piezas = piezasDef.map((p) => {
    const r = crearRecipiente(p.tipo);
    r.servir(p.arte, p.leche);
    r.grupo.position.y = -r.alto / 2;
    const soporte = new THREE.Group();
    soporte.add(r.grupo);
    soporte.scale.setScalar(0.001);
    raiz.add(soporte);
    return { soporte, interior: r.grupo, alto: r.alto };
  });

  // Materiales de grano.
  const tostado = new THREE.MeshPhysicalMaterial({ color: "#3d2115", roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.3 });
  const interior = new THREE.MeshStandardMaterial({ color: "#8a5a38", roughness: 0.95 });

  // Grano de la intro, hecho de dos mitades que se separan.
  const intro = new THREE.Group();
  const mitad = (lado: 1 | -1) => {
    const g = new THREE.Group();
    const piel = new THREE.Mesh(geoGrano(lado === 1 ? Math.PI / 2 : -Math.PI / 2, Math.PI), tostado);
    const corte = new THREE.Mesh(geoCorte(lado), interior);
    piel.castShadow = true;
    g.add(piel, corte);
    intro.add(g);
    return g;
  };
  const der = mitad(1);
  const izq = mitad(-1);
  scene.add(intro);

  // Esquirlas que saltan al partirse.
  const NE = 34;
  const esquirlas = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.07, 0), tostado, NE);
  esquirlas.visible = false;
  scene.add(esquirlas);
  const chip = Array.from({ length: NE }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), s: 1 }));
  let tEsquirlas = -1, inicioEsquirlas = 0;

  // Granos flotantes alrededor de los vasos.
  const NF = opciones.movil ? 12 : 24;
  const flotantes = new THREE.InstancedMesh(geoGrano(), tostado, NF);
  flotantes.castShadow = true;
  const grupoFlot = new THREE.Group();
  grupoFlot.add(flotantes);
  grupoFlot.scale.setScalar(0);
  raiz.add(grupoFlot);
  const semillas = Array.from({ length: NF }, () => ({
    // En escritorio la mayoría va a la derecha para no pasar por detrás del titular.
    x: opciones.movil ? Math.random() * 2 - 1 : Math.random() < 0.22 ? -1 + Math.random() * 0.12 : -0.02 + Math.random() * 1.02, y: Math.random() * 2.4 - 1.2, z: -2 + Math.random() * 3.4,
    s: 0.2 + Math.random() * 0.18, rx: Math.random() * 6, ry: Math.random() * 6, vel: 0.2 + Math.random() * 0.5, fase: Math.random() * 6,
  }));

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), pos = new THREE.Vector3(), esc = new THREE.Vector3();
  const puntero = { x: 0, y: 0 };
  // techo: altura (mundo) por debajo de la cual circulan los granos en móvil; la fija la página según el titular.
  const estado = { scroll: 0, vaiven: 1, activo: true, techo: null as number | null };
  const VIDA_ESQUIRLAS = opciones.movil ? 1.1 : 1.8; // en móvil desaparecen antes de que salga el titular

  /** Tamaño visible del mundo a la profundidad z (0 = plano de los vasos). */
  function vista(z = 0) {
    const h = 2 * (camera.position.z - z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    return { w: h * camera.aspect, h };
  }

  function redimensionar() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function pintar() { renderer.render(scene, camera); }

  function tick(t: number, dtMs: number) {
    if (!estado.activo) return;
    const dt = Math.min(dtMs / 1000, 0.05); // gsap.ticker da milisegundos
    const v = vista();
    // Balanceo suave de cada vaso.
    piezas.forEach(({ interior }, i) => (interior.rotation.y = Math.sin(t * 0.4 + i * 2) * 0.35 * estado.vaiven));
    vasos.forEach(({ vaiven }, i) => {
      vaiven.position.y = -0.2 + Math.sin(t * 0.9 + i * 1.3) * 0.08 * estado.vaiven;
      vaiven.rotation.y = Math.sin(t * 0.45 + i * 1.7) * 0.22 * estado.vaiven;
      vaiven.rotation.z = Math.sin(t * 0.6 + i) * 0.03 * estado.vaiven;
    });
    // Inclinación hacia el ratón (con inercia).
    raiz.rotation.y += (puntero.x * 0.12 - raiz.rotation.y) * 0.05;
    raiz.rotation.x += (puntero.y * 0.07 - raiz.rotation.x) * 0.05;

    // Granos flotantes: suben con el scroll y giran despacio.
    semillas.forEach((s, i) => {
      // Franja por la que circulan: nunca por la zona del menú; en móvil, solo la mitad de abajo, lejos del titular.
      const techo = opciones.movil ? (estado.techo ?? v.h * 0.02) : v.h * 0.36, fondoY = -v.h * 0.7, alto = techo - fondoY;
      const bruto = s.y * v.h * 0.6 + estado.scroll * 2.2 * s.vel + Math.sin(t * 0.5 + s.fase) * 0.15;
      const y = (((bruto % alto) + alto) % alto) + fondoY;
      pos.set(s.x * v.w * 0.55, y, s.z);
      e.set(s.rx + t * 0.3 * s.vel, s.ry + t * 0.4 * s.vel, 0);
      q.setFromEuler(e);
      esc.setScalar(s.s);
      flotantes.setMatrixAt(i, m4.compose(pos, q, esc));
    });
    flotantes.instanceMatrix.needsUpdate = true;

    // Física sencilla de las esquirlas.
    if (tEsquirlas >= 0) {
      tEsquirlas = t - inicioEsquirlas; // tiempo real: desaparecen aunque la pestaña vaya a tirones
      chip.forEach((c, i) => {
        c.v.y -= 9 * dt;
        c.p.addScaledVector(c.v, dt);
        c.r.x += dt * 6; c.r.y += dt * 4;
        q.setFromEuler(c.r);
        esc.setScalar(c.s * Math.max(0, 1 - tEsquirlas / VIDA_ESQUIRLAS));
        esquirlas.setMatrixAt(i, m4.compose(c.p, q, esc));
      });
      esquirlas.instanceMatrix.needsUpdate = true;
      if (tEsquirlas > VIDA_ESQUIRLAS) { tEsquirlas = -1; esquirlas.visible = false; }
    }
    pintar();
  }

  function estallar(origen: THREE.Vector3) {
    chip.forEach((c) => {
      c.p.copy(origen).add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 1.2, 0.3));
      c.v.set((Math.random() - 0.5) * 9, 1 + Math.random() * 5, Math.random() * 3);
      c.s = 0.6 + Math.random() * 1.4;
    });
    esquirlas.visible = true;
    tEsquirlas = 0;
    inicioEsquirlas = gsap.ticker.time;
  }

  // Foto fija de cada producto en su recipiente (para la versión sin animaciones).
  function foto(i: number, w: number, h: number) {
    const tam = new THREE.Vector2();
    renderer.getSize(tam);
    const ocultos = [...vasos.map((v) => v.vaso), ...piezas.map((p) => p.soporte), grupoFlot, intro];
    const antes = ocultos.map((o) => o.visible);
    ocultos.forEach((o) => (o.visible = false));
    const { soporte, alto } = piezas[i];
    const previo = { p: soporte.position.clone(), r: soporte.rotation.clone(), s: soporte.scale.clone() };
    soporte.visible = true;
    soporte.position.set(0, 0, 0); soporte.rotation.set(0.35, -0.3, 0); soporte.scale.setScalar(4.2 / alto);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    pintar();
    const url = canvas.toDataURL("image/png");
    soporte.position.copy(previo.p); soporte.rotation.copy(previo.r); soporte.scale.copy(previo.s);
    ocultos.forEach((o, j) => (o.visible = antes[j]));
    renderer.setSize(tam.x, tam.y, false);
    camera.aspect = tam.x / tam.y; camera.updateProjectionMatrix();
    return url;
  }

  redimensionar();
  gsap.ticker.add(tick);

  return {
    vasos: vasos.map((v) => v.vaso),
    piezas: piezas.map((p) => ({ soporte: p.soporte, alto: p.alto })),
    intro, izq, der, grupoFlot, estado, puntero,
    vista, redimensionar, pintar, estallar, foto,
  };
}

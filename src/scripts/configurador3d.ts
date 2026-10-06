// Escena 3D del configurador "Hazte tu café": el recipiente cambia según lo que elige el visitante.
// Para llevar: vaso de papel de Café Jardón. Para tomar aquí: el recipiente real de cada bebida
// (ver recipientes3d.ts: demitasse, taza, vaso de latte, Chemex o cristal con hielo).
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap } from "gsap";
import { crearVaso, texturaEtiqueta, type Diseno } from "./cafe3d";
import { crearRecipiente, TONO_LECHE, type Arte, type Recipiente, type TipoRecipiente } from "./recipientes3d";

export interface Bebida { id: string; nombre: string; arte: Arte; recipiente: TipoRecipiente; caliente: boolean; diseno: Diseno }
export interface Eleccion { bebida: Bebida; tamano: "S" | "M" | "L"; leche: keyof typeof TONO_LECHE; canela: boolean; para: "aqui" | "llevar" }

type Tipo = TipoRecipiente | "llevar";

// Escala base de cada recipiente (para que se vean a un tamaño parecido en pantalla)
// y cuánto cambia con el tamaño elegido.
const BASE: Record<Tipo, number> = { llevar: 1, espresso: 1.25, taza: 1.05, latte: 1, chemex: 0.92, cristal: 1.05 };
const TAMANO = { S: 0.86, M: 0.95, L: 1.04 };
const TAMANO_LLEVAR = { S: [0.84, 0.76], M: [0.92, 0.88], L: [1, 1] } as const;

function crearVapor() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.9)"); grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const mapa = new THREE.CanvasTexture(c);
  const grupo = new THREE.Group();
  const nubes = Array.from({ length: 7 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: mapa, transparent: true, depthWrite: false, opacity: 0 }));
    grupo.add(s);
    return { s, fase: i / 7, x: (Math.random() - 0.5) * 0.5 };
  });
  return { grupo, nubes };
}

export function crearConfigurador(canvas: HTMLCanvasElement, opciones: { reducir: boolean }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;
  // Un poco desde arriba, como cuando te sirven: así se ve el dibujo de la leche.
  const MIRA = new THREE.Vector3(0, 1, 0);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  const sol = new THREE.DirectionalLight("#fff0dc", 2.3);
  sol.position.set(-4, 8, 5);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 30 });
  sol.shadow.radius = 8;
  scene.add(sol);
  const relleno = new THREE.DirectionalLight("#ffd2a8", 0.5);
  relleno.position.set(5, 2, 4);
  scene.add(relleno);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.16 }));
  suelo.rotation.x = -Math.PI / 2;
  suelo.receiveShadow = true;
  scene.add(suelo);

  const giro = new THREE.Group(); // lo gira el visitante arrastrando
  scene.add(giro);

  const aniso = renderer.capabilities.getMaxAnisotropy();
  const papel = crearVaso({ nombre: "", etiqueta: "", manga: "#1f1510", tinta: "#f3e7d7", acento: "#e4642b", tapa: "#141010" }, aniso);
  papel.vaiven.position.y = 1.25; // apoyado en el suelo
  const reales = {} as Record<TipoRecipiente, Recipiente>;
  (["espresso", "taza", "latte", "chemex", "cristal"] as TipoRecipiente[]).forEach((t) => (reales[t] = crearRecipiente(t)));
  const grupos = { llevar: papel.vaso } as Record<Tipo, THREE.Group>;
  (Object.keys(reales) as TipoRecipiente[]).forEach((t) => (grupos[t] = reales[t].grupo));
  Object.values(grupos).forEach((g) => { g.visible = false; giro.add(g); });
  const vapor = crearVapor();
  giro.add(vapor.grupo);

  const etiquetas = new Map<string, THREE.Texture>();
  const etiquetaDe = (b: Bebida) => {
    if (!etiquetas.has(b.id)) etiquetas.set(b.id, texturaEtiqueta(b.diseno, aniso));
    return etiquetas.get(b.id)!;
  };

  let actual: Eleccion | null = null;
  let tipoActual: Tipo | null = null;
  const d = (s: number) => (opciones.reducir ? 0 : s);
  const tipoDe = (e: Eleccion): Tipo => (e.para === "llevar" ? "llevar" : e.bebida.recipiente);

  function vestir(e: Eleccion) {
    papel.papel.map = etiquetaDe(e.bebida);
    papel.papel.needsUpdate = true;
    papel.fondo.color.set(e.bebida.diseno.manga);
    papel.tapa.color.set(e.bebida.diseno.tapa);
    if (e.para === "aqui") reales[e.bebida.recipiente].servir(e.bebida.arte, TONO_LECHE[e.leche], e.canela);
  }

  function escalar(tipo: Tipo, tamano: Eleccion["tamano"], dur: number) {
    const [sx, sy] = tipo === "llevar" ? TAMANO_LLEVAR[tamano] : [BASE[tipo] * TAMANO[tamano], BASE[tipo] * TAMANO[tamano]];
    return gsap.to(grupos[tipo].scale, { x: sx, y: sy, z: sx, duration: dur, ease: "elastic.out(1, 0.55)" });
  }

  /** Aplica una elección: anima solo lo que ha cambiado. */
  function aplicar(e: Eleccion) {
    const tipo = tipoDe(e);
    const antes = actual;
    actual = e;
    if (!antes || tipo !== tipoActual) {
      // Cambio de recipiente: el anterior se va girando y el nuevo aparece.
      const viejo = tipoActual ? grupos[tipoActual] : null;
      tipoActual = tipo;
      const nuevo = grupos[tipo];
      const entrar = () => {
        if (viejo) viejo.visible = false;
        vestir(e);
        nuevo.visible = true;
        nuevo.rotation.y = -Math.PI;
        nuevo.scale.setScalar(0.001);
        gsap.to(nuevo.rotation, { y: 0, duration: d(1), ease: "expo.out" });
        escalar(tipo, e.tamano, d(1.1));
      };
      if (viejo && !opciones.reducir) {
        gsap.to(viejo.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.35, ease: "power3.in" });
        gsap.to(viejo.rotation, { y: Math.PI, duration: 0.35, ease: "power3.in", onComplete: entrar });
      } else entrar();
      return;
    }
    const g = grupos[tipo];
    if (antes.bebida.id !== e.bebida.id && tipo === "llevar") {
      // Otra bebida en vaso de papel: vuelta completa y la etiqueta cambia de espaldas.
      gsap.timeline()
        .to(g.rotation, { y: "+=" + Math.PI, duration: d(0.45), ease: "power2.in", onComplete: () => vestir(e) })
        .to(g.rotation, { y: "+=" + Math.PI, duration: d(0.7), ease: "expo.out" });
    } else if (antes.bebida.id !== e.bebida.id || antes.leche !== e.leche || antes.canela !== e.canela) {
      // Mismo recipiente, otra bebida o leche: el líquido baja, cambia y vuelve a subir, como si se sirviera de nuevo.
      const liq = tipo !== "llevar" ? reales[tipo].liquido : undefined;
      if (liq && !opciones.reducir) {
        gsap.timeline()
          .to(liq.scale, { y: 0.05, duration: 0.3, ease: "power2.in", onComplete: () => vestir(e) })
          .to(liq.scale, { y: 1, duration: 0.8, ease: "power3.out" });
      } else vestir(e);
    }
    if (antes.tamano !== e.tamano) escalar(tipo, e.tamano, d(0.9));
  }

  // ---------- Arrastrar para girar, con inercia ----------
  let vel = 0, arrastrando = false, ultimoX = 0;
  canvas.addEventListener("pointerdown", (ev) => { arrastrando = true; ultimoX = ev.clientX; canvas.setPointerCapture(ev.pointerId); });
  canvas.addEventListener("pointermove", (ev) => {
    if (!arrastrando) return;
    const dx = ev.clientX - ultimoX;
    ultimoX = ev.clientX;
    giro.rotation.y += dx * 0.012;
    vel = dx * 0.012;
  });
  const soltar = () => (arrastrando = false);
  canvas.addEventListener("pointerup", soltar);
  canvas.addEventListener("pointercancel", soltar);

  function redimensionar() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const lejos = w / h < 0.9 ? 1.25 : 1; // en pantallas estrechas la cámara se aleja
    camera.position.set(0, 4.6 * lejos, 7.4 * lejos);
    camera.lookAt(MIRA);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(redimensionar).observe(canvas);

  let visible = true;
  new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);
  const pintar = () => renderer.render(scene, camera);

  gsap.ticker.add((t, dtMs) => {
    if (!visible) return;
    const dt = Math.min(dtMs / 1000, 0.05);
    if (!arrastrando) {
      vel *= 0.94;
      giro.rotation.y += vel + (opciones.reducir ? 0 : dt * 0.25);
    }
    // Vapor solo en bebidas calientes servidas aquí.
    const humea = !!actual && actual.bebida.caliente && tipoActual !== null && tipoActual !== "llevar" && !opciones.reducir;
    vapor.grupo.visible = humea;
    if (humea) {
      const tipo = tipoActual as TipoRecipiente;
      const alto = reales[tipo].alto * grupos[tipo].scale.y + 0.05;
      vapor.grupo.rotation.y = -giro.rotation.y; // el vapor no gira con la taza
      vapor.nubes.forEach((n) => {
        const p = (t * 0.22 + n.fase) % 1;
        n.s.position.set(n.x + Math.sin(t + n.fase * 9) * 0.12, alto + p * 1.6, 0);
        n.s.scale.setScalar(0.35 + p * 0.9);
        (n.s.material as THREE.SpriteMaterial).opacity = Math.sin(p * Math.PI) * 0.28;
      });
    }
    pintar();
  });

  redimensionar();
  return {
    aplicar,
    /** Imagen del recipiente actual (para la animación de "añadir al pedido"). */
    foto: () => { pintar(); return canvas.toDataURL("image/png"); },
  };
}

// Recipientes 3D de cada bebida, fieles a cómo se sirven en una cafetería de especialidad:
// - Espresso: demitasse (60-90 ml) con crema dorada.
// - Flat white: taza de 150-180 ml, microespuma fina, dibujo nítido y aro de crema.
// - Capuchino: taza de 150-180 ml con espuma gruesa que sobresale del borde.
// - Latte: más leche (220-300 ml), en vaso alto de cristal con capas y roseta.
// - Filtro: cafetera Chemex de cristal con collar de madera y cordón de cuero.
// - Cold brew: vaso alto de cristal con hielo.
// Todos se construyen con la base en y = 0.
import * as THREE from "three";

export type Arte = "crema" | "filtro" | "flatwhite" | "roseta" | "capuchino" | "frio";
export type TipoRecipiente = "espresso" | "taza" | "latte" | "chemex" | "cristal";
export const TONO_LECHE = { entera: "#fbf6ee", avena: "#efe1c9", sinlactosa: "#fdf9f1", ninguna: "#fbf6ee" } as const;

/* ---------- Superficie de la bebida (dibujo en canvas) ---------- */
export function dibujarSuperficie(arte: Arte, leche: string = TONO_LECHE.entera, canela = false) {
  const N = 512, c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!;
  const r = N / 2;
  g.translate(r, r);

  // Color de fondo: cuanta más leche lleva la bebida, más claro.
  const fondos: Record<Arte, [string, string]> = {
    crema: ["#c98a4b", "#7a4318"],      // crema dorada del espresso
    flatwhite: ["#7c4520", "#4a240d"],  // poca leche: muy contrastado
    roseta: ["#b9824f", "#8a5530"],     // latte: más leche, más claro
    capuchino: ["#f6efe4", "#e8dccb"],
    filtro: ["#3a1d0e", "#1d0d05"],
    frio: ["#3a1d0e", "#1d0d05"],
  };
  const [centro, borde] = fondos[arte];
  const base = g.createRadialGradient(0, 0, r * 0.05, 0, 0, r);
  base.addColorStop(0, centro);
  base.addColorStop(1, borde);
  g.fillStyle = base;
  g.fillRect(-r, -r, N, N);

  const manchas = (color: string, n: number, alfa: number, tam: number) => {
    g.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * r * 0.95;
      g.globalAlpha = Math.random() * alfa;
      g.beginPath(); g.ellipse(Math.cos(a) * d, Math.sin(a) * d, 2 + Math.random() * tam, 1.5, a, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  };

  g.fillStyle = leche;
  if (arte === "crema") {
    manchas("#f0c48a", 320, 0.35, 12); // vetas claras ("tiger striping")
    manchas("#5a2d0e", 160, 0.3, 8);
  } else if (arte === "filtro") {
    g.globalAlpha = 0.16; g.fillStyle = "#fff";
    g.beginPath(); g.ellipse(-r * 0.3, -r * 0.35, r * 0.35, r * 0.12, -0.5, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
  } else if (arte === "flatwhite") {
    // Aro de crema en el borde y tulipa de tres hojas, pequeña y muy definida.
    g.strokeStyle = "#b8743a"; g.lineWidth = r * 0.12;
    g.beginPath(); g.arc(0, 0, r * 0.9, 0, Math.PI * 2); g.stroke();
    g.fillStyle = leche;
    [[0.3, 0.4], [0.02, 0.33], [-0.24, 0.26]].forEach(([y, w]) => {
      g.beginPath();
      g.moveTo(-w * r, y * r);
      g.bezierCurveTo(-w * r, (y - 0.3) * r, w * r, (y - 0.3) * r, w * r, y * r);
      g.quadraticCurveTo(0, (y - 0.1) * r, -w * r, y * r);
      g.fill();
    });
    g.beginPath(); g.ellipse(0, -r * 0.45, r * 0.08, r * 0.07, 0, 0, Math.PI * 2); g.fill();
  } else if (arte === "roseta") {
    for (let i = 0; i < 8; i++) {
      const y = r * 0.55 - i * r * 0.14, w = r * (0.66 - i * 0.062);
      g.beginPath();
      g.moveTo(-w, y); g.quadraticCurveTo(0, y - r * 0.3, w, y); g.quadraticCurveTo(0, y - r * 0.1, -w, y);
      g.fill();
    }
    g.beginPath(); g.ellipse(0, -r * 0.6, r * 0.08, r * 0.07, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#8a5530"; g.lineWidth = 7;
    g.beginPath(); g.moveTo(0, -r * 0.55); g.lineTo(0, r * 0.66); g.stroke();
  } else if (arte === "capuchino") {
    // Espuma gruesa: blanca con un fino anillo de café y textura de burbuja.
    g.strokeStyle = "rgba(138,85,48,0.55)"; g.lineWidth = r * 0.07;
    g.beginPath(); g.arc(0, 0, r * 0.95, 0, Math.PI * 2); g.stroke();
    manchas("#d9c7b0", 400, 0.35, 5);
    // Cacao espolvoreado, como el capuchino clásico.
    g.fillStyle = "#5a2d12";
    for (let i = 0; i < 4200; i++) {
      const ang = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), 0.7) * r * 0.62;
      g.globalAlpha = 0.25 + Math.random() * 0.6;
      g.beginPath(); g.arc(Math.cos(ang) * d, Math.sin(ang) * d, 1.5 + Math.random() * 3, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }
  if (canela && arte !== "filtro" && arte !== "frio") {
    g.fillStyle = "#6b3415";
    for (let i = 0; i < 800; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * r * 0.65;
      g.globalAlpha = 0.25 + Math.random() * 0.5;
      g.fillRect(Math.cos(a) * d, Math.sin(a) * d, 2.5, 2.5);
    }
    g.globalAlpha = 1;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Disco con subdivisiones radiales: plano o abombado (la espuma del capuchino sobresale).
function geoSuperficie(radio: number, domo: number) {
  const g = new THREE.RingGeometry(0.0001, radio, 64, 14);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const d = Math.hypot(p.getX(i), p.getY(i)) / radio;
    p.setZ(i, domo * (1 - d * d));
  }
  g.rotateX(-Math.PI / 2);
  g.computeVertexNormals();
  return g;
}

const loza = () => new THREE.MeshPhysicalMaterial({ color: "#f3eee6", roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide });
// Cristal con transparencia y reflejos (la transmisión real se ve gris sobre un lienzo transparente).
const vidrio = () => new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.03, clearcoat: 1, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
const sombra = (...ms: THREE.Mesh[]) => ms.forEach((m) => { m.castShadow = true; m.receiveShadow = true; });

export interface Recipiente {
  grupo: THREE.Group;
  alto: number;
  /** Cambia el dibujo/colores de la bebida. */
  servir(arte: Arte, leche?: string, canela?: boolean): void;
  /** Para animar el "servir de nuevo". */
  liquido?: THREE.Object3D;
}

/* ---------- Taza de cerámica con plato (flat white, capuchino) y demitasse (espresso) ---------- */
export function crearTaza(opciones: { demitasse?: boolean } = {}): Recipiente {
  const grupo = new THREE.Group();
  const m = loza();
  const perfil = (opciones.demitasse
    ? [[0, 0.12], [0.42, 0.12], [0.5, 0.18], [0.66, 0.6], [0.72, 1.02], [0.74, 1.1], [0.69, 1.12], [0.64, 1.04], [0.58, 0.6], [0.4, 0.3], [0, 0.28]]
    : [[0, 0.12], [0.5, 0.12], [0.56, 0.16], [0.66, 0.34], [0.8, 0.86], [0.88, 1.3], [0.9, 1.38], [0.86, 1.4], [0.82, 1.33], [0.74, 0.88], [0.6, 0.4], [0.4, 0.26], [0, 0.24]]
  ).map(([x, y]) => new THREE.Vector2(x, y));
  const cuerpo = new THREE.Mesh(new THREE.LatheGeometry(perfil, 96), m);
  const asa = new THREE.Mesh(new THREE.TorusGeometry(opciones.demitasse ? 0.2 : 0.3, opciones.demitasse ? 0.06 : 0.07, 18, 48, Math.PI * 1.2), m);
  asa.rotation.z = -Math.PI * 0.6;
  asa.position.set(opciones.demitasse ? 0.8 : 0.94, opciones.demitasse ? 0.68 : 0.86, 0);
  const plato = new THREE.Mesh(new THREE.LatheGeometry([
    [0, 0], [1.1, 0], [1.42, 0.07], [1.52, 0.15], [1.47, 0.17], [1.15, 0.1], [0.62, 0.07], [0, 0.07],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 96), m);
  if (opciones.demitasse) plato.scale.setScalar(0.72);

  const liquidoMat = new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.6 });
  const radio = opciones.demitasse ? 0.66 : 0.81;
  const nivel = opciones.demitasse ? 0.98 : 1.22;
  const plana = new THREE.Mesh(geoSuperficie(radio, 0), liquidoMat);
  const cupula = new THREE.Mesh(geoSuperficie(0.86, 0.2), liquidoMat); // espuma de capuchino, por encima del borde
  plana.position.y = nivel;
  cupula.position.y = 1.36;
  const liquido = new THREE.Group();
  liquido.add(plana, cupula);
  sombra(cuerpo, asa, plato);
  grupo.add(cuerpo, asa, plato, liquido);

  return {
    grupo, alto: opciones.demitasse ? 1.12 : 1.4, liquido,
    servir(arte, leche, canela) {
      liquidoMat.map?.dispose();
      liquidoMat.map = dibujarSuperficie(arte, leche, canela);
      liquidoMat.needsUpdate = true;
      plana.visible = arte !== "capuchino";
      cupula.visible = arte === "capuchino";
    },
  };
}

/* ---------- Latte en vaso alto de cristal: capas de leche, café y espuma ---------- */
export function crearVasoLatte(): Recipiente {
  const grupo = new THREE.Group();
  const pared = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.6, 2.6, 64, 1, true), vidrio());
  pared.position.y = 1.3;
  const fondo = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.18, 48), vidrio());
  fondo.position.y = 0.09;
  // Capas de abajo arriba (radios siguiendo el cono del vaso).
  const capa = (y0: number, y1: number, color: string) => {
    const r0 = 0.57 + (y0 / 2.6) * 0.12, r1 = 0.57 + (y1 / 2.6) * 0.12;
    const malla = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, y1 - y0, 48), new THREE.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.3 }));
    malla.position.y = (y0 + y1) / 2;
    malla.castShadow = true;
    return malla;
  };
  const leche = capa(0.18, 1.35, "#efe2cf");
  const mezcla = capa(1.35, 2.05, "#a86f3e");
  const espuma = capa(2.05, 2.32, "#f7efe3");
  const topeMat = new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.5 });
  const tope = new THREE.Mesh(geoSuperficie(0.69, 0.02), topeMat);
  tope.position.y = 2.32;
  const liquido = new THREE.Group();
  liquido.add(leche, mezcla, espuma, tope);
  grupo.add(liquido, pared, fondo);
  return {
    grupo, alto: 2.6, liquido,
    servir(_arte, tono = TONO_LECHE.entera, canela) {
      (leche.material as THREE.MeshPhysicalMaterial).color.set(tono).offsetHSL(0, 0, -0.03);
      (espuma.material as THREE.MeshPhysicalMaterial).color.set(tono);
      topeMat.map?.dispose();
      topeMat.map = dibujarSuperficie("roseta", tono, canela);
      topeMat.needsUpdate = true;
    },
  };
}

/* ---------- Cold brew: vaso alto de cristal con hielo ---------- */
export function crearCristalHielo(): Recipiente {
  const grupo = new THREE.Group();
  const pared = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.66, 2.3, 64, 1, true), vidrio());
  pared.position.y = 1.15;
  const fondo = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.16, 48), vidrio());
  fondo.position.y = 0.08;
  const cafe = new THREE.Mesh(new THREE.CylinderGeometry(0.73, 0.65, 1.55, 48), new THREE.MeshPhysicalMaterial({ color: "#2a1207", roughness: 0.12, clearcoat: 0.8 }));
  cafe.position.y = 0.94;
  cafe.castShadow = true;
  const hieloMat = new THREE.MeshPhysicalMaterial({ color: "#eef7ff", roughness: 0.12, clearcoat: 1, transparent: true, opacity: 0.6 });
  const liquido = new THREE.Group();
  liquido.add(cafe);
  [[-0.25, 1.62, 0.15, 0.4], [0.24, 1.66, -0.12, 0.8], [0.02, 1.72, 0.3, 1.3], [-0.15, 1.5, -0.3, 0.2]].forEach(([x, y, z, r]) => {
    const cubo = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), hieloMat);
    cubo.position.set(x, y, z);
    cubo.rotation.set(r, r * 1.3, r * 0.7);
    liquido.add(cubo);
  });
  grupo.add(liquido, pared, fondo);
  return { grupo, alto: 2.3, liquido, servir() {} };
}

/* ---------- Filtro: Chemex de cristal con collar de madera ---------- */
function texturaMadera() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = "#a8703f"; g.fillRect(0, 0, 512, 128);
  // Vetas: líneas onduladas más oscuras y más claras.
  for (let i = 0; i < 46; i++) {
    const y0 = Math.random() * 128, amp = 2 + Math.random() * 5, fase = Math.random() * 6;
    g.strokeStyle = Math.random() < 0.6 ? "rgba(90,50,22,0.35)" : "rgba(220,170,110,0.25)";
    g.lineWidth = 0.8 + Math.random() * 2.2;
    g.beginPath();
    for (let x = 0; x <= 512; x += 8) g.lineTo(x, y0 + Math.sin(x / 40 + fase) * amp);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function crearChemex(): Recipiente {
  const grupo = new THREE.Group();
  // Silueta de reloj de arena: frasco abajo, cintura estrecha y embudo arriba.
  const perfil = [[0, 0], [0.72, 0], [0.98, 0.14], [1.02, 0.32], [0.64, 1.25], [0.4, 1.5], [0.42, 1.62], [0.94, 2.72], [0.98, 2.8]];
  const cristal = new THREE.Mesh(new THREE.LatheGeometry(perfil.map(([x, y]) => new THREE.Vector2(x, y)), 96), vidrio());
  const cafe = new THREE.Mesh(new THREE.LatheGeometry([
    [0, 0.05], [0.7, 0.05], [0.95, 0.16], [0.98, 0.32], [0.84, 0.66], [0, 0.66],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 72), new THREE.MeshPhysicalMaterial({ color: "#4a1c0a", roughness: 0.08, clearcoat: 1 }));
  cafe.castShadow = true;
  // Collar de madera alrededor de la cintura, siguiendo la forma del cristal.
  const collar = new THREE.Mesh(new THREE.LatheGeometry([
    [0.7, 1.16], [0.47, 1.45], [0.47, 1.68], [0.72, 1.98],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 72), new THREE.MeshStandardMaterial({ map: texturaMadera(), roughness: 0.55, side: THREE.DoubleSide }));
  // Cordón de cuero con su cuenta de madera.
  const cuero = new THREE.MeshStandardMaterial({ color: "#4a2d1a", roughness: 0.7 });
  const cordon = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.028, 10, 64), cuero);
  cordon.rotation.x = Math.PI / 2;
  cordon.position.y = 1.56;
  const cuenta = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), new THREE.MeshStandardMaterial({ color: "#8a5530", roughness: 0.5 }));
  cuenta.position.set(0, 1.5, 0.53);
  const cabo = (x: number, r: number) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8), cuero);
    m.position.set(x, 1.33, 0.53);
    m.rotation.z = r;
    return m;
  };
  sombra(collar);
  const liquido = new THREE.Group();
  liquido.add(cafe);
  grupo.add(liquido, cristal, collar, cordon, cuenta, cabo(-0.04, 0.12), cabo(0.04, -0.12));
  return { grupo, alto: 2.8, liquido, servir() {} };
}

export function crearRecipiente(tipo: TipoRecipiente): Recipiente {
  if (tipo === "espresso") return crearTaza({ demitasse: true });
  if (tipo === "taza") return crearTaza();
  if (tipo === "latte") return crearVasoLatte();
  if (tipo === "chemex") return crearChemex();
  return crearCristalHielo();
}

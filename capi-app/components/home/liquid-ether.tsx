"use client";
// @ts-nocheck

import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./LiquidEther.css";

export default function LiquidEther({
  mouseForce = 20,
  cursorSize = 100,
  isViscous = false,
  viscous = 30,
  iterationsViscous = 32,
  iterationsPoisson = 32,
  dt = 0.014,
  BFECC = true,
  resolution = 0.5,
  isBounce = false,
  colors = ["#5227FF", "#FF9FFC", "#B497CF"],
  style = {},
  className = "",
  autoDemo = true,
  autoSpeed = 0.5,
  autoIntensity = 2.2,
  takeoverDuration = 0.25,
  autoResumeDelay = 3000,
  autoRampDuration = 0.6,
}: {
  mouseForce?: number;
  cursorSize?: number;
  isViscous?: boolean;
  viscous?: number;
  iterationsViscous?: number;
  iterationsPoisson?: number;
  dt?: number;
  BFECC?: boolean;
  resolution?: number;
  isBounce?: boolean;
  colors?: string[];
  style?: React.CSSProperties;
  className?: string;
  autoDemo?: boolean;
  autoSpeed?: number;
  autoIntensity?: number;
  takeoverDuration?: number;
  autoResumeDelay?: number;
  autoRampDuration?: number;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const webglRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const rafRef = useRef<number | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const isVisibleRef = useRef(true);
  const resizeRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    function makePaletteTexture(stops: string[]) {
      let arr = stops?.length ? stops : ["#ffffff", "#ffffff"];
      if (arr.length === 1) arr = [arr[0], arr[0]];
      const w = arr.length;
      const data = new Uint8Array(w * 4);
      for (let i = 0; i < w; i += 1) {
        const c = new THREE.Color(arr[i]);
        data[i * 4] = Math.round(c.r * 255);
        data[i * 4 + 1] = Math.round(c.g * 255);
        data[i * 4 + 2] = Math.round(c.b * 255);
        data[i * 4 + 3] = 255;
      }
      const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      return tex;
    }

    const paletteTex = makePaletteTexture(colors);
    const bgVec4 = new THREE.Vector4(0, 0, 0, 0);

    class CommonClass {
      width = 0;
      height = 0;
      aspect = 1;
      pixelRatio = 1;
      container: HTMLElement | null = null;
      renderer: THREE.WebGLRenderer | null = null;
      clock: THREE.Clock | null = null;
      delta = 0;
      time = 0;
      init(container: HTMLElement) {
        this.container = container;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.resize();
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.autoClear = false;
        this.renderer.setClearColor(new THREE.Color(0x000000), 0);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.domElement.style.width = "100%";
        this.renderer.domElement.style.height = "100%";
        this.renderer.domElement.style.display = "block";
        this.clock = new THREE.Clock();
        this.clock.start();
      }
      resize() {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        this.aspect = this.width / this.height;
        if (this.renderer) this.renderer.setSize(this.width, this.height, false);
      }
      update() {
        if (!this.clock) return;
        this.delta = this.clock.getDelta();
        this.time += this.delta;
      }
    }
    const Common = new CommonClass();

    class MouseClass {
      coords = new THREE.Vector2();
      coords_old = new THREE.Vector2();
      diff = new THREE.Vector2();
      timer: number | null = null;
      container: HTMLElement | null = null;
      docTarget: Document | null = null;
      listenerTarget: Window | null = null;
      isHoverInside = false;
      isAutoActive = false;
      autoIntensity = 2.0;
      hasUserControl = false;
      takeoverActive = false;
      takeoverStartTime = 0;
      takeoverDuration = 0.25;
      takeoverFrom = new THREE.Vector2();
      takeoverTo = new THREE.Vector2();
      onInteract: (() => void) | null = null;
      _onMouseMove = (e: MouseEvent) => this.onDocumentMouseMove(e);
      _onTouchStart = (e: TouchEvent) => this.onDocumentTouchStart(e);
      _onTouchMove = (e: TouchEvent) => this.onDocumentTouchMove(e);
      _onTouchEnd = () => {
        this.isHoverInside = false;
      };
      _onDocumentLeave = () => {
        this.isHoverInside = false;
      };

      init(container: HTMLElement) {
        this.container = container;
        this.docTarget = container.ownerDocument || null;
        const defaultView = this.docTarget?.defaultView || window;
        this.listenerTarget = defaultView;
        this.listenerTarget.addEventListener("mousemove", this._onMouseMove);
        this.listenerTarget.addEventListener("touchstart", this._onTouchStart, { passive: true });
        this.listenerTarget.addEventListener("touchmove", this._onTouchMove, { passive: true });
        this.listenerTarget.addEventListener("touchend", this._onTouchEnd);
        this.docTarget?.addEventListener("mouseleave", this._onDocumentLeave);
      }
      dispose() {
        this.listenerTarget?.removeEventListener("mousemove", this._onMouseMove);
        this.listenerTarget?.removeEventListener("touchstart", this._onTouchStart);
        this.listenerTarget?.removeEventListener("touchmove", this._onTouchMove);
        this.listenerTarget?.removeEventListener("touchend", this._onTouchEnd);
        this.docTarget?.removeEventListener("mouseleave", this._onDocumentLeave);
      }
      isPointInside(clientX: number, clientY: number) {
        if (!this.container) return false;
        const rect = this.container.getBoundingClientRect();
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
      }
      setCoords(clientX: number, clientY: number) {
        if (!this.container) return;
        if (this.timer) window.clearTimeout(this.timer);
        const rect = this.container.getBoundingClientRect();
        const nx = (clientX - rect.left) / rect.width;
        const ny = (clientY - rect.top) / rect.height;
        this.coords.set(nx * 2 - 1, -(ny * 2 - 1));
        this.timer = window.setTimeout(() => void 0, 100);
      }
      onDocumentMouseMove(event: MouseEvent) {
        this.isHoverInside = this.isPointInside(event.clientX, event.clientY);
        if (!this.isHoverInside) return;
        this.onInteract?.();
        this.setCoords(event.clientX, event.clientY);
        this.hasUserControl = true;
      }
      onDocumentTouchStart(event: TouchEvent) {
        if (event.touches.length !== 1) return;
        const t = event.touches[0];
        this.isHoverInside = this.isPointInside(t.clientX, t.clientY);
        if (!this.isHoverInside) return;
        this.onInteract?.();
        this.setCoords(t.clientX, t.clientY);
        this.hasUserControl = true;
      }
      onDocumentTouchMove(event: TouchEvent) {
        if (event.touches.length !== 1) return;
        const t = event.touches[0];
        this.isHoverInside = this.isPointInside(t.clientX, t.clientY);
        if (!this.isHoverInside) return;
        this.setCoords(t.clientX, t.clientY);
      }
      update() {
        if (this.takeoverActive) {
          const t = (performance.now() - this.takeoverStartTime) / (this.takeoverDuration * 1000);
          if (t >= 1) {
            this.takeoverActive = false;
            this.coords.copy(this.takeoverTo);
          } else {
            const k = t * t * (3 - 2 * t);
            this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, k);
          }
        }
        this.diff.subVectors(this.coords, this.coords_old);
        this.coords_old.copy(this.coords);
      }
    }
    const Mouse = new MouseClass();

    const face_vert = `attribute vec3 position;uniform vec2 boundarySpace;varying vec2 uv;void main(){vec3 pos=position;vec2 scale=1.0-boundarySpace*2.0;pos.xy=pos.xy*scale;uv=vec2(0.5)+(pos.xy)*0.5;gl_Position=vec4(pos,1.0);}`;
    const line_vert = `attribute vec3 position;uniform vec2 px;varying vec2 uv;void main(){vec3 pos=position;uv=0.5+pos.xy*0.5;vec2 n=sign(pos.xy);pos.xy=abs(pos.xy)-px*1.0;pos.xy*=n;gl_Position=vec4(pos,1.0);}`;
    const mouse_vert = `attribute vec3 position;attribute vec2 uv;uniform vec2 center;uniform vec2 scale;uniform vec2 px;varying vec2 vUv;void main(){vec2 pos=position.xy*scale*2.0*px+center;vUv=uv;gl_Position=vec4(pos,0.0,1.0);}`;
    const advection_frag = `precision highp float;uniform sampler2D velocity;uniform float dt;uniform bool isBFECC;uniform vec2 fboSize;varying vec2 uv;void main(){vec2 ratio=max(fboSize.x,fboSize.y)/fboSize;if(!isBFECC){vec2 vel=texture2D(velocity,uv).xy;vec2 uv2=uv-vel*dt*ratio;gl_FragColor=vec4(texture2D(velocity,uv2).xy,0.0,0.0);}else{vec2 spot_new=uv;vec2 vel_old=texture2D(velocity,uv).xy;vec2 spot_old=spot_new-vel_old*dt*ratio;vec2 vel_new1=texture2D(velocity,spot_old).xy;vec2 spot_new2=spot_old+vel_new1*dt*ratio;vec2 error=spot_new2-spot_new;vec2 spot_new3=spot_new-error/2.0;vec2 vel_2=texture2D(velocity,spot_new3).xy;vec2 spot_old2=spot_new3-vel_2*dt*ratio;gl_FragColor=vec4(texture2D(velocity,spot_old2).xy,0.0,0.0);}}`;
    const color_frag = `precision highp float;uniform sampler2D velocity;uniform sampler2D palette;uniform vec4 bgColor;varying vec2 uv;void main(){vec2 vel=texture2D(velocity,uv).xy;float lenv=clamp(length(vel),0.0,1.0);vec3 c=texture2D(palette,vec2(lenv,0.5)).rgb;vec3 outRGB=mix(bgColor.rgb,c,lenv);float outA=mix(bgColor.a,1.0,lenv);gl_FragColor=vec4(outRGB,outA);}`;
    const divergence_frag = `precision highp float;uniform sampler2D velocity;uniform float dt;uniform vec2 px;varying vec2 uv;void main(){float x0=texture2D(velocity,uv-vec2(px.x,0.0)).x;float x1=texture2D(velocity,uv+vec2(px.x,0.0)).x;float y0=texture2D(velocity,uv-vec2(0.0,px.y)).y;float y1=texture2D(velocity,uv+vec2(0.0,px.y)).y;float divergence=(x1-x0+y1-y0)/2.0;gl_FragColor=vec4(divergence/dt);}`;
    const externalForce_frag = `precision highp float;uniform vec2 force;varying vec2 vUv;void main(){vec2 circle=(vUv-0.5)*2.0;float d=1.0-min(length(circle),1.0);d*=d;gl_FragColor=vec4(force*d,0.0,1.0);}`;
    const poisson_frag = `precision highp float;uniform sampler2D pressure;uniform sampler2D divergence;uniform vec2 px;varying vec2 uv;void main(){float p0=texture2D(pressure,uv+vec2(px.x*2.0,0.0)).r;float p1=texture2D(pressure,uv-vec2(px.x*2.0,0.0)).r;float p2=texture2D(pressure,uv+vec2(0.0,px.y*2.0)).r;float p3=texture2D(pressure,uv-vec2(0.0,px.y*2.0)).r;float div=texture2D(divergence,uv).r;gl_FragColor=vec4((p0+p1+p2+p3)/4.0-div);}`;
    const pressure_frag = `precision highp float;uniform sampler2D pressure;uniform sampler2D velocity;uniform vec2 px;uniform float dt;varying vec2 uv;void main(){float p0=texture2D(pressure,uv+vec2(px.x,0.0)).r;float p1=texture2D(pressure,uv-vec2(px.x,0.0)).r;float p2=texture2D(pressure,uv+vec2(0.0,px.y)).r;float p3=texture2D(pressure,uv-vec2(0.0,px.y)).r;vec2 v=texture2D(velocity,uv).xy;vec2 gradP=vec2(p0-p1,p2-p3)*0.5;v=v-gradP*dt;gl_FragColor=vec4(v,0.0,1.0);}`;
    const viscous_frag = `precision highp float;uniform sampler2D velocity;uniform sampler2D velocity_new;uniform float v;uniform vec2 px;uniform float dt;varying vec2 uv;void main(){vec2 old=texture2D(velocity,uv).xy;vec2 n0=texture2D(velocity_new,uv+vec2(px.x*2.0,0.0)).xy;vec2 n1=texture2D(velocity_new,uv-vec2(px.x*2.0,0.0)).xy;vec2 n2=texture2D(velocity_new,uv+vec2(0.0,px.y*2.0)).xy;vec2 n3=texture2D(velocity_new,uv-vec2(0.0,px.y*2.0)).xy;vec2 nv=(4.0*old+v*dt*(n0+n1+n2+n3))/(4.0*(1.0+v*dt));gl_FragColor=vec4(nv,0.0,0.0);}`;

    class ShaderPass {
      props: any;
      scene: THREE.Scene;
      camera: THREE.Camera;
      uniforms: any;
      constructor(props: any) {
        this.props = props;
        this.uniforms = this.props.material?.uniforms;
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        if (this.uniforms) {
          const material = new THREE.RawShaderMaterial(this.props.material);
          const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
          this.scene.add(plane);
        }
      }
      update() {
        Common.renderer?.setRenderTarget(this.props.output || null);
        Common.renderer?.render(this.scene, this.camera);
        Common.renderer?.setRenderTarget(null);
      }
    }

    class Simulation {
      options: any;
      fbos: any;
      fboSize = new THREE.Vector2();
      cellScale = new THREE.Vector2();
      boundarySpace = new THREE.Vector2();
      advection: any;
      ext: any;
      divergence: any;
      poisson: any;
      pressure: any;
      visc: any;
      constructor(options: any) {
        this.options = { ...options };
        this.fbos = { v0: null, v1: null, vv0: null, vv1: null, div: null, p0: null, p1: null };
        this.calcSize();
        this.createAllFBO();
        this.createPasses();
      }
      getFloatType() {
        const isIOS = /(iPad|iPhone|iPod)/i.test(navigator.userAgent);
        return isIOS ? THREE.HalfFloatType : THREE.FloatType;
      }
      calcSize() {
        const width = Math.max(1, Math.round(this.options.resolution * Common.width));
        const height = Math.max(1, Math.round(this.options.resolution * Common.height));
        this.cellScale.set(1 / width, 1 / height);
        this.fboSize.set(width, height);
      }
      createAllFBO() {
        const type = this.getFloatType();
        const opts = {
          type,
          depthBuffer: false,
          stencilBuffer: false,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          wrapS: THREE.ClampToEdgeWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
        };
        Object.keys(this.fbos).forEach((k) => {
          this.fbos[k] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, opts);
        });
      }
      createPasses() {
        this.advection = new ShaderPass({
          material: {
            vertexShader: face_vert,
            fragmentShader: advection_frag,
            uniforms: {
              boundarySpace: { value: this.cellScale },
              fboSize: { value: this.fboSize },
              velocity: { value: this.fbos.v0.texture },
              dt: { value: this.options.dt },
              isBFECC: { value: this.options.BFECC },
            },
          },
          output: this.fbos.v1,
        });
        this.ext = new ShaderPass({
          output: this.fbos.v1,
        });
        const mouseM = new THREE.RawShaderMaterial({
          vertexShader: mouse_vert,
          fragmentShader: externalForce_frag,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          uniforms: {
            force: { value: new THREE.Vector2(0, 0) },
            center: { value: new THREE.Vector2(0, 0) },
            scale: { value: new THREE.Vector2(this.options.cursor_size, this.options.cursor_size) },
            px: { value: this.cellScale },
          },
        });
        this.ext.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mouseM));

        this.visc = new ShaderPass({
          material: {
            vertexShader: face_vert,
            fragmentShader: viscous_frag,
            uniforms: {
              boundarySpace: { value: this.boundarySpace },
              velocity: { value: this.fbos.v1.texture },
              velocity_new: { value: this.fbos.vv0.texture },
              v: { value: this.options.viscous },
              px: { value: this.cellScale },
              dt: { value: this.options.dt },
            },
          },
          output: this.fbos.vv1,
        });
        this.divergence = new ShaderPass({
          material: {
            vertexShader: face_vert,
            fragmentShader: divergence_frag,
            uniforms: {
              boundarySpace: { value: this.boundarySpace },
              velocity: { value: this.fbos.vv1.texture },
              px: { value: this.cellScale },
              dt: { value: this.options.dt },
            },
          },
          output: this.fbos.div,
        });
        this.poisson = new ShaderPass({
          material: {
            vertexShader: face_vert,
            fragmentShader: poisson_frag,
            uniforms: {
              boundarySpace: { value: this.boundarySpace },
              pressure: { value: this.fbos.p0.texture },
              divergence: { value: this.fbos.div.texture },
              px: { value: this.cellScale },
            },
          },
          output: this.fbos.p1,
        });
        this.pressure = new ShaderPass({
          material: {
            vertexShader: face_vert,
            fragmentShader: pressure_frag,
            uniforms: {
              boundarySpace: { value: this.boundarySpace },
              pressure: { value: this.fbos.p1.texture },
              velocity: { value: this.fbos.vv1.texture },
              px: { value: this.cellScale },
              dt: { value: this.options.dt },
            },
          },
          output: this.fbos.v0,
        });
      }
      resize() {
        this.calcSize();
        Object.values(this.fbos).forEach((fbo: any) => fbo.setSize(this.fboSize.x, this.fboSize.y));
      }
      update() {
        this.boundarySpace.copy(this.options.isBounce ? new THREE.Vector2(0, 0) : this.cellScale);
        this.advection.uniforms.dt.value = this.options.dt;
        this.advection.uniforms.isBFECC.value = this.options.BFECC;
        this.advection.update();

        const mouse = this.ext.scene.children[0] as THREE.Mesh;
        const uniforms = (mouse.material as THREE.RawShaderMaterial).uniforms;
        uniforms.force.value.set((Mouse.diff.x / 2) * this.options.mouse_force, (Mouse.diff.y / 2) * this.options.mouse_force);
        uniforms.center.value.set(Mouse.coords.x, Mouse.coords.y);
        uniforms.scale.value.set(this.options.cursor_size, this.options.cursor_size);
        this.ext.update();

        this.visc.uniforms.v.value = this.options.viscous;
        this.visc.uniforms.dt.value = this.options.dt;
        this.visc.uniforms.velocity.value = this.fbos.v1.texture;
        this.visc.uniforms.velocity_new.value = this.fbos.vv0.texture;
        for (let i = 0; i < this.options.iterations_viscous; i += 1) {
          this.visc.props.output = i % 2 === 0 ? this.fbos.vv1 : this.fbos.vv0;
          this.visc.uniforms.velocity_new.value = i % 2 === 0 ? this.fbos.vv0.texture : this.fbos.vv1.texture;
          this.visc.update();
        }
        const velTex = this.options.isViscous ? this.fbos.vv1.texture : this.fbos.v1.texture;
        this.divergence.uniforms.velocity.value = velTex;
        this.divergence.update();

        this.poisson.uniforms.divergence.value = this.fbos.div.texture;
        for (let i = 0; i < this.options.iterations_poisson; i += 1) {
          this.poisson.props.output = i % 2 === 0 ? this.fbos.p1 : this.fbos.p0;
          this.poisson.uniforms.pressure.value = i % 2 === 0 ? this.fbos.p0.texture : this.fbos.p1.texture;
          this.poisson.update();
        }

        this.pressure.uniforms.velocity.value = velTex;
        this.pressure.uniforms.pressure.value = this.fbos.p1.texture;
        this.pressure.uniforms.dt.value = this.options.dt;
        this.pressure.update();
      }
    }

    class Output {
      simulation: any;
      scene: THREE.Scene;
      camera: THREE.Camera;
      constructor() {
        this.simulation = new Simulation({
          iterations_poisson: iterationsPoisson,
          iterations_viscous: iterationsViscous,
          mouse_force: mouseForce,
          resolution,
          cursor_size: cursorSize,
          viscous,
          isBounce,
          dt,
          isViscous,
          BFECC,
        });
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        const mesh = new THREE.Mesh(
          new THREE.PlaneGeometry(2, 2),
          new THREE.RawShaderMaterial({
            vertexShader: face_vert,
            fragmentShader: color_frag,
            transparent: true,
            depthWrite: false,
            uniforms: {
              velocity: { value: this.simulation.fbos.v0.texture },
              boundarySpace: { value: new THREE.Vector2() },
              palette: { value: paletteTex },
              bgColor: { value: bgVec4 },
            },
          })
        );
        this.scene.add(mesh);
      }
      resize() {
        this.simulation.resize();
      }
      update() {
        this.simulation.update();
        Common.renderer?.setRenderTarget(null);
        Common.renderer?.render(this.scene, this.camera);
      }
    }

    class WebGLManager {
      props: any;
      output: any;
      running = false;
      lastUserInteraction = performance.now();
      _loop: any;
      _resize: any;
      _onVisibility: any;
      constructor(props: any) {
        this.props = props;
        Common.init(props.$wrapper);
        Mouse.init(props.$wrapper);
        Mouse.autoIntensity = props.autoIntensity;
        Mouse.takeoverDuration = props.takeoverDuration;
        Mouse.onInteract = () => {
          this.lastUserInteraction = performance.now();
        };
        this.output = new Output();
        props.$wrapper.prepend(Common.renderer!.domElement);
        this._loop = this.loop.bind(this);
        this._resize = this.resize.bind(this);
        this._onVisibility = () => {
          if (document.hidden) this.pause();
          else if (isVisibleRef.current) this.start();
        };
        window.addEventListener("resize", this._resize);
        document.addEventListener("visibilitychange", this._onVisibility);
      }
      resize() {
        Common.resize();
        this.output.resize();
      }
      render() {
        Mouse.update();
        Common.update();
        this.output.update();
      }
      loop() {
        if (!this.running) return;
        this.render();
        rafRef.current = requestAnimationFrame(this._loop);
      }
      start() {
        if (this.running) return;
        this.running = true;
        this._loop();
      }
      pause() {
        this.running = false;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      dispose() {
        window.removeEventListener("resize", this._resize);
        document.removeEventListener("visibilitychange", this._onVisibility);
        Mouse.dispose();
        const renderer = Common.renderer;
        if (renderer) {
          const canvas = renderer.domElement;
          if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
          renderer.dispose();
          renderer.forceContextLoss();
        }
      }
    }

    const container = mountRef.current;
    container.style.position = container.style.position || "relative";
    container.style.overflow = container.style.overflow || "hidden";

    const webgl = new WebGLManager({
      $wrapper: container,
      autoDemo,
      autoSpeed,
      autoIntensity,
      takeoverDuration,
      autoResumeDelay,
      autoRampDuration,
    });
    webglRef.current = webgl;
    webgl.start();

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const visible = entry.isIntersecting && entry.intersectionRatio > 0;
        isVisibleRef.current = visible;
        if (!webglRef.current) return;
        if (visible && !document.hidden) webglRef.current.start();
        else webglRef.current.pause();
      },
      { threshold: [0, 0.01, 0.1] }
    );
    io.observe(container);
    intersectionObserverRef.current = io;

    const ro = new ResizeObserver(() => {
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      resizeRafRef.current = requestAnimationFrame(() => webglRef.current?.resize());
    });
    ro.observe(container);
    resizeObserverRef.current = ro;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resizeRafRef.current) cancelAnimationFrame(resizeRafRef.current);
      resizeObserverRef.current?.disconnect();
      intersectionObserverRef.current?.disconnect();
      webglRef.current?.dispose();
      webglRef.current = null;
    };
  }, [
    BFECC,
    autoDemo,
    autoIntensity,
    autoRampDuration,
    autoResumeDelay,
    autoSpeed,
    colors,
    cursorSize,
    dt,
    isBounce,
    isViscous,
    iterationsPoisson,
    iterationsViscous,
    mouseForce,
    resolution,
    takeoverDuration,
    viscous,
  ]);

  return <div ref={mountRef} className={`liquid-ether-container ${className}`} style={style} />;
}

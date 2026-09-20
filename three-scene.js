/* ============================================================
   StudyOS — three-scene.js
   The hero 3D composition: a floating open book, a progress
   ring with an orbiting marker, drifting study cards, soft
   particles and blob shadows. Reacts subtly to the cursor.
   Falls back silently when THREE or WebGL is unavailable.
   ============================================================ */

const HeroScene = (() => {

  function softCircleTexture(color = 'rgba(140,175,152,1)'){
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    grd.addColorStop(0, color); grd.addColorStop(1, 'rgba(140,175,152,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(32, 32, 30, 0, 7); g.fill();
    const t = new THREE.CanvasTexture(c); return t;
  }
  function blobShadowTexture(){
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 6, 64, 64, 62);
    grd.addColorStop(0, 'rgba(18,40,28,.34)'); grd.addColorStop(1, 'rgba(18,40,28,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }

  function buildBook(){
    const book = new THREE.Group();
    const coverMat = new THREE.MeshStandardMaterial({ color: 0x1E4D36, roughness: .48, metalness: .07 });
    const coverMat2 = new THREE.MeshStandardMaterial({ color: 0x16402D, roughness: .55, metalness: .07 });
    const pageA = new THREE.MeshStandardMaterial({ color: 0xFBF7EC, roughness: .9 });
    const pageB = new THREE.MeshStandardMaterial({ color: 0xF1ECDD, roughness: .95 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xC9A45C, roughness: .35, metalness: .45 });

    const mkHalf = (side) => {           /* side: -1 left, +1 right */
      const g = new THREE.Group();
      const cover = new THREE.Mesh(new THREE.BoxGeometry(1.58, .07, 2.3), coverMat);
      cover.position.set(side * .79, 0, 0);
      g.add(cover);
      for (let i = 0; i < 4; i++){        /* stacked pages */
        const p = new THREE.Mesh(new THREE.BoxGeometry(1.42 - i*.015, .045, 2.14 - i*.03), i % 2 ? pageB : pageA);
        p.position.set(side * (.79 - .02), .062 + i * .048, 0);
        g.add(p);
      }
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.36, .02, 2.06), pageA); /* top page */
      top.position.set(side * (.79 - .05), .062 + 4 * .048, 0);
      g.add(top);
      g.rotation.z = side * .34;          /* open V angle around spine (z) */
      return g;
    };
    const left = mkHalf(-1), right = mkHalf(1);
    right.position.y = .012;
    book.add(left, right);
    const spine = new THREE.Mesh(new THREE.BoxGeometry(.14, .16, 2.32), coverMat2);
    spine.position.y = -.02;
    book.add(spine);
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(.09, .012, .62), goldMat);
    ribbon.position.set(.62, .27, -.72); ribbon.rotation.z = .12;
    book.add(ribbon);
    book.rotation.set(-.52, .62, .1);
    return book;
  }

  function create(container, opts = {}){
    if (typeof THREE === 'undefined'){ return null; }
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch(e){ return null; }
    const compact = !!opts.compact;
    const reduce = document.documentElement.classList.contains('reduce-motion') ||
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(compact ? 36 : 33, 1, .1, 100);
    camera.position.set(0, compact ? 1.1 : 1.5, compact ? 7.6 : 8.4);
    camera.lookAt(0, .12, 0);

    scene.add(new THREE.HemisphereLight(0xfff6e8, 0xd9e4d6, 1.0));
    const key = new THREE.DirectionalLight(0xffffff, 1.05); key.position.set(4.5, 7, 4); scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fcaaf, .45); fill.position.set(-6, 2.5, -2); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xd8bc72, .5); rim.position.set(-2, 4.5, -6); scene.add(rim);

    const root = new THREE.Group(); scene.add(root);

    /* --- open book (centerpiece) --- */
    const book = buildBook();
    book.position.set(0, .42, 0);
    root.add(book);

    /* --- progress ring + orbiting gold marker --- */
    const ringGroup = new THREE.Group();
    ringGroup.rotation.set(1.18, 0, .18);
    ringGroup.position.set(0, .35, 0);
    const R = 2.4;
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(R, .028, 12, 130),
      new THREE.MeshStandardMaterial({ color: 0x7FA98C, roughness: .4, metalness: .15, transparent: true, opacity: .65 }));
    ringGroup.add(ring);
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(R - .16, .012, 8, 110),
      new THREE.MeshStandardMaterial({ color: 0xBCCFC2, roughness: .5, transparent: true, opacity: .3 }));
    ringGroup.add(ring2);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(.11, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xD8BC72, roughness: .25, metalness: .6 }));
    ringGroup.add(marker);
    root.add(ringGroup);

    /* --- floating study cards --- */
    const cardGeo = new THREE.BoxGeometry(.98, .055, .7);
    const cardMats = [0xF7F4EA, 0x2D6A4F, 0xC3D6C9, 0xE7D9AE].map(c =>
      new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: .04 }));
    const cards = [];
    const cardSpots = compact
      ? [[-2.5, 1.4, -.6, .5], [2.6, .8, -1, -.4]]
      : [[-2.85, 1.75, -.7, .55], [2.95, 1.15, -1.2, -.5], [-2.2, -.45, .8, -.35], [2.35, -.75, .6, .4], [ .4, 2.45, -1.9, .15]];
    cardSpots.forEach((s, i) => {
      const m = new THREE.Mesh(cardGeo, cardMats[i % cardMats.length]);
      m.position.set(s[0], s[1], s[2]);
      m.rotation.set(Math.random()*.5 - .25, s[3], Math.random()*.4 - .2);
      m.userData = { phase: Math.random()*7, baseY: s[1], spin: .1 + Math.random()*.12 };
      cards.push(m); root.add(m);
    });

    /* --- abstract accents: matte sphere + gold pill --- */
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(.5, 40, 40),
      new THREE.MeshStandardMaterial({ color: 0xCFE3D3, roughness: .3, metalness: .05 }));
    sphere.position.set(-3.3, -.25, -1.6); sphere.userData = { phase: 2.2, baseY: -.25 };
    root.add(sphere); cards.push(sphere);

    const pill = new THREE.Mesh(new THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(.14, .55, 6, 14) : new THREE.SphereGeometry(.3, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xC9A45C, roughness: .3, metalness: .5 }));
    pill.position.set(3.35, 2.1, -.4); pill.rotation.z = .8; pill.userData = { phase: 4.4, baseY: 2.1 };
    root.add(pill); cards.push(pill);

    /* --- drifting particles --- */
    const pCount = compact ? 60 : 120;
    const pos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++){
      pos[i*3] = (Math.random()-.5) * 11; pos[i*3+1] = (Math.random()-.5) * 7; pos[i*3+2] = (Math.random()-.5) * 5 - 1;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({
      size: .06, map: softCircleTexture(), transparent: true, opacity: .5, depthWrite: false, color: 0x87ab93 }));
    root.add(pts);

    /* --- fake soft shadows --- */
    const shTex = blobShadowTexture();
    const mkShadow = (x, z, s) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s),
        new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI/2; m.position.set(x, -1.32, z);
      root.add(m); return m;
    };
    mkShadow(0, .1, 4.6); mkShadow(-2.85, -.5, 1.6); mkShadow(2.95, -1, 1.5);

    /* --- interaction & loop --- */
    let mx = 0, my = 0, running = false, raf = 0, t = Math.random()*10, last = performance.now();
    const onMouse = e => {
      const r = container.getBoundingClientRect();
      mx = clamp(((e.clientX - r.left) / r.width) - .5, -.6, .6);
      my = clamp(((e.clientY - r.top) / r.height) - .5, -.6, .6);
    };
    addEventListener('mousemove', onMouse, { passive: true });

    function frame(now){
      if (!running) return;
      const dt = Math.min(.05, (now - last)/1000); last = now; t += dt;
      book.position.y = .42 + Math.sin(t*.75)*.12;
      book.rotation.y = .62 + Math.sin(t*.3)*.09;
      book.rotation.x = -.52 + Math.sin(t*.5)*.035;
      const a = t*.42;
      marker.position.set(Math.cos(a)*R, Math.sin(a)*R*0 + 0, Math.sin(a)*R);
      marker.position.y = Math.sin(a)*R*0;
      cards.forEach(c => {
        c.position.y = c.userData.baseY + Math.sin(t*.6 + c.userData.phase)*.16;
        if (c !== sphere && c !== pill) c.rotation.y += (c.userData.spin || .1) * dt;
      });
      pts.rotation.y = t*.03;
      root.rotation.y += ((mx * (compact ? .1 : .22)) - root.rotation.y) * .045;
      root.rotation.x += ((my * .09) - root.rotation.x) * .045;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }

    function size(){
      const w = container.clientWidth || 300, h = container.clientHeight || 300;
      renderer.setSize(w, h); camera.aspect = w/h; camera.updateProjectionMatrix();
      if (reduce) renderer.render(scene, camera);
    }
    const ro = new ResizeObserver(size); ro.observe(container); size();

    const vis = new IntersectionObserver(es => {
      const show = es[0].isIntersecting;
      if (show && !running && !reduce){ running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      else if (!show && running){ running = false; cancelAnimationFrame(raf); }
    }, { threshold: .05 });
    vis.observe(container);
    const onVis = () => { if (document.hidden && running){ running = false; cancelAnimationFrame(raf); } };
    document.addEventListener('visibilitychange', onVis);

    return {
      destroy(){
        running = false; cancelAnimationFrame(raf);
        ro.disconnect(); vis.disconnect();
        removeEventListener('mousemove', onMouse);
        document.removeEventListener('visibilitychange', onVis);
        renderer.dispose();
        container.contains(renderer.domElement) && container.removeChild(renderer.domElement);
      }
    };
  }
  return { create };
})();

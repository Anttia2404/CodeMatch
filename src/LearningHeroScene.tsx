import { useEffect, useRef, useState } from 'react'
import type * as ThreeTypes from 'three'

/** A small, decorative Three.js learning network. It has no data or network calls. */
export function LearningHeroScene() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let running = false
    let frame = 0
    let inView = false
    let renderer: ThreeTypes.WebGLRenderer | undefined
    let resizeObserver: ResizeObserver | undefined
    let intersectionObserver: IntersectionObserver | undefined
    let removeVisibilityListener: (() => void) | undefined
    let scene: ThreeTypes.Scene | undefined
    let camera: ThreeTypes.PerspectiveCamera | undefined
    let root: ThreeTypes.Group | undefined
    const animationStart = performance.now()

    if (typeof window.matchMedia !== 'function' || typeof IntersectionObserver === 'undefined' || typeof ResizeObserver === 'undefined' || typeof WebGLRenderingContext === 'undefined') return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    async function start() {
      const THREE = await import('three')
      if (disposed || !host) return

      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80)
      camera.position.set(0, 5.6, 8.7)
      camera.lookAt(0, 0.1, 0)
      root = new THREE.Group()
      root.scale.setScalar(0.78)
      root.position.y = 1.05
      scene.add(root)

      const warmPage = new THREE.MeshStandardMaterial({ color: '#b6c2b6', roughness: 0.9, transparent: true, opacity: 0.72, depthWrite: false })
      const pageEdge = new THREE.MeshStandardMaterial({ color: '#78877d', roughness: 0.92 })
      const sage = new THREE.MeshBasicMaterial({ color: '#9fc7b8', transparent: true, opacity: 0.82 })
      const sageLine = new THREE.LineBasicMaterial({ color: '#9fc7b8', transparent: true, opacity: 0.3 })
      const lineBright = new THREE.LineBasicMaterial({ color: '#c4ded2', transparent: true, opacity: 0.68 })

      const ambient = new THREE.HemisphereLight('#d8e6df', '#18201e', 1.4)
      scene.add(ambient)
      const keyLight = new THREE.DirectionalLight('#d2e9dd', 1.8)
      keyLight.position.set(-3, 7, 5)
      scene.add(keyLight)

      const book = new THREE.Group()
      book.position.set(0, 0.18, 0)
      book.rotation.x = -0.16
      root.add(book)

      const cover = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.13, 1.9), pageEdge)
      cover.position.y = -0.12
      book.add(cover)
      const pages = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.11, 1.82), warmPage)
      pages.position.y = -0.025
      book.add(pages)

      for (let side = -1; side <= 1; side += 2) {
        const page = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.045, 1.74), warmPage)
        page.position.set(side * 0.47, 0.055, 0)
        page.rotation.z = side * -0.035
        book.add(page)

        for (let row = 0; row < 5; row += 1) {
          const width = row === 4 ? 0.42 : 0.58 + (row % 2) * 0.12
          const rule = new THREE.Mesh(new THREE.BoxGeometry(width, 0.009, 0.012), pageEdge)
          rule.position.set(side * (0.48 + (row % 2) * 0.04), 0.084, -0.58 + row * 0.28)
          book.add(rule)
        }
      }

      const ringGroup = new THREE.Group()
      ringGroup.rotation.set(0.32, 0.08, -0.12)
      root.add(ringGroup)
      for (const [radius, opacity] of [[2.25, 0.56], [2.85, 0.25], [3.38, 0.16]] as const) {
        const points = Array.from({ length: 129 }, (_, index) => {
          const angle = (index / 128) * Math.PI * 2
          return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
        })
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({ color: '#9fc7b8', transparent: true, opacity })
        ringGroup.add(new THREE.LineLoop(geometry, material))
      }

      const topics = [
        new THREE.Vector3(-2.85, 0.72, -0.5),
        new THREE.Vector3(-2.15, 0.9, 1.05),
        new THREE.Vector3(2.55, 0.48, -0.9),
        new THREE.Vector3(2.8, 0.85, 0.55),
        new THREE.Vector3(-0.45, 1.42, -2.2),
      ]
      const nodes: Array<{ object: ThreeTypes.Group; phase: number; baseY: number }> = []
      topics.forEach((point, index) => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.35, 0),
          new THREE.Vector3(point.x * 0.48, 0.75, point.z * 0.4),
          point,
        ])
        root!.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(36)), sageLine))

        const node = new THREE.Group()
        node.position.copy(point)
        const body = new THREE.Mesh(new THREE.IcosahedronGeometry(index % 2 === 0 ? 0.16 : 0.12, 1), sage)
        const wire = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), lineBright)
        node.add(body, wire)
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: '#e5eee6' }))
        beacon.position.set(0.19, 0.18, 0.04)
        node.add(beacon)
        root!.add(node)
        nodes.push({ object: node, phase: index * 1.2, baseY: point.y })
      })

      const dpr = Math.min(window.devicePixelRatio || 1, window.matchMedia('(max-width: 760px)').matches ? 1.25 : 1.6)
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: dpr > 1, powerPreference: 'low-power' })
      renderer.setPixelRatio(dpr)
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 0.95
      renderer.domElement.className = 'learning-scene__canvas'
      renderer.domElement.setAttribute('aria-hidden', 'true')
      host.appendChild(renderer.domElement)

      const resize = () => {
        if (!renderer || !camera || !host) return
        const width = Math.max(1, host.clientWidth)
        const height = Math.max(1, host.clientHeight)
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.position.y = width < 600 ? 7.8 : width < 900 ? 6.2 : 5.6
        camera.position.z = width < 600 ? 13.2 : width < 900 ? 10.2 : 8.7
        root!.position.y = width < 600 ? 3.7 : width < 900 ? 1.35 : 1.05
        root!.scale.setScalar(width < 600 ? 0.68 : 0.78)
        camera.updateProjectionMatrix()
      }
      resize()
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(host)
      setReady(true)

      const animate = (now: number) => {
        frame = 0
        if (disposed || !running || !scene || !camera || !renderer || !root) return
        const seconds = (now - animationStart) / 1000
        const movement = reduceMotion ? 0 : seconds
        root.rotation.y = Math.sin(movement * 0.16) * 0.12
        root.rotation.x = Math.sin(movement * 0.12) * 0.025
        book.position.y = 0.18 + Math.sin(movement * 0.7) * 0.035
        ringGroup.rotation.y = movement * 0.045
        nodes.forEach(({ object, phase, baseY }) => {
          object.position.y = baseY + Math.sin(movement * 0.72 + phase) * 0.07
          object.rotation.x = movement * 0.2 + phase
          object.rotation.y = movement * 0.28 + phase
        })
        renderer.render(scene, camera)
        frame = window.requestAnimationFrame(animate)
      }

      const setRunning = (value: boolean) => {
        inView = value
        running = value && !document.hidden
        if (running && !reduceMotion && !frame) frame = window.requestAnimationFrame(animate)
        if (running && reduceMotion && !frame) {
          renderer?.render(scene!, camera!)
          frame = -1
        }
        if (!running && frame > 0) {
          window.cancelAnimationFrame(frame)
          frame = 0
        }
      }
      const onVisibilityChange = () => setRunning(inView)
      intersectionObserver = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting))
      intersectionObserver.observe(host)
      document.addEventListener('visibilitychange', onVisibilityChange)
      removeVisibilityListener = () => document.removeEventListener('visibilitychange', onVisibilityChange)
    }

    void start().catch(() => setReady(false))
    return () => {
      disposed = true
      if (frame > 0) window.cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      intersectionObserver?.disconnect()
      renderer?.dispose()
      removeVisibilityListener?.()
      scene?.traverse((object) => {
        const renderable = object as ThreeTypes.Mesh
        renderable.geometry?.dispose()
        if (Array.isArray(renderable.material)) renderable.material.forEach((material) => material.dispose())
        else renderable.material?.dispose()
      })
      renderer?.domElement.remove()
    }
  }, [])

  return <div ref={hostRef} className={`learning-scene${ready ? ' is-ready' : ''}`} aria-hidden="true">
    <div className="learning-scene__fallback"><span className="scene-orbit scene-orbit--one" /><span className="scene-orbit scene-orbit--two" /><span className="scene-book"><i /><i /><i /><i /></span><span className="scene-node scene-node--one" /><span className="scene-node scene-node--two" /><span className="scene-node scene-node--three" /></div>
  </div>
}

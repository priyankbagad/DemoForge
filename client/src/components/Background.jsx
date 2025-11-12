import React, { useEffect, useRef } from 'react'

export default function Background(){
  const ref = useRef(null)
  useEffect(()=>{
    const c = ref.current, ctx = c.getContext('2d', { alpha: false })
    let raf=0, t=0
    const resize=()=>{ c.width=window.innerWidth; c.height=window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    function rnd(x,y){ return Math.sin(x*0.0027 + Math.cos(y*0.0021 + t))*0.5 + 0.5 }
    function frame(){
      const {width:w,height:h}=c
      const img = ctx.createImageData(w,h); const d=img.data
      for (let y=0; y<h; y++){
        for (let x=0; x<w; x++){
          const v = rnd(x,y)*0.95
          const r = 155*v, g = 255*v, b = 246*v*0.9
          const i=(y*w+x)*4
          d[i]=r*0.18; d[i+1]=g*0.18; d[i+2]=b*0.22; d[i+3]=255
        }
      }
      ctx.putImageData(img,0,0); t+=0.004; raf=requestAnimationFrame(frame)
    }
    raf=requestAnimationFrame(frame)
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  },[])
  return <canvas className="bg" ref={ref} />
}

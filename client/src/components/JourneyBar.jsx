import React, { useEffect, useRef } from 'react'
import anime from 'animejs'

export default function JourneyBar({ running, ok=true }){
  const ref = useRef(null)
  useEffect(()=>{
    if (!ref.current) return
    const el = ref.current
    const dots = el.querySelectorAll('.journey-dot')
    if (running){
      anime.remove(dots)
      anime({
        targets: dots,
        translateX: [0, 520],
        easing: 'easeInOutSine',
        duration: 1100,
        delay: anime.stagger(120),
        direction: 'alternate',
        loop: true
      })
    } else {
      anime.remove(dots)
      dots.forEach(d=> d.style.transform = 'translateX(0px)')
    }
  }, [running])

  return (
    <div style={{position:'relative', height:40, margin:'8px 0 10px'}}>
      <div style={{position:'absolute', top:18, left:0, right:0, height:4, background:'rgba(255,255,255,.08)', borderRadius:4}} />
      <div className="journey-dot" style={{position:'absolute', top:8, left:0, width:10, height:10, borderRadius:10, background: ok? '#75f9c1':'#ff6b6b', boxShadow:'0 0 16px rgba(117,249,193,.5)'}} />
      <div className="journey-dot" style={{position:'absolute', top:18, left:0, width:10, height:10, borderRadius:10, background: ok? '#9bfff6':'#ff9b9b', boxShadow:'0 0 16px rgba(155,255,246,.5)'}} />
      <div className="journey-dot" style={{position:'absolute', top:28, left:0, width:10, height:10, borderRadius:10, background: ok? '#c0b5ff':'#ffc0c0', boxShadow:'0 0 16px rgba(192,181,255,.5)'}} />
    </div>
  )
}

import React from 'react'
import '../pages/Login.css'

export default function SliderBoxes({ active, onChange }) {
  const positions = ['15%', '50%']

  return (
    <>
      {/* 1) Background placeholders behind the forms */}
      <div className="placeholder-container">
        {positions.map((pos, i) => (
          <div
            key={i}
            className="placeholder-box"
            style={{ left: pos }}
          />
        ))}
      </div>

      {/* 2) Slider highlight + logo that moves to opposite side */}
      <div className="slider-container">
        <div
          className="slider-box"
          style={{ left: positions[active === 0 ? 1 : 0] }}
        >
          {/* logo on the opposite side of the active form */}
          <img
            src={`${process.env.PUBLIC_URL}/gravepath3.png`}
            alt="Grave Path Logo"
            className="slider-image"
          />
        </div>
      </div>
    </>
  )
}

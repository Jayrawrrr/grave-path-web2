import React from 'react'
import '../pages/Login.css'

export default function SliderBoxes({ active, onChange }) {
  const positions = ['15%', '50%']

  return (
    <>
      {/* 1) Placeholders (blur) behind the form */}
      <div className="placeholder-container">
        {positions.map((pos, i) => (
          <div
            key={i}
            className="box placeholder"
            style={{ left: pos }}
            
          />
        ))}
      </div>

      {/* 2) Slider highlight + logo rides ON TOP */}
      <div className="slider-container">
        <div
          className="box slider"
          style={{ left: positions[active] }}
        >
          {/* logo always inside the sliding box */}
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

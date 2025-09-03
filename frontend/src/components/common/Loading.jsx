import React from 'react'

const Loading = ({ size = '20px' }) => {
  return (
    <div 
      className="spinner"
      style={{
        width: size,
        height: size,
        border: `2px solid #f3f3f3`,
        borderTop: `2px solid var(--primary-blue)`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    />
  )
}

export default Loading
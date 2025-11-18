import React, { useEffect, useState } from 'react'
import './Card.css'

export interface ItemOption {
  id: number
  title: string
  avatar: string
  user: string
  views: number
  width: number
  height: number
  url: string
}

export interface CardProps {
  item: ItemOption
  onlyImage?: boolean
  noImage?: boolean
  width?: string
}

export const Card: React.FC<CardProps> = ({ item, onlyImage = false, noImage = false, width = '100%' }) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!noImage) {
      const image = new Image()
      image.src = item.url
      if (image.complete) {
        setLoaded(true)
        return
      }
      image.onload = () => {
        setLoaded(true)
      }
      image.onerror = () => {
        setLoaded(true)
      }
    }
  }, [item.url, noImage])

  const cardHeight = noImage ? 'auto' : '100%'

  return (
    <article className="card" data-id={item.id} style={{ width, height: cardHeight }}>
      {!onlyImage && (
        <div className="body">
          <h3>{item.title}</h3>
          <div className="author">
            <div className="avatar">
              <img src={item.avatar} alt={item.user} />
              <span>{item.user}</span>
            </div>
            <div className="views">❤️ {item.views > 999 ? '999+' : item.views}</div>
          </div>
        </div>
      )}
      {!noImage && (
        <div className="cover">
          {loaded ? (
            <img src={item.url} alt="图片" />
          ) : (
            <div className="loading-circle" />
          )}
        </div>
      )}
    </article>
  )
}

export default Card

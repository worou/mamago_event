import { useMemo } from 'react'
import { PinIcon } from '../Icons'

const TILE = 256

/**
 * Position du point en « pixels monde » pour un zoom donné
 * (projection Web Mercator, celle des tuiles OSM).
 */
function project(latitude, longitude, zoom) {
  const scale = 2 ** zoom * TILE
  const rad = (latitude * Math.PI) / 180

  return {
    x: ((longitude + 180) / 360) * scale,
    y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale,
  }
}

/**
 * Carte du lieu composée de tuiles OpenStreetMap.
 *
 * L'iframe d'intégration d'OSM a été écartée : ses ressources internes sont
 * bloquées (ERR_BLOCKED_BY_ORB) et la carte restait vide. De simples balises
 * <img> sur les tuiles sont fiables, sans clé d'API ni script tiers —
 * contrairement à l'intégration Google que suggère la maquette.
 */
export default function VenueMap({
  latitude,
  longitude,
  location,
  zoom = 15,
  height = 256,
}) {
  const tiles = useMemo(() => {
    if (latitude == null || longitude == null) return null

    const width = 900 // Largeur de calcul ; le conteneur recadre à l'affichage.
    const center = project(latitude, longitude, zoom)

    // Coin supérieur gauche du conteneur, en pixels monde.
    const originX = center.x - width / 2
    const originY = center.y - height / 2

    const firstX = Math.floor(originX / TILE)
    const lastX = Math.floor((originX + width) / TILE)
    const firstY = Math.floor(originY / TILE)
    const lastY = Math.floor((originY + height) / TILE)

    const max = 2 ** zoom
    const list = []

    for (let ty = firstY; ty <= lastY; ty++) {
      if (ty < 0 || ty >= max) continue
      for (let tx = firstX; tx <= lastX; tx++) {
        // Enroulement horizontal autour de l'antiméridien.
        const wrapped = ((tx % max) + max) % max
        list.push({
          key: `${tx}-${ty}`,
          url: `https://tile.openstreetmap.org/${zoom}/${wrapped}/${ty}.png`,
          left: tx * TILE - originX,
          top: ty * TILE - originY,
        })
      }
    }

    return { list, width }
  }, [latitude, longitude, zoom, height])

  if (!tiles) return null

  const osmLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <div className="relative overflow-hidden bg-slate-200" style={{ height }}>
        <div className="absolute inset-0">
          {tiles.list.map((tile) => (
            <img
              key={tile.key}
              src={tile.url}
              alt=""
              loading="lazy"
              width={TILE}
              height={TILE}
              className="absolute max-w-none select-none"
              style={{ left: tile.left, top: tile.top }}
            />
          ))}
        </div>

        {/* Repère au centre géométrique, qui correspond aux coordonnées. */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white shadow-lg ring-4 ring-white/70">
            <PinIcon className="h-5 w-5" />
          </span>
        </div>

        {location && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-4 py-1.5 text-xs font-semibold text-slate-800 shadow">
            {location}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
        <p className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
          <PinIcon className="h-4 w-4 shrink-0 text-brand-600" />
          <span className="truncate">{location}</span>
        </p>
        <a
          href={osmLink}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-sm font-semibold text-brand-700 hover:underline"
        >
          Itinéraire
        </a>
      </div>

      {/* L'attribution est exigée par la licence des tuiles OSM. */}
      <p className="border-t border-slate-100 bg-white px-4 pb-2 text-[10px] text-slate-400">
        © Contributeurs{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          OpenStreetMap
        </a>
      </p>
    </div>
  )
}

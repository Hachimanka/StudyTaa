import express from 'express'
import { Readable } from 'stream'

const router = express.Router()

const FALLBACK_CATEGORY = 'lofi'

const ALLOWED_PROXY_HOSTS = new Set(['www.soundhelix.com', 'soundhelix.com'])

const PLAYLISTS = {
  lofi: {
    id: '6399367984',
    label: 'LoFi Girl Favorites',
    description: 'Curated chill beats from LoFi Girl.',
    artwork: 'https://cdn-images.dzcdn.net/images/playlist/dd65e37cd15fd92d2d4a24f71ecd9990/500x500-000000-80-0-0.jpg'
  },
  chillhop: {
    id: '7917934722',
    label: 'Late Night Vibes',
    description: 'Chillhop and ambient lo-fi to focus anytime.',
    artwork: 'https://cdn-images.dzcdn.net/images/playlist/d7339dcf3f95c8dfbaf5f294fb315cec/500x500-000000-80-0-0.jpg'
  },
  sleep: {
    id: '6399369944',
    label: 'Sleep LoFi',
    description: 'Soft lo-fi instrumentals for evening study sessions.',
    artwork: 'https://cdn-images.dzcdn.net/images/playlist/ab13740f24c6f25b2da2bf1cb5068a10/500x500-000000-80-0-0.jpg'
  },
  jazz: {
    id: '1807219322',
    label: 'LoFi Jazz',
    description: 'Jazz-flavoured lo-fi grooves with mellow horns.',
    artwork: 'https://cdn-images.dzcdn.net/images/playlist/dfa8d945383a5be59514bc404651d3a2/500x500-000000-80-0-0.jpg'
  },
  ambient: {
    id: '12433782343',
    label: 'Dream Ambient',
    description: 'Atmospheric ambient textures to keep your focus steady.',
    artwork: 'https://cdn-images.dzcdn.net/images/playlist/9e5831f7e6c9dfb65479e17aae787d17/500x500-000000-80-0-0.jpg'
  }
}

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

const getFetch = async () => {
  if (typeof fetch === 'function') return fetch
  const module = await import('node-fetch')
  return module.default
}

router.get('/music/categories', (req, res) => {
  const categories = Object.entries(PLAYLISTS).map(([key, meta]) => ({
    key,
    label: meta.label,
    description: meta.description,
    artwork: meta.artwork
  }))

  res.json({ categories })
})

router.get('/music/tracks', async (req, res) => {
  const category = (req.query.category || FALLBACK_CATEGORY).toLowerCase()
  const playlist = PLAYLISTS[category] || PLAYLISTS[FALLBACK_CATEGORY]

  try {
    const fetchImpl = await getFetch()
    const response = await fetchImpl(`https://api.deezer.com/playlist/${playlist.id}`)

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to reach Deezer playlist', status: response.status })
    }

    const payload = await response.json()
    const tracks = (payload?.tracks?.data || [])
      .filter((item) => Boolean(item?.preview))
      .map((item) => {
        const previewDurationSeconds = 30
        return {
        id: item.id,
        title: item.title || item.title_short,
        artist: item.artist?.name || 'Unknown artist',
        album: item.album?.title || '',
        url: item.preview,
        artwork: item.album?.cover_medium || payload.picture_medium || playlist.artwork,
  durationSeconds: previewDurationSeconds,
  durationLabel: formatDuration(previewDurationSeconds),
        isPreview: true
      }
      })

    res.json({
      category,
      playlist: {
        id: playlist.id,
        title: payload?.title || playlist.label,
        description: payload?.description || playlist.description,
        artwork: payload?.picture_medium || playlist.artwork
      },
      tracks
    })
  } catch (error) {
    console.error('Deezer fetch failed:', error)
    res.status(502).json({
      error: 'Failed to load tracks from upstream service',
      details: error.message
    })
  }
})

const toNodeStream = (body) => {
  if (!body) return null
  if (typeof body.pipe === 'function') return body
  if (Readable && typeof Readable.fromWeb === 'function') {
    try {
      return Readable.fromWeb(body)
    } catch (error) {
      console.warn('Failed to convert Web stream to Node stream', error)
    }
  }
  return null
}

router.get('/music/proxy', async (req, res) => {
  const { url: targetUrl } = req.query
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url query parameter' })
  }

  let parsed
  try {
    parsed = new URL(targetUrl)
  } catch (error) {
    return res.status(400).json({ error: 'Invalid url provided' })
  }

  if (!ALLOWED_PROXY_HOSTS.has(parsed.hostname)) {
    return res.status(403).json({ error: 'Requested host is not allowed' })
  }

  try {
    const fetchImpl = await getFetch()
    const upstream = await fetchImpl(parsed.toString(), {
      headers: {
        'User-Agent': 'StudyTaMusicProxy/1.0'
      }
    })

    if (!upstream.ok || !upstream.body) {
      return res.status(upstream.status || 502).json({
        error: 'Failed to fetch upstream resource',
        status: upstream.status
      })
    }

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg'
    const contentLength = upstream.headers.get('content-length')
    res.setHeader('Content-Type', contentType)
    if (contentLength) {
      res.setHeader('Content-Length', contentLength)
    }
    res.setHeader('Cache-Control', 'public, max-age=86400')

    const stream = toNodeStream(upstream.body)
    if (stream) {
      stream.on('error', (streamError) => {
        console.error('Music proxy stream error:', streamError)
        if (!res.headersSent) {
          res.status(502).json({ error: 'Upstream stream error' })
        } else {
          res.destroy(streamError)
        }
      })
      stream.pipe(res)
      return
    }

    const arrayBuffer = await upstream.arrayBuffer()
    res.end(Buffer.from(arrayBuffer))
  } catch (error) {
    console.error('Music proxy failed:', error)
    res.status(502).json({
      error: 'Unable to proxy audio resource',
      details: error.message
    })
  }
})

export default router

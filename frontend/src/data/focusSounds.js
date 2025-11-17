const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '')
const PROXY_ROUTE = '/api/music/proxy'

const buildProxyUrl = (url) => {
  if (!url || !/^https?:/i.test(url)) return url
  return `${API_BASE}${PROXY_ROUTE}?url=${encodeURIComponent(url)}`
}

export const rawFocusSounds = {
  nature: [
    { id: 1, name: 'Forest Rain', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', type: 'audio', duration: '8:00:00' },
    { id: 2, name: 'Ocean Waves', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', type: 'audio', duration: '10:00:00' },
    { id: 3, name: 'Thunderstorm', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', type: 'audio', duration: '8:00:00' },
    { id: 4, name: 'Crackling Fire', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', type: 'audio', duration: '12:00:00' }
  ],
  lofi: [
    { id: 5, name: 'Lofi Hip Hop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', type: 'audio', duration: '24/7' },
    { id: 6, name: 'Chill Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', type: 'audio', duration: '24/7' },
    { id: 7, name: 'Study Jazz', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', type: 'audio', duration: '24/7' }
  ],
  ambient: [
    { id: 8, name: 'Space Ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', type: 'audio', duration: '8:00:00' },
    { id: 9, name: 'Deep Meditation', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', type: 'audio', duration: '8:00:00' },
    { id: 10, name: 'Binaural Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', type: 'audio', duration: '8:00:00' }
  ],
  classical: [
    { id: 11, name: 'Bach Focus', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', type: 'audio', duration: '2:00:00' },
    { id: 12, name: 'Mozart Study', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', type: 'audio', duration: '3:00:00' },
    { id: 13, name: 'Chopin Peaceful', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', type: 'audio', duration: '2:30:00' }
  ]
}

export const focusSounds = Object.fromEntries(
  Object.entries(rawFocusSounds).map(([category, tracks]) => [
    category,
    tracks.map((track) => ({
      ...track,
      sourceUrl: track.url,
      url: buildProxyUrl(track.url)
    }))
  ])
)

export default focusSounds

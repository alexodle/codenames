module.exports = () => {
  if (!process.env.API_BASE_URL) {
    throw new Error('Missing required env var at build-time: API_BASE_URL')
  }
  return {
    env: {
      API_BASE_URL: process.env.API_BASE_URL,
      ASSET_BASE_URL: process.env.API_BASE_URL,
    }
  }
}

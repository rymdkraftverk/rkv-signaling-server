const url = process.env.SLACK_WEBHOOK_URL

export const postScoreBoard = async (scoreBoard: unknown) => {
  if (!url) {
    console.log('SLACK_WEBHOOK_URL not configured')
    return
  }

  const body = JSON.stringify({
    username: 'Score board monitor',
    // Nested stringification to receive the string representation in slack
    text:     JSON.stringify(scoreBoard),
  })

  await fetch(
    url,
    {
      method:  'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

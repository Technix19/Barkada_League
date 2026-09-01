// Shared match validation rules (project spec section 33).
//
// Used both by MatchForm for instant client-side feedback and by the mock
// service layer to stand in for server-side validation. When the real
// Express API exists, the backend re-runs equivalent checks and remains
// the final authority.

export function validateMatchForm(formData, { players, seasons }) {
  const errors = {}

  if (!formData.seasonId) {
    errors.seasonId = 'Season is required.'
  } else if (!seasons.some((s) => String(s.id) === String(formData.seasonId))) {
    errors.seasonId = 'Selected season does not exist.'
  }

  if (!formData.player1Id) {
    errors.player1Id = 'Player 1 is required.'
  } else if (!players.some((p) => String(p.id) === String(formData.player1Id))) {
    errors.player1Id = 'Selected player does not exist.'
  }

  if (!formData.player2Id) {
    errors.player2Id = 'Player 2 is required.'
  } else if (!players.some((p) => String(p.id) === String(formData.player2Id))) {
    errors.player2Id = 'Selected player does not exist.'
  }

  if (
    formData.player1Id &&
    formData.player2Id &&
    String(formData.player1Id) === String(formData.player2Id)
  ) {
    errors.player2Id = 'Player 2 must be different from Player 1.'
  }

  const score1 = formData.player1Score
  const score2 = formData.player2Score

  if (score1 === '' || score1 === null || score1 === undefined) {
    errors.player1Score = 'Score is required.'
  } else if (!Number.isInteger(Number(score1)) || Number(score1) < 0) {
    errors.player1Score = 'Score must be a whole number of 0 or more.'
  }

  if (score2 === '' || score2 === null || score2 === undefined) {
    errors.player2Score = 'Score is required.'
  } else if (!Number.isInteger(Number(score2)) || Number(score2) < 0) {
    errors.player2Score = 'Score must be a whole number of 0 or more.'
  }

  if (
    !errors.player1Score &&
    !errors.player2Score &&
    Number(score1) === Number(score2)
  ) {
    errors.player2Score = 'Scores cannot be tied.'
  }

  if (!formData.playedAt) {
    errors.playedAt = 'Played date is required.'
  }

  return errors
}

export function deriveWinnerId(formData) {
  return Number(formData.player1Score) > Number(formData.player2Score)
    ? Number(formData.player1Id)
    : Number(formData.player2Id)
}

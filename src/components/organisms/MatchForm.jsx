import { useState } from 'react'
import Button from '../atoms/Button.jsx'
import Input from '../atoms/Input.jsx'
import Select from '../atoms/Select.jsx'
import FormField from '../molecules/FormField.jsx'
import { validateMatchForm } from '../../utils/validateMatch.js'

export default function MatchForm({
  players,
  seasons,
  initialValues,
  onSubmit,
  submitLabel = 'Save Match',
  submitting = false,
  submitError = null,
}) {
  const [formData, setFormData] = useState(initialValues)
  const [errors, setErrors] = useState({})

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateMatchForm(formData, { players, seasons })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {submitError && (
        <div className="form-banner-error" role="alert">
          {submitError}
        </div>
      )}

      <FormField label="Season" htmlFor="seasonId" error={errors.seasonId}>
        <Select
          id="seasonId"
          value={formData.seasonId}
          invalid={Boolean(errors.seasonId)}
          onChange={(e) => updateField('seasonId', e.target.value)}
        >
          <option value="">Select a season</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="form-grid">
        <FormField label="Player 1" htmlFor="player1Id" error={errors.player1Id}>
          <Select
            id="player1Id"
            value={formData.player1Id}
            invalid={Boolean(errors.player1Id)}
            onChange={(e) => updateField('player1Id', e.target.value)}
          >
            <option value="">Select player 1</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Player 2" htmlFor="player2Id" error={errors.player2Id}>
          <Select
            id="player2Id"
            value={formData.player2Id}
            invalid={Boolean(errors.player2Id)}
            onChange={(e) => updateField('player2Id', e.target.value)}
          >
            <option value="">Select player 2</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <div className="matchup-grid">
        <FormField label="Player 1 Score" htmlFor="player1Score" error={errors.player1Score}>
          <Input
            id="player1Score"
            className="score-input"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={formData.player1Score}
            invalid={Boolean(errors.player1Score)}
            onChange={(e) => updateField('player1Score', e.target.value)}
          />
        </FormField>

        <span className="vs-label" aria-hidden="true">
          VS
        </span>

        <FormField label="Player 2 Score" htmlFor="player2Score" error={errors.player2Score}>
          <Input
            id="player2Score"
            className="score-input"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={formData.player2Score}
            invalid={Boolean(errors.player2Score)}
            onChange={(e) => updateField('player2Score', e.target.value)}
          />
        </FormField>
      </div>

      <FormField label="Date Played" htmlFor="playedAt" error={errors.playedAt}>
        <Input
          id="playedAt"
          type="date"
          value={formData.playedAt}
          invalid={Boolean(errors.playedAt)}
          onChange={(e) => updateField('playedAt', e.target.value)}
        />
      </FormField>

      <div className="form-actions">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

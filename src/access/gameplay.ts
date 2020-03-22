import { query, withTransaction } from "../db"
import { GameEvent, SpecCardCell, Team, TeamBoardSpec } from "../types/model"
import { NotFoundError } from "../util/errors"
import { ensureUpdated } from "./util"

export const getTeamBoardSpecs = async (gameID: number): Promise<TeamBoardSpec[]> => {
  return await Promise.all([getTeamBoardSpec(gameID, '1'), getTeamBoardSpec(gameID, '2')])
}

export const getTeamBoardSpec = async (gameID: number, team: Team): Promise<TeamBoardSpec> => {
  const teamSpecResult = await query<TeamBoardSpec>(`
    SELECT team, spec_card_id, spec_card_side
    FROM team_board_spec
    WHERE game_id = $1 AND team = $2
    LIMIT 1;
    `, [gameID, team])
  if (!teamSpecResult.rows.length) {
    throw new NotFoundError(`Team board spec not found for gameID:${gameID}, team:${team}`)
  }
  const teamSpecCard = teamSpecResult.rows[0]
  const result = await query<SpecCardCell>(`
    SELECT row, col, cell_type
    FROM spec_card_cell
    WHERE spec_card_id = $1 AND side = $2
    ORDER BY row ASC, col ASC;
    `, [teamSpecCard.spec_card_id, teamSpecCard.spec_card_side])
  if (!result.rows.length) {
    throw new NotFoundError(`Team board spec cells not found for gameID:${gameID}, team:${team}`)
  }
  teamSpecCard.specCardCells = result.rows
  return teamSpecCard
}

export const setHint = async (gameID: number, turnNum: number, hint: string, hintNum: number) => {
  ensureUpdated('Hint either not found or given out of sync', await query(`
    UPDATE game_turn
    SET hint_word = $3, hint_num = $4
    WHERE game_id = $1 AND turn_num = $2 AND hint_word IS NULL AND turn_num = (
      SELECT current_turn_num FROM game WHERE id = $1 AND current_turn_num IS NOT NULL LIMIT 1
    );
    `, [gameID, turnNum, hint, hintNum]))
  // TODO: rely on postgres triggers
  query(`NOTIFY gameChange, '${gameID}';`, [])
}

export const processEvents = async (gameID: number, events: GameEvent[]) => {
  await withTransaction(async client => {
    for (const event of events) {
      switch (event.type) {
        case 'guess':
          ensureUpdated('Failed to add guess', await client.query(`
            INSERT INTO game_turn_guesses(game_id, turn_num, guess_num, row, col)
            VALUES($1, $2, $3, $4, $5);
            `, [gameID, event.turnNum, event.guessNum, event.row, event.col]))
          break
        case 'cover':
          ensureUpdated('Failed to add cover', await client.query(`
            UPDATE game_board_cell
            SET covered = $4, covered_citizen_team = $5
            WHERE game_id = $1 AND row = $2 AND col = $3;
            `, [gameID, event.row, event.col, event.newCover, event.newCover === 'citizen' ? event.newCoverCitizenTeam : undefined]))
          break
        case 'nextturn':
          ensureUpdated('Failed to increment turn num', await client.query(`
            UPDATE game
            SET current_turn_num = $3
            FROM game_turn
            WHERE
              game_id = $1 AND
              game_turn.team != $2 AND
              current_turn_num = ($3 - 1) AND
              game_turn.turn_num = ($3 - 1);
            `, [gameID, event.nextTeam, event.nextTurnNum]))
          ensureUpdated('Failed to create new turn', await client.query(`
            INSERT INTO game_turn(game_id, turn_num, team)
            VALUES($1, $2, $3);
            `, [gameID, event.nextTurnNum, event.nextTeam]))
          break
        case 'gameover':
          ensureUpdated('Failed to set game over', await client.query(`
            UPDATE game
            SET winning_team = $3, game_over = true
            WHERE id = $1 AND current_turn_num = $2;
            `, [gameID, event.turnNum, event.winner]))
          break
        case 'pass':
          break
        default:
          throw new Error(`Unrecognized event: ${event['type']}`)
      }
    }
  })
  query(`NOTIFY gameChange, '${gameID}';`, [])
  query(`NOTIFY gameChange_v2, '${JSON.stringify({ gameID, events })}';`, [])
}

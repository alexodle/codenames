ALTER TABLE game ADD COLUMN deleted boolean DEFAULT false;
DROP INDEX game_created_by_player_id_idx;

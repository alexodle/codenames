ALTER TABLE game_turn ADD COLUMN allow_pass boolean;
UPDATE game_turn SET allow_pass = true;
ALTER TABLE game_turn ALTER COLUMN allow_pass SET NOT NULL;

-- DDL generated by Postico 1.5.10
-- Not all database features are supported. Do not use for backup.

-- Table Definition ----------------------------------------------

CREATE TABLE spec_card_cell (
    side text NOT NULL,
    row integer NOT NULL,
    col integer NOT NULL,
    cell_type text NOT NULL,
    spec_card_id integer NOT NULL REFERENCES spec_card(id)
);

-- Indices -------------------------------------------------------

CREATE INDEX spec_card_cell_spec_card_id_idx ON spec_card_cell(spec_card_id int4_ops);
-- DDL generated by Postico 1.5.10
-- Not all database features are supported. Do not use for backup.

-- Table Definition ----------------------------------------------

CREATE TABLE login_state (
    nonce text PRIMARY KEY,
    date_created timestamp with time zone NOT NULL DEFAULT now(),
    redirect_url text NOT NULL
);

-- Indices -------------------------------------------------------

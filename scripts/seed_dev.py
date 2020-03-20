#!/bin/python

import os
import psycopg2
import csv
import sys


PLAYERS = ('Kara Dev', 'Alex Dev')


def connect():
  return psycopg2.connect(
    dbname=os.environ['PGDATABASE'],
    user=os.environ['PGUSER'],
    password=os.environ['PGPASSWORD'],
    host=os.environ['PGHOST'],
    port=os.environ['PGPORT'])


def seed_players(conn):
  for name in PLAYERS:
    with conn:
      with conn.cursor() as cur:
        cur.execute('SELECT COUNT(*) FROM player WHERE name = %s LIMIT 1;', (name, ))
        (n, ) = cur.fetchone()
        if n == 0:
          cur.execute('INSERT INTO player(name) VALUES(%s);', (name, ))


def seed_new_game(conn):
  with conn:
    with conn.cursor() as cur:
      cur.execute('INSERT INTO game_')


if __name__ == '__main__':
  conn = connect()
  seed_players(conn)

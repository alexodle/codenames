#!/bin/python

import os
import psycopg2
import csv
import sys


def connect():
  return psycopg2.connect(
    dbname=os.environ['PGDATABASE'],
    user=os.environ['PGUSER'],
    password=os.environ['PGPASSWORD'],
    host=os.environ['PGHOST'],
    port=os.environ['PGPORT'])


def seed_words(conn):
  def foreach_word():
    with open('data/words') as f:
      for line in f:
        word = line.strip()
        if word:
          yield word
  for word in foreach_word():
    with conn:
      with conn.cursor() as cur:
        cur.execute('INSERT INTO word_card(word) VALUES(%s) ON CONFLICT (word) DO NOTHING;', (word, ))


def seed_cards(conn):
  ROWS=5
  COLS=5

  def foreach_card():
    with open('data/cards') as f:
      try:
        while True:
          front, back = f.next().strip(), f.next().strip()
          yield front, back
          f.next()
      except EOFError:
        pass

  def convert_cell_type(v):
    if v == 'Z':
      return 'citizen'
    elif v == 'A':
      return 'agent'
    elif v == 'X':
      return 'assassin'
    raise Exception('Unrecognized cell: %s' % v)

  def add_card(front, back, cur):
    card_hash = ''.join(sorted([front, back]))
    cur.execute('''INSERT INTO spec_card(hash) VALUES(%s) RETURNING id;''', (card_hash, ))
    (card_id, ) = cur.fetchone()
    add_card_side(card_id, 'front', front, cur)
    add_card_side(card_id, 'back', back, cur)

  def add_card_side(card_id, side, card_str, cur):
    for row in range(ROWS):
      for col in range(COLS):
        i = row * ROWS + col
        cell_type = convert_cell_type(card_str[i])
        cur.execute('''
          INSERT INTO spec_card_cell(spec_card_id, side, row, col, cell_type)
          VALUES(%s, %s, %s, %s, %s)
          ''', (card_id, side, row, col, cell_type))

  for front, back in foreach_card():
    try:
      with conn:
        with conn.cursor() as cur:
          add_card(front, back, cur)
    except psycopg2.errors.UniqueViolation:
      pass

if __name__ == '__main__':
  conn = connect()
  #seed_words(conn)
  seed_cards(conn)

#!/usr/bin/env python
import argparse
import getpass
import psycopg2

"Because psql does not like running from within fab."


def main():
    parser = argparse.ArgumentParser(description='Call postgresql.')
    parser.add_argument('--hostname', '-n', default="localhost")
    parser.add_argument('--user', '-u', help='database user')
    parser.add_argument('--password', '-p', help='database user')
    parser.add_argument('--database', '-d', help="database")
    parser.add_argument('--print_one', '-1', action="store_true",
                        help="print first return row (fails if none)")
    parser.add_argument('commands', help="sql commands")
    args = parser.parse_args()
    user = args.user or getpass.getuser()
    password = args.password or getpass.getpass("password: ")
    cx = psycopg2.connect(user=user, password=password, database=args.database)
    cur = cx.cursor()
    cur.execute(args.commands)
    if args.print_one:
        result = cur.fetchone()
        assert result
        print result

if __name__ == '__main__':
    main()
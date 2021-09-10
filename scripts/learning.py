#!/Library/Frameworks/Python.framework/Versions/3.9/bin/python3.9
import requests
import random
import sys
import time
import getopt

from requests.models import parse_url


host = '172.16.239.10'
hdr = {'Content-Type': 'text/html'}


def usage():
    print('WAF Machine Learning DEMO uCase')
    print('-a --action <s>: action')
    print('\tsql_injection: SQL Injection parameter training model.')
    print('\t\t+ required: -n <number>: number of sample')
    print('\t\tcommand_injection: auto summit form values with number of request')
    print('\t\t+required: -n <number>: number of sample')

ascii_string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'


def gen_string(_num):
    return ''.join(random.choice(ascii_string) for _ in range(_num))


def gen_ip4():
    return '.'.join(map(str, (random.randint(0, 255) for _ in range(4))))


def _training_sql_injection_param(_request_num):
    try:
        for _ in range (_request_num):
            rand_uname = gen_string(8)
            rand_passwd = gen_string(8)
            print('+[{}]training model url:http://{}/api/v01/auth?nickname={}&password={}'.format(_, host, rand_uname, rand_passwd))
            req = requests.post("http://{}/api/v01/auth?nickname={}&password={}".format(host, rand_uname, rand_passwd), headers=hdr)
            print('Response status: ', req.status_code)
            time.sleep(0.01)
    except KeyboardInterrupt:
        print('[STOPED]: ^c')


def _training_command_injection(_request_num):
    for _ in range(_request_num):
        rand_ip4 = gen_ip4()
        print('+[{}]training model url:http://{}/api/v01/exec?exec={}'.format(_, host, rand_ip4))
        r = requests.get('http://{}/api/v01/exec?exec={}'.format(host, rand_ip4))
        print('Response status: ', r.status_code)


def _training_xss(_request_num):
    for _ in range(_request_num):
        rand_nickname = gen_string(6)
        rand_decs = gen_string(20)
        print('+[{}]training model url://htpp://{}/api/v01/accedit?nickname={}&description={}'.format(_, host, rand_nickname, rand_decs))
        r = requests.get('htpp://{}/api/v01/accedit?nickname={}&description={}'.format(_, host, rand_nickname, rand_decs))
        print('Response status: ', r.status_code)


if __name__ == '__main__':
    action = None
    number = 0
    try:
        opts, args = getopt.getopt(sys.argv[1:], 'a:n:h:', 
        ['action=', 'number='])
    except getopt.GetoptError as err:
        print('[ERROR]: {}'.format(err))
        sys.exit(1)
    
    for o, a in opts:
        if o in ('-a', '--action'):
            action = a
        elif o in ('-n', '--number'):
            try:
                number = int(a)
            except:
                print('[ERROR]: invalid number')
                sys.exit(1)
        else:
            print('[ERROR]: unknown option')
            sys.exit(1)
    if action not in ('sql_injection', 'xss', 'command_injection'):
        print('[ERROR]: unknown action')
        sys.exit(1)    
    if action == 'sql_injection':
        if number <= 0:
            print('[ERROR]: number must be ge 0')
            sys.exit(1)
        else:
            _training_sql_injection_param(number)
    elif action == 'command_injection':
        if number <= 0:
            print('[ERROR]: number must be ge 0')
        else:
            _training_command_injection(number)
    elif action == 'xss':
        if number <= 0:
            print('[ERROR]: number must be ge 0')
        else:
            _training_xss(number)
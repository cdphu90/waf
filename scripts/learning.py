#!/usr/local/bin/python3.9
import json
import requests
import random
import sys
import time
import getopt



# host = '172.16.239.10'
hdr = {'Content-Type': 'text/html'}

cookie_name = 'user_session'
uuid = '63572724-11e1-11ec-9b42-3c15c2ea5372'
cookie = {cookie_name: uuid}
ascii_string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'


def usage():
    print('WAF Machine Learning DEMO uCase')
    print('-a --action <s>: action')
    print('\tsql_injection: SQL Injection parameter training model.')
    print('\t\t+ required: -n <number>: number of sample')
    print('\t\tcommand_injection: auto summit form values with number of request')
    print('\t\t+required: -n <number>: number of sample')



def gen_string(_num):
    return ''.join(random.choice(ascii_string) for _ in range(_num))


def gen_ip4():
    return '.'.join(map(str, (random.randint(0, 255) for _ in range(4))))


def _training_sql_injection_param(host, _request_num):
    for _ in range (_request_num):
        rand_uname = gen_string(8)
        rand_passwd = gen_string(8)
        url = 'http://{}/api/v01/auth?nickname={}&password={}'.format(host, rand_uname, rand_passwd)
        res = requests.post(url, headers=hdr, cookies=cookie)
        print('=>[{}]Res Code: {} {}'.format(_, res.status_code, res.json()['res_msg']))
        time.sleep(0.01)


def _training_command_injection(host, _request_num):
    for _ in range(_request_num):
        rand_ip4 = gen_ip4()
        url = 'http://{}/api/v01/exec?exec={}'.format(host, rand_ip4)
        #print('req url = {}'.format(url))
        res = requests.get(url, headers=hdr, cookies=cookie)
        print('=>[{}]Res Code: {} {}'.format(_, res.status_code, res.json()['res_msg']))


def _training_xss(host, request_num):
    for _ in range(request_num):
        rand_nickname = gen_string(6)
        rand_decs = gen_string(20)
        rand_username = gen_string(8)
        rand_password = gen_string(8)
        rand_email = gen_string(8)
        rand_address= gen_string(8)
        url = 'http://{}/api/v01/accedit?nickname={}&password={}&username={}&email={}&address={}&description={}'.format(host, rand_nickname, rand_password, rand_username, rand_email, rand_address, rand_decs)
        res = requests.get(url, headers=hdr, cookies=cookie)
        print('=>[{}]: Res Code: {} {}'.format(_, res.status_code, res.json()['res_msg']))


if __name__ == '__main__':
    host = '';
    action = None
    number = 0
    try:
        opts, args = getopt.getopt(sys.argv[1:], 'a:n:h:', 
        ['action=', 'number=', 'host'])
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
        elif o in ('-h', '--host'):
            host = a
            if not host:
                print('[ERROR]: host could not be empty')
                sys.exit(1)
        else:
            print('[ERROR]: unknown option')
            sys.exit(1)
    if not host:
        print('[ERROR]: -h [--host] is mandary');
        sys.exit(1)
    if action not in ('sql_injection', 'xss', 'command_injection'):
        print('[ERROR]: unknown action')
        sys.exit(1)    
    if action == 'sql_injection':
        if number <= 0:
            print('[ERROR]: number must be ge 0')
            sys.exit(1)
        else:
            _training_sql_injection_param(host,number)
    elif action == 'command_injection':
        if number <= 0:
            print('[ERROR]: number must be ge 0')
        else:
            _training_command_injection(host, number)
    elif action == 'xss':
        if number <= 0:
            print('[ERROR]: number must be ge 0')
        else:
            _training_xss(host, number)
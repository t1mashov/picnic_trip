
from django.shortcuts import render, redirect
from django.db import connection
from .models import *
from picnic_trip.settings import BASE_DIR

import hashlib
import json


def index(rq):

    data = {
        'error_message' : '',
        'title' : 'Picnic Trip - Authorization',
    }
    if rq.method == 'POST':
        if 'enter' in rq.POST.keys():
            login = rq.POST['name']
            password = rq.POST['password']
            password_hash = hashlib.md5(password.encode('utf-8')).hexdigest()

            for u in User.objects.all():
                if u.name == login and u.password_hash == password_hash:
                    print('success', rq.session.keys())
                    rq.session['uid'] = u.id
                    return redirect('area')
            data['error_message'] = 'Неверный логин или пароль'

        if 'reg' in rq.POST.keys():
            all_logins = [el.name for el in User.objects.all()]
            login = rq.POST['name'].strip()
            password = rq.POST['password'].strip()

            if login == '':
                data['error_message'] = 'Укажите логин'

            else:
                if not login in all_logins:
                    new_user = User(
                        name=login, 
                        password_hash = hashlib.md5(password.encode('utf-8')).hexdigest()
                    )
                    new_user.save()
                else:
                    data['error_message'] = 'Такой логин уже существует'
    elif rq.method == 'GET':
            
        if sum(
                1 if el in rq.GET.keys() else 0 
                for el in ['out', 'guest']
            ) > 0:
            if rq.session.has_key('uid'):
                del rq.session['uid']
            if 'guest' in rq.GET.keys():
                return redirect('area')

    return render(rq, 'main/index.html', data)



def area(rq):
    cursor = connection.cursor()

    data = {
        'a1' : 1,
        'title' : 'Picnic Trip - Area selection',
    }

    if 'uid' in rq.session.keys():
        user_id = rq.session['uid']

        cursor.execute(f'''
            select area_id, comment
            from history
            where user_id = {user_id}
        ''')
        saved = cursor.fetchall()
        saved = [(str(el[0]), el[1] if el[1]!=None else '') for el in saved]

        saved_areas = '''
        <script>
            saved = {
                '''+ ',\n'.join(
                    ["'"+el[0]+"' : `"+el[1].replace(chr(2), "\\'").replace(chr(3), '\\`')+"`" for el in saved]
                ) +'''
            }
        </script>'''
        print(saved_areas)

    if rq.method == 'POST':
        if 'save_area' in rq.POST.keys():
            objstr = rq.POST['save_area'].replace("''''", '"')
            rq.session['save_area'] = objstr
            return redirect('history')

    db = open(f'{BASE_DIR}/main/open_data/data1.json', encoding='utf-8').read()
    

    connect_db = f'''
    <script>
        connect_db('{db}')
    </script>'''

    data['connect_db'] = connect_db
    
    data['reg'] = 'false'
    if rq.session.has_key('uid'):
        data['reg'] = True
        data['saved_areas'] = saved_areas
    return render(rq, 'main/area.html', data)



def history(rq):
    cursor = connection.cursor()
    user_id = rq.session['uid']
    opened = ''

    data = {
        'title' : 'Picnic trip - Travel history',
        'a3' : 1,
    }

    if rq.method == 'POST':
        print('\n'.join(f'{k} : {v}' for k, v in rq.POST.items()))
        if 'id' in rq.POST.keys():
            comment = rq.POST['comment']
            comment = comment.replace('\'', chr(2)).replace('`', chr(3))
            cursor.execute(f'''
                update history
                set comment = '{comment}'
                where area_id = {rq.POST['id']}
            ''')
            opened = rq.POST['id']

    if 'save_area' in rq.session.keys():
        print(rq.session['save_area'])
        obj = json.loads(rq.session['save_area'])
        cursor.execute(f'''
            insert into history (user_id, area_id)
            values
            ({user_id}, {obj['global_id']})
        ''')
        opened = str(obj['global_id'])
        del rq.session['save_area']

    cursor.execute(f'''
        select area_id, comment
        from history
        where user_id = {user_id}
    ''')
    areas = cursor.fetchall()

    areas = [(el[0], el[1].replace(chr(2), "\\'").replace(chr(3), '\\`') if el[1]!=None else '') for el in areas]
    print(areas)
    load_area = '''
    <script>
        '''+"\n".join(
            ["load_area('"+str(el[0])+"', `"+str(el[1])+"`"+(', 1' if opened == str(el[0]) else '')+');\n' for el in areas]
        )+'''
    </script>'''

    print(load_area)
    print(opened)

    db = open(f'{BASE_DIR}/main/open_data/data1.json', encoding='utf-8').read()
    connect_db = f'''
    <script>
        connect_db('{db}')
    </script>'''

    data['load_area'] = load_area
    data['connect_db'] = connect_db
    
    return render(rq, 'main/history.html', data)    
    


def items(rq):

    cursor = connection.cursor()
    user_id = rq.session['uid']

    if rq.method == 'POST':
        if 'items' in rq.POST.keys():
            cursor.execute(f'''
                delete from my_item
                where user_id={user_id}
            ''')
            mas = [el.split(':') for el in rq.POST['items'][:-1:].split(',')]
            if mas[0][0] != '':
                add_items = '''
                    insert into my_item (name, checked, user_id)
                    values'''
                for el in mas:
                    add_items += f"('{el[0]}', {int(el[1])}, {user_id}),\n"
                add_items = add_items[:-2:]
                cursor.execute(add_items)

    # получение всех элементов myitems и отправка в html 
    cursor.execute(f'''
        select name, checked 
        from my_item
        where user_id={user_id}
    ''')
    my_items = cursor.fetchall()
    my_items_arr = []
    for el in my_items:
        my_items_arr.append({
            'name' : el[0],
            'checked' : el[1],
        })

    cursor.execute('''
        select c.name, i.name
        from main_category c join main_item i on (i.category_id = c.id)
    ''')
    res = cursor.fetchall()
    items_dict = {}
    for k, v in res:
        if not k in items_dict.keys(): items_dict[k] = []
        else: items_dict[k].append(v)

    data = {
        'a2' : 1,
        'title' : 'Picnic Trip - Collecting items',
        'items' : items_dict,
        'my_items' : my_items_arr,
    }
    return render(rq, 'main/items.html', data)